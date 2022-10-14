import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { SvgEnum } from 'src/app/enum';
import { HttpService } from 'src/app/services/http/http.service';
import { SubSink } from 'subsink';

export interface PeriodicElement {
  position: number;
  sku: string;
  name: string;
  available_qty: number;
  qc_failed_qty: number;
  remove_failed_qty: number;
  remove_available_qty: number;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {
    position: 1,
    name: 'Hydrogen',
    qc_failed_qty: 3,
    remove_failed_qty: 1,
    available_qty: 10,
    remove_available_qty: 5,
    sku: 'tshirt1',
  },
  {
    position: 2,
    name: 'Hydrogen',
    qc_failed_qty: 3,
    remove_failed_qty: 1,
    available_qty: 10,
    remove_available_qty: 2,
    sku: 'tshirt2',
  },
];

@Component({
  selector: 'app-removal-request',
  templateUrl: './removal-request.component.html',
  styleUrls: ['./removal-request.component.scss'],
})
export class RemovalRequestComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  displayedColumns: string[] = [
    'select',
    'sku',
    'name',
    'available_qty',
    'remove_available_qty',
    'qc_failed_qty',
    'remove_failed_qty',
    'action',
  ];

  inventoryForm: FormGroup;
  selection = new SelectionModel<PeriodicElement>(true, []);
  removalForm: FormGroup;
  warehouseList: Observable<any>;
  objectKeys = Object.keys;
  log = console.log;
  showDeleteAll = false;

  constructor(
    private fb: FormBuilder,
    private httpService: HttpService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.removalForm = this.fb.group({
      return_type: [0, [Validators.required]],
      warehouse_code: [null, [Validators.required]],
      inventory_data: this.fb.array([]),
      reason: [''],
    });

    this.inventoryForm = this.fb.group({
      inventories: this.fb.array([]),
    });

    this.getWarehouses();
    this.getInventoryList();

    this.subs.sink = this.selection.changed.subscribe(() =>
      this.updateDeleteAllStatus()
    );
  }

  get inventories(): FormArray {
    return this.removalForm.get('inventory_data') as FormArray;
  }

  isSelected(warehouseCode: string): boolean {
    return this.removalForm.get('warehouse_code').value === warehouseCode;
  }

  getIcon(warehouseName: string): string {
    if (!warehouseName) {
      return '';
    }

    const key = warehouseName?.split(' ')[0]?.toLowerCase();
    return `assets:${SvgEnum[key]}`;
  }

  removeFlipkart(warehouseName): boolean {
    return !warehouseName?.toLowerCase().includes('flipkart');
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

  updateDeleteAllStatus(): void {
    this.showDeleteAll = this.selection.hasValue();
  }

  removeElement(idx: number): void {
    this.inventories.removeAt(idx);
  }

  getDataSource(): AbstractControl[] {
    return [...this.inventories.controls];
  }

  clickDeleteAll(): void {
    this.selection.selected.forEach((element) => {
      const idx = this.inventories.controls.findIndex(
        (inventory) => inventory.value.position === element.position
      );
      this.removeElement(idx);

      this.selection.deselect(element);
    });
  }

  removedAvailableQtyErr(row: FormGroup): string {
    const qcFailedControl = row.get('remove_available_qty');
    if (qcFailedControl.hasError('min')) {
      return 'Invalid value';
    }
    return '';
  }

  removeFailedQtyErr(row: FormGroup): string {
    const qc2RemoveControl = row.get('remove_failed_qty');
    if (qc2RemoveControl.hasError('min')) {
      return 'Invalid value';
    }
    return '';
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.inventories.controls.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle(): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.inventories.controls.forEach((row) =>
          this.selection.select(row.value)
        );
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: PeriodicElement): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.position + 1
    }`;
  }

  onSubmit(evt: Event): void {
    evt.preventDefault();
    this.removalForm.markAllAsTouched();
    if (this.removalForm.invalid) {
      this.toastr.error('Invalid Form');
      return;
    }

    const srfUser = localStorage.getItem('srf_user');
    const parsedSrfUser = JSON.parse(srfUser);
    const { company_id } = parsedSrfUser;

    const payload = { ...this.removalForm.value };
    payload.company_id = company_id;
    console.log('payload :>> ', payload);
    // add company id
    this.httpService.postwms('create-return-to-vendor', payload).subscribe(
      (success) => {
        this.toastr.success('Request sumitted successfully');
        // Navigate to url
      },
      (err) => {
        console.error(err);
        const message = err?.error?.message;
        this.toastr.error(message, 'Error');
      }
    );
  }

  getInventoryList(): void {
    const payload = { sort: 'DESC', sort_by: 'updated_on', is_web: 1 };

    this.httpService.getWithParams('inventory', payload).subscribe(
      (success: { data: any[]; meta: object }) => {
        const { data } = success;
        data.forEach((inventory, i) => {
          const {
            sku,
            name,
            available_quantity: available_qty,
            blocked_quantity: qc_failed_qty,
          } = inventory;

          this.inventories.push(
            this.fb.group({
              position: i + 1,
              sku,
              name,
              available_qty,
              qc_failed_qty,
              remove_available_qty: new FormControl('', [
                Validators.required,
                Validators.min(0),
              ]),
              remove_failed_qty: new FormControl('', [
                Validators.required,
                Validators.min(0),
              ]),
            })
          );
        });
      },
      (onErr) => {}
    );
  }

  getWarehouses(): void {
    this.warehouseList = this.httpService.getWithParams(
      'warehouse/get-warehouse',
      {}
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
