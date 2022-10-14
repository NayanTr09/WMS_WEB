import { ToastrService } from 'ngx-toastr';
import { CustomFilters } from 'src/app/components/helper/filters/filters.component';
import { AuthService } from './../../../services/auth/auth.service';
import {
  Component,
  ViewChild,
  SimpleChanges,
  Input,
  Output,
  EventEmitter,
  OnInit,
  TemplateRef,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';

import { MatPaginator } from '@angular/material/paginator';
import { Url } from 'url';
import { FcsService } from 'src/app/services/http/fcs.service';
import { GoogleAnalyticsService } from 'src/app/services/http/google-analytics.service';

interface InventoryTable {
  id: number;
  srpin: string;
  ean: string;
  sku: string;
  product_name: string;
  product_name_sort: string;
  quantity: number;
  fulfillment_center: string;
  onhold_quantity: number;
  total_quantity: number;
  center_type: string;
  expiry_data: {};
}

interface data {
  links: { first: Url; next: Url };
  data: InventoryTable[];
  meta: { per_page: number };
}

interface Warehouse {
  code: string;
  name: string;
}

@Component({
  selector: 'inventory-list',
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./fcs.component.scss'],
})
export class InventoryListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('expiryDialog') expiryDialog: TemplateRef<HTMLDialogElement>;

  resultsLength: number;
  warehouses: Warehouse[];
  inventorydataSource: InventoryTable[];
  changed: any = {};
  /*inventory*/

  queryparams: {
    date: string;
    page: number;
    per_page: number;
    product_name: string;
    sku: string;
    srpin: string;
    ean: string;
    warehouse_code: string;
    wh_code: string;
    is_web: number;
  };

  filters_info: {
    date: CustomFilters;
    warehouse_code: CustomFilters;
    sku: CustomFilters;
    srpin: CustomFilters;
    ean: CustomFilters;
    product_name: CustomFilters;
  };

  inventorySource: MatTableDataSource<InventoryTable>;
  @Input() query: any;
  @Output() paramsEvent: EventEmitter<any> = new EventEmitter();
  //@Output() downloadURL: EventEmitter<any> = new EventEmitter();

  displayedColumns: string[] = [
    'asn',
    'created_at',
    'unique_skus',
    //'onhold_quantity',
    'quantity',
    'status',
  ];

  InventoryColumns: string[] = [
    //'s_no',
    'sku',
    'srpin',
    'product_name',
    'fulfillment_center',
    'quantity',
    'onhold_quantity',
    'total_quantity',
  ];

  dataLength: number = 0;
  pageSize = 15;
  page = 1;
  pageSizeOptions: number[];
  currentPage: number = 0;
  showNoData: number;
  reportDownloadURL: string;
  firstTimeLoad: boolean = true;
  is_b2b_plan_activated: boolean;
  warehouse_data: any[];
  //filename : string = "inventory-do-file.csv";
  //channel_id=0&warehouse_code=&product=&sku=&

  constructor(
    public fcsService: FcsService,
    public authService: AuthService,
    public toastr: ToastrService,
    private dialog: MatDialog,
    public ga: GoogleAnalyticsService
  ) {
    //this.warehouses = [];
    this.resultsLength = 0;
    this.inventorydataSource = [];
    this.reportDownloadURL = 'warehouse/export-inventories';

    this.filters_info = {
      date: {
        label: 'Choose the date for closing inventory',
        name: 'Date',
        type: 'date',
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
        isDefault: true,
        multiple: true,
      },
      sku: {
        tag_name: 'SKU',
        name: 'sku',
        label: 'SKU',
        placeholder: 'Search by SKU',
        type: 'input',
        main_filter: 1,
        field_values: {},
        data: [],
      },
      product_name: {
        tag_name: 'Product Name',
        name: 'search',
        label: 'Product',
        placeholder: 'Search by Product Name',
        type: 'input',
        main_filter: 1,
        field_values: {},
        data: [],
      },
      srpin: {
        tag_name: 'SR PIN',
        name: 'srpin',
        label: 'SRPIN',
        placeholder: 'Search by SR PIN',
        type: 'input',
        main_filter: 1,
        field_values: {},
        data: [],
      },
      ean: {
        tag_name: 'EAN',
        name: 'ean',
        label: 'EAN',
        placeholder: 'Search by EAN',
        type: 'input',
        main_filter: 1,
        field_values: {},
        data: [],
      },
    };

    //this.filters_info.warehouse_code.field_values = { 'value' : 'all'};

    this.queryparams = {
      date: '',
      product_name: '',
      page: this.page,
      per_page: this.pageSize,
      warehouse_code: '',
      wh_code: '',
      sku: '',
      is_web: 1,
      srpin: '',
      ean: '',
    };
    this.pageSizeOptions = [15, 30, 60];

    this.inventorySource = new MatTableDataSource<InventoryTable>(
      this.inventorydataSource
    );

    this.getWarehouses();
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      const chng = changes[propName];
      const cur = chng.currentValue;

      if (propName == 'query' && cur && Object.keys(cur).length) {
        this.changed.product_name =
          cur.product_name != undefined ? cur.product_name : '';
        this.changed.page = cur.page != undefined ? cur.page : '';
        this.changed.per_page = cur.per_page;
        this.changed.warehouse_code = cur.warehouse_code
          ? cur.warehouse_code
          : '';
        this.changed.date = cur.date ? cur.date : '';
        this.changed.wh_code = cur.wh_code ? cur.wh_code : '';
        this.changed.sku = cur.sku ? cur.sku : '';
        this.changed.is_web = cur.is_web;
        this.changed.srpin = cur.srpin ? cur.srpin : '';
        this.changed.ean = cur.ean ? cur.ean : '';
      }
    }
  }

  updateParams(queryparams: any) {
    this.paramsEvent.emit({ inventory: queryparams });
  }

  ngOnInit() {
    this.setFilters();
  }

  public getWarehouses() {
    this.is_b2b_plan_activated = this.authService.getB2bFlag();

    /*if(this.is_b2b_plan_activated == "true") {

        this.fcsService.getWarehouse().subscribe((data:any) => {
          let k =0;
          if(data) {
            // if(!data.data.warehouses.length) {
            //   this.firstTimeLoad = false;
            //   this.toastr.warning("No Fulfillment Center Found","Warning");
            //   return;
            // }
            //console.log("FIELD VLAUE",this.filters_info.warehouse_code.field_values.value);
            for(let wh of data.data.warehouses) {
              if(k == 0 && !this.filters_info.warehouse_code.field_values.value) {
                //console.log("trigger...");
                //console.log(this.filters_info.warehouse_code.field_values);
                this.filters_info.warehouse_code.field_values = { 'value' : wh.id};
              }

              this.filters_info.warehouse_code.data[k] = {
                'name' : wh.name,
                'value' : wh.id
              };
              k++;
            }
          }
        });

      } else { */

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
        this.warehouse_data = data.data.warehouses;
        //console.log("FIELD VLAUE",this.filters_info.warehouse_code.field_values.value);
        for (let wh of data.data.warehouses) {
          if (k == 0 && !this.filters_info.warehouse_code.field_values.value) {
            //console.log("trigger...");
            //console.log(this.filters_info.warehouse_code.field_values);
            this.filters_info.warehouse_code.field_values = {
              value: wh.shipping_address_id,
            };
          }

          this.filters_info.warehouse_code.data[k] = {
            name: wh.name + '(' + wh.warehouse_code + ')',
            value: wh.shipping_address_id,
          };
          k++;
        }
      }
    });
    //}
  }

  setFilters() {
    //console.log('---- setFilters ------');

    let filters_array = Object.keys(this.filters_info);

    for (let ft of filters_array) {
      this.filters_info[ft].field_values = {
        value: this.changed[ft]
          ? this.changed[ft]
          : Object.keys(this.filters_info[ft].field_values).length
          ? this.filters_info[ft].field_values.value
          : '',
      };
    }

    //console.log("set filter functions -->-->-->");
    //console.log(this.filters_info);

    //new chagnes for pagination
    let qpkeys = Object.keys(this.queryparams);
    for (let qp of qpkeys) {
      if (filters_array.indexOf(qp) === -1 && this.changed[qp] != undefined) {
        this.queryparams[qp] = this.changed[qp];
      }
    }
    //console.log("showNoData ",this.queryparams);
    //this.showNoData = 1;
  }

  updateFilters($event) {
    //console.log('update filters ');
    let filters_array = Object.keys(this.filters_info);
    this.queryparams.page = this.currentPage = 1;
    for (let ft of filters_array) {
      if (
        ($event.filters[ft] != '' || this.queryparams[ft] != '') &&
        this.queryparams[ft] != $event.filters[ft]
      ) {
        this.ga.emitEvent('Filters', ft, '');
      }
      this.queryparams[ft] = $event.filters[ft];
    }
    this.getInventoryData();
    this.updateParams(this.queryparams);
  }

  public getInventoryData() {
    if (this.is_b2b_plan_activated == false) {
      this.InventoryColumns = [
        'sku',
        'srpin',
        'product_name',
        'fulfillment_center',
        'quantity',
        'onhold_quantity',
        'total_quantity',
      ];
    }

    let params = Object.assign({}, this.queryparams);
    // console.log('query params:', params);
    params['product'] = this.queryparams['product_name'];
    params['seller_id'] = this.authService.getUserData().company_id;
    delete params['product_name'];
    var wh_codes = this.queryparams['warehouse_code'].split(',');
    var whCode = [];
    for (let el in wh_codes) {
      let warehouse_code = this.warehouse_data.find(
        (o) => o.shipping_address_id == wh_codes[el]
      );
      whCode.push(warehouse_code.warehouse_code);
    }

    this.queryparams['wh_code'] = whCode.join();
    params['wh_code'] = this.queryparams['wh_code'];

    this.inventorydataSource = [];

    this.fcsService.getInventoryDetailsUpdate(params).subscribe((data: any) => {
      this.firstTimeLoad = false;
      if (data.data !== undefined && data.data.length) {
        let results = data.data;

        let meta = data.meta;

        if (data.links === undefined) {
          this.currentPage = meta.pagination.current_page - 1;

          if (meta.pagination.links.next) {
            this.dataLength =
              meta.pagination.per_page * (meta.pagination.current_page + 1);
          } else {
            this.dataLength = 0;
          }
        } else {
          this.currentPage = meta.current_page - 1;

          if (data.links.next) {
            this.dataLength = meta.per_page * (meta.current_page + 1);
          } else {
            this.dataLength = 0;
          }
        }

        let k = 0,
          index = 0;
        for (let result of results) {
          this.inventorydataSource[k] = {
            //'s_no' : index,
            id: result.id,
            sku: result.sku,
            product_name: result.product_name,
            product_name_sort:
              result.product_name && result.product_name.length > 15
                ? result.product_name.substr(0, 15) + '...'
                : result.product_name,
            srpin: result.srpin,
            ean: result.ean,
            onhold_quantity: result.on_hold_quantity,
            quantity: result.available_quantity,
            fulfillment_center: result.warehouse_name,
            total_quantity: result.total_qty ? result.total_qty : 0,
            center_type: result.center_type,
            expiry_data: result.expiry_data,
          };
          k++;
          //index++;
        }
        this.inventorySource = new MatTableDataSource(this.inventorydataSource);
        //this.inventorySource.paginator = this.paginator;

        //this.array = this.dataSource;
        //this.queryparams.per_page = this.inventorydataSource.length;
        //this.iterator();
      } else {
        this.showNoData = 1;
        this.inventorySource = new MatTableDataSource([]);
      }
    });
    // console.log('inventory data',this.inventorydataSource);
  }
  onClickExpiry(idx: number): void {
    console.log('idx', idx);
    console.log(this.inventorySource.data[idx]['expiry_data']);
    const data = this.inventorySource.data[idx]['expiry_data'];
    if (!data) {
      return;
    }
    const sku = this.inventorySource.data[idx]['sku'];
    const payload = { sku, data };
    console.log(payload);
    this.dialog.open(this.expiryDialog, {
      width: '40%',
      data: payload,
      panelClass: 'br-10',
      // disableClose: true,
      autoFocus: true,
    });
  }

  onPaginateChange(e: any) {
    if (e.pageSize > this.queryparams.per_page) {
      e.previousPageIndex = e.pageIndex = 0;
    }
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
    this.getInventoryData();
    this.updateParams(this.queryparams);
  }
}
