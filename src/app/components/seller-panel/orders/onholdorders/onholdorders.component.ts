import { filter } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { OrdersService } from './../../../../services/http/orders.service';
import { CustomFilters } from 'src/app/components/helper/filters/filters.component';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import * as moment from 'moment';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  TemplateRef,
} from '@angular/core';
import { HttpService } from '../../../../services/http/http.service';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { GoogleAnalyticsService } from 'src/app/services/http/google-analytics.service';
import { requiredFileType } from '../../common/file-upload/file-upload.component';

export interface OnHoldInterface {
  orderId: string;
  product: string;
  customer: string;
  created: string;
  reason: string;
}

@Component({
  selector: 'onholdorders',
  templateUrl: './onholdorders.component.html',
  styleUrls: ['./onholdorders.component.scss'],
})
export class OnholdordersComponent implements OnInit {
  @Input() query: any;
  @Output() paramsEvent: EventEmitter<any> = new EventEmitter();
  @Input() populate_filter_data: any;

  @ViewChild('bulkCancelDialog') bulkCancelDialog: TemplateRef<any>;
  @ViewChild('ewayBillUpload') ewayBillUpload: TemplateRef<any>;
  showLoader: boolean = false;
  changed: any = {};
  currentPage: number = 0;
  dataLength: number = 0;
  pageSizeOptions: number[] = [15, 30, 60];
  ewayBillObjFromItems: any;
  detailsToggleStatus = {
    isShowEwayDetails: true,
    isShowProductDetails: true,
    isEwayDetailsEditable: false,
  };
  ewayBillObj = {
    eway_bill_number: '',
    eway_bill: '',
    eway_bill_invoice: '',
    is_prev_invoice_used: false,
  };

  queryparams: {
    from: string;
    to: string;
    is_web: number;
    page: number;
    per_page: number;
    search: string;
    search_customer_info: string;
    channel_id: string;
    onhold: number;
  };

  filters_info: {
    date: CustomFilters;
    search: CustomFilters;
    search_customer_info: CustomFilters;
    channel_id: CustomFilters;
    srf_failed_reason: CustomFilters;
  };

  displayedColumns: string[] = [
    'select',
    'orderId',
    'Product',
    'Customer',
    'Payment',
    'On-Hold Reason',
    'Action',
  ];
  uploadEwayBillForm: FormGroup;
  error_eway_bill_number: string = '';
  error_eway_bill: string = '';
  error_eway_bill_invoice: string = '';

  constructor(
    public request: HttpService,
    public orderService: OrdersService,
    public toastr: ToastrService,
    public modal: MatDialog,
    public ga: GoogleAnalyticsService
  ) {
    this.queryparams = {
      //ids:0,
      page: 1,
      per_page: 15,
      from: '',
      to: '',
      is_web: 1,
      search: '',
      search_customer_info: '',
      channel_id: '',
      onhold: 1,
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
      srf_failed_reason: {
        label: 'Search by OnHold Reason',
        name: 'OnHold Reason',
        placeholder: 'Select OnHold Reason',
        type: 'select',
        field_values: {},
        data: [],
        //'data' : this.populate_filter_data.channels,
        multiple: true,
      },
    };
  }
  dataSource: any;
  selection: any;
  onhold_data: OnHoldInterface[];

  firstTimeLoad: boolean = true;

  closeDialog() {
    //console.log("closeDialog");
    this.modal.closeAll();
  }

