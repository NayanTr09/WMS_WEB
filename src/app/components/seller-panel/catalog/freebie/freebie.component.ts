import { ToastrService } from 'ngx-toastr';
import { debounceTime, tap, map, takeWhile, takeLast } from 'rxjs/operators';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  FormArray,
} from '@angular/forms';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Observable, timer } from 'rxjs';
import { FreebieService } from 'src/app/services/http/freebie.service';
import { Location } from '@angular/common';
import { IOptions, TSku } from '../catalog-model';
import { Router } from '@angular/router';
import { SubSink } from 'subsink';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipList } from '@angular/material/chips';

@Component({
  selector: 'app-freebie',
  templateUrl: './freebie.component.html',
  styleUrls: ['./freebie.component.scss'],
})
export class FreebieComponent implements OnInit, OnDestroy {
  @ViewChild('freeSkusInput') freeSkusInput: ElementRef<HTMLInputElement>;
  @ViewChild('chipList') chipList: MatChipList;
  private subs = new SubSink();
  conditionForm: FormGroup;
  dummyCtrl = new FormControl();
  searchedResult: Observable<TSku[]>;
  productSearchedResult: Observable<object[]>;
  selectedOrderType = 0;
  //anotherConditionFlag = false;
  addProducts: FormGroup;
  currentProduct: any;
  conditions: IOptions[];
  orderType = [
    {
      id: 1,
      value: 'Order Value',
    },
    {
      id: 2,
      value: 'Order SKUs',
    },
  ];

  orderValue = [
    { id: '&gt;', value: 'If order value greater than' }, // >
    { id: '&lt;', value: 'If order value less than' }, // <
    { id: '&equals;&equals;', value: 'If order value equal to' }, // ==
    { id: 'between', value: 'If order value between' }, // ==
  ];

  orderSkus = [{ id: 'sku', value: 'If order SKU equal to' }];
  readyToSubmit = false;
  conditionTextObj = [];
  alive = true;

  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private freebieService: FreebieService,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.conditionForm = this.formBuilder.group({
      type: new FormControl('', [Validators.required]),
      condition1: new FormControl(''),
      amount1: new FormControl(''),
      order_sku: new FormControl(''),
      free_skus: this.formBuilder.array([], [Validators.required]),
    });

    this.subs.sink = this.dummyCtrl.valueChanges.subscribe((value: string) => {
      if (typeof value === 'string') {
        this.searchedResult = this.freebieService
          .getSearchProduct({ key: value })
          .pipe(map((resp: { result: TSku[]; status: number }) => resp.result));
      }
    });

