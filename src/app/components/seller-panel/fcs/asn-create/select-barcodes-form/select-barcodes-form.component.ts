import {
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Observable, BehaviorSubject } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';
import { EndpointFCS, FcsService } from 'src/app/services/http/fcs.service';
import { SubSink } from 'subsink';
import { FormStatus } from '../asn-create.component';

@Component({
  selector: 'app-select-barcodes-form',
  templateUrl: './select-barcodes-form.component.html',
  styleUrls: ['./select-barcodes-form.component.scss'],
})
export class SelectBarcodesFormComponent implements OnInit, OnDestroy {
  @Output() selectionChange = new EventEmitter();
  private subs = new SubSink();
  selectBarcodes: FormGroup;
  formStatus: string;
  asnData: any;
  donwloadingProcess: number = 0;
  isBulk: boolean = false;
  skuLeft: number = 0;

  constructor(
    private fb: FormBuilder,
    private fcsService: FcsService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.selectBarcodes = this.fb.group({
      barcodes: this.fb.array([]),
      mrpCheck: [false],
      barcodesCheck: [false],
    });

    this.initSelectBarcodes();
  }

  get getBarcodes(): FormArray {
    return this.selectBarcodes.get('barcodes') as FormArray;
  }

  initSelectBarcodes(): void {
    this.subs.sink = this.getAutosave().subscribe((success) => {
      const { selectBarcodes, asnData } = success?.data;
      this.isBulk = success.is_bulk;
      if (this.isBulk) {
        this.skuLeft=success.skus_left;
      }

      this.asnData = asnData;
      this.parseBarcodeDetails();
      if (selectBarcodes) {
        const { mrpCheck, barcodesCheck, barcodes } = selectBarcodes;
        this.selectBarcodes.patchValue(
          { barcodesCheck, mrpCheck },
          { emitEvent: false, onlySelf: false }
        );
      }
    });

    this.subs.sink = this.selectBarcodes.valueChanges
      .pipe(
        debounceTime(500),
        tap(() => (this.formStatus = FormStatus.Saving))
      )
      .subscribe((data) => {
        this.subs.sink = this.postAutosave(data, 'selectBarcodes').subscribe(
          (success) => {
            console.log('success :>> ', success);
            this.formStatus = FormStatus.Saved;
            const { selectBarcodes } = success?.data;
            if (selectBarcodes) {
              const { mrpCheck, barcodesCheck, barcodes } = selectBarcodes;
              this.fillBarcodeDetails(barcodes);
              this.selectBarcodes.patchValue(
                { barcodesCheck, mrpCheck },
                { emitEvent: false, onlySelf: false }
              );
            }
          }
        );
      });
  }

  getAutosave(): Observable<any> {
    return this.fcsService.requestToEndpoint(EndpointFCS.autosave_get);
  }

  postAutosave(dump, sectionName): Observable<any> {
    const payload = { section: sectionName, data: dump };
    return this.fcsService.postToEndpint(EndpointFCS.autosave_post, payload);
  }

  onClickPrev(): void {
    if (this.isBulk) {
      this.toastr.warning('This a BUlk ASN cannot go to previous Stage');
      return;
    }
    this.selectionChange.emit('previous');
  }

  parseBarcodeDetails(): void {
    const srfUser = localStorage.getItem('srf_user');
    const { company_id } = JSON.parse(srfUser) ?? {};
    const payload = { asn_id: this.asnData?.id, seller_id: company_id };
    const endpoint = 'warehouse/asn-barcode-details';
    this.subs.sink = this.fcsService
      .requestToEndpoint(endpoint, payload)
      .subscribe(
        (onSuccess) => {
          this.fillBarcodeDetails(onSuccess.data);
        },
        (onErr) => console.error('onErr ', onErr)
      );
  }

  fillBarcodeDetails(data: any[]): void {
    const allIds = this.getBarcodes.value.map((dta) => dta.id);

    data.forEach((barcodeData) => {
      if (!allIds.includes(barcodeData.id)) {
        this.getBarcodes.controls.push(this.fb.group({ ...barcodeData }));
      }
    });
  }

  removeItem(idx: number): void {
    this.getBarcodes.removeAt(idx);
  }

  onClickSubmit(evt): void {
    evt.preventDefault();
    const { barcodes, barcodesCheck, mrpCheck } = this.selectBarcodes.value;
    const skus = barcodes.map((b) => ({ sku: b.sku }));
    const barcodePayload = {
      skus,
      asn: this.asnData?.asn,
      generate_mrp_label: +mrpCheck,
      generate_barcode_label: +barcodesCheck,
    };

    this.subs.sink = this.fcsService
      .postToEndpint(EndpointFCS.barcode, barcodePayload)
      .subscribe(
        (success) => {
          if (!success.status) {
            this.toastr.error(success.message, 'Error');
          } else {
            this.selectionChange.emit('next');
          }
        },
        (onErr) => {
          this.toastr.error(onErr.error.message, 'Error');
          console.error(onErr);
        }
      );
  }

  downloadBarcode(evt): boolean {
    evt.preventDefault();
    const { barcodes } = this.selectBarcodes.value;
    const skus = barcodes.map((b) => ({ sku: b.sku }));
    const payload = {
      skus,
      asn: this.asnData?.asn,
      generate_barcode_only: true,
    };

    this.fcsService.postToEndpint(EndpointFCS.barcode, payload).subscribe(
      (success) => {
        if (success.download_url) {
          this.barcodeDownloadLink(success.download_url);
        } else if (success.is_background_downloading) {
          this.donwloadingProcess = 1;
          this.isBarcodeDownloadComplete();
        } else if (!success.status) {
          this.toastr.error(success.message, 'Error');
        }
      },
      (onErr) => {
        this.toastr.error(onErr.error.message, 'Error');
        console.error(onErr);
        return false;
      }
    );

    return false;
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  counter: number = 0;
  private async isBarcodeDownloadComplete() {
    console.log('Beforep: ' + new Date().toString());
    await this.delay(3000);
    // Sleep thread for 3 seconds
    const payload = { asn_id: this.asnData?.id };
    const url = EndpointFCS.asnBarcodeDownloadRetry;

    this.fcsService.checkBarcodeComplete(url, payload).subscribe(
      (success) => {
        if (success.barcode_url) {
          this.donwloadingProcess = 2;
          this.barcodeDownloadLink(success.barcode_url);
        } else {
          if (this.counter < 5) {
            this.counter++;
            this.isBarcodeDownloadComplete();
          } else {
            this.donwloadingProcess = 0;
            this.toastr.info(
              'Unable to process your request right now. We will mail you shortly.',
              'Info'
            );
          }
        }
      },
      (error) => {
        this.toastr.error('unable to download, Something went wrong!', 'Error');
      }
    );

    console.log('Afterp:  ' + new Date().toString());
  }

  barcodeDownloadLink(download_url) {
    let link = document.createElement('a');
    link.download = 'asn-barcode';
    // console.log(filename);
    link.target = '_blank';
    link.href = download_url;
    document.body.appendChild(link);
    link.click();
    // Cleanup the DOM
    document.body.removeChild(link);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
