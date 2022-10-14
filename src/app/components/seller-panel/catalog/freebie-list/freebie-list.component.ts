import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HttpService } from 'src/app/services/http/http.service';
import { SubSink } from 'subsink';
import { IFilters, IFiltersInfo, IFreebieProduct } from '../catalog-model';

const FREEBIE_LIST = 'catalog/freebie-list';

/*const RESP = {
  data: [
    {
      id: 26,
      vendor_id: 1,
      type: 1,
      freebie_type: 'Order Value',
      condition:
        'If order value is greater than equal to 100 and order value is less than and equal to 200 then add Test4 with the order',
      status: 1,
      shipping_status: null,
      created_at: 'August 16 2021 11:31 AM',
    },
    {
      id: 25,
      vendor_id: 1,
      type: 1,
      freebie_type: 'Order Value',
      condition:
        'If order value is greater than 1010 and order value is less than and equal to 1200 then add Test3 with the order',
      status: 0,
      shipping_status: null,
      created_at: 'August 10 2021 3:56 PM',
    },
    {
      id: 24,
      vendor_id: 1,
      type: 2,
      freebie_type: 'Order SKU',
      condition:
        'If order sku is Test15 then add sku(s) Test11 with the order.',
      status: 1,
      shipping_status: null,
      created_at: 'August 5 2021 6:10 PM',
    },
  ],
  links: {
    first:
      'http://apiwms.shiprocket.local/api/v1/freebie-products/get-all?page=1',
    last: null,
    prev: null,
    next: null,
  },
  meta: {
    current_page: 1,
    from: 1,
    path: 'http://apiwms.shiprocket.local/api/v1/freebie-products/get-all',
    per_page: 15,
    to: 3,
  },
}; */

@Component({
  selector: 'app-freebie-list',
  templateUrl: './freebie-list.component.html',
  styleUrls: ['./freebie-list.component.scss'],
})
export class FreebieListComponent implements OnInit, OnDestroy {
  @ViewChild('confirmationDialog')
  confirmationDialog: TemplateRef<HTMLDialogElement>;
  private subs = new SubSink();
  filtersInfo: IFiltersInfo = {
    date: {
      label: 'Filter by Date Range',
      name: 'Date',
      type: 'date_range',
      data: [],
      field_values: {},
    },
    sku: {
      name: 'Search',
      label: 'SKU',
      placeholder: 'Search by Freebie sku',
      type: 'input',
      main_filter: 1,
      field_values: {},
      data: [],
    },
    type: {
      label: 'Filter by Type',
      placeholder: 'Select Type',
      type: 'select',
      name: 'type',
      field_values: {},
      data: [
        {
          name: 'Order value',
          value: '1',
        },
        {
          name: 'Order sku',
          value: '2',
        },
      ],
    },
  };

  queryparams = {
    page: 1,
    per_page: 15,
    date_from: '',
    date_to: '',
    is_web: 1,
    sku: '',
  };

  dataLength: number = 0;
  currentPage: number;
  freebieProducts: IFreebieProduct[];
  pageSizeOptions: number[] = [15, 30, 60];
  displayedColumns: string[] = [
    'id',
    'freebie_type',
    'condition',
    'created_at',
    'status',
    'action',
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpService,
    private toastr: ToastrService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.setFilters(params);
    });
  }

  setParams(): void {
    this.router.navigate([FREEBIE_LIST], {
      queryParams: this.queryparams,
    });
  }

  showConfirmationDialog(id: number): void {
    this.dialog.open(this.confirmationDialog, { data: { id } });
  }

  deleteRow(id: number): void {
    const endpoint = `freebie-products/${id}`;
    this.dialog.closeAll();

    this.subs.sink = this.http.deleteRequest(endpoint).subscribe(
      (success) => {
        const { message } = success;
        //this.dialog.closeAll();
        this.getProducts();
        this.toastr.success(message, 'Success');
      },
      (onErr) => {
        console.error(onErr);
        //this.dialog.closeAll();
        this.toastr.error(onErr.error.message, 'Error');
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

  updateFilters(evt: { filters: IFilters }): void {
    const filtersArray = Object.keys(this.filtersInfo);
    console.log('update filters');
    filtersArray.forEach((filter) => {
      if (filter === 'date') {
        this.queryparams.date_from = evt.filters[filter]?.start;
        this.queryparams.date_to = evt.filters[filter]?.end;
      } else {
        this.queryparams[filter] = evt.filters[filter];
      }
    });

    this.queryparams.page = this.currentPage = 1;
    this.setParams();
    this.getProducts();
  }

  getProducts(): void {
    const endpoint = 'freebie-products';
    const payload = this.queryparams;

    this.subs.sink = this.http.requestToEndpoint(endpoint, payload).subscribe(
      (success) => {
        const { data, meta, links } = success;
        this.freebieProducts = [...data];
        const { current_page } = meta;

        if (this.freebieProducts) {
          
          // console.log('links next', links.next);
          // console.log('links previous', links.previous);
          // console.log(meta.per_page);
          // console.log(current_page);
          if (links.next) {
            this.dataLength = meta.per_page * (current_page + 1);
          } else {
            this.dataLength = 0;
          }
        }
        //console.log(this.dataLength);
        this.currentPage = current_page - 1;
      },
      (onErr) => {
        console.error(onErr);

        // const { data, meta } = RESP;
        // this.freebieProducts = [...data];
        // const { current_page } = meta;
        // this.currentPage = current_page;
      }
    );
  }

  handlePage(e): void {
    //console.log('page index ', e.pageIndex);
    //this.queryparams.page = e.pageIndex ;
    //this.queryparams.per_page = e.pageSize;
    // this.setParams();
    // console.log('CURRENT PAGE ', this.currentPage);
    // console.log('previousPageIndex', e.previousPageIndex);
    // console.log('pageIndex', e.pageIndex);

    if (e.previousPageIndex >= e.pageIndex) {
      if (e.previousPageIndex == 0 && e.pageIndex == 0) {
        console.log('previous page index is greater and both zero');
        this.queryparams.page = this.currentPage = 1;
      } else {
        console.log('previous page index is greater and both not zero');
        this.queryparams.page = this.currentPage;
      }
    } else {
      this.queryparams.page = this.currentPage + 2;
    }
    this.queryparams.per_page = e.pageSize;
    this.setParams();
    this.getProducts();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