    this.watchType();
  }

  watchType(): void {
    const type = this.conditionForm.get('type');
    const condition1 = this.conditionForm.get('condition1');

    this.subs.sink = type.valueChanges
      .pipe(debounceTime(100))
      .subscribe((orderType) => {
        if (orderType === 2 && this.orderSkus.length === 1) {
          condition1.patchValue('sku');
        }
      });
  }

  get isBetween(): boolean {
    return this.conditionForm.get('condition1').value === 'between';
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const newSku: TSku = event.option.value;
    const found = this.freeSkus.value.find((sku: TSku) => sku.id === newSku.id);

    // stop duplicate
    if (!found) {
      this.freeSkus.push(new FormControl(newSku));
    }
    this.chipList.errorState = this.freeSkus.invalid; // add error if invalid
    this.freeSkusInput.nativeElement.value = '';
    this.dummyCtrl.setValue(null);
  }

  remove(index: number): void {
    this.freeSkus.removeAt(index);
  }

  goBack(): void {
    if (this.readyToSubmit) {
      this.readyToSubmit = false;
    } else {
      this.location.back();
    }
  }

  changeCondition(): void {
    console.log('changes condition ....');
    const condition1 = this.conditionForm.get('condition1');
    const amount1 = this.conditionForm.get('amount1');
    amount1.clearValidators();

    if (this.selectedOrderType == 1) {
      if (condition1.value === 'between') {
        amount1.setValidators([
          Validators.required,
          Validators.pattern(/^(\d+(?:[,])\d+)$/),
        ]);
      } else {
        amount1.setValidators([
          Validators.required,
          Validators.pattern(/^(\d+)$/),
        ]);
      }
    }

    amount1.updateValueAndValidity();
  }

  changeConditionType(event): void {
    this.selectedOrderType = event.value;

    this.conditionForm.reset();

    this.conditionForm.get('type').setValidators([Validators.required]);

    this.freeSkus.clear();

    console.log(this.selectedOrderType);

    if (this.selectedOrderType == 1) {
      this.conditions = this.orderValue;
      this.conditionForm.get('order_sku').clearValidators();
      this.conditionForm.get('order_sku').updateValueAndValidity();

      this.conditionForm.get('condition1').setValidators([Validators.required]);
      this.conditionForm.get('condition1').updateValueAndValidity();

      if (this.conditionForm.get('condition1').value == 'between') {
        this.conditionForm
          .get('amount1')
          .setValidators([
            Validators.required,
            Validators.pattern('^d+(?:[,]d)$'),
          ]);
        this.conditionForm.get('amount1').updateValueAndValidity();

        console.log('BETWEEN......');
      } else {
        this.conditionForm
          .get('amount1')
          .setValidators([Validators.required, Validators.pattern(/^(\d+)$/)]);
        this.conditionForm.get('amount1').updateValueAndValidity();
      }
    } else {
      this.conditions = this.orderSkus;
      this.conditionForm.get('amount1').clearValidators();
      this.conditionForm.get('amount1').updateValueAndValidity();

      this.conditionForm.get('condition1').clearValidators();
      this.conditionForm.get('condition1').updateValueAndValidity();

      this.conditionForm.get('order_sku').setValidators([Validators.required]);
      this.conditionForm.get('order_sku').updateValueAndValidity();
    }

    this.conditionForm.get('free_skus').setValidators([Validators.required]);

    this.conditionForm.updateValueAndValidity();

    this.conditionForm.patchValue({
      type: this.selectedOrderType,
    });

    //this.anotherConditionFlag = false;
  }

  reset(): void {
    this.freeSkus.clear();
    this.conditionForm.reset();
  }

  createCondition(): boolean {
    console.log(this.conditionForm.controls);
    console.log(this.conditionForm.invalid);

    if (this.conditionForm.invalid) {
      this.chipList.errorState = this.freeSkus.invalid; // add error if invalid
      return false;
    }

    const payload = {
      free_skus: this.conditionForm.controls.free_skus.value.map((pdt) => ({
        sku: pdt.sku,
        product_id: pdt.id,
      })),
      type: this.conditionForm.get('type').value,
    };

    if (payload.type == 1) {
      payload['condition1'] = this.conditionForm.get('condition1').value;

      if (this.conditionForm.get('condition1').value == 'between') {
        payload['condition1'] = '&gt;';
        payload['condition2'] = '&lt;';
        const commaSeperatedAmount = this.conditionForm
          .get('amount1')
          .value.split(',');
        payload['condition1_value'] = commaSeperatedAmount[0];
        payload['condition2_value'] = commaSeperatedAmount[1];
      } else {
        payload['condition2'] = '';
        payload['condition2_value'] = '';
        payload['condition1_value'] = this.conditionForm.get('amount1').value;
      }
    } else {
      payload['order_sku'] = {
        product_id: this.conditionForm.get('order_sku').value.id,
        sku: this.conditionForm.get('order_sku').value.sku,
      };
    }

    console.log(payload);

    if (!this.conditionForm.invalid && !this.readyToSubmit) {
      this.getText(payload);
      return false;
    }

    this.freebieService.createCondition(payload).subscribe(
      (success) => {
        console.log(success);
        if (!success.status) {
          this.toastr.error(success.error, 'Error');
        } else {
          this.toastr.success(success.message, 'Success');

          timer(2000)
            .pipe(takeWhile(() => this.alive))
            .subscribe((_) => {
              this.router.navigate(['catalog/freebie-list']);
            });
        }
      },
      (error) => {
        console.log(error);
      }
    );
  }

  getText(payload) {
    this.freebieService.checkValdition(payload).subscribe(
      (success) => {
        const { status } = success;
        if (status === 1) {
          this.conditionTextObj = success;
          const payloadType = payload.type === 1 ? 'Order Value' : 'Order SKU';
          this.conditionTextObj['data']['type'] = payloadType;

          this.readyToSubmit = true;
        } else {
          this.toastr.error(success.error, 'Error');
        }
      },
      (err) => {
        this.toastr.error(err.error.message, 'Error');
      }
    );
  }

  searchProduct(evt): void {
    const value = evt.target.value;
    this.productSearchedResult = this.freebieService
      .getSearchProduct({ key: value })
      .pipe(map((resp: { result: any[]; status: number }) => resp.result));
  }

  get freeSkus(): FormArray {
    return this.conditionForm.get('free_skus') as FormArray;
  }

  formatInputValue(product): string {
    if (product) {
      this.currentProduct = product;
      return product.sku;
    }
    return '';
  }

  ngOnDestroy(): void {
    this.alive = false;
    this.subs.unsubscribe();
  }
}
