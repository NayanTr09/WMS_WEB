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
import { FormStatus } from '../stock-transfer-create.component';

interface ReasonInterface {
  sku: string;
  errors: string[] | string;
}

@Component({
  selector: 'app-stock-transfer-products-form',
  templateUrl: './stock-transfer-products-form.component.html',
  styleUrls: ['./stock-transfer-products-form.component.scss'],
})
//stock-transfer-product-form
export class StockTransferProductsFormComponent implements OnInit, OnDestroy {
  @Output() selectionChange = new EventEmitter();
  private subs = new SubSink();
  autocomplete = new FormControl();
  productSearchedResult: Observable<object[]>;
  addProducts: FormGroup;
  downloadUrl = 'warehouse/get-dummy-csv?is_web=1';
  filename = 'asn-sample-file.csv';
  formStatus: FormStatus;
  stockTransferData: any;
  shipping: any;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private fcsService: FcsService
  ) {}

  ngOnInit(): void {
    this.addProducts = this.fb.group({
      products: this.fb.array([], [Validators.required]),
    });

    this.initAddProducts();
  }

  initAddProducts(): void {
    this.subs.sink = this.getAutosave().subscribe((success) => {
      const { stockTransferData, shipping, addProducts } = success?.data;
      this.stockTransferData = this.stockTransferData ?? stockTransferData;

      this.shipping = shipping;
      if (addProducts && addProducts.products) {
        addProducts.products.forEach((product) =>
          this.addProductToList(product)
        );
      }
    });

    this.subs.sink = this.addProducts.valueChanges
      .pipe(
        debounceTime(500),
        tap(() => (this.formStatus = FormStatus.Saving))
      )
      .subscribe((data) => {
        this.subs.sink = this.postAutosave(data, 'addProducts').subscribe(
          (success) => {
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
    return this.fcsService.requestToEndpoint(
      EndpointFCS.stock_transfer_autosave_get
    );
  }

  postAutosave(dump, sectionName): Observable<any> {
    const payload = { section: sectionName, data: dump };
    return this.fcsService.postToEndpint(
      EndpointFCS.stock_transfer_autosave_post,
      payload
    );
  }

  /*onFileSelected(evt): void {
    const file = evt.target.files[0];
    evt.target.value = null; // hack

    if (!file) {
      this.toastr.warning('No CSV file selected', 'Warning');
      return;
    }

    const warehouseCode = this.shipping?.fromLocation;
    const formData = new FormData();
    formData.append('warehouse_code', warehouseCode);
    formData.append('file', file);

    this.fcsService.uploadCSV(formData).subscribe(
      (onSuccess: any) => {
       
        const { skus } = onSuccess;
        skus.forEach((product) => this.addProductToList(product));
      },
      (error) => {
        if (error.error.message) {
          this.toastr.error(error.error.message, 'Error');
        }
      }
    );
  } */

  addProductToList(product): void {
    const { sku } = product;

    const productFound = this.totalProducts.value.find(
      (prod) => prod.sku === sku
    );
    if (!productFound) {
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

      let params = {
        warehouse_code: this.shipping.fromLocation,
        sku: product.sku,
      };

      this.fcsService.getInventoryDetail(params).subscribe(
        (success) => {
          if (success.status) {
            product.available_units = success.data.available_quantity;
            this.addProductToList(product);

            return product.sku;
          } else {
            product.available_units = 0;
            this.addProductToList(product);
            const parseMsg: ReasonInterface[] = [
              { sku: product.sku, errors: [success.error] },
            ];
            this.updateReasonField(parseMsg);

            return product.sku;
          }
        },
        (error) => {}
      );
    }
    return '';
  }

  removeProduct(idx: number): void {
    this.totalProducts.removeAt(idx);
  }

  saveSKUs(): Observable<any> {
    const { fromLocation, toLocation } = this.shipping;
    const payload = {
      skus: this.totalProducts.value.map((pdt) => ({
        sku: pdt.sku,
        quantity: pdt.quantity,
      })),
      transfer_asn: this.stockTransferData?.stock_transfer,
      stock: this.stockTransferData?.id,
      warehouse_pickup_code: fromLocation,
      //warehouse_to_id: toLocation,
    };
    return this.fcsService.saveManualStockTransfer(payload);
  }

  updateReasonField(
    //reasonList: [{ sku: string; errors: string[] | string }]
    reasonList: ReasonInterface[]
  ): void {
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
    evt.preventDefault();
    this.addProducts.markAllAsTouched();
    const isInvalid = this.addProducts.invalid;
    if (isInvalid) {
      this.toastr.error('Invalid form');
      return;
    }

    this.subs.sink = this.saveSKUs().subscribe(
      (onSuccess) => {
        this.selectionChange.emit('next');
      },
      (onErr) => {
        //this.toastr.error('Error while submitting', 'Failed');
        // fill errors inside table
        //const parseMsg = JSON.parse(onErr?.error?.message) || [];
        //this.updateReasonField(parseMsg);
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

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
