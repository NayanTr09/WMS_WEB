import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from 'src/app/services/http/http.service';
import { SubSink } from 'subsink';

interface ProductInterface {
  id: number;
  sku: string;
  name: string;
  quantity?: FormControl;
}

interface ComboInterface {
  parentID: number;
  parentSKU: string;
  childSKU: ProductInterface[];
  is_web: number;
}

@Component({
  selector: 'app-add-combo',
  templateUrl: './add-combo.component.html',
  styleUrls: ['./add-combo.component.scss'],
})
export class AddComboComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  parentAutocomplete = new FormControl();
  childAutocomplete = new FormControl();
  step = 1;
  parentTable: ProductInterface[] = [];
  childTable: ProductInterface[] = [];
  parentSearchResult: Observable<any>;

  constructor(
    private location: Location,
    private http: HttpService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {}

  searchProductParent(evt): void {
    const value = evt.target.value;
    const endpt = 'products/searchProduct';
    const payload = {
      key: value,
      is_web: 1,
      type: 0,
    };
    this.parentSearchResult = this.http
      .requestToEndpoint(endpt, payload)
      .pipe(map((resp: { result: any[]; status: number }) => resp.result));
  }

  toggleParentSearch(): void {
    if (this.parentTable.length) {
      this.parentAutocomplete.disable();
    } else {
      this.parentAutocomplete.enable();
    }
  }

  formatParentValue(product: ProductInterface): string {
    if (product) {
      const found = this.parentTable.findIndex(
        (entry) => entry.id === product.id
      );
      if (found < 0) {
        this.parentTable.push(product);
        this.toggleParentSearch();
      }
      return product.sku;
    }
    return '';
  }

  formatChildValue(product): string {
    if (product) {
      const found = this.childTable.findIndex(
        (entry) => entry.id === product.id
      );
      if (found < 0) {
        this.childTable.push({
          ...product,
          quantity: new FormControl('', [
            Validators.required,
            Validators.min(1),
          ]),
        });
      }
      return product.sku;
    }
    return '';
  }

  removeParentEntry(idx: number): void {
    this.parentTable.splice(idx, 1);
    this.toggleParentSearch();
  }

  removeChildEntry(idx: number): void {
    this.childTable.splice(idx, 1);
  }

  onClickNext(): void {
    let isInvalid = false;
    if (this.step === 2) {
      this.childTable.forEach((product) => {
        const quantity = product.quantity as FormControl;
        quantity.markAllAsTouched();
        if (quantity.invalid) {
          isInvalid = quantity.invalid;
        }
      });

      if (!isInvalid) {
        this.step++;
      }
    } else {
      this.step++;
    }
  }

  onClickPrevious(): void {
    this.step--;
  }

  goBack(): void {
    this.location.back();
  }

  submitCombo(): void {
    const combo = { childSKU: [] } as ComboInterface;
    combo.is_web = 1;
    this.parentTable.forEach((product) => {
      combo.parentID = product.id;
      combo.parentSKU = product.sku;
    });
    this.childTable.forEach((product) => {
      combo.childSKU.push({
        ...product,
        quantity: product.quantity.value,
      });
    });

    const endpt = 'products/combo';
    this.subs.sink = this.http.postToEndpint(endpt, combo).subscribe(
      (success) => {
        this.toastr.success(success?.message, 'Success');
        this.router.navigate(['fcs/products']);
      },
      (onErr) => {
        console.error(onErr);
        this.toastr.error(onErr.error.message);
      }
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
