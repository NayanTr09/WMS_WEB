import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import apiEnum from 'src/app/components/Utils/apiEnum';
import { HttpService } from 'src/app/services/http/http.service';
import { SubSink } from 'subsink';
import {
  IFbsSettings,
  IShippingMethod,
} from '../fulfillment/fulfillment.component';

@Component({
  selector: 'app-srf-smart',
  templateUrl: './srf-smart.component.html',
  styleUrls: ['./srf-smart.component.scss'],
})
export class SrfSmartComponent implements OnInit, OnDestroy {
  @Input() fbsSettings: IFbsSettings;
  @Input() shippingMethod: IShippingMethod;
  @Output() submitted = new EventEmitter();

  private sub = new SubSink();
  srfSmartForm: FormGroup;
  availableZones = [
    { name: 'Zone A', value: 'z_a' },
    { name: 'Zone B', value: 'z_b' },
    { name: 'Zone C', value: 'z_c' },
    { name: 'Zone D', value: 'z_d' },
    { name: 'Zone E', value: 'z_e' },
    { name: 'Zone E2', value: 'z_e2' },
  ];
  is_smart = false;
  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private http: HttpService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.fillFormValues();
  }

  initializeForm(): void {
    this.srfSmartForm = this.fb.group({
      is_rush: [{ value: null, disabled: true }],
      service_type_zones: this.fb.group({
        z_a: [81],
        z_b: [81],
        z_c: [81],
        z_d: [81],
        z_e: [81],
        z_e2: [81],
      }),
    });

    if (this.fbsSettings?.is_rush) {
      this.addShippingMethodRateController();
    }
  }

  addShippingMethodRateController(): void {
    const shippingMethodRateController = this.fb.group({
      express: [null, [Validators.required, Validators.min(0)]],
      standard: [null, [Validators.required, Validators.min(0)]],
      rush: [
        { value: null, disabled: !this.fbsSettings?.is_rush },
        [Validators.required, Validators.min(0)],
      ],
      darkstore: [null, [Validators.required, Validators.min(0)]],
    });

    this.srfSmartForm.addControl(
      'shipping_method_rate',
      shippingMethodRateController
    );
  }

  fillFormValues(): void {
    if (this.fbsSettings) {
      const {
        is_rush,
        service_type_zones,
        shipping_method_rate = {},
      } = this.fbsSettings;

      this.srfSmartForm?.patchValue({
        is_rush,
        service_type_zones,
        shipping_method_rate,
      });
      this.is_smart = this.fbsSettings['is_smart'] === 1 ? true : false;
    }
  }

  onClickSubmit(evt: Event): void {
    if (this.srfSmartForm.invalid) {
      this.toastr.error('Invalid Form', 'Error');
      return;
    }

    const payload = this.srfSmartForm.value;
    payload['is_smart'] = this.is_smart;
    const endpoint = apiEnum.srf_smart;
    this.sub.sink = this.http.postToEndpint(endpoint, payload).subscribe(
      (onSuccess) => {
        console.log(onSuccess);
        this.submitted.emit(true);
        this.toastr.success('Settings saved successfully', 'Success');
      },
      (onError) => {
        console.error(onError);
        this.toastr.error(onError.error.message, 'Error');
      }
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
