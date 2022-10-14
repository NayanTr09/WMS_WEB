import {
  Component,
  OnInit,
  ViewChild,
  Output,
  EventEmitter,
  Input,
  SimpleChanges,
  TemplateRef,
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
  dekit_quantity?: number;
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

@Component({
  selector: 'app-de-kitting',
  templateUrl: './de-kitting.component.html',
  styleUrls: ['./de-kitting.component.scss'],
})
export class DeKittingComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

  pageSizeOptions: number[] = [15, 30, 60];

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

  @Input() query: any;
  @Input() populate_filter_data: any;
  @Output() paramsEvent: EventEmitter<any> = new EventEmitter();

  displayedColumns: string[] = [
    'id',
    'sku',
    'dekit_quantity',
    'items',
    'status',
  ];
  constructor(
    public httpService: HttpService,
    public orderService: OrdersService,
    public authService: AuthService,
    public dialog: MatDialog,
    public toastr: ToastrService,
    public modal: MatDialog,
    public route: ActivatedRoute,
    public router: Router
  ) {
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
        label: 'KitID or SKU',
        placeholder: 'Search by Kit ID or SKU',
        tag_name: 'KitID or SKU',
        type: 'input',
        main_filter: 1,
        field_values: {},
        data: [],
      },
    };
  }

  ngOnInit(): void {
    this.tableSource = new MatTableDataSource<KitTable>(this.dataSource);
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

  firstTimeLoad: boolean = true;
  public getKittingList() {
    let query_params = Object.assign({}, this.queryparams);
    this.dataSource = [];
    query_params['dekit'] = 1;
    this.orderService.kittingList(query_params).subscribe((data: data) => {
      this.firstTimeLoad = false;
      console.log(data);
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
          this.dataSource[k] = { dekit_quantity: 0 };
          this.dataSource[k].id = result.id;
          this.dataSource[k].created_at = result.created_at;
          this.dataSource[k].sku = result.sku;
          this.dataSource[k].dekit_quantity = result.dekit_quantity;
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
        this.queryparams.date_from = $event.filters[ft].start;
        this.queryparams.date_to = $event.filters[ft].end;
      } else {
        this.queryparams[ft] = $event.filters[ft];
      }
    }

    this.updateParams(this.queryparams);

    this.getKittingList();
  }
}
