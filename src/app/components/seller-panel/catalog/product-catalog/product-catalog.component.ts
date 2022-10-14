import { SelectionModel } from '@angular/cdk/collections';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CustomFilters } from 'src/app/components/helper/filters/filters.component';
import { ProductsService } from 'src/app/services/http/products.service';
import { SubSink } from 'subsink';
import { IProductsElement } from '../catalog-model';
import { GoogleAnalyticsService } from 'src/app/services/http/google-analytics.service';

const NUM_REGEX = new RegExp(/[^\d\.]*/g);
const PRODUCT_LIST = 'catalog/product-list';

@Component({
  selector: 'app-product-catalog',
  templateUrl: './product-catalog.component.html',
  styleUrls: ['./product-catalog.component.scss'],
})
export class ProductCatalogComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('mapDialog') mapDailog: TemplateRef<HTMLDialogElement>;
  @ViewChild('comboDialog') comboDailog: TemplateRef<HTMLDialogElement>;
  // @Input() query: any = { date_from: '', date_to: '' };
  // @Output() paramsEvent = new EventEmitter();
  dataSource = new MatTableDataSource<IProductsElement>([]);
  productsForm: FormGroup;
  backupData = [];
  rowToEdit = [];
  selection = new SelectionModel<IProductsElement>(true, []);
  pageSizeOptions: number[] = [15, 30, 60];
  resultsLength = 0;
  currentPage = 0;
  private subs = new SubSink();
  displayedColumns: string[] = [
    // 'select',
    'sku',
    'name',
    'mrp',
    'dimensions',
    'weight',
    'action',
  ];
  queryparams: {
    sku: string;
    srpin: string;
    ean: string;
    product_name: string;
    page: number;
    sort_by: string;
    per_page: number;
    date_from: string;
    date_to: string;
    is_web: number;
    status: string;
    with_items: number;
    fbs: number;
  };
  filtersInfo: {
    date: CustomFilters;
    sku: CustomFilters;
    srpin: CustomFilters;
    ean: CustomFilters;
    product_name: CustomFilters;
    essential: CustomFilters;
  };

  constructor(
    private productsService: ProductsService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private router: Router,
    private route: ActivatedRoute,
    public ga: GoogleAnalyticsService
  ) {}

  ngOnInit(): void {
    this.productsForm = this.fb.group({
      productTable: this.fb.array([]),
    });

    this.filtersInfo = {
      date: {
        label: 'Search by Date Range',
        name: 'Date',
        type: 'date_range',
        data: [],
        field_values: {},
      },
      essential: {
        label: 'Search by essential',
        placeholder: 'Select Status',
        type: 'select',
        name: 'Essential',
        field_values: {},
        data: [
          {
            name: 'Yes',
            value: '1',
          },
          {
            name: 'No',
            value: '0',
          },
        ],
      },
      product_name: {
        name: 'Search',
        label: 'Product',
        placeholder: 'Search by Product Name',
        type: 'input',
        main_filter: 1,
        field_values: {},
        data: [],
      },
      sku: {
        name: 'Search',
        label: 'SKU',
        placeholder: 'Search by SKU',
        type: 'input',
        main_filter: 1,
        field_values: {},
        data: [],
      },
      srpin: {
        name: 'Search',
        label: 'SRPIN',
        placeholder: 'Search by SRPIN',
        type: 'input',
        main_filter: 1,
        field_values: {},
        data: [],
      },
      ean: {
        name: 'Search',
        label: 'EAN',
        placeholder: 'Search by EAN',
        type: 'input',
        main_filter: 1,
        field_values: {},
        data: [],
      },
    };

    this.queryparams = {
      product_name: '',
      page: 1,
      sku: '',
      srpin: '',
      ean: '',
      per_page: 15,
      date_from: '',
      date_to: '',
      is_web: 1,
      status: '',
      sort_by: null,
      with_items: 1,
      fbs: 1,
    };

    // this.setFilters();
    this.route.queryParams.subscribe((params) => {
      this.setFilters(params);
    });
  }

  // ngOnChanges(): void {
  //   if (this.query) {
  //     this.getProducts();
  //   }
  // }

  get productTable(): FormArray {
    return this.productsForm.get('productTable') as FormArray;
  }

  enableEditMode(idx: number): boolean {
    return this.rowToEdit.includes(idx);
  }

  editRow(idx: number): void {
    this.ga.emitEvent('SRF', 'Clicked on Action Edit', 'Catalog Page');
    this.rowToEdit.push(idx);
  }

  onClickMapped(idx: number): void {
    this.ga.emitEvent('SRF', 'Clicked on SKU Mapping Detail', 'Catalog Page');
    const { sku, listings = [] } = this.productTable.value[idx];
    const payload = { sku, listings };
    this.dialog.open(this.mapDailog, {
      width: '40%',
      data: payload,
      panelClass: 'br-10',
      // disableClose: true,
      autoFocus: true,
    });
  }

  onClickCombo(idx: number): void {
    // const combo = this.productTable.value[idx]?.combo ?? [];
    const { sku, combo = [] } = this.productTable.value[idx];
    const payload = { sku, combo };
    this.dialog.open(this.comboDailog, {
      width: '40%',
      data: payload,
      panelClass: 'br-10',
      // disableClose: true,
      autoFocus: true,
    });
  }

  getDataSource(): AbstractControl[] {
    return [...this.productTable.controls];
  }

  cancelEdit(idx: number): void {
    this.rowToEdit = this.rowToEdit.filter((row) => row !== idx);
    this.productTable.removeAt(idx);
    this.productTable.insert(idx, this.prepareRow(this.backupData[idx]));
  }

  submitEdit(idx: number): void {
    this.productTable.markAllAsTouched();
    if (this.productTable.invalid) {
      this.toastr.error('Found invalid entry');
      return;
    }

    const product = { ...this.productTable.at(idx).value };
    const id = product.product_id;
    delete product.listings;
    delete product.product_id;
    delete product.combo;
    const payload = {
      product_id: id,
      data: product,
    };

    const endpt = 'products/srfUpdate';
    this.subs.sink = this.productsService
      .postRequestToEndpoint(payload, endpt)
      .subscribe(
        (success: { error: number; updated: number }) => {
          console.log(success);
          const { error, updated } = success;
          if (error) {
            this.toastr.error('Error while updating');
          } else {
            this.toastr.success('Updated successfully');
          }
          this.getProducts();
          this.rowToEdit = this.rowToEdit.filter((row) => row !== idx);
        },
        (onErr) => {
          this.toastr.error(onErr?.error?.message);
        }
      );
  }

  getNum(str: string): string {
    return str.replace(NUM_REGEX, '');
  }

  splitDimensions(dimensions: string): FormGroup {
    let dimensionsArr = new Array(3);
    if (dimensions && dimensions.includes('cm')) {
      dimensionsArr = dimensions
        .slice(0, dimensions.length - 2)
        .split('x')
        .map((val) => val.trim());
    }

    return this.fb.group({
      length_cm: new FormControl(dimensionsArr[0], [Validators.required]),
      width_cm: new FormControl(dimensionsArr[1], [Validators.required]),
      height_cm: new FormControl(dimensionsArr[2], [Validators.required]),
    });
  }

  prepareRow(data): FormGroup {
    return this.fb.group({
      ...this.splitDimensions(data.dimensions).controls,
      weight_kgs: new FormControl(this.getNum(data.weight), [
        Validators.required,
      ]),
      listings: new FormControl(data.listings),
      combo: new FormControl(data.combo),
      mrp: new FormControl(data.mrp, [Validators.required]),
      master_sku_code: new FormControl(data.sku, [Validators.required]),
      product_name: new FormControl(data.name, [Validators.required]),
      dimensions: new FormControl(data.dimensions, [Validators.required]),
      image_url: data.image,
      product_id: data.id,
      sku: data.sku,
    });
  }

  updateProductTable(productsArr: any[]): void {
    this.productTable.clear();
    productsArr.forEach((dta, idx) => {
      dta.position = idx;
      this.productTable.push(this.prepareRow(dta));
    });
  }

  getProducts(): void {
    const endpoint = 'products';
    const payload = this.queryparams;

    this.subs.sink = this.productsService
      .requestToEndpoint(endpoint, payload)
      .subscribe(
        (success) => {
          const { data, meta } = success;
          this.backupData = [...data];
          this.updateProductTable(this.backupData);
          if (success) {
            this.currentPage = meta.pagination.current_page - 1;

            if (meta.pagination.links.next) {
              //console.log("next page link "+links.next);
              this.resultsLength =
                meta.pagination.per_page * (meta.pagination.current_page + 1);
              // this.paginator.pageIndex =  meta.current_page+1;
              //console.log("RESULT LENGTH ",this.dataLength);
            } else {
              //this.resultsLength = meta.per_page;
              this.resultsLength = 0;
              //this.pageSize =  0;
            }
          }
        },
        (onErr) => {
          console.error(onErr);
        }
      );
  }

  setFilters(params): void {
    const filtersArray = Object.keys(this.filtersInfo);

    filtersArray.forEach((key) => {
      if (key === 'date') {
        this.filtersInfo[key].field_values = {
          start: params?.date_from,
          end: params?.date_to,
        };
      } else {
        this.filtersInfo[key].field_values = { value: params[key] };
      }
    });
  }

  // setFilters(): void {
  //   const filtersArray = Object.keys(this.filtersInfo);

  //   filtersArray.forEach((key) => {
  //     if (key === 'date') {
  //       this.filtersInfo[key].field_values = {
  //         start: this.query?.date_from,
  //         end: this.query?.date_to,
  //       };
  //     } else {
  //       this.filtersInfo[key].field_values = { value: this.query[key] };
  //     }
  //   });

  //   // new chagnes for pagination
  //   const qpkeys = Object.keys(this.queryparams);
  //   qpkeys.forEach((key) => {
  //     if (
  //       !filtersArray[key] &&
  //       key !== 'date_from' &&
  //       key !== 'date_to' &&
  //       this.query[key]
  //     ) {
  //       this.queryparams[key] = this.query[key];
  //     }
  //   });
  // }

  updateParams(queryparams: any): void {
    // this.paramsEvent.emit({ products: queryparams });
    this.router.navigate([PRODUCT_LIST], {
      queryParams: this.queryparams,
    });
  }

  updateFilters(evt): void {
    const filtersArray = Object.keys(this.filtersInfo);
    const { filters } = evt;

    filtersArray.forEach((key) => {
      if (key === 'date') {
        this.queryparams.date_from = filters[key]?.start;
        this.queryparams.date_to = filters[key]?.end;
        if (
          this.queryparams.date_from != filters[key]?.start ||
          this.queryparams.date_to != filters[key]?.end
        ) {
          this.ga.emitEvent('Filters', 'Clicked on Search by Date Range', '');
        }
      } else {
        if (
          (evt.filters[key] != '' || this.queryparams[key] != '') &&
          this.queryparams[key] != evt.filters[key]
        ) {
          this.ga.emitEvent('Filters', key, '');
        }
        this.queryparams[key] = evt.filters[key];
      }
    });

    this.updateParams(this.queryparams);
    this.getProducts();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.productTable.value.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.productTable.value.forEach((val) => {
      this.selection.select(val.id);
    });
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: IProductsElement): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.position + 1
    }`;
  }

  handlePage(e): void {
    if (e.pageSize > this.queryparams.per_page) {
      e.previousPageIndex = e.pageIndex = 0;
    }

    if (e.previousPageIndex >= e.pageIndex) {
      //this.queryparams.page = this.currentPage;
      if (e.previousPageIndex == 0 && e.pageIndex == 0) {
        this.queryparams.page = this.currentPage = 1;
      } else {
        this.queryparams.page = this.currentPage;
      }
    } else {
      this.queryparams.page = this.currentPage + 2;
    }
    this.queryparams.per_page = e.pageSize;
    this.getProducts();
    this.updateParams(this.queryparams);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
