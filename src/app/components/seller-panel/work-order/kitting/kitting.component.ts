import {
  Component,
  OnInit,
  ViewChild,
  Output,
  EventEmitter,
  Input,
  SimpleChanges,
  TemplateRef,
  OnDestroy,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from './../../../../services/auth/auth.service';
import { OrdersService } from './../../../../services/http/orders.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Url } from 'url';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CustomFilters } from '../../../helper/filters/filters.component';
import { ActivatedRoute, Router, ActivationEnd } from '@angular/router';
import { HttpService } from 'src/app/services/http/http.service';
import { FcsService } from 'src/app/services/http/fcs.service';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { SubSink } from 'subsink';
import { GoogleAnalyticsService } from 'src/app/services/http/google-analytics.service';

interface KitTable {
  id?: number;
  sku?: string;
  vendor_id?: number;
  warehouse_id?: number;
  created_at?: Date;
  updated_at?: Date;
  items?: Object;
  status?: string;
  quantity?: number;
  warehouse_code: string;
}

interface Warehouse {
  value: string;
  name: string;
}

interface data {
  links: { first: Url; next: Url };
  data: KitTable[];
  meta: { per_page: number; current_page: number };
}

const STATUS = [
  { title: 'In Draft', color: '#e3c800', 'background-color': '#fff9cf' },
  { title: 'Ready to Ship', color: '#efa30c', 'background-color': '#fee9c0' },
  { title: 'Shipped', color: '#2c9f29', 'background-color': '#bffeb9' },
  { title: 'Delivered', color: '#6f57e9', 'background-color': '#ded8ff' },
  { title: 'Completed', color: '#3ab7b4', 'background-color': '#b5fcf9' },
  // { title: 'Inventory Stocked', color: '#555', 'background-color': '#ddd' },
];

@Component({
  selector: 'app-kitting',
  templateUrl: './kitting.component.html',
  styleUrls: ['./kitting.component.scss'],
})
export class KittingComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  @ViewChild('addKit') addKit: TemplateRef<any>;
  @ViewChild('deKit') deKit: TemplateRef<any>;
  private subs = new SubSink();
  pageSizeOptions: number[] = [15, 30, 60];
  active_screen: string;
  kitproduct: any;
  max_kit: number;
  max_dekit: number;
  addKitForm: FormGroup;
  deKitForm: FormGroup;
  queryparams: {
    kit: string;
    page: number;
    per_page: number;
    warehouse_code: string;
    date_from: string; //this.range.get('start').value.format('YYYY-MMM-DD').toString(),//'2017-Jun-12',//this.range.get('end').value.format('YYYY-MMM-DD').toString(),
    date_to: string; //this.range.get('end').value.format('YYYY-MMM-DD').toString(),//'2021-Jan-21',//,
    is_web: number;
    status: number; //this.status == -1 ? '' : this.status
    search: string;
  };

  filters_info: {
    date: CustomFilters;
    status: CustomFilters;
    warehouse_code: CustomFilters;
    search: CustomFilters;
  };

  resultsLength: number;
  //currentPage     : number;
  //pageSize        : number;
  dataSource: KitTable[];
  warehouses: Warehouse[];
  changed: any = {};
  tableSource: MatTableDataSource<KitTable>;
  //pageEvent: PageEvent;
  currentPage: number;
  firstTimeLoad: boolean = true;
  showLoader: boolean = false;

  @Input() query: any;
  @Input() populate_filter_data: any;
  @Output() paramsEvent: EventEmitter<any> = new EventEmitter();
  @Output() create_button: EventEmitter<any> = new EventEmitter();

  displayedColumns: string[] = [
    'id',
    'sku',
    'quantity',
    'items',
    'status',
    'action',
  ];
  constructor(
    public httpService: HttpService,
    public fcsService: FcsService,
    public orderService: OrdersService,
    public authService: AuthService,
    public dialog: MatDialog,
    public toastr: ToastrService,
    public route: ActivatedRoute,
    public router: Router,
    private fb: FormBuilder,
    public ga: GoogleAnalyticsService
  ) {
    this.currentPage = 0;
    this.resultsLength = 0;
    this.queryparams = {
      kit: '',
      date_from: '',
      date_to: '',
      is_web: 1,
      page: 1,
      //payment_method: string,
      per_page: 15,
      warehouse_code: '',
      status: 1,
      search: '',
    };

    this.filters_info = {
      date: {
        name: 'Date',
        label: 'Search by Date Range',
        type: 'date_range',
        data: [],
        field_values: {},
      },
      status: {
        label: 'Search by Status',
        name: 'Status',
        placeholder: 'Select Status',
        type: 'select',
        field_values: {},
        data: [
          { name: 'Completed', value: 2 },
          { name: 'Pending', value: 1 },
        ],
        multiple: true,
        isDefault: true,
        hasSelectAll: true,
      },
      warehouse_code: {
        label: 'Search by Fulfilment Centre',
        name: 'Warehouse',
        placeholder: 'Select Fulfilment Centre',
        type: 'select',
        field_values: {},
        data: [],
        multiple: true,
        isDefault: true,
        hasSelectAll: true,
      },
      search: {
        name: 'search',
        label: 'Kit ID or SKU',
        placeholder: 'Search by Kit ID or SKU',
        tag_name: 'Kit ID or SKU',
        type: 'input',
        main_filter: 1,
        field_values: {},
        data: [],
      },
    };
    this.dataSource = [];
  }

  ngOnInit(): void {
    this.addKitForm = this.fb.group({
      kit_id: [''],
      sku: [''],
      max_kit: [null],
      quantity: [null, [Validators.required]],
    });

    this.deKitForm = this.fb.group({
      kit_id: [''],
      sku: [''],
      max_dekit: [null],
      quantity: [null, [Validators.required]],
    });

    this.tableSource = new MatTableDataSource<KitTable>(this.dataSource);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.create_button.emit(true);
    //console.log("ngOnchanges.... of all orders");
    for (const propName in changes) {
      const chng = changes[propName];
      const cur = chng.currentValue;

      if (propName == 'query' && Object.keys(cur).length) {
        this.changed.page = cur.page != undefined ? cur.page : '';
        this.changed.per_page = cur.per_page;
        this.changed.from = cur.from ? cur.from : '';
        this.changed.to = cur.to ? cur.to : '';
        this.changed.is_web = cur.is_web;
        this.changed.status = cur.status;
        this.changed.warehouse_code = cur.warehouse_code;
        this.changed.search = cur.search;
      }

      if (propName == 'populate_filter_data' && Object.keys(cur).length) {
        let d: any = [];
        if (cur.warehouses.length) {
          this.filters_info.warehouse_code.data = cur.warehouses;
        }
      }
    }
  }

  public getKittingList() {
    this.create_button.emit(true);
    let query_params = Object.assign({}, this.queryparams);
    this.dataSource = [];

    this.orderService.kittingList(query_params).subscribe((data: data) => {
      this.firstTimeLoad = false;
      if (data.data.length) {
        let results = data.data;
        let meta = data.meta;
        let links = data.links;
        let k = 0;

        this.currentPage = meta.current_page - 1;

        if (links.next) {
          this.resultsLength = meta.per_page * (meta.current_page + 1);
        } else {
          this.resultsLength = 0;
        }

        this.queryparams.page = meta.current_page;

        for (let result of results) {
          this.dataSource[k] = {} as KitTable;
          this.dataSource[k].id = result.id;
          this.dataSource[k].created_at = result.created_at;
          this.dataSource[k].sku = result.sku;
          this.dataSource[k].warehouse_code = result.warehouse_code;
          this.dataSource[k].status =
            result.status == '2' ? 'completed' : 'pending';
          this.dataSource[k].quantity = result.quantity;
          this.dataSource[k].items = result.items;
          k++;
        }
        this.tableSource = new MatTableDataSource(this.dataSource);
        this.tableSource.paginator = this.paginator;
      } else {
        this.dataSource = [];
        this.tableSource = new MatTableDataSource(this.dataSource);
      }
    });
  }

  updateParams(queryparams: any) {
    this.paramsEvent.emit({ kit: queryparams });
  }

  updateFilters($event) {
    let filters_array = Object.keys(this.filters_info);
    this.queryparams.page = this.currentPage = 1;
    for (let ft of filters_array) {
      if (ft == 'date') {
        if (
          this.queryparams.date_from != $event.filters[ft].start ||
          this.queryparams.date_to != $event.filters[ft].end
        ) {
          this.ga.emitEvent('Filters', 'Clicked on Search by Date Range', '');
        }
        this.queryparams.date_from = $event.filters[ft].start;
        this.queryparams.date_to = $event.filters[ft].end;
      } else {
        if (
          ($event.filters[ft] != '' || this.queryparams[ft] != '') &&
          this.queryparams[ft] != $event.filters[ft]
        ) {
          this.ga.emitEvent('Filters', ft, '');
        }
        this.queryparams[ft] = $event.filters[ft];
      }
    }

    this.updateParams(this.queryparams);

    this.getKittingList();
  }

  openDialog($key): void {
    if ($key == 'remove') {
      this.dialog.open(this.deKit, {
        panelClass: 'br-10',
        width: '50%',
      });
    } else {
      this.dialog.open(this.addKit, {
        panelClass: 'br-10',
        width: '50%',
      });
    }
  }

  addQuantity(kit) {
    if (kit.status == 'completed') {
      let params = {
        items: kit.items,
        warehouse_code: kit.warehouse_code,
        update: kit.quantity,
      };

      this.subs.sink = this.fcsService.getMaxKit(params).subscribe(
        (data: any) => {
          if (data.status) {
            this.max_kit = data.maxKit - kit.quantity;
            this.openDialog('add');
            this.addKitForm.patchValue({
              ...kit,
              max_kit: data.maxKit - kit.quantity,
              kit_id: kit.id,
              quantity: 1,
            });
          } else {
            this.toastr.error('Error while fetching max kit', 'Error');
          }
        },
        (errors) => console.error(errors)
      );
    }
  }

  removeQuantity(kit) {
    if (kit.status == 'completed') {
      this.max_dekit = kit.quantity;
      this.openDialog('remove');
      this.deKitForm.patchValue({
        ...kit,
        max_dekit: kit.quantity,
        kit_id: kit.id,
        quantity: 1,
      });
    }
  }

  onClickSubmit(evt): void {
    this.showLoader = true;
    evt.preventDefault();
    this.addKitForm.markAllAsTouched();
    const { quantity, max_kit, kit_id } = this.addKitForm.value;

    if (quantity <= 0) {
      this.toastr.error('Quantity should be greater than 0');
      this.showLoader = false;
      return;
    }

    if (quantity > max_kit) {
      this.toastr.error('Quantity should not exceed max kit qty');
      this.showLoader = false;
      return;
    }
    const payload = { quantity, kit_id };
    const endpt = 'warehouse/update-kit';
    this.subs.sink = this.httpService.post(endpt, payload).subscribe(
      (data: any) => {
        if (data.status) {
          this.showLoader = false;
          this.toastr.success('Kit quantity updated successfully');
          this.dialog.closeAll();
          this.getKittingList();
        } else {
          this.showLoader = false;
          this.toastr.error('Error while updating kit', 'Error');
        }
      },
      (err) => {
        this.showLoader = false;
        console.error(err);
        const message = err?.error?.message;
        this.toastr.error(message, 'Error');
      }
    );
  }

  onClickDekitSubmit(evt): void {
    this.showLoader = true;
    evt.preventDefault();
    this.addKitForm.markAllAsTouched();
    const { quantity, max_dekit, kit_id } = this.deKitForm.value;

    if (quantity <= 0) {
      this.toastr.error('Quantity should be greater than 0');
      this.showLoader = false;
      return;
    }

    if (quantity > max_dekit) {
      this.toastr.error('Quantity should not exceed max dekit quantity');
      this.showLoader = false;
      return;
    }

    const payload = { quantity, kit_id };
    const endpt = 'warehouse/de-kit';
    this.subs.sink = this.httpService.post(endpt, payload).subscribe(
      (data: any) => {
        if (data.status) {
          this.showLoader = false;
          this.toastr.success('Dekitting kit quantity successfully');
          this.dialog.closeAll();
          this.getKittingList();
        } else {
          this.showLoader = false;
          this.toastr.error('Error while updating kit', 'Error');
        }
      },
      (err) => {
        this.showLoader = false;
        console.error(err);
        const message = err?.error?.message;
        this.toastr.error(message, 'Error');
      }
    );
  }

  saveKitSKUs(qty, kit_id): void {
    const res = { quantity: qty, kit_id: kit_id };
  }

  public handlePage(e: any) {
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
    this.getKittingList();
    this.updateParams(this.queryparams);
  }

  onClickCancel(evt) {
    evt.preventDefault();
    this.active_screen = 'default';
    this.router.navigate(['work-order/kitting']);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
