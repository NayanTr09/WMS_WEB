import { CustomerEditComponent } from './customer-edit/customer-edit.component';
import { switchMap, map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { OrdersService } from './../../../../services/http/orders.service';
import {
  Component,
  ElementRef,
  OnInit,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as moment from 'moment';
import { MatAccordion } from '@angular/material/expansion';
import { DownloadService } from 'src/app/services/http/download.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from './../../../../services/auth/auth.service';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
})
export class OrderDetailComponent implements OnInit {
  @ViewChild(MatAccordion) timelineAccordion: MatAccordion;
  @ViewChild('cancelOrderAndShipment') cancelOrderAndShipment: TemplateRef<any>;
  @ViewChild('updateImeiDialog') updateImeiDialog: TemplateRef<any>;
  @ViewChild('updateHsnDialog') updateHsnDialog: TemplateRef<any>;
  @ViewChild('cancelOrderDialog') cancelOrderDialog: TemplateRef<any>;
  @ViewChildren('imeiBinding') imeiBinding: QueryList<ElementRef>;
  @ViewChildren('hsnBinding') hsnBinding: QueryList<ElementRef>;
  hsnOptions = [];
  orderDetail: any = {};
  isDataReady = false;
  activityDetails: any;
  activitiesKeys: any;
  TrackingDetails: any;
  trackKeys = {};
  cancelOnChannel = true;
  objectKeys = Object.keys;
  trackError = 'No Data Available';
  editNotAllowed = ['NEW', 'READY TO SHIP'];
  labelNotAllowed = ['NEW', 'CANCELED'];
  is_admin: boolean = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    public orderService: OrdersService,
    public downloadService: DownloadService,
    public toastr: ToastrService,
    public dialog: MatDialog,
    public authService: AuthService
  ) {
    this.is_admin = this.authService.getUserData().is_admin;
  }

  checkShippingMethod(): boolean {
    try {
      const serviceTypeId = this.orderDetail?.awb_data?.charges
        ?.service_type_id;
      const cond1 =
        serviceTypeId === 117 || serviceTypeId === 81 || serviceTypeId === 141;
      const cond2 = this.orderDetail?.others?.checkout_shipping_method;
      return cond1 && cond2;
    } catch (error) {
      return false;
    }
  }

  getOrderDetail(orderId) {
    this.orderService.getOrderDetail(orderId).then((data: any) => {
      this.isDataReady = true;
      this.orderDetail = data;
      this.getTrackingDetails(data.shipments.id);
    });
  }

  downloadLabel(): void {
    const { shipments } = this.orderDetail;
    const id: number = shipments?.id;

    this.orderService.getLabel({ shipment_id: [id] }).subscribe(
      (resp: any) => {
        const { data, name, response: errMsg } = resp;
        if (data && name) {
          this.downloadService.downloadStream(resp.data, resp.name);
        }

        if (errMsg) {
          this.toastr.error(errMsg, 'Error');
        }
      },
      (err) => {
        this.toastr.error(
          'Error occur while downloading. Please try again',
          'Error'
        );
      }
    );
  }

  suggestHsn(index: number): void {
    const inputRef = this.hsnBinding.toArray()[index];
    const val = inputRef.nativeElement.value.trim();
    const url = `filters?type=hsn&is_web=1&search=${val}`;

    this.orderService.requestToEndpoint(url).subscribe(
      (success) => {
        const { data } = success[0];
        this.hsnOptions = data;
      },
      (err) => console.log(err)
    );
  }

  downloadInvoice(): void {
    const srfUser = localStorage.getItem('srf_user');
    const user = srfUser ? JSON.parse(srfUser) : {};
    const { status_code, products } = this.orderDetail;
    const { gstn } = user;

    if (gstn && status_code === 1) {
      const productsWithoutHsn = products.filter((product) => !product.hsn);
      if (productsWithoutHsn.length) {
        this.dialog.open(this.updateHsnDialog, { data: productsWithoutHsn });
        return;
      }

      this.imeiOrPrintInvoice();
      return;
    }

    this.imeiOrPrintInvoice();
  }

  imeiOrPrintInvoice(): void {
    const {
      products,
      base_channel_code,
      channel_order_id,
      id,
      channel_name,
      is_international,
      shipments,
    } = this.orderDetail;
    const items = [];

    products.forEach((product) => {
      const { custom_field, custom_field_value } = product;
      const newProduct = { ...product };
      if (custom_field === 'imei' && !custom_field_value) {
        newProduct.base_channel_code = base_channel_code;
        newProduct.channel_order_id = channel_order_id;
        newProduct.order_id = id;
        newProduct.channel_name = channel_name;
        items.push(newProduct);
      }
    });

    if (items.length) {
      this.dialog.open(this.updateImeiDialog, { data: items });
      return;
    }

    let url;
    let data;
    if (is_international) {
      url = 'orders/international/print/invoice';
      data = {
        shipment_ids: [shipments.id],
        order_ids: [id],
      };
    } else {
      url = 'orders/print/invoice';
      data = {
        ids: [id],
      };
    }

    this.orderService.sendRequestToEndpoint(data, url).subscribe(
      (onSuccess) => {
        const { message, invoice_url } = onSuccess;
        if (invoice_url) {
          this.downloadService.downloadDataWithUrl(invoice_url, 'Invoice');
        } else {
          this.toastr.info(message);
        }
      },
      (onErr) => {
        console.error(onErr);
        this.toastr.error(onErr.message);
      }
    );
  }

  onSaveHsnDetails(evt, data: any[]): void {
    evt.preventDefault();
    const inputGroup = this.hsnBinding.toArray();
    const isValid = inputGroup.every((el) => {
      const val = el.nativeElement.value;
      if (!val) {
        el.nativeElement.classList.add('is-invalid');
        return false;
      }
      return true;
    });

    if (isValid) {
      const url = 'products/update/hsn';
      const payload = inputGroup.map((el, idx) => {
        const val = el.nativeElement.value;
        return {
          hsn: val.trim(),
          id: data[idx].id,
        };
      });

      this.orderService.sendRequestToEndpoint({ data: payload }, url).subscribe(
        (success) => {
          this.getOrderDetail(this.orderDetail.id);
          this.toastr.success(success.message);
        },
        (err) => {
          this.toastr.error(err.message);
        },
        () => {
          this.dialog.closeAll();
        }
      );
    }
  }

  onSaveImeiDetails(data: any[]): void {
    const inputGroup = this.imeiBinding.toArray();
    const isValid = inputGroup.every((el) => {
      const val = el.nativeElement.value;
      if (!val) {
        el.nativeElement.classList.add('is-invalid');
        return false;
      }
      return true;
    });

    if (isValid) {
      const url = 'products/update/imei';
      const payload = inputGroup.map((el, idx) => {
        const val = el.nativeElement.value;
        return {
          imei: val.trim(),
          order_product_id: data[idx].id,
        };
      });

      this.orderService.sendRequestToEndpoint({ data: payload }, url).subscribe(
        (success) => {
          this.toastr.success(success.message);
          this.getOrderDetail(this.orderDetail.id);
        },
        (err) => {
          this.toastr.error(err.message);
        },
        () => {
          this.dialog.closeAll();
        }
      );
    }
  }

  hideCancel(): boolean {
    return ![1, 2, 3, 4, 12, 13, 14, 21, 22, 24, 28, 34, 35].includes(
      this.orderDetail.status_code
    );
  }

  clickCancel(): void {
    if (this.orderDetail.status_code === 1) {
      this.dialog.open(this.cancelOrderDialog, {
        data: { hello: 'world' },
        width: '30%',
      });
      return;
    }

    this.dialog.open(this.cancelOrderAndShipment, {
      data: { hello: 'world' },
      width: '35%',
    });
  }

  cancelOrder(): void {
    const { id, status_code, is_return } = this.orderDetail;
    const data: any = {
      cancel_on_channel: +!!this.cancelOnChannel,
      order_ids: [id],
      is_return: +!!is_return,
    };

    let url: string;
    if (status_code === '3') {
      url = 'orders/cancel/labeled';
    } else if (status_code === '1' || status_code === '2') {
      url = 'orders/cancel';
      data.ids = [id];
    } else if (
      status_code === '12' ||
      status_code === '13' ||
      status_code === '14'
    ) {
      url = 'orders/cancel/labeled';
      data.status = 'queue_error';
    } else {
      url = 'orders/cancel/manifested';
    }

    if (!!is_return) {
      url = 'orders/cancel';
      data.ids = [id];
    }

    this.orderService.cancelOrders(data, url).subscribe(
      (onSuccess) => {
        this.dialog.closeAll();
        this.toastr.success(onSuccess.message);
        this.getOrderDetail(id);
      },
      (onErr) => {
        console.error(onErr);
        this.toastr.error(onErr.message);
      }
    );
  }

  hideInvoiceBtn(): boolean {
    const { is_international, status_code, is_return } = this.orderDetail;
    const codeToExclude = [10, 11, 5, 18];
    if (
      is_international &&
      !is_return &&
      !codeToExclude.includes(status_code)
    ) {
      return true;
    }
    return false;
  }

  cancelShipment(): void {
    const { id, is_return } = this.orderDetail;
    const data = {
      cancel_on_channel: +!!this.cancelOnChannel,
      order_ids: [id],
      is_return: +!!is_return,
      ids: [id],
    };
    const url = 'orders/cancel/shipment';

    this.orderService.sendRequestToEndpoint(data, url).subscribe(
      () => {
        this.dialog.closeAll();
        this.toastr.success('Shipment Cancelled Successfully');
        this.getOrderDetail(id);
      },
      (onErr) => {
        console.error(onErr);
        this.toastr.error(onErr.message);
      }
    );
  }

  onCloseClick(): void {
    this.dialog.closeAll();
  }

  getActivityDetail(orderId) {
    this.orderService.getOrderActivty(orderId).then((data) => {
      this.activitiesKeys = Object.keys(data);
      if (this.activitiesKeys.length) {
        this.activityDetails = data;
      }
    });
  }

  getTrackingDetails(shipmentId) {
    this.orderService.getOrderTracking(shipmentId).then((data: any) => {
      console.log(data);

      if (data && !data.tracking_data.error) {
        const activities = data.tracking_data.shipment_track_activities;
        activities.forEach((activity) => {
          if (activity.activity) {
            const mediumDate = moment(activity.date).format('ll');
            if (!this.trackKeys[mediumDate]) {
              this.trackKeys[mediumDate] = [];
            }
            this.trackKeys[mediumDate] = [
              ...this.trackKeys[mediumDate],
              activity,
            ];
          }
        });
        console.log('>>', this.trackKeys);
      } else {
        this.trackError = data.tracking_data.error;
      }
    });
  }

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      let orderId = params.get('order_id');
      this.getOrderDetail(orderId);
      this.getActivityDetail(orderId);
    });
  }

  formatTime(time) {
    return moment(time, 'hh:mm:ss').format('hh:mm A');
  }

  createPlaceholderContent(cust_name) {
    if (!cust_name) {
      return '';
    }

    return cust_name
      .split(' ')
      .map((v) => v[0])
      .join('');
  }

  handleBackBtn(): void {
    window.history.back();
  }

  openDialog(): void {
    const customerData = {
      fullname: this.orderDetail.customer_name,
      email: this.orderDetail.customer_email,
      address1: this.orderDetail.customer_address,
      address2: this.orderDetail.customer_address_2,
      city: this.orderDetail.customer_city,
      state: this.orderDetail.customer_state,
      pincode: this.orderDetail.customer_pincode,
      country: this.orderDetail.customer_country,
      phone: this.orderDetail.customer_phone,
      company_name: this.orderDetail.company_name,
      country_code: this.orderDetail.country_code,
      state_code: this.orderDetail.state_code,
      order_id: this.orderDetail.id,
      status_code: this.orderDetail.status_code,
    };

    const dialogRef = this.dialog.open(CustomerEditComponent, {
      panelClass: 'dialog-700',
      width: '70%',
      data: {
        customerData,
      },
      disableClose: true,
      autoFocus: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getOrderDetail(result.orderId);
      }
    });
  }
}
