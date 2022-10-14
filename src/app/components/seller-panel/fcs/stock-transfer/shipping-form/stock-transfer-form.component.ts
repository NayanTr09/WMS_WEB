import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';
import { EndpointFCS, FcsService } from 'src/app/services/http/fcs.service';
import { SubSink } from 'subsink';
import { FormStatus } from '../stock-transfer-create.component';

interface Warehouse {
  code: string;
  name: string;
  to_warehouse_type: string;
  to_warehouse_code: string;
}

interface Addresses {
  id: number;
  name: string;
}

@Component({
  selector: 'app-stock-transfer-form',
  templateUrl: './stock-transfer-form.component.html',
  styleUrls: ['./stock-transfer-form.component.scss'],
})
export class StockTransferFormComponent implements OnInit, OnDestroy {
  @Input() asnData: { id: number; asn: string };
  @Output() postSave = new EventEmitter();
  private subs = new SubSink();
  shipping: FormGroup;
  //newShippingAddress: FormGroup;
  pickupAddresses: Addresses[] = [];
  warehouses: Warehouse[] = [];
  formStatus: string;
  showAddNewAddress: boolean;
  hideOtp = true;
  time: number;
  phoneVerified = false;
  otpSubs: any;

  constructor(
    private fb: FormBuilder,
    private fcsService: FcsService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.shipping = this.fb.group({
      fromLocation: ['', [Validators.required]],
      toLocation: ['', Validators.required],
    });

    /*this.newShippingAddress = this.fb.group({
      pickup_location: ['', [Validators.required, Validators.maxLength(8)]],
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[6-9][0-9]{9}$')]],
      otp: ['', [Validators.required, Validators.minLength(6)]],
      alternate_phone: [''],
      address: ['', [Validators.required, Validators.minLength(10)]],
      address_2: [''],
      pin_code: [
        '',
        [Validators.required, Validators.minLength(6), Validators.maxLength(6)],
      ],
      city: ['', Validators.required],
      state: ['', Validators.required],
      country: ['india'],
      email: ['', [Validators.required, Validators.email]],
      supplier_check: [false],
    }); */

    //this.getPickupAddress();
    this.getWarehouses();
    this.initShipping();
  }

