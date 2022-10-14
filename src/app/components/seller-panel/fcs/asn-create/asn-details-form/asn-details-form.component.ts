import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DownloadService } from 'src/app/services/http/download.service';
import { EndpointFCS, FcsService } from 'src/app/services/http/fcs.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-asn-details-form',
  templateUrl: './asn-details-form.component.html',
  styleUrls: ['./asn-details-form.component.scss'],
})
export class AsnDetailsFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() asnData;
  @Output() awbStatus = new EventEmitter();
  private subs = new SubSink();
  asnDetails: FormGroup;
  courierList: Observable<object[]>;
  shippingAddress: Observable<any>;
  asnOverview: Observable<any>;
  tableTotal = {
    total_expected: 0,
    total_passed: 0,
    total_failed: 0,
    total_missing: 0,
  };
  downloadUrls: { asn_document: any; barcode_url: any; invoice_url: any };
  slot_date: any;
  grn_expected_date: any;
  slot_timings: any;
  isAwbAvailable = null;
  isBulk: boolean = false;
  skus_left: number = 0;
  constructor(
    private fb: FormBuilder,
    private fcsService: FcsService,
    private toastr: ToastrService,
    private router: Router,
    private downloadService: DownloadService
  ) {}

  ngOnInit(): void {
    this.asnDetails = this.fb.group({
      selectCourier: [null],
      awbNumber: ['', [Validators.minLength(5), Validators.maxLength(32)]],
    });
  }

  ngOnChanges(): void {
    if (this.asnData) {
      this.getCourierList();
      this.getShippingDetails();
      this.parseAsnDetails();
    }
  }

  getCourierList(): void {
    this.courierList = this.fcsService.requestToEndpoint(
      EndpointFCS.courier_list
    );
  }

  getShippingDetails(): void {
    const payload = { asn: this.asnData?.asn };
    this.shippingAddress = this.fcsService.requestToEndpoint(
      EndpointFCS.asn_address,
      payload
    );
  }

  parseAsnDetails(): void {
    const payload = {
      with_items: 1,
      asn_id: this.asnData?.id,
      asn: this.asnData?.asn,
      with_booking: 1,
    };
    this.asnOverview = this.fcsService
      .requestToEndpoint(EndpointFCS.asn_detail, payload)
      .pipe(
        map((res) => {
          const { data } = res;
          this.isBulk = res.data.is_bulk;
          if (this.isBulk) {
            this.skus_left = res.data.skus_left;
          }
          const {
            items = [],
            others,
            asn_document,
            barcode_url,
            invoice_url,
            slot_date,
            slot_timings,
            grn_expected_date,
          } = data;
          this.downloadUrls = { asn_document, barcode_url, invoice_url };
          this.slot_date = slot_date;
          this.grn_expected_date = grn_expected_date;
          this.slot_timings = slot_timings;

          items.forEach((item) => {
            this.tableTotal.total_expected += item.quantity;
            this.tableTotal.total_passed += item.qc_passed_quantity;
            this.tableTotal.total_failed += item.qc_failed_quantity;
          });
          this.tableTotal.total_missing =
            this.tableTotal.total_expected -
            (this.tableTotal.total_passed + this.tableTotal.total_failed);

          if (others) {
            this.isAwbAvailable = Boolean(others.awb);
            this.awbStatus.emit(this.isAwbAvailable);
            this.asnDetails.patchValue({
              selectCourier: others.courier_name,
              awbNumber: others.awb,
            });
          }
          return data;
        })
      );
  }

  handleDownload(url: string, context: string): void {
    if (!url) {
      this.toastr.error('Not available');
      return;
    }

    const filename = `${context}-${Date.now()}`;
    this.downloadService.downloadDataWithUrl(url, filename, '_blank');
  }

  onClickSubmit(evt): void {
    evt.preventDefault();
    if (this.asnDetails.invalid) {
      this.toastr.error('Invalid submission');
      return;
    }
    const { awbNumber, selectCourier } = this.asnDetails.value;

    const payload = {
      asn: this.asnData?.asn,
      awb: awbNumber ? awbNumber.trim() : '',
      courier_name: selectCourier,
    };
    this.subs.sink = this.fcsService
      .postToEndpint(EndpointFCS.update_asn, payload)
      .subscribe(
        () => {
          this.toastr.success('ASN Created Successfully!', 'Success');
          this.router.navigate(['/fcs/asn']);
        },
        (onErr) => {
          this.toastr.error(onErr.message, 'Error');
        }
      );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
