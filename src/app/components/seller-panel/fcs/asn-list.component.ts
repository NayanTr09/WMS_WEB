import { ToastrService } from 'ngx-toastr';
import { AuthService } from './../../../services/auth/auth.service';
import { FcsService } from './../../../services/http/fcs.service';
import {
  Component,
  ViewChild,
  //AfterViewInit,
  OnInit,
  Output,
  EventEmitter,
  Input,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Url } from 'url';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
// import { UploadASNDialog } from './asn-upload/upload-asn-dialog.component';
import { CustomFilters } from '../../helper/filters/filters.component';
import { timer } from 'rxjs';
import { Router } from '@angular/router';
import { GoogleAnalyticsService } from 'src/app/services/http/google-analytics.service';
//import { MatFormFieldControl } from '@angular/material/form-field';
//import {PageEvent} from '@angular/material/paginator';

interface ASNTable {
  asn?: string;
  id?: number;
  created_at?: Date;
  slot_date?: string;
  slot_timings?: string;
  slot_id?: number;
  can_reschedule?: boolean;
  items?: [
    {
      id?: number;
      name?: string;
      sku?: string;
      quantity?: number;
      qc_failed_quantity?: number;
      qc_passed_quantity?: number;
    }
  ];
  status?: string;
  unique_skus?: number;
  quantity?: number;
  //'action' ?: {'asn_document':string,'invoice_url':string},
  asn_document?: Url;
  invoice_url?: Url;
  barcode_url?: Url;
  grn?: string;
  shipping_status?: string;
  error_file?: Url;
}

interface data {
  links: { first: Url; next: Url };
  data: ASNTable[];
  meta: { per_page: number; current_page: number };
}

interface Warehouse {
  code: string;
  name: string;
}

const STATUS = [
  { title: 'In Draft', color: '#e3c800', 'background-color': '#fff9cf' },
  { title: 'Ready to Ship', color: '#efa30c', 'background-color': '#fee9c0' },
  { title: 'Shipped', color: '#2c9f29', 'background-color': '#bffeb9' },
  { title: 'Delivered', color: '#6f57e9', 'background-color': '#ded8ff' },
  { title: 'Completed', color: '#3ab7b4', 'background-color': '#b5fcf9' },
  { title: 'Cancelled', color: '#555', 'background-color': '#ddd' },
];

