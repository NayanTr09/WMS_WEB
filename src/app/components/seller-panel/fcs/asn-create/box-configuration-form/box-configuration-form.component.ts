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
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';
import { EndpointFCS, FcsService } from 'src/app/services/http/fcs.service';
import { SubSink } from 'subsink';
import { FormStatus } from '../asn-create.component';

@Component({
  selector: 'app-box-configuration-form',
  templateUrl: './box-configuration-form.component.html',
  styleUrls: ['./box-configuration-form.component.scss'],
})
export class BoxConfigurationFormComponent implements OnInit, OnDestroy {
  @Output() selectionChange = new EventEmitter();
  private subs = new SubSink();
  boxConfig: FormGroup;
  formStatus: FormStatus;
  asnData: any;
  objectKeys = Object.keys;
  fixedColumns = ['SKU', 'Product Name', 'Units', 'actions'];
  displayedColumns = {
    sku: 'SKU',
    name: 'Product Name',
    quantity: 'Units',
    box1: 'Box 1',
    actions: 'actions',
  };
  isB2BEnabled: boolean;
  isBulk: boolean = false;
  skuLeft: number = 0;
  rowcount: number = 3;
  maxBoxCount: number;
  skuLeftcolcount: number;
  constructor(
    private fb: FormBuilder,
    private fcsService: FcsService,
    private toastr: ToastrService,
    private router: Router
  ) {}
  wrongValues: {};
  ngOnInit(): void {
    this.wrongValues = {};
    this.checkB2BStatus();
    this.boxConfig = this.fb.group({
      boxDetails: this.fb.array([]),
      inventoryType: [null, Validators.required],
    });

    this.initBoxConfiguration();
  }

  get getBoxDetails(): FormArray {
    return this.boxConfig.get('boxDetails') as FormArray;
  }

  initBoxConfiguration(): void {
    this.subs.sink = this.getAutosave().subscribe((success) => {
      const { boxConfig, asnData } = success?.data;
      this.isBulk = success.is_bulk;
      this.skuLeft = success.skus_left;
      this.asnData = this.asnData ?? asnData;

      if (boxConfig) {
        const { boxDetails, inventoryType } = boxConfig;
        this.boxConfig.patchValue(
          { inventoryType },
          { emitEvent: false, onlySelf: false }
        );
        if (this.isBulk) {
          this.maxBoxCount = success.max_box_count;
          this.rowcount = this.rowcount + this.maxBoxCount;

          this.handleBulkBoxConfigResponse([...boxDetails]);
        } else {
          this.handleBoxConfigResponse([...boxDetails]);
        }
      } else {
        this.parseBoxConfig();
      }
    });

    this.subs.sink = this.boxConfig.valueChanges
      .pipe(
        debounceTime(500),
        tap(() => (this.formStatus = FormStatus.Saving))
      )
      .subscribe((data) => {
        this.subs.sink = this.postAutosave(data, 'boxConfig').subscribe(
          (success) => {
            this.formStatus = FormStatus.Saved;
            const { boxConfig } = success?.data;
            if (boxConfig) {
              const { boxDetails, inventoryType } = boxConfig;
              this.boxConfig.patchValue(
                { inventoryType },
                { emitEvent: false, onlySelf: false }
              );
              if (this.isBulk) {
                this.handleBulkBoxConfigResponse(boxDetails);
              } else {
                this.handleBoxConfigResponse(boxDetails);
              }
            }
          }
        );
      });
  }

  checkB2BStatus(): void {
    this.subs.sink = this.fcsService
      .requestToEndpoint(EndpointFCS.b2b_enabled)
      .subscribe((resp) => {
        const { is_b2b_enable } = resp?.data;
        this.isB2BEnabled = is_b2b_enable;
        if (!this.isB2BEnabled) {
          this.boxConfig.get('inventoryType').setValue('b2c');
        }
      });
  }

  parseBoxConfig(): void {
    const payload = {
      with_items: 1,
      asn_id: this.asnData?.id,
      asn: this.asnData?.asn,
    };
    const endpoint = 'warehouse/asn-detail';
    this.subs.sink = this.fcsService
      .requestToEndpoint(endpoint, payload)
      .subscribe(
        (onSuccess) => {
          if (this.isBulk) {
            this.handleBulkBoxConfigResponse(onSuccess?.data?.items);
          } else {
            this.handleBoxConfigResponse(onSuccess?.data?.items);
          }
        },
        (onErr) => console.error('onErr :', onErr)
      );
  }

