import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { debounceTime, map, tap } from 'rxjs/operators';
import { EndpointFCS, FcsService } from 'src/app/services/http/fcs.service';
import { SubSink } from 'subsink';
import { FormStatus } from '../asn-create.component';
import { ProgressBarMode } from '@angular/material/progress-bar';
import { MatStepper } from '@angular/material/stepper';
import { Router, ActivatedRoute } from '@angular/router';

interface ReasonInterface {
  sku: string;
  errors: string[] | string;
}

@Component({
  selector: 'app-add-products-form',
  templateUrl: './add-products-form.component.html',
  styleUrls: ['./add-products-form.component.scss'],
})
export class AddProductsFormComponent implements OnInit, OnDestroy {
  @Output() selectionChange = new EventEmitter();
  private subs = new SubSink();
  autocomplete = new FormControl();
  productSearchedResult: Observable<object[]>;
  addProducts: FormGroup;
  downloadUrl = 'warehouse/get-dummy-csv?is_web=1';
  filename = 'asn-sample-file.csv';
  formStatus: FormStatus;
  asnData: any;
  shipping: any;
  removeFlag: boolean = false;
  maxSKUCount: number = 500;
  uploadedSku: number = 0;
  totalSku: number = 1;
  isBulk: boolean = false;
  uploadPercentage: number;
  err_file_url: any;
  showProgress: boolean = false;
  bulk_upload_status: number = 0;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private fcsService: FcsService,
    public route: ActivatedRoute,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.addProducts = this.fb.group({
      products: this.fb.array([], [Validators.required]),
    });