@Component({
  selector: 'asn-list',
  templateUrl: './asn-list.component.html',
  styleUrls: ['./fcs.component.scss'],
})
export class ASNListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  @ViewChild('confirmDialog') confirmDialog: TemplateRef<HTMLDialogElement>;

  // @ViewChild('asnItems') asnItems: TemplateRef<any>;

  pageSizeOptions: number[] = [15, 30, 60];
  reportASNDownloadURL: string;

  queryparams: {
    asn: string;
    page: number;
    per_page: number;
    warehouse_code: string;
    date_from: string; //this.range.get('start').value.format('YYYY-MMM-DD').toString(),//'2017-Jun-12',//this.range.get('end').value.format('YYYY-MMM-DD').toString(),
    date_to: string; //this.range.get('end').value.format('YYYY-MMM-DD').toString(),//'2021-Jan-21',//,
    is_web: number;
    status: string; //this.status == -1 ? '' : this.status
  };

  filters_info: {
    cancel: CustomFilters;
    date: CustomFilters;
    status: CustomFilters;
    asn: CustomFilters;
    warehouse_code: CustomFilters;
  };

  resultsLength: number;
  //currentPage     : number;
  //pageSize        : number;
  dataSource: ASNTable[];
  warehouses: Warehouse[];
  changed: any = {};
  tableSource: MatTableDataSource<ASNTable>;
  //pageEvent: PageEvent;
  currentPage: number;

  @Input() query: any;
  @Output() paramsEvent: EventEmitter<any> = new EventEmitter();
  statusMapping = STATUS;
  displayedColumns: string[] = [
    'asn',
    'slot_date',
    'unique_skus',
    'quantity',
    'status',
    'action',
  ];

  constructor(
    public fcsService: FcsService,
    public authService: AuthService,
    public toastr: ToastrService,
    public modal: MatDialog,
    public router: Router,
    public ga: GoogleAnalyticsService
  ) {
    this.currentPage = 0;
    this.queryparams = {
      asn: '',
      page: 1,
      per_page: 15,
      warehouse_code: '',
      date_from: '',
      date_to: '',
      is_web: 1,
      status: '',
    };

    this.dataSource = [];
    this.warehouses = [];
    this.resultsLength = 0;
    this.reportASNDownloadURL = 'warehouse/export-asn';

    //this.filters_array = ['date','status','warehouse_code','asn'];

    this.filters_info = {
      cancel: {
        label: 'Non-Cancelled ASN',
        name: 'Non-Cancelled ASN',
        type: 'switch',
        data: [],
        field_values: {},
        bool_value: true,
      },
      date: {
        label: 'Search by Date Range',
        name: 'Date',
        type: 'date_range',
        data: [],
        field_values: {},
      },
      status: {
        label: 'Search by Status',
        placeholder: 'Select Status',
        type: 'select',
        name: 'Status',
        field_values: {},
        data: [
          {
            name: 'In Draft',
            value: '0',
          },
          {
            name: 'Ready To Ship',
            value: '1',
          },
          {
            name: 'Shipped',
            value: '2',
          },
          {
            name: 'Delivered',
            value: '3',
          },
        ],
      },
      warehouse_code: {
        label: 'Search by Fulfillment Center',
        type: 'select',
        placeholder: 'Select Fulfillment Center',
        name: 'Fulfillment Center',
        field_values: {},
        data: [],
      },
      asn: {
        label: 'ASN',
        placeholder: 'Search By ASN',
        type: ' input',
        name: 'ASN',
        main_filter: 1,
        field_values: {},
        data: [],
      },
    };

    this.getWarehouses();
  }

  ngOnInit(): void {
    //console.log("<< ---- NGONIT ASN ---- >>> ");
    this.tableSource = new MatTableDataSource<ASNTable>(this.dataSource);

    this.setFilters();
    //this.dataSource = new MatTableDataSource<ProessingInterface>(this.processing_data);
  }

  // openASNItemPopup($event, asn, items): void {
  //   $event.preventDefault();
  //   this.modal.open(this.asnItems, { data: { items: items, asn: asn } });
  // }

  navigateToCreateAsn(element): void {
    const { id, asn, shipping_status } = element;
    this.ga.emitEvent('SRF', 'Clicked on ASN ID', asn);
    const Re = 0;
    this.router.navigate(['/fcs/create-asn'], {
      queryParams: { id, asn, shipping_status, Re },
    });
  }
  navigateToRescheduleAsn(element): void {
    if (!element.can_reschedule) {
      this.toastr.warning('Gate Entry Generated cannot reschedule');
      return;
    }
    const {
      id,
      asn,
      shipping_status,
      slot_date,
      slot_timings,
      slot_id,
    } = element;
    this.ga.emitEvent(
      'SRF',
      'Clicked on Appointment to reschedule the ASN',
      asn
    );
    const Re = 1;
    this.router.navigate(['/fcs/create-asn'], {
      queryParams: {
        id,
        asn,
        shipping_status,
        Re,
        slot_date,
        slot_timings,
        slot_id,
      },
    });
  }
  closeDialog() {
    this.modal.closeAll();
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
        qp != 'date_from' &&
        qp != 'date_to' &&
        this.changed[qp] != undefined
      ) {
        this.queryparams[qp] = this.changed[qp];
      }
    }

    //console.log("set filters ", this.queryparams);
  }

  updateFilters($event) {
    //console.log('update filters ');
    let filters_array = Object.keys(this.filters_info);

    for (let ft of filters_array) {
      const filterValue = $event.filters[ft];
      if (ft == 'date') {
        this.queryparams.date_from = filterValue.start;
        this.queryparams.date_to = filterValue.end;
      } else if (ft === 'cancel') {
        this.queryparams[ft] = filterValue ? '' : 1;
      } else {
        this.queryparams[ft] = filterValue;
      }
    }

    //console.log("UPDATE filters ", this.queryparams);
    // let qpkeys = Object.keys(this.queryparams);
    // for(let qp of qpkeys) {
    //   if(filters_array.indexOf(qp) === -1 && qp != 'date_from' && qp != 'date_to' && $event.filters[qp] != undefined) {
    //     this.queryparams[qp] = this.changed[qp];
    //   }
    // }

    this.updateParams(this.queryparams);

    this.getASNData();

    //this.paramsEvent.emit({'asn':this.queryparams});
  }

  updateParams(queryparams: any) {
    this.paramsEvent.emit({ asn: queryparams });
  }

  ngOnChanges(changes: SimpleChanges) {
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
        //this.setFilters();
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

  public getWarehouses() {
    this.fcsService.getWarehouse().subscribe((data: any) => {
      if (data) {
        let k = 0;

        for (let wh of data.data.warehouses) {
          this.warehouses[k] = {
            name: wh.name,
            code: wh.warehouse_code,
          };

          this.filters_info.warehouse_code.data[k] = {
            name:
              wh.warehouse_code == 'DEL-1'
                ? wh.name + ' (out of space)'
                : wh.name + '(' + wh.warehouse_code + ')',
            value: wh.warehouse_code,
            is_disabled: wh.warehouse_code == 'DEL-1' ? true : false,
          };

          k++;
        }
      }
    });
  }

  firstTimeLoad: boolean = true;

  public getASNData() {
    let query_params = Object.assign({}, this.queryparams);
    query_params['with_items'] = 1;
    //let query_params = this.queryparams;
    //console.log("query_params >> ",this.queryparams);

    this.dataSource = [];
    this.fcsService.getASNDetails(query_params).subscribe((data: data) => {
      this.firstTimeLoad = false;
      if (data.data.length) {
        let results = data.data;
        let meta = data.meta;
        let links = data.links;
        let k = 0;

        //console.log(" PER PAGE ",meta.per_page , "CURRENT PAGE ",meta.current_page);
        this.currentPage = meta.current_page - 1;

        if (links.next) {
          //console.log("next page link "+links.next);
          this.resultsLength = meta.per_page * (meta.current_page + 1);
          // this.paginator.pageIndex =  meta.current_page+1;
          //console.log("RESULT LENGTH ",this.resultsLength);
        } else {
          //this.resultsLength = meta.per_page;
          this.resultsLength = 0;
        }

        this.queryparams.page = meta.current_page;
        //this.currentPage = meta.current_page ? meta.current_page : 1;
        for (let result of results) {
          this.dataSource[k] = {};
          this.dataSource[k].asn = result.asn;
          this.dataSource[k].id = result.id;
          this.dataSource[k].created_at = result.created_at;
          this.dataSource[k].slot_date = result.slot_date
            ? result.slot_date
            : null;
          this.dataSource[k].slot_timings = result.slot_timings
            ? result.slot_timings
            : '';
          this.dataSource[k].slot_id = result.slot_id;
          this.dataSource[k].can_reschedule = result.can_reschedule;

          this.dataSource[k].unique_skus = result.items.length;
          this.dataSource[k].status = result.grn != '' ? result.grn : 'pending';
          this.dataSource[k].quantity = 0;
          this.dataSource[k].asn_document = result.asn_document;
          this.dataSource[k].invoice_url = result.invoice_url;
          this.dataSource[k].barcode_url = result.barcode_url;
          this.dataSource[k].items = result.items;
          this.dataSource[k].shipping_status = result.shipping_status;
          this.dataSource[k].error_file = result.error_file;
          for (let item of result.items) {
            this.dataSource[k].quantity += <number>item.quantity;
          }
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

  /*
   Function for deletion of ASN
   ASN can be deleted only if the grn is not done
  */

  deleteAsn(id, asn, grn): void {
    const payload = {
      id: id,
      asn: asn,
      grn: '',
    };
    this.modal.open(this.confirmDialog, {
      width: '30%',
      data: payload,
      panelClass: 'br-10',
      // disableClose: true,
      autoFocus: true,
    });
  }
  confirmDelete(data) {
    this.modal.closeAll();
    this.fcsService.deleteAsn(data).subscribe(
      () => {
        this.getASNData();
        this.toastr.success(
          'ASN ' + data.asn + ' has been successfully cancelled',
          'Success'
        );
      },
      (error) => {
        this.toastr.warning(error.error.message, 'Error');
      }
    );
  }
  openDownloadUrl(url) {
    this.ga.emitEvent('SRF', 'Clicked on Action Fulfillment Centre - ASN', url);
    window.open(url, '_blank');
  }

  // public handlePage(e: any) {
  //   if (e.previousPageIndex > e.pageIndex) {
  //     this.queryparams.page = this.currentPage ;
  //   } else {
  //     this.queryparams.page = this.currentPage + 2;
  //   }
  //   this.queryparams.per_page = e.pageSize;
  //   this.getASNData();
  //   this.updateParams(this.queryparams);
  // }

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
    this.getASNData();
    this.updateParams(this.queryparams);
  }
}