  getOnHoldOrders() {
    let params = Object.assign({}, this.queryparams);

    this.request.getWithParams('orders/processing', params).subscribe(
      (data: any) => {
        this.firstTimeLoad = false;

        let d = data['data'].filter((row) => {
          if (row['srf_reason'] && row['srf_reason'].length > 28) {
            row['srf_reason_sort'] = row['srf_reason'].substr(0, 28) + '..';
            return row;
          } else {
            row['srf_reason_sort'] = row['srf_reason'];
            return row;
          }
        });

        //console.log(d);

        this.dataSource.data = d;

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
          }
        }
      },
      (errors) => {}
    );
  }

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource<OnHoldInterface>(this.onhold_data);
    this.selection = new SelectionModel<OnHoldInterface>(true, []);
    this.uploadEwayBillForm = new FormGroup({
      eway_bill_number: new FormControl('', [
        Validators.required,
        Validators.minLength(12),
        Validators.maxLength(12),
      ]),
      eway_bill: new FormControl('', [
        Validators.required,
        requiredFileType(['pdf']),
      ]),
      eway_bill_invoice: new FormControl('', [
        Validators.required,
        requiredFileType(['pdf']),
      ]),
    });
    this.setFilters();
  }

  parseHtmlToText(txt: string): string {
    return txt?.replace(/\s?(<br\s?\/?>)\s?/g, '\r\n');
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  bulkVerify() {
    //order_id: ["57726", "57725"], is_web: 1}
    const order_ids = [];
    this.selection.selected.forEach((s) => {
      if (s.is_order_verified === 0) {
        order_ids.push(s.id);
      }
    });

    if (!order_ids.length) {
      this.toastr.warning('All selected orders are verified', 'Warning');
      return;
    }

    const data = { order_id: order_ids, is_web: 1 };

    this.orderService.verifyOrder(data).subscribe((response: any) => {
      if (response.status) {
        this.toastr.success(response.message, 'Success');
        this.selection.clear();
        if (response.not_valid_orders.length) {
          // console.log(response.not_valid_orders);
        }
        this.getOnHoldOrders();
      } else {
        this.toastr.error(
          'Something went wrong! Please try again later',
          'Error'
        );
      }
    });
  }

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
        //console.log("ONHOLD : populate_filter_data ngOnChange function");
        //console.log(cur);
        let d: any = [];

        if (cur.channels.length) {
          this.filters_info.channel_id.data = cur.channels;
        }

        if (cur.onhold_reason.length) {
          this.filters_info.srf_failed_reason.data = cur.onhold_reason;
        }

        //console.log("ONHOLD ORDERS : ngOnChanges END HERE");
      }
    }
  }

  openOrderCancelPopup() {
    this.modal.open(this.bulkCancelDialog);
  }

  cancelOrders() {
    let order_ids = [];
    this.selection.selected.forEach((s) => {
      order_ids.push(s.id);
    });

    const data = {
      ids: order_ids,
      cancel_on_channel: 1,
      is_return: 0,
      is_web: 1,
    };

    this.orderService.cancelOrders(data).subscribe(
      (onSuccess: any) => {
        this.modal.closeAll();
        this.toastr.success('Successfully cancelled Order');
        this.selection.clear();
        this.getOnHoldOrders();
      },
      (onErr) => {
        this.toastr.error('Something went wrong!', 'Error');
      }
    );
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
    this.getOnHoldOrders();
  }

  verifyOrder(order_id) {
    let data = { order_id: { order_id: order_id }, is_web: 1 };
    //{"order_id":{"order_id":58489},"is_web":1}
    this.orderService.verifyOrder(data).subscribe((response: any) => {
      if (response.status) {
        this.toastr.success('Success', response.message);
        this.getOnHoldOrders();
      } else {
        this.toastr.success(
          'Error',
          'Something went wrong! Please try again later'
        );
      }
    });
  }
  uploadEwayBill(shipment_id) {
    let data = { shipment_id: shipment_id, is_web: 1 };
    //{"order_id":{"order_id":58489},"is_web":1}
    this.orderService.ewayDetails(data).subscribe((response: any) => {
      if (response.awb) {
        this.ewayBillObjFromItems = response;
        this.modal.open(this.ewayBillUpload, {
          panelClass: 'welcome-modal',
          data: {
            ewayBillObjFromItems: response,
          },
        });
      } else {
        this.toastr.success(
          'Error',
          'Something went wrong! Please try again later'
        );
        this.modal.closeAll();
      }
    });
  }
  updateParams(queryparams: any) {
    this.paramsEvent.emit({ onholdorders: queryparams });
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
    this.getOnHoldOrders();
    this.updateParams(this.queryparams);
  }

  public getFileNameFromUrl(value) {
    if (!value) {
      return '';
    }
    return value.slice(value.lastIndexOf('/') + 1);
  }

  public handleShowDetailsToggle(type) {
    if (type == 'product') {
      this.detailsToggleStatus.isShowProductDetails = !this.detailsToggleStatus
        .isShowProductDetails;
    } else if (type == 'eway') {
      this.detailsToggleStatus.isShowEwayDetails = !this.detailsToggleStatus
        .isShowEwayDetails;
    } else if (type == 'edit_eway') {
      this.detailsToggleStatus.isEwayDetailsEditable = !this.detailsToggleStatus
        .isEwayDetailsEditable;
    }
  }

  public handlePrevInvoiceUse(e) {
    if (e.target.checked) {
      this.ewayBillObj.is_prev_invoice_used = true;
    } else {
      this.ewayBillObj.is_prev_invoice_used = false;
    }
    if (this.ewayBillObj.is_prev_invoice_used) {
      this.ewayBillObj.eway_bill_invoice = '';
    }
  }

  public saveEwayBill(shipment_id) {
    this.ewayBillObj.eway_bill_number = this.uploadEwayBillForm.controls.eway_bill_number.value;
    let formData = new FormData();
    formData.append('eway_bill_invoice', this.ewayBillObj.eway_bill_invoice);
    formData.append('eway_bill', this.ewayBillObj.eway_bill);
    formData.append('eway_bill_number', this.ewayBillObj.eway_bill_number);
    let is_prev = this.ewayBillObj.is_prev_invoice_used ? 'true' : 'false';
    formData.append('use_shiprocket_invoice', is_prev);
    this.showLoader = true;
    this.orderService.saveEwayDetails(formData, shipment_id).subscribe(
      (response: any) => {
        if (response) {
          this.toastr.success('Success', response.message);
          this.error_eway_bill = '';
          this.error_eway_bill_invoice = '';
          this.error_eway_bill_number = '';
          this.showLoader = false;
          this.modal.closeAll();
          this.getOnHoldOrders();
        } else {
          this.showLoader = false;
          this.toastr.success(
            'Error',
            'Something went wrong! Please try again later'
          );
        }
      },
      (err) => this.alertValidation(err.error.errors)
    );
  }

  public uploadEwayBillInvoice(e) {
    console.log(e.target.files[0]);
    if (e.target.files[0].type !== 'application/pdf') {
      e.target.value = null;
      this.toastr.error('Invalid file type!');
      return;
    }
    this.ewayBillObj.eway_bill_invoice = e.target.files[0];
  }

  public uploadEwayBillNumber(e) {
    console.log(e.target.files[0]);
    if (e.target.files[0].type !== 'application/pdf') {
      e.target.value = null;
      this.toastr.error('Invalid file type!');
      return;
    }
    this.ewayBillObj.eway_bill = e.target.files[0];
  }

  public getMomentDate(date) {
    if (!date) {
      return '';
    }
    return moment(date.split(' ')[0], 'DD-MM-YYYY').format('DD-MM-YYYY');
  }

  public alertValidation(errorObj) {
    this.showLoader = false;
    let keyArry = Object.keys(errorObj);
    let length = keyArry.length;
    for (let i = 0; i < length; i++) {
      if (Array.isArray(errorObj[keyArry[i]])) {
        var errorHtml = errorObj[keyArry[i]][0];
      } else {
        var errorHtml = errorObj[keyArry[i]];
      }

      if (keyArry[i] == 'eway_bill_number') {
        this.error_eway_bill_number = errorHtml;
      }
      if (keyArry[i] == 'eway_bill') {
        this.error_eway_bill = errorHtml;
      }
      if (keyArry[i] == 'eway_bill_invoice') {
        this.error_eway_bill_invoice = errorHtml;
      }
    }
  }
}