  initShipping(): void {
    this.subs.sink = this.getAutosave().subscribe((success) => {
      const { shipping, asnData } = success?.data ?? {};
      this.asnData = asnData;
      if (shipping) {
        this.updateShipping(shipping);
      }
    });

    /**
     * subscribe to value changes
     * Call Autosave POST api
     */
    this.subs.sink = this.shipping.valueChanges
      .pipe(
        debounceTime(500),
        tap(() => (this.formStatus = FormStatus.Saving))
      )
      .subscribe((data) => {
        // console.log(data);
        this.subs.sink = this.postAutosave(data, 'shipping').subscribe(
          (success) => {
            this.formStatus = FormStatus.Saved;
            const { shipping } = success?.data;
            if (shipping) {
              this.shipping.patchValue(
                { ...shipping },
                { emitEvent: false, onlySelf: true }
              );
            }
          }
        );
      });
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

  updateShipping(shipping): void {
    //this.getPickupAddress();
    this.getWarehouses();

    this.shipping.patchValue(
      { ...shipping },
      { emitEvent: false, onlySelf: false }
    );

    /*if (shipping && shipping.fromLocation === 'new') {
      this.showAddNewAddress = true;
      this.attachListnerToPincode();
    }*/
  }

  /*onPhoneBlur(evt): void {
    this.sendOtpRequest();
  }*/

  getPickupAddress(): void {
    this.subs.sink = this.fcsService.getPickupAddresses().subscribe(
      (data: any) => {
        const { shipping_address = [] } = data?.data;
        this.pickupAddresses = shipping_address.map((address) => ({
          name: address.pickup_location,
          id: address.id,
        }));
      },
      (onErr) => console.error('onErr :', onErr)
    );
  }

  getObjectLength(data): number {
    if (data) {
      return Object.keys(data).length;
    }
    return 0;
  }

  public getWarehouses(): void {
    this.subs.sink = this.fcsService.getStockTransferWarehouses().subscribe(
      (data: any) => {
        const { warehouse } = data?.data;

        this.warehouses = warehouse.map((wh) => ({
          name: wh.warehouse_name + ' ' + wh.from,
          code: wh.warehouse_code,
          to_warehouse_type: wh.to,
          to_warehouse_code: wh.dependent_warehouse_code,
        }));
      },
      (onErr) => console.error('onErr (getWarehouses): ', onErr)
    );
  }

  fromLocationChanged(evt): void {
    const { value } = evt;

    const warehouse = this.warehouses.filter(function (warehouse) {
      if (warehouse.code == value) {
        return warehouse;
      }
    });

    //$this->shipping;

    this.shipping.patchValue({ toLocation: warehouse[0].to_warehouse_code });

    /*this.showAddNewAddress = false;

    if (value === 'new') {
      this.showAddNewAddress = true;
      this.attachListnerToPincode();
    }*/
  }

  /*attachListnerToPincode(): void {
    const pincode = this.newShippingAddress.get('pin_code');
    this.subs.sink = pincode.valueChanges
      .pipe(debounceTime(500))
      .subscribe((pin) => {
        if (pincode.valid) {
          this.getLocationWithPincode(pin);
        }
      });
  }*/

  /*getLocationWithPincode(postcode): void {
    const payload = { is_web: 1, postcode };
    this.subs.sink = this.fcsService
      .requestToEndpoint(EndpointFCS.postcode, payload)
      .subscribe((success) => {
        const { city, state } = success?.postcode_details;
        this.newShippingAddress.patchValue(
          { city, state },
          { emitEvent: false, onlySelf: true }
        );
        this.newShippingAddress.get('city').disable();
        this.newShippingAddress.get('state').disable();
      });
  }*/

  startTimer(): void {
    this.time = 30;
    const timer = setInterval(() => {
      if (this.time <= 1) {
        clearInterval(timer);
      }
      this.time--;
    }, 1000);
  }

  /* sendOtpRequest(): void {
    const phoneNum = this.newShippingAddress.get('phone');
    const phone = phoneNum.value;
    if (phoneNum.invalid) {
      this.toastr.error('Invalid phone');
      return;
    }

    const payload = { is_web: 1, module: 1, phone };
    this.subs.sink = this.fcsService
      .postToEndpint(EndpointFCS.shipping_phone, payload)
      .subscribe((success) => {
        const { verified } = success;
        if (verified) {
          this.toastr.success('Phone number verified');
          this.phoneVerified = true;
          this.newShippingAddress.get('phone').disable();
          this.newShippingAddress.removeControl('otp');
        } else {
          this.startTimer();
          this.toastr.success('OTP sent');
          this.hideOtp = false;
          if (this.otpSubs) {
            this.otpSubs.unsubscribe();
          }
          this.onOtpEnter();
        }
      });
  } */

  /* onOtpEnter(): void {
    const otpNum = this.newShippingAddress.get('otp');
    this.otpSubs = otpNum.valueChanges
      .pipe(debounceTime(500))
      .subscribe((otp) => {
        if (otpNum.valid) {
          const payload = {
            address_id: '',
            is_web: 1,
            module: 1,
            otp,
          };

          this.subs.sink = this.fcsService
            .postToEndpint(EndpointFCS.confirm_otp, payload)
            .subscribe(
              (success) => {
                this.phoneVerified = true;
                this.time = 0;
                this.newShippingAddress.get('phone').disable();
                this.newShippingAddress.get('otp').disable();
                this.toastr.success('OTP confirmed');
              },
              (onErr) => {
                this.toastr.error('OTP confirmation failed');
              }
            );
        }
      });
  }*/

  postShippingPreferences(): void {
    const endpoint = 'stock-transfer/create';
    const { fromLocation, toLocation } = this.shipping.value;

    const payload = {
      pickup_wareshouse_id: fromLocation,
      drop_warehouse_id: toLocation,
      asn_id: this.asnData?.id,
    };

    this.subs.sink = this.fcsService.postToEndpint(endpoint, payload).subscribe(
      (success) => {
        // console.log(success);
        const stockTransferData = success?.data;
        this.postSave.emit({ stockTransferData });
      },
      (onErr) => {
        console.error(onErr);
        this.toastr.error(onErr.error.message, 'Error');
      }
    );
  }

  /*postNewShippingAddress(): Observable<any> {
    const value = this.newShippingAddress.getRawValue();
    return this.fcsService.postToEndpint(EndpointFCS.add_pickup, value);
  }*/

  onClickSubmit(e): void {
    e.preventDefault();
    this.shipping.markAllAsTouched();
    if (this.shipping.valid) {
      const { value } = this.shipping;
      this.postShippingPreferences();
      return;
      /*if (value.fromLocation !== 'new') {
        this.postShippingPreferences();
        return;
      }*/

      // if new address is selected
      /*this.newShippingAddress.markAllAsTouched();
      if (this.newShippingAddress.valid) {
        this.subs.sink = this.postNewShippingAddress().subscribe(
          (success) => {
            
            this.shipping.patchValue({
              fromLocation: success?.pickup_id,
            });
            this.postShippingPreferences();
          },
          (onErr) => {
            console.error(':>> ', onErr);
            const { errors = {} } = onErr?.error;
            this.toastr.error(JSON.stringify(errors), 'Error');
          }
        );
      }*/
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