    this.initAddProducts();
    var user = localStorage.getItem('srf_user');
    var params = {
      seller_id: user['company_id'],
    };
  }

  initAddProducts(): void {
    this.subs.sink = this.getAutosave().subscribe((success) => {
      const { asnData, shipping, addProducts } = success?.data;
      this.asnData = this.asnData ?? asnData;
      this.shipping = shipping;
      if (addProducts && addProducts.products) {
        addProducts.products.forEach((product) =>
          this.addProductToList(product)
        );
      }

      this.isBulk = success.is_bulk;
      this.bulk_upload_status = success.bulk_upload_status;
      if (this.isBulk && this.bulk_upload_status != 2) {
        this.checkBulkUploadStatus();
      }
    });

    this.subs.sink = this.addProducts.valueChanges
      .pipe(
        debounceTime(500),
        tap(() => (this.formStatus = FormStatus.Saving))
      )
      .subscribe((data) => {
        // if (data.products.length > this.maxSKUCount && !this.removeFlag) {
        //   this.toastr.error(
        //     'Cannot add more then '+this.maxSKUCount+' skus at a time.',
        //     'Error'
        //   );
        //   return;
        // }
        this.removeFlag = false;
        this.subs.sink = this.postAutosave(data, 'addProducts').subscribe(
          (success) => {
            this.isBulk = success.is_bulk;
            this.formStatus = FormStatus.Saved;
            const { addProducts } = success?.data;
            if (addProducts && addProducts.products) {
              addProducts.products.forEach((product) =>
                this.addProductToList(product)
              );
            }
          }
        );

        if (this.formStatus === FormStatus.Saved) {
          this.formStatus = FormStatus.Idle;
        }
      });
  }

  get totalProducts(): FormArray {
    return this.addProducts.get('products') as FormArray;
  }

  searchProduct(evt): void {
    const value = evt.target.value;
    this.productSearchedResult = this.fcsService
      .getSearchProduct({ key: value })
      .pipe(map((resp: { result: any[]; status: number }) => resp.result));
  }

  getAutosave(): Observable<any> {
    return this.fcsService.requestToEndpoint(EndpointFCS.autosave_get);
  }

  postAutosave(dump, sectionName): Observable<any> {
    const payload = { section: sectionName, data: dump };
    return this.fcsService.postToEndpint(EndpointFCS.autosave_post, payload);
  }

  onFileSelected(evt): void {
    const file = evt.target.files[0];
    evt.target.value = null; // hack

    if (!file) {
      this.toastr.warning('No CSV file selected', 'Warning');
      return;
    }
    if (file.type !== 'text/csv') {
      this.toastr.error('Invalid file type!');
      return;
    }
    const warehouseCode = this.shipping?.fromLocation;
    const toLocation = this.shipping?.toLocation;
    const formData = new FormData();
    const asn = this.asnData?.asn;
    const id = this.asnData?.id;
    formData.append('toLocation', toLocation);
    formData.append('asn', asn);
    formData.append('id', id);

    formData.append('warehouse_code', warehouseCode);
    formData.append('file', file);

    this.fcsService.uploadCSV(formData).subscribe(
      (onSuccess: any) => {
        this.toastr.warning(onSuccess.message);
        this.getAutosave().subscribe((data): any => {
          this.isBulk = data.is_bulk;
          if (this.isBulk) {
            this.checkBulkUploadStatus();
          }
        });
        // else{
        //   const { skus } = onSuccess;
        //   if (Array.isArray(skus)) {
        //     skus.forEach((product) => this.addProductToList(product));
        //   } else {
        //     Object.values(skus).forEach((product) =>
        //       this.addProductToList(product)
        //     );
        //   }
        // }
      },
      (error) => {
        if (error.error.message) {
          try {
            var Error_File_Url = JSON.parse(error.error.message);
            this.err_file_url = Error_File_Url['Error_File_Url'];
            this.toastr.error('Please Download Error File', 'Error');
          } catch (e) {
            this.toastr.error(error.error.message, 'Error');
          }
        }
      }
    );
  }

  addProductToList(product): void {
    const { sku } = product;

    const productFound = this.totalProducts.value.find(
      (prod) => prod.sku === sku
    );
    if (!productFound) {
      // if (this.totalProducts.length > this.maxSKUCount - 1) {
      //   this.toastr.error(
      //     'Cannot add more then ' + this.maxSKUCount + ' skus at a time.',
      //     'Error'
      //   );
      //   return;
      // }

      this.totalProducts.push(
        this.fb.group({
          ...product,
          quantity: [
            product.quantity ?? '',
            [Validators.required, Validators.min(1)],
          ],
        })
      );
    }
  }

  formatInputValue(product): string {
    if (product) {
      product.reason = product.reason ?? '';
      this.addProductToList(product);
      return product.sku;
    }
    return '';
  }

  removeProduct(idx: number): void {
    this.removeFlag = true;
    this.totalProducts.removeAt(idx);
  }

  saveSKUs(): Observable<any> {
    const { fromLocation, toLocation } = this.shipping;
    const payload = {
      skus: this.totalProducts.value.map((pdt) => ({
        sku: pdt.sku,
        quantity: pdt.quantity,
      })),
      asn: this.asnData?.asn,
      asn_pickup_id: fromLocation,
      warehouse_code: toLocation,
    };

    return this.fcsService.saveManualASN(payload);
  }

  updateReasonField(reasonList: ReasonInterface[]): void {
    const allSkus = reasonList.map((rl) => rl.sku);
    this.totalProducts.controls.forEach((control: FormGroup) => {
      const { sku } = control.value;
      const skuIdx = allSkus.indexOf(sku);
      if (skuIdx > -1) {
        let reason;
        if (typeof reasonList[skuIdx].errors === 'string') {
          reason = reasonList[skuIdx].errors;
        } else {
          reason = reasonList[skuIdx].errors[0];
        }

        if (allSkus.includes(sku)) {
          control.patchValue({ reason });
        }
      }
    });
  }

  onClickPrev(): void {
    this.selectionChange.emit('previous');
  }

  onClickSubmit(evt): void {
    if (this.isBulk && this.uploadedSku != this.totalSku) {
      this.toastr.warning('Bulk Asn Upload in process');
      return;
    }
    if (
      this.isBulk &&
      this.uploadedSku == this.totalSku &&
      this.bulk_upload_status
    ) {
      this.selectionChange.emit('next');
    }
    evt.preventDefault();
    this.addProducts.markAllAsTouched();
    const isInvalid = this.addProducts.invalid;
    if (isInvalid && !this.isBulk) {
      this.toastr.error('Invalid form');
      return;
    }

    this.subs.sink = this.saveSKUs().subscribe(
      (onSuccess) => {
        console.log('onSuccess :>> ', onSuccess);
        this.selectionChange.emit('next');
      },
      (onErr) => {
        // fill errors inside table
        console.error('onErr : ', onErr);
        const message = onErr?.error?.message;

        try {
          const parseMsg: ReasonInterface[] = JSON.parse(message);
          this.updateReasonField(parseMsg);
        } catch (error) {
          this.toastr.error(message, 'Failed');
        }
      }
    );
  }
  async checkBulkUploadStatus() {
    var user = {};
    user = JSON.parse(localStorage.getItem('srf_user'));
    var params = {
      seller_id: user['company_id'],
    };
    console.log('Check bulk upload');
    // this.fcsService.checkUploadStatus(url, params).subscribe((onSuccess) => {
    //         console.log('Check bulk upload api');
    //         this.uploadedSku = onSuccess.uploaded;
    //         this.totalSku = onSuccess.total;
    //         this.uploadPercentage = (this.uploadedSku / this.totalSku) * 100;

    //       });
    this.fcsService.is_add_product = true;
    this.checkbulk(this.uploadedSku, this.totalSku, params, 0);
  }
  async checkbulk(uploadedSku, totalsku, params, bulk_upload_status) {
    // if (this.uploadedSku == this.totalSku && this) {
    //   this.toastr.success('Asn Succesfly Uploaded');
    //   return;
    // }

    if (
      uploadedSku <= totalsku &&
      bulk_upload_status < 3 &&
      this.fcsService.is_add_product
    ) {
      await this.wait5s();
      await this.fcsService
        .checkUploadStatus(EndpointFCS.checkBulkUploadStatus, params)
        .subscribe((onSuccess) => {
          console.log('Check bulk upload api promise');
          this.showProgress = true;
          this.uploadedSku = onSuccess.uploaded;
          this.totalSku = onSuccess.total;
          this.uploadPercentage = (this.uploadedSku / this.totalSku) * 100;
          this.bulk_upload_status = onSuccess.bulk_upload_status;
          if (this.bulk_upload_status == 2) {
            this.toastr.error('Error Occured in Asn Upload');
            this.router.navigate(['/fcs/asn']);
            return;
          }
          if (this.bulk_upload_status < 3) {
            this.checkbulk(
              this.uploadedSku,
              this.totalSku,
              params,
              this.bulk_upload_status
            );
          }

          console.log('checkbulk');
        });
    } else {
      return;
    }
  }
  wait5s() {
    return new Promise((resolve) => {
      setTimeout(() => resolve('a'), 2000);
    });
  }
  ngOnDestroy(): void {
    this.fcsService.is_add_product = false;
    this.subs.unsubscribe();
  }
}
