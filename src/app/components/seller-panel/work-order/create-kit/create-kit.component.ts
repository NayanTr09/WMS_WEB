import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { SvgEnum } from 'src/app/enum';
import { HttpService } from 'src/app/services/http/http.service';
import { map } from 'rxjs/operators';
import { FcsService } from 'src/app/services/http/fcs.service';
import { ToastrService } from 'ngx-toastr';
import { SubSink } from 'subsink';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Router } from '@angular/router';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

interface ProductInterface {
  id: number;
  sku: string;
  name: string;
  reason: string;
  quantity: number;
}

@Component({
  selector: 'app-create-kit',
  templateUrl: './create-kit.component.html',
  styleUrls: ['./create-kit.component.scss'],
  animations: [
    trigger('fadeInOut', [
      state(
        'void',
        style({
          opacity: 0,
        })
      ),
      transition('void <=> *', animate(300)),
    ]),
  ],
})
export class CreateKitComponent implements OnInit, OnDestroy {
  createKitForm: FormGroup;
  warehouses: Observable<any>;
  private subs = new SubSink();
  autocomplete = new FormControl();
  autocompleteKit = new FormControl();
  productSearchedResult: Observable<object[]>;
  productKitSearchedResult: Observable<object[]>;
  maxKit: number;
  activeScreen: string;
  showItems = true;
  duplicateCreateKitForm: any;

  constructor(
    private fb: FormBuilder,
    private httpService: HttpService,
    private toastr: ToastrService,
    private fcsService: FcsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.createKitForm = this.fb.group({
      warehouse_code: [null, [Validators.required]],
      products: this.fb.array([], [Validators.required]),
      kitproducts: this.fb.array([], [Validators.required]),
    });

    this.getWarehouses();
  }

  getWarehouses(): void {
    this.activeScreen = 'warehouse_screen';
    this.warehouses = this.httpService.getWithParams(
      'warehouse/get-warehouse',
      {}
    );
  }

  onSubmitWarehouse(evt): void {
    evt.preventDefault();
    const warehouseControl = this.createKitForm.get('warehouse_code');
    warehouseControl.markAllAsTouched();
    if (warehouseControl.invalid) {
      this.toastr.error('Please select a warehouse');
      return;
    }

    const hasWarehouseChanged =
      warehouseControl?.value !== this.duplicateCreateKitForm?.warehouse_code;

    if (hasWarehouseChanged) {
      this.totalProducts.clear();
      this.totalKitProducts.clear();
    }
    this.activeScreen = 'item_screen';
  }

  locationsValidation(): ValidatorFn {
    const validator: ValidatorFn = (formArray: FormArray) => {
      const selectedCount = formArray.controls
        .map((control) => {
          const val = control.value;
          return Object.values(val)[0];
        })
        .includes(true);

      return selectedCount ? null : { notSelected: true };
    };

    return validator;
  }

  get totalProducts(): FormArray {
    return this.createKitForm.get('products') as FormArray;
  }

  get totalKitProducts(): FormArray {
    return this.createKitForm.get('kitproducts') as FormArray;
  }

  searchProduct(evt): void {
    const value = evt.target.value;
    const { warehouse_code } = this.createKitForm.value;
    this.productSearchedResult = this.fcsService
      .getSearchKitItems({ key: value, warehouse_code })
      .pipe(map((resp: { result: any[]; status: number }) => resp.result));
  }

  searchKitProduct(evt): void {
    const value = evt.target.value;
    const { warehouse_code } = this.createKitForm.value;
    this.productKitSearchedResult = this.fcsService
      .getSearchKitProduct({ key: value, warehouse_code })
      .pipe(map((resp: { result: any[]; status: number }) => resp.result));
  }

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

  addKitProductToList(product): void {
    const { sku } = product;

    const productFound = this.totalKitProducts.value.find(
      (prod) => prod.sku === sku
    );
    if (!productFound) {
      this.totalKitProducts.push(
        this.fb.group({
          ...product,
          quantity: [
            product.quantity ?? '',
            [Validators.required, Validators.min(1)],
          ],
        })
      );
      this.autocompleteKit.disable();
    }
  }

  onOptionSelectedKit(evt: MatAutocompleteSelectedEvent): void {
    const product = evt?.option?.value;
    if (product) {
      product.reason = product.reason ?? '';
      this.addKitProductToList(product);
    }
  }

  onOptionSelected(evt: MatAutocompleteSelectedEvent): void {
    const product = evt?.option?.value;
    if (product) {
      product.reason = product.reason ?? '';
      this.addProductToList(product);
    }
  }

