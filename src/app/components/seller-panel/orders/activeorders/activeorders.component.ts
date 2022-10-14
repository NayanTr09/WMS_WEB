import { CustomFilters } from 'src/app/components/helper/filters/filters.component';
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
import { PageEvent } from '@angular/material/paginator';
import { GoogleAnalyticsService } from 'src/app/services/http/google-analytics.service';

export interface ProessingInterface {
  orderId: string;
  product: string;
  customer: string;
  shipping: string;
  status: string;
}

@Component({
  selector: 'activeorders',
  templateUrl: './activeorders.component.html',
  styleUrls: ['./activeorders.component.scss'],
})
export class ActiveordersComponent implements OnInit {
  @Input() query: any;
  @Output() paramsEvent: EventEmitter<any> = new EventEmitter();
  @Input() populate_filter_data: any;

  changed: any = {};

  filters_info: {
    date: CustomFilters;
    filter: CustomFilters;
    courier_id: CustomFilters;
    search: CustomFilters;
    search_customer_info: CustomFilters;
    channel_id: CustomFilters;
  };

  queryparams: {
    courier_id: number;
    filter: string;
    filter_by: string;
    from: string;
    to: string;
    is_web: number;
    page: number;
    //payment_method: string,
    channel_id: '';
    per_page: number;
    search: string;
    search_customer_info: string;
  };

  displayedColumns: string[] = [
    'orderId',
    'Product',
    'Customer',
    'Payment',
    'Shipping',
    'Status',
  ];

  dataLength: number = 0;
  pageSize = 15;
  page = 1;
  pageSizeOptions: number[] = [15, 30, 60];
  currentPage: number = 0;

  // MatPaginator Output
  pageEvent: PageEvent;

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
        tag_name: 'Search',
        placeholder: 'Search by Order ID or AWB',
        type: 'input',
        main_filter: 1,
        field_values: {},
        data: [],
      },
      search_customer_info: {
        label: 'Customer',
        name: 'search_customer_info',
        tag_name: 'Customer',
        placeholder: 'Search by Email or Phone',
        type: 'input',
        main_filter: 1,
        field_values: {},
        data: [],
      },
      channel_id: {
        label: 'Search by Channel',
        name: 'Channels',
        placeholder: 'Select Courier',
        type: 'select',
        field_values: {},
        data: [],
        //'data' : this.populate_filter_data.channels,
        multiple: true,
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
      channel_id: '',
      //payment_method: string,
      per_page: 15,
      search: '',
      search_customer_info: '',
    };
  }

  dataSource: any;
  activeOrders_data: ProessingInterface[];

  ngOnChanges(changes: SimpleChanges) {
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
        this.changed.channel_id = cur.channel_id;
        this.changed.search = cur.search;
        this.changed.search_customer_info = cur.search_customer_info;
      }

      if (propName == 'populate_filter_data' && Object.keys(cur).length) {
        //console.log("Active order : populate_filter_data ngOnChange function");
        let d: any = [];
        if (cur.shipment_status.length) {
          this.filters_info.filter.data = cur.shipment_status.filter((data) => {
            //return [7,8,10,12,14].indexOf(data.value) == -1;
            //Delivered,Canceled,Pending,Pickup Error

            return [7, 5, 1, 16, 17, 52, 53].indexOf(data.value) == -1;
          });
        }
        if (cur.channels.length) {
          this.filters_info.channel_id.data = cur.channels;
        }
        if (cur.couriers.length) {
          this.filters_info.courier_id.data = cur.couriers;
        }

        //console.log("ACTIVE ORDERS : ngOnChanges END HERE");
      }

      //console.log(this.changed);
    }
  }

  firstTimeLoad: boolean = true;

  getActiveOrders() {
    let params = Object.assign({}, this.queryparams);
    params['fbs_active'] = 1;
    params['fbs'] = 1;

    this.request.getWithParams('orders', params).subscribe(
      (data: any) => {
        //console.log("data",data);
        this.firstTimeLoad = false;

        this.dataSource.data = data['data'];

        let meta = data.meta;

        if (data) {
          this.currentPage = meta.pagination.current_page - 1;

          if (meta.pagination.links.next) {
            //console.log("next page link "+links.next);
            this.dataLength =
              meta.pagination.per_page * (meta.pagination.current_page + 1);
            // this.paginator.pageIndex =  meta.current_page+1;
            //console.log("RESULT LENGTH ",this.dataLength);
          } else {
            //this.resultsLength = meta.per_page;
            this.dataLength = 0;
            //this.pageSize =  0;
          }
        }
      },
      (errors) => {}
    );
  }

  setFilters(default_param?: any) {
    let filters_array = Object.keys(this.filters_info);

    for (let ft of filters_array) {
      if (ft == 'date') {
        this.filters_info[ft].field_values = {
          start: this.changed.from,
          end: this.changed.to,
        };
      } else {
        this.filters_info[ft].field_values = { value: this.changed[ft] };
      }
    }

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
  }

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource<ProessingInterface>(
      this.activeOrders_data
    );
    this.setFilters();
  }

  updateFilters($event) {
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
    //console.log(this.queryparams);

    this.getActiveOrders();
  }

  updateParams(queryparams: any) {
    this.paramsEvent.emit({ activeorders: queryparams });
  }

  ngOnDestroy(): void {
    //console.log("active component destroyed");
  }

  onPaginateChange(e: any) {
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
    this.getActiveOrders();
    this.updateParams(this.queryparams);
  }
}
