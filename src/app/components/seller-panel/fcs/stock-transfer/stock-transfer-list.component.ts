import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { CustomFilters } from 'src/app/components/helper/filters/filters.component';

import {
  Component,
  ViewChild,
  SimpleChanges,
  Input,
  Output,
  EventEmitter,
  OnInit,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Url } from 'url';
import { FcsService } from 'src/app/services/http/fcs.service';
import { GoogleAnalyticsService } from 'src/app/services/http/google-analytics.service';

interface STListTable {
  id: number;
  stock_transfer_id: number;
  created_at: string;
  unique_sku: number;
  total_units: number;
  from_center: string;
  to_center: string;
  from_id: number;
  to_id: number;
  status: number;
}

interface data {
  links: { first: Url; next: Url };
  data: STListTable[];
  meta: { per_page: number };
}

const STATUS = [
  { title: 'Pending', color: '#e3c800', 'background-color': '#fff9cf' },
  { title: 'In-progress', color: '#efa30c', 'background-color': '#fee9c0' },
  // { title: 'Shipped', color: '#2c9f29', 'background-color': '#bffeb9' },
  // { title: 'Delivered', color: '#6f57e9', 'background-color': '#ded8ff' },
  { title: 'Completed', color: '#3ab7b4', 'background-color': '#b5fcf9' },
  // { title: 'Inventory Stocked', color: '#555', 'background-color': '#ddd' },
];

interface Warehouse {
  code: string;
  name: string;
}