  formatInputValue(product): string {
    // console.log('product :>> ', product);
    // if (product) {
    //   product.reason = product.reason ?? '';
    //   this.addProductToList(product);
    //   return '';
    // }
    return '';
  }

  formatInputKitValue(product): string {
    // if (product) {
    // product.reason = product.reason ?? '';
    // this.addKitProductToList(product);
    // return product.sku;
    // }
    return '';
  }

  removeProduct(idx: number): void {
    this.totalProducts.removeAt(idx);
  }

  removeKitProduct(idx: number): void {
    this.totalKitProducts.removeAt(idx);
    this.autocompleteKit.enable();
  }

  getMaxKit(): void {
    const items = {};
    const { warehouse_code } = this.createKitForm.value;
    const products = this.totalProducts.value;
    products.forEach((product: ProductInterface) => {
      items[product.sku] = product.quantity;
    });

    this.autocomplete.reset();
    this.subs.sink = this.fcsService
      .getMaxKit({ items, warehouse_code })
      .subscribe(
        (data: any) => {
          if (data.status) {
            this.maxKit = data.maxKit;
          } else {
            this.toastr.error('Error while fetching max kit', 'Error');
          }
        },
        (err) => {
          console.error(err);
          const message = err?.error?.message;
          this.toastr.error(message, 'Error');
        }
      );
  }

  onClickSubmit(evt): void {
    evt.preventDefault();
    this.totalProducts.markAllAsTouched();
    const isInvalid = this.totalProducts.invalid;
    if (isInvalid) {
      this.toastr.error('Invalid form');
      return;
    }

    this.activeScreen = 'product_screen';
    this.enableDisableSearch();
    this.getMaxKit();
  }

  enableDisableSearch(): void {
    const len = this.totalKitProducts.controls.length;
    if (len > 0) {
      this.autocompleteKit.disable();
    } else {
      this.autocompleteKit.enable();
    }
  }

  onClickSubmitKit(evt): void {
    evt.preventDefault();
    this.totalKitProducts.markAllAsTouched();
    const isInvalid = this.totalKitProducts.invalid;
    const quantity = this.totalKitProducts.value[0]?.quantity;
    if (isInvalid) {
      this.toastr.error('Invalid form');
      return;
    }
    if (quantity > this.maxKit) {
      this.toastr.error('Quantity should not exceed max kit qty');
      return;
    }
    this.activeScreen = 'final_screen';
    this.autocompleteKit.reset();
  }

  onClickSubmitForm(evt): void {
    evt.preventDefault();
    if (!this.totalKitProducts.value.length) {
      this.toastr.error('Kit SKU is missing', 'Error');
      return;
    }

    if (!this.totalProducts.value.length) {
      this.toastr.error('Kit items are missing', 'Error');
      return;
    }

    const items = {};
    this.totalProducts.value.forEach((product: ProductInterface) => {
      items[product.sku] = product.quantity;
    });

    const { sku, quantity } = this.totalKitProducts.value[0];
    const { warehouse_code } = this.createKitForm.value;
    const payload = {
      warehouse_code,
      sku,
      quantity,
      items,
    };

    this.subs.sink = this.httpService
      .post('warehouse/save-kit', payload)
      .subscribe(
        (response: any) => {
          if (response.status) {
            this.toastr.success('Kit created successfully');
            this.router.navigate(['work-order/kitting']);
          } else {
            if (response.message) {
              this.toastr.error(this.getRawHtml(response.message), 'Error', {
                enableHtml: true,
                timeOut: 5000,
                //extendedTimeOut:2000
                //disableTimeOut:true
              });
            } else {
              this.toastr.error(
                'Something went wrong! Please try again later',
                'Error'
              );
            }
          }
        },
        (err) => {
          console.error(err);
          const message = err?.error?.message;
          this.toastr.error(message, 'Error');
        }
      );
  }

  getRawHtml(errorMessage): string {
    const skuName = this.totalKitProducts.value[0].sku;
    return `<h4 class="mb-1">Error in registering the kit sku ${skuName}</h4><p>Following fields need to be updated in product sheet.</p>
    <ul>
    ${errorMessage.map((msg) => `<li>${msg}</li>`).join('')}
    </ul>
    `;
  }

  getIcon(warehouseName: string): string {
    if (!warehouseName) {
      return '';
    }

    const key = warehouseName?.split(' ')[0]?.toLowerCase();
    return `assets:${SvgEnum[key]}`;
  }

  isSelected(warehouseCode: string): boolean {
    return this.createKitForm.get('warehouse_code').value === warehouseCode;
  }

  onClickPrev(type): void {
    this.activeScreen = type;
    this.duplicateCreateKitForm = { ...this.createKitForm.value };
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
