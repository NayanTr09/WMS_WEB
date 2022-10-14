import { CustomFilters } from 'src/app/components/helper/filters/filters.component';
import { HttpService } from '../../../../services/http/http.service';
import { MatTableDataSource } from '@angular/material/table';
import { GoogleAnalyticsService } from 'src/app/services/http/google-analytics.service';
//import { PageEvent } from '@angular/material/paginator';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

export interface BackOrderInterface {
  orderId: string;
  product: string;
  customer: string;
  payment: string;
  shipping: string;
}

@Component({
  selector: 'backorders',
  templateUrl: './backorders.component.html',
  styleUrls: ['./backorders.component.scss'],
})
export class BackordersComponent implements OnInit {
  displayedColumns: string[] = [
    'orderId',
    'Product',
    'Customer',
    'Payment',
    'Shipping',
  ];

  @Input() query: any;
  @Output() paramsEvent: EventEmitter<any> = new EventEmitter();
  @Input() populate_filter_data: any;

  changed: any = {};

  filters_info: {
    date: CustomFilters;
    //filter  : CustomFilters,
    //courier_id  : CustomFilters
    search: CustomFilters;
    search_customer_info: CustomFilters;
    channel_id: CustomFilters;
  };

  dataLength = 0;
  pageSize = 15;
  page = 1;
  pageSizeOptions: number[] = [15, 30, 60];
  currentPage: number = 0;

  queryparams: {
    from: string;
    to: string;
    is_web: number;
    page: number;
    channel_id: string;
    //payment_method: string,
    per_page: number;
    search: string;
    search_customer_info: string;
  };

  constructor(public request: HttpService, public ga: GoogleAnalyticsService) {
    this.queryparams = {
      page: this.page,
      per_page: this.pageSize,
      from: '',
      to: '',
      is_web: 1,
      search: '',
      search_customer_info: '',
      channel_id: '',
    };

    this.filters_info = {
      date: {
        name: 'Date',
        label: 'Search by Date Range',
        type: 'date_range',
        data: [],
        field_values: {},
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
        placeholder: 'Select Channel',
        type: 'select',
        field_values: {},
        data: [],
        //'data' : this.populate_filter_data.channels,
        multiple: true,
      },
    };
  }

  dataSource: any;
  back_order_data: BackOrderInterface[];
  //pageEvent: PageEvent;

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
        //this.changed.filter = cur.filter ;
        //this.changed.courier_id = cur.courier_id ;
        this.changed.channel_id = cur.channel_id;
        this.changed.search = cur.search;
        this.changed.search_customer_info = cur.search_customer_info;
      }

      if (propName == 'populate_filter_data' && Object.keys(cur).length) {
        //console.log("AllOrders : populate_filter_data ngOnChange function");
        let d: any = [];

        if (cur.channels.length) {
          this.filters_info.channel_id.data = cur.channels;
        }

        //console.log("BACK ORDERS : ngOnChanges END HERE");
      }
    }
  }
  firstTimeLoad: boolean = true;

  getBackOrders() {
    let params = Object.assign({}, this.queryparams);
    params['back_order'] = 1;
    //delete params['back_order'];

    this.request.getWithParams('orders/processing', params).subscribe(
      (data: any) => {
        this.dataSource = data['data'];
        this.firstTimeLoad = false;
        // console.log("get length",this.dataSource)
        // if(!data['meta']['pagination']['links']['next']){
        //   this.dataLength = (this.page*this.pageSize)-1;
        //   console.log(this.dataLength);
        // }

        //console.log(this.page);

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

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource<BackOrderInterface>(
      this.back_order_data
    );
    this.setFilters();
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

  updateFilters($event) {
    //console.log('Events .... ... ....');
    let filters_array = Object.keys(this.filters_info);
    //console.log($event.filters);
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

    this.getBackOrders();
  }

  updateParams(queryparams: any) {
    this.paramsEvent.emit({ backorders: queryparams });
  }

  public onPaginateChange(e: any) {
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
    this.getBackOrders();
    this.updateParams(this.queryparams);
  }
}
