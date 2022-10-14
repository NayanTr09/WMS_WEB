import {
  Component,
  OnInit,
  Injectable,
  ViewChild,
  Output,
  EventEmitter,
  Input,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from './../../../services/auth/auth.service';
import { environment } from 'src/environments/environment';
import { ToastrService } from 'ngx-toastr';

//import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ReportsService } from './../../../services/http/reports.service';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Url } from 'url';
import { MatMenuTrigger } from '@angular/material/menu';
//import * as moment from 'moment';

//import { CustomFilters } from '../../helper/filters/filters.component';
import {
  CASE,
  CustomFilters,
  FiltersComponent,
} from 'src/app/components/helper/filters/filters.component';
//import { timer } from 'rxjs';
//import { MatFormFieldControl } from '@angular/material/form-field';
//import {PageEvent} from '@angular/material/paginator';
import { DownloadService } from './../../../services/http/download.service';
import { GoogleAnalyticsService } from 'src/app/services/http/google-analytics.service';

interface ReportsTable {
  date?: Date;
  from?: Date;
  to?: Date;
  size?: string;
  title?: string;
  type?: string;
  url?: Url;
  is_report_downloadable?: number;
}

interface data {
  data: ReportsTable[];
  meta: {
    panel_report_count: number;
    pagination: {
      count?: number;
      current_page?: number;
      per_page?: number;
      total?: number;
      total_pages?: number;
    };
  };
}
@Injectable()
export class QueryParams {
  private queryParams: any;
  constructor() {
    this.queryParams = {};
  }

  public setValue(value) {
    delete value.action;
    this.queryParams = value;
  }

  public getValue() {
    return this.queryParams;
  }
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit, OnChanges {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  qs: any;
  pageSizeOptions: number[] = [15, 30, 60];
  is_admin: boolean = false;

  queryparams: {
    from: string;
    to: string;
    is_web: number;
    page: number;
    per_page: number;
    title_id: string;
    type_id: string;
  };

  filters_info: {
    type_id: CustomFilters;
    title_id: CustomFilters;
    date: CustomFilters;
  };
  resultsLength: number;
  dataSource: ReportsTable[];
  changed: any = {};
  tableSource: MatTableDataSource<ReportsTable>;
  currentPage: number;

  @Input() query: any;
  @Output() paramsEvent: EventEmitter<any> = new EventEmitter();

  displayedColumns: string[] = [
    'date',
    'title',
    'type',
    'from_to',
    'url',
    'size',
  ];

  constructor(
    public reportsService: ReportsService,
    public authService: AuthService,
    public queryParams: QueryParams,
    public dialog: MatDialog,
    public toastr: ToastrService,
    public modal: MatDialog,
    public route: ActivatedRoute,
    public router: Router,
    public downloadService: DownloadService,
    public ga: GoogleAnalyticsService
  ) {
    this.currentPage = 0;
    this.queryparams = {
      from: '',
      to: '',
      is_web: 1,
      page: 1,
      per_page: 15,
      title_id: '',
      type_id: '',
    };
    this.qs = {};

    this.dataSource = [];
    this.resultsLength = 0;
    this.is_admin = this.authService.getUserData().is_admin;

    this.filters_info = {
      title_id: {
        label: 'Report Title',
        name: 'Title',
        tag_name: 'Title',
        placeholder: 'Search by Report Title',
        type: 'input',
        data: [],
        field_values: {},
        main_filter: 1,
      },
      type_id: {
        label: 'Search by Report Type',
        name: 'Type',
        placeholder: 'Select Type',
        type: 'select',
        data: [
          {
            name: 'Orders',
            value: 25,
          },
          {
            name: 'Inventories',
            value: 26,
          },
          {
            name: 'ASN',
            value: 27,
            case: 'uppercase' as CASE,
          },
          {
            name: 'Products',
            value: 28,
          },
        ],
        field_values: {},
      },
      date: {
        label: 'Search by Date Range',
        name: 'Date',
        type: 'date_range',
        data: [],
        field_values: {},
      },
    };
  }

  downloadCsv() {
    // const { search } = window.location;
    // if (search) {
    //   this.reportDownloadURL += search;
    // } else {
    //   this.reportDownloadURL += '?is_web=1';
    // }

    const link = document.getElementById('downloadLink');
    link.click();
  }

  navigateToPage(): void {
    const token = this.authService.getUserData().token;
    const url = environment.tokenLoginUrl;
    window.open(`${url}?token=${token}&toState=app.reports`, '_blank');
  }

  updateQueryParams($event): void {
    //console.log("coming....");
    let key = Object.keys($event);
    let qp = this.queryParams.getValue();

    this.route.queryParams.subscribe((params) => {
      this.router.navigate(['reports'], { queryParams: params });
      let params_len = Object.keys(params).length;
      let stored_p_len = Object.values(qp).length;

      //params in url but not in query param class so set params from url
      if (params_len && !stored_p_len) {
        this.queryParams.setValue(params);
        this.qs[key[0]] = params;
      } else if (!params_len && stored_p_len) {
        //not params in url and stored in query param class so set form queryparma class
        this.queryParams.setValue(qp);
        this.qs[key[0]] = qp;
      } else {
        //console.log($event);
        this.queryParams.setValue($event[key[0]]);
        this.qs[key[0]] = $event[key[0]];
      }
    });
  }

  ngOnInit(): void {
    console.log('enter construct');

    //console.log("<< ---- NGONIT ASN ---- >>> ");
    this.tableSource = new MatTableDataSource<ReportsTable>(this.dataSource);

    this.route.url.subscribe((url: any): void => {
      this.router.navigate([url], { queryParams: this.queryparams });
    });

    this.setFilters();
    //this.dataSource = new MatTableDataSource<ProessingInterface>(this.processing_data);
  }

  hasGE(status: string): boolean {
    return status.toLowerCase().startsWith('ge');
  }

  setFilters(default_param?: any) {
    //console.log("set filters ... ");

    let filters_array = Object.keys(this.filters_info);

    for (let ft of filters_array) {
      if (ft == 'date') {
        this.filters_info[ft].field_values = {
          start: this.changed.date_from,
          end: this.changed.date_to,
        };
      } else {
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
  }

  updateFilters($event) {
    console.log('update filters ');
    let filters_array = Object.keys(this.filters_info);

    for (let ft of filters_array) {
      if (ft == 'date') {
        this.queryparams.from = $event.filters[ft].start;
        this.queryparams.to = $event.filters[ft].end;
      } else {
        this.queryparams[ft] = $event.filters[ft];
      }
    }

    this.route.url.subscribe((url: any): void => {
      this.router.navigate([url], { queryParams: this.queryparams });
    });

    this.updateParams(this.queryparams);

    this.getReportsData();
  }

  updateParams(queryparams: any) {
    switch (queryparams.type_id) {
      case 25: {
        this.ga.emitEvent(
          'SRF',
          'Clicked on Search by report type orders',
          'Report Page'
        );
        break;
      }
      case 26: {
        this.ga.emitEvent(
          'SRF',
          'Clicked on Search by report type inventories',
          'Report Page'
        );
        break;
      }
      case 27: {
        this.ga.emitEvent(
          'SRF',
          'Clicked on Search by report type ASN',
          'Report Page'
        );
        break;
      }
      case 28: {
        this.ga.emitEvent(
          'SRF',
          'Clicked on Search by report type Products',
          'Report Page'
        );
        break;
      }
      default: {
        break;
      }
    }
    this.paramsEvent.emit(queryparams);
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('On change');
    for (const propName in changes) {
      const chng = changes[propName];
      const cur = chng.currentValue;

      if (propName == 'query' && cur != undefined && Object.keys(cur).length) {
        this.changed.asn = cur.asn != undefined ? cur.asn : '';
        this.changed.page = cur.page != undefined ? cur.page : '';
        this.changed.per_page = cur.per_page;
        this.changed.warehouse_code = cur.warehouse_code
          ? cur.warehouse_code
          : '';
        this.changed.date_from = cur.date_from ? cur.date_from : '';
        this.changed.date_to = cur.date_to ? cur.date_to : '';
        this.changed.is_web = cur.is_web;
        this.changed.status = cur.status;
        this.setFilters();
      }
      //console.log("CURRENT VALUES ",this.changed);
    }
    //console.log(this.changed);
  }

  ngDestroy() {
    //console.log('ng destroy ... ');
  }

  openDateMenu() {
    this.trigger.openMenu();
  }

  firstTimeLoad: boolean = true;

  public getReportsData() {
    console.log('Enter get report data');
    let query_params = Object.assign({}, this.queryparams);
    query_params['is_srf'] = 1;
    //let query_params = this.queryparams;
    //console.log("query_params >> ",this.queryparams);

    this.dataSource = [];

    this.reportsService
      .getReportsDetails(query_params)
      .subscribe((data: data) => {
        this.firstTimeLoad = false;

        if (data.data.length) {
          let results = data.data;
          let meta = data.meta;
          let k = 0;

          //console.log(" PER PAGE ",meta.per_page , "CURRENT PAGE ",meta.current_page);
          this.currentPage = meta.pagination.current_page - 1;

          if (meta.pagination.total) {
            //console.log("next page link "+links.next);
            this.resultsLength = meta.pagination.total;
            // this.paginator.pageIndex =  meta.current_page+1;
            //console.log("RESULT LENGTH ",this.resultsLength);
          } else {
            //this.resultsLength = meta.per_page;
            this.resultsLength = 0;
          }

          this.queryparams.page = meta.pagination.current_page;
          //this.currentPage = meta.current_page ? meta.current_page : 1;

          for (let result of results) {
            this.dataSource[k] = {};
            this.dataSource[k].date = result.date;
            this.dataSource[k].from = result.from;
            this.dataSource[k].to = result.to;
            this.dataSource[k].size = result.size;
            this.dataSource[k].title = result.title;
            this.dataSource[k].type = result.type;
            this.dataSource[k].url = result.url;
            this.dataSource[k].is_report_downloadable =
              result.is_report_downloadable;
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

  openDownloadUrl(url, is_report_downloadable) {
    if (isNaN(url) && !is_report_downloadable) {
      //window.open(url, '_blank');

      // var link=document.createElement('a');
      // link.href = url;
      // link.download = url.substr(url.lastIndexOf('/') + 1);
      // link.click();
      this.downloadService.downloadDataWithUrl(url);
    } else {
      this.downloadService.downloadReportById(url);
    }
  }
  public handlePage(e: any) {
    console.log('handle page');
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
    this.getReportsData();
    this.updateParams(this.queryparams);
  }
}
