import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { HttpService } from '../../../../services/http/http.service';
import { MatTableDataSource } from '@angular/material/table';
import { CustomFilters } from 'src/app/components/helper/filters/filters.component';
import { GoogleAnalyticsService } from 'src/app/services/http/google-analytics.service';
//import { PageEvent } from '@angular/material/paginator';

export interface ProessingInterface {
  orderId: string;
  product: string;
  customer: string;
  shipping: string;
  status: string;
}

@Component({
  selector: 'allorders',
  templateUrl: './allorders.component.html',
  styleUrls: ['./allorders.component.scss'],
})
export class AllOrdersComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'orderId',
    'Product',
    'Customer',
    'Payment',
    'Shipping',
    'shippingMethod',
    'Status',
  ];

  dataLength = 0;
  //pageSize = 15;
  page = 1;
  pageSizeOptions: number[] = [15, 30, 60];

  // MatPaginator Output
  //pageEvent: PageEvent;
  currentPage: number = 0;

  filters_info: {
    date: CustomFilters;
    filter: CustomFilters;
    courier_id: CustomFilters;
    search: CustomFilters;
    search_customer_info: CustomFilters;
    channel_id: CustomFilters;
    shipping_method: CustomFilters;
  };

  queryparams: {
    courier_id: number;
    //fbs: number,
    filter: string;
    filter_by: string;
    from: string;
    to: string;
    is_web: number;
    page: number;
    //payment_method: string,
    per_page: number;
    search: string;
    search_customer_info: string;
  };

  @Input() query: any;
  @Input() populate_filter_data: any;
  @Output() paramsEvent: EventEmitter<any> = new EventEmitter();

  changed: any = {};
  filtD: any = {};
  //populate_data : any[];

  constructor(public request: HttpService, public ga: GoogleAnalyticsService) {
    this.filters_info = {
      date: {
        name: 'Date',
        label: 'Search by Date Range',
        type: 'date_range',
        data: [],
        field_values: {},
      },

      filter: {
        name: 'Status',
        label: 'Search by Status',
        placeholder: 'Select Status',
        type: 'select',
        field_values: {},
        data: [],
        multiple: true,
      },
      courier_id: {
        name: 'Courier ID',
        label: 'Search by Courier',
        placeholder: 'Select Courier',
        type: 'select',
        field_values: {},
        data: [],
        //'data' : this.populate_filter_data.couriers,
        multiple: true,
      },
      search: {
        name: 'search',
        label: 'Order ID or AWB',
        placeholder: 'Search by Order ID or AWB',
        tag_name: 'Search',
        type: 'input',
        main_filter: 1,
        field_values: {},
        data: [],
      },
      search_customer_info: {
        label: 'Customer',
        placeholder: 'Search by Email or Phone',
        name: 'search_customer_info',
        tag_name: 'Customer',
        type: 'input',
        main_filter: 1,
        field_values: {},
        data: [],
      },

      channel_id: {
        label: 'Search by Channel',
        name: 'Channels',
        placeholder: 'Select Channel',
        type: 'select',
        field_values: {},
        data: [],
        //'data' : this.populate_filter_data.channels,
        multiple: true,
      },

      shipping_method: {
        label: 'Search by Shipping Method',
        name: 'Shipping Method',
        placeholder: 'Select Shipping Method',
        type: 'select',
        field_values: {},
        data: [
          { name: 'Fulfillment', value: 'fbs' },
          { name: 'Shiprocket', value: 'sr' },
        ],
      },
    };

    this.queryparams = {
      courier_id: 0,
      filter: '',
      filter_by: 'status',
      from: '',
      to: '',
      is_web: 1,
      page: 1,
      //payment_method: string,
      per_page: 15,
      search: '',
      search_customer_info: '',
    };
  }

  dataSource: any;
  processing_data: ProessingInterface[];
  firstTimeLoad: boolean = true;

  getProcessingOrders() {
    //console.log("QUERYPARAMS BEFORE QUERY ",this.queryparams);
    let params = Object.assign({}, this.queryparams);
    params['fbs_all_orders'] = 1;

    this.request.getWithParams('orders', params).subscribe(
      (data: any) => {
        this.firstTimeLoad = false;
        this.dataSource.data = data['data'];
        let meta = data.meta;
        if (data) {
          this.currentPage = meta.pagination.current_page - 1;

          if (meta.pagination.links.next) {
            this.dataLength =
              meta.pagination.per_page * (meta.pagination.current_page + 1);
          } else {
            //this.pageSize =  0;
            this.dataLength = 0;
          }
        }
      },
      (errors) => {}
    );
  }

  ngOnDestroy() {
    //console.log('All Orders : ChildComponent:OnDestroy');
  }

  updateParams(queryparams: any) {
    //console.log("all query params",queryparams);
    this.paramsEvent.emit({ allorders: queryparams });
  }

  ngOnChanges(changes: SimpleChanges) {
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
        this.changed.filter = cur.filter;
        this.changed.courier_id = cur.courier_id;
        this.changed.channels = cur.channel_id;
        this.changed.search = cur.search;
        this.changed.search_customer_info = cur.search_customer_info;
      }

      if (propName == 'populate_filter_data' && Object.keys(cur).length) {
        let d: any = [];
        if (cur.shipment_status.length) {
          this.filters_info.filter.data = cur.shipment_status;
        }
        if (cur.channels.length) {
          this.filters_info.channel_id.data = cur.channels;
        }
        if (cur.couriers.length) {
          this.filters_info.courier_id.data = cur.couriers;
        }
      }
    }
  }

  setFilters(default_param?: any) {
    //console.log("set filters ... ");

    let filters_array = Object.keys(this.filters_info);

    for (let ft of filters_array) {
      if (ft == 'date') {
        this.filters_info[ft].field_values = {
          start: this.changed.from,
          end: this.changed.to,
        };
      } else {
        //console.log(ft,);
        this.filters_info[ft].field_values = { value: this.changed[ft] };
      }
    }

    //new chagnes for pagination
    let qpkeys = Object.keys(this.queryparams);
    for (let qp of qpkeys) {
      if (
        filters_array.indexOf(qp) === -1 &&
        qp != 'from' &&
        qp != 'to' &&
        this.changed[qp] != undefined
      ) {
        this.queryparams[qp] = this.changed[qp];
      }
    }
    //console.log(this.filters_info);
  }

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource<ProessingInterface>(
      this.processing_data
    );
    this.setFilters();
  }

  updateFilters($event) {
    //console.log("updateFiltesrs ---");
    let filters_array = Object.keys(this.filters_info);
    this.queryparams.page = this.currentPage = 1;

    for (let ft of filters_array) {
      if (ft == 'date') {
        if (
          this.queryparams.from != $event.filters[ft].start ||
          this.queryparams.to != $event.filters[ft].end
        ) {
          this.ga.emitEvent('Filters', 'Clicked on Search by Date Range', '');
        }
        this.queryparams.from = $event.filters[ft].start;
        this.queryparams.to = $event.filters[ft].end;
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
    this.getProcessingOrders();
  }

  public onPaginateChange(e: any) {
    if (e.pageSize > this.queryparams.per_page) {
      e.previousPageIndex = e.pageIndex = 0;
    }

    if (e.previousPageIndex >= e.pageIndex) {
      if (e.previousPageIndex == 0 && e.pageIndex == 0) {
        this.queryparams.page = this.currentPage = 1;
      } else {
        this.queryparams.page = this.currentPage;
      }
    } else {
      this.queryparams.page = this.currentPage + 2;
    }
    this.queryparams.per_page = e.pageSize;
    this.getProcessingOrders();
    this.updateParams(this.queryparams);
  }
}