@Component({
  selector: 'stock-transfer-list',
  templateUrl: './stock-transfer-list.component.html',
  styleUrls: ['../fcs.component.scss'],
})
export class StockTransferListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  resultsLength: number;
  warehouses: Warehouse[];
  STdataSource: STListTable[];
  changed: any = {};
  /*inventory*/

  queryparams: {
    page: number;
    per_page: number;
    //product_name :  string,
    stock_id: string;
    warehouse_code: string;
    is_web: number;
    date_from: string; //this.range.get('start').value.format('YYYY-MMM-DD').toString(),//'2017-Jun-12',//this.range.get('end').value.format('YYYY-MMM-DD').toString(),
    date_to: string; //this.range.get('end').value.format('YYYY-MMM-DD').toString(),//'2021-Jan-21',//,
  };

  filters_info: {
    date: CustomFilters;
    warehouse_code: CustomFilters;
    stock_id: CustomFilters;
    //product_name  : CustomFilters
  };

  stockTransferListSource: MatTableDataSource<STListTable>;
  @Input() query: any;
  @Output() paramsEvent: EventEmitter<any> = new EventEmitter();
  //@Output() downloadURL: EventEmitter<any> = new EventEmitter();

  listColumns: string[] = [
    'stock_transfer_id',
    'created_at',
    'unique_skus',
    'from_center',
    'status',
  ];

  statusMapping = STATUS;

  dataLength: number = 0;
  pageSize: number = 15;
  page: number = 1;
  pageSizeOptions: number[];
  currentPage: number = 0;
  showNoData: number;
  reportDownloadURL: string;
  firstTimeLoad: boolean = true;
  //filename : string = "inventory-do-file.csv";
  //channel_id=0&warehouse_code=&product=&sku=&

  constructor(
    public fcsService: FcsService,
    public authService: AuthService,
    public toastr: ToastrService,
    public router: Router,
    public ga: GoogleAnalyticsService
  ) {
    //this.warehouses = [];
    this.resultsLength = 0;
    this.STdataSource = [];
    //this.reportDownloadURL = "warehouse/export-inventories";

    this.filters_info = {
      date: {
        label: 'Search by Date Range',
        name: 'Date',
        type: 'date_range',
        data: [],
        field_values: {},
      },
      warehouse_code: {
        name: 'Fulfillment Center',
        label: 'Search by Fulfillment Center',
        placeholder: 'Select Fulfillment Center',
        type: 'select',
        data: [],
        field_values: {},
        //'isDefault' : true
      },
      stock_id: {
        name: 'Search',
        label: 'Stock',
        placeholder: 'Search by Stock ID',
        type: 'input',
        main_filter: 1,
        field_values: {},
        data: [],
      },
    };

    //this.filters_info.warehouse_code.field_values = { 'value' : 'all'};

    this.queryparams = {
      //product_name :  '',
      page: 1,
      per_page: 15,
      warehouse_code: '',
      stock_id: '',
      is_web: 1,
      date_from: '',
      date_to: '',
    };

    console.log('QUERY PARAMAS');
    console.log(this.queryparams);
    this.pageSizeOptions = [15, 30, 60];

    this.stockTransferListSource = new MatTableDataSource<STListTable>(
      this.STdataSource
    );

    this.getWarehouses();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('ngOnChanges.........................');
    for (const propName in changes) {
      const chng = changes[propName];
      const cur = chng.currentValue;

      if (propName == 'query' && cur && Object.keys(cur).length) {
        console.log(cur);
        //this.changed.product_name = cur.product_name != undefined ? cur.product_name : '';
        this.changed.page = cur.page != undefined ? cur.page : '';
        this.changed.per_page = cur.per_page;
        this.changed.warehouse_code = cur.warehouse_code
          ? cur.warehouse_code
          : '';
        this.changed.date_from = cur.date_from ? cur.date_from : '';
        this.changed.date_to = cur.date_to ? cur.date_to : '';
        this.changed.stock_id = cur.sku ? cur.stock_id : '';
        this.changed.is_web = cur.is_web;
      }
    }
  }

  updateParams(queryparams: any) {
    console.log('updateParams in stock-transfer component');
    console.log(queryparams);
    this.paramsEvent.emit({ 'stock-transfer': queryparams });
  }

  ngOnInit() {
    this.setFilters();
  }

  public getWarehouses() {
    this.fcsService.getInventoryWarehouse().subscribe((data: any) => {
      let k = 0;

      /*this.filters_info.warehouse_code.data[k] = {
          'name' : "All",
          'value' : "all"
        };
        k++; */
      //console.log(this.filters_info.warehouse_code.data);
      //let default_val = "";
      if (data) {
        if (!data.data.warehouses.length) {
          this.firstTimeLoad = false;
          this.toastr.warning('No Fulfillment Center Found', 'Warning');
          return;
        }
        console.log('FIELD VLAUE', this.filters_info.warehouse_code);
        for (let wh of data.data.warehouses) {
          //if(k == 0 && !this.filters_info.warehouse_code.field_values.value) {
          //console.log("trigger...");
          //console.log(this.filters_info.warehouse_code.field_values);
          //this.filters_info.warehouse_code.field_values = { 'value' : wh.shipping_address_id};
          //}

          this.filters_info.warehouse_code.data[k] = {
            name: wh.name + '(' + wh.warehouse_code + ')',
            value: wh.warehouse_code,
          };
          k++;
        }
        console.log(this.filters_info);
      }
    });
  }

  setFilters() {
    console.log('---- setFilters ------');

    let filters_array = Object.keys(this.filters_info);

    console.log(filters_array);

    // for(let ft of filters_array) {
    //   this.filters_info[ft].field_values = {'value': this.changed[ft] ? this.changed[ft] : ( Object.keys(this.filters_info[ft].field_values).length ? this.filters_info[ft].field_values.value : '' )};
    // }

    for (let ft of filters_array) {
      if (ft == 'date') {
        console.log('DATE>>>>>>');
        console.log(this.filters_info[ft]);
        this.filters_info[ft].field_values = {
          start: this.changed.date_from,
          end: this.changed.date_to,
        };
      } else {
        this.filters_info[ft].field_values = { value: this.changed[ft] };
      }
    }

    //console.log("set filter functions -->-->-->");
    console.log(this.filters_info);

    //new chagnes for pagination
    let qpkeys = Object.keys(this.queryparams);
    console.log('QPKEYS');
    console.log(qpkeys);
    for (let qp of qpkeys) {
      if (
        filters_array.indexOf(qp) === -1 &&
        this.changed[qp] != undefined &&
        qp != 'date_from' &&
        qp != 'date_to'
      ) {
        this.queryparams[qp] = this.changed[qp];
      } else {
        //this.queryparams[qp] = this.changed[qp];
      }
    }
    console.log(this.queryparams);
  }

  updateFilters($event) {
    console.log('update filters ');
    let filters_array = Object.keys(this.filters_info);

    for (let ft of filters_array) {
      if (ft == 'date') {
        this.queryparams.date_from = $event.filters[ft].start;
        this.queryparams.date_to = $event.filters[ft].end;
      } else {
        this.queryparams[ft] = $event.filters[ft];
      }
    }

    console.log(this.queryparams);

    this.updateParams(this.queryparams);
    this.getStockTransferData();
  }

  public getStockTransferData() {
    let params = Object.assign({}, this.queryparams);
    //params['product'] = this.queryparams['product_name'];
    //delete params['product_name'];

    this.STdataSource = [];

    // let qs = Object.keys(params).map((key)=>{
    //   return `${key}=${params[key]}`;
    // }).join('&');
    //console.log(qs);
    //this.reportDownloadURL += qs;
    //console.log(this.reportDownloadURL);
    // if(params.warehouse_code == 'all') {
    //   params.warehouse_code = '';
    // }

    this.fcsService.getStockTransferDetails(params).subscribe((data: any) => {
      this.firstTimeLoad = false;
      if (data.data !== undefined && data.data.length) {
        //this.showNoData = 0;
        let results = data.data;

        let meta = data.meta;

        let links =
          meta.pagination != undefined && meta.pagination.link != undefined
            ? meta.pagination.links
            : {};

        if (!links.length) {
          links = data.links != undefined ? data.links : {};
          this.currentPage = meta.current_page - 1;
          meta['pagination'] = {};
          meta['pagination']['per_page'] = meta.per_page;
          meta['pagination']['current_page'] = meta.current_page;
        } else {
          this.currentPage = meta.pagination.current_page - 1;
        }

        if (links && links.next) {
          this.dataLength =
            meta.pagination.per_page * (meta.pagination.current_page + 1);
        } else {
          this.dataLength = 0;
        }
        //console.log(this.currentPage);
        //index = this.currentPage != 0 ? (this.currentPage * this.queryparams.per_page+1) : 1;
        let k = 0,
          index = 0;

        for (let result of results) {
          this.STdataSource[k] = {
            id: result.id,
            stock_transfer_id: result.stock_transfer_id,
            created_at: result.created_at,
            from_center: result.from_warehouse_name,
            to_center: result.to_warehouse_name,
            unique_sku: result.stock_items.length,
            total_units: 0,
            to_id: result.to_warehouse_id,
            from_id: result.from_warehouse_id,
            status: result.status,
          };

          for (let item of result.stock_items) {
            this.STdataSource[k].total_units += <number>item.quantity;
          }

          k++;
          index++;
        }
        this.stockTransferListSource = new MatTableDataSource(
          this.STdataSource
        );
        this.stockTransferListSource.paginator = this.paginator;
        console.log(this.stockTransferListSource);
        //this.array = this.dataSource;
        //this.queryparams.per_page = this.inventorydataSource.length;
        //this.iterator();
      } else {
        this.showNoData = 1;
        this.stockTransferListSource = new MatTableDataSource([]);
      }
    });
  }

  onPaginateChange(e: any) {
    //console.log(e);
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
    //console.log(this.queryparams);
    this.getStockTransferData();
    this.updateParams(this.queryparams);
  }

  navigateToCreateAsn(element): void {
    const { id, stock_transfer_id, status } = element;
    this.router.navigate(['/fcs/create-stock-transfer'], {
      queryParams: { id, stock_transfer_id, status },
    });
  }
}