  handleBoxConfigResponse(resp = []): void {
    if (!resp.length) {
      return;
    }
    let maxBoxLen = -1; // to store maximum boxes
    const allIds = this.getBoxDetails.value.map((dta) => dta.sku);
    resp.forEach((item) => {
      const { sku, name, quantity, packaging_detail } = item;
      let boxes = { box1: '' };

      if (packaging_detail && packaging_detail.length) {
        boxes = packaging_detail[0];
      } else {
        Object.keys(item)
          .filter((key) => key.startsWith('box'))
          .forEach((key) => (boxes[key] = item[key]));
      }

      // setting maxBoxLen's initial value
      if (maxBoxLen === -1) {
        maxBoxLen = Object.keys(boxes).length;
      }

      let currBoxLen = Object.keys(boxes).length;
      // add more boxes if number of boxes are less than maxBoxLen
      if (currBoxLen < maxBoxLen) {
        while (currBoxLen < maxBoxLen) {
          boxes[`box${currBoxLen + 1}`] = null;
          currBoxLen++;
        }
      }

      const formatBoxes = {};
      Object.keys(boxes).forEach(
        (key) => (formatBoxes[key] = [boxes[key], Validators.min(0)])
      );
      if (!allIds.includes(sku)) {
        this.getBoxDetails.push(
          this.fb.group({ sku, name, quantity, ...formatBoxes })
        );
      }
    });
    if (this.getBoxDetails.length) {
      const temp = Object.keys(this.getBoxDetails.value[0]).filter((key) =>
        key.toLowerCase().startsWith('box')
      );
      temp.forEach((val, i) => {
        this.displayedColumns[val] = `Box ${i + 1}`;
      });
      // to get actions as last field
      delete this.displayedColumns.actions;
      this.displayedColumns.actions = 'actions';
    }
  }
  handleBulkBoxConfigResponse(resp = []): void {
    if (!resp.length) {
      return;
    }
    this.subs.sink = this.getAutosave().subscribe((success) => {
      this.maxBoxCount = success.max_box_count;
    });
    const allIds = this.getBoxDetails.value.map((dta) => dta.sku);
    resp.forEach((item) => {
      const { sku, name, quantity, packaging_detail } = item;
      let boxes = { box1: '' };

      if (packaging_detail && packaging_detail.length) {
        boxes = packaging_detail[0];
      } else {
        Object.keys(item)
          .filter((key) => key.startsWith('box'))
          .forEach((key) => (boxes[key] = item[key]));
      }

      const formatBoxes = {};
      Object.keys(boxes).forEach(
        (key) => (formatBoxes[key] = [boxes[key], Validators.min(0)])
      );
      if (!allIds.includes(sku)) {
        this.getBoxDetails.push(
          this.fb.group({ sku, name, quantity, ...formatBoxes })
        );
      }
    });
    if (this.getBoxDetails.length) {
      const temp = Object.keys(this.getBoxDetails.value[0]).filter((key) =>
        key.toLowerCase().startsWith('box')
      );

      if (this.isBulk && temp.length < this.maxBoxCount) {
        for (var i = temp.length; i < this.maxBoxCount; i++) {
          var key = `box${i + 1}`;
          temp.push(key);
        }
      }

      temp.forEach((val, i) => {
        this.displayedColumns[val] = `Box ${i + 1}`;
      });

      this.getBoxDetails.value.forEach((elem, i) => {
        const nBoxes = Object.keys(elem).filter((key) =>
          key.toLowerCase().startsWith('box')
        );
        for (var j = nBoxes.length; j < this.maxBoxCount; j++) {
          var boxKey = `box${j + 1}`;
          const fg = this.getBoxDetails.at(i) as FormGroup;
          fg.addControl(boxKey, new FormControl(null, Validators.min(0)));
        }
      });
      delete this.displayedColumns.actions;
      this.displayedColumns.actions = 'actions';
      this.skuLeftcolcount = Object.keys(this.displayedColumns).length;
    }
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

  addColumn(): void {
    if (this.isBulk) {
      return;
    }
    const { value } = this.getBoxDetails;
    const temp = Object.keys(value[0])
      .filter((key) => key.toLowerCase().startsWith('box'))
      .map((box, i) => `box${i + 1}`);

    // add new box
    temp.push(`box${temp.length + 1}`);

    temp.forEach((box, i) => {
      this.displayedColumns[box] = `Box ${i + 1}`;
      value.forEach((data, j) => {
        if (!data[box]) {
          const fg = this.getBoxDetails.at(j) as FormGroup;
          fg.addControl(box, new FormControl(null, Validators.min(0)));
        }
      });
    });

    // to get actions as last field
    delete this.displayedColumns.actions;
    this.displayedColumns.actions = 'actions';
  }

  removeColumn(idx, columnName): void {
    if (this.isBulk) {
      return;
    }
    this.getBoxDetails.controls.forEach((control) => {
      const fg = control as FormGroup;
      fg.removeControl(columnName);
    });
    delete this.displayedColumns[columnName];
  }

  postBoxConfigration(): Observable<any> | boolean {
    let hasError = false;
    const skus = this.getBoxDetails.value.map((data, index) => {
      const { sku, quantity } = data;
      const temp = {};
      // tslint:disable-next-line: variable-name
      Object.keys(data)
        .filter((key) => key.startsWith('box'))
        .forEach((key, i) => (temp[`box${i + 1}`] = data[key]));

      const total = Object.values(temp).reduce(
        (a: number, b: number) => a + b,
        0
      );

      this.wrongValues[index] = '';
      if (total > quantity || total < quantity) {
        this.wrongValues[index] = 'text-danger';
        hasError = true;
      }

      return { sku, quantity, packaging_detail: [temp] };
    });

    const { asn } = this.asnData;
    const { inventoryType } = this.boxConfig.value;
    const payload = {
      asn,
      skus,
      place_of_item: inventoryType,
    };

    if (hasError) {
      this.toastr.error('Units and box count mismatched', 'Error');
      return false;
    }
    // Do a post request
    const endpoint = 'warehouse/update-packaging-detail';
    return this.fcsService.postToEndpint(endpoint, payload);
  }

  onClickSubmit(evt): void {
    evt.preventDefault();
    this.boxConfig.markAllAsTouched();
    if (this.boxConfig.invalid) {
      this.toastr.error('Invalid Form', 'Error');
      return;
    }
    // this.selectionChange.emit('next');
    const boxConfigration = this.postBoxConfigration();
    if (typeof boxConfigration !== 'boolean') {
      this.subs.sink = boxConfigration.subscribe(
        (success) => {
          // const { asn, asn_id: id, shipping_status } = success;
          // this.router.navigate(['/fcs/create-asn'], {
          //   queryParams: { id, asn, shipping_status },
          // });
          if (!success.status) {
            this.toastr.error(success.message, 'Error');
          } else {
            this.selectionChange.emit('next');
          }
        },
        (onErr) => {
          this.toastr.error(onErr.message, 'Error');
        }
      );
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
