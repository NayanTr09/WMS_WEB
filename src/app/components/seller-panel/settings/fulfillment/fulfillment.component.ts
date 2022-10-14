import { Component, OnDestroy, OnInit } from '@angular/core';
import { SettingsService } from 'src/app/services/http/settings.service';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { GoogleAnalyticsService } from 'src/app/services/http/google-analytics.service';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';

interface Zone {
  name: string;
  value: number;
  selected: boolean;
}

interface Dimensions {
  id: string;
  option: string;
}

export interface IFbsSettings {
  is_blackbox?: 0 | 1;
  zones?: number[];
  is_rush?: 0 | 1;
  shipping_method_rate?: {
    express: number;
    standard: number;
    rush?: number;
  };
  service_type_zones?: object;
}

export interface IShippingMethod {
  standard: number;
  express: number;
}

@Component({
  selector: 'app-fulfillment',
  templateUrl: './fulfillment.component.html',
  styleUrls: ['./fulfillment.component.scss'],
})
export class FulfillmentComponent implements OnInit, OnDestroy {
  private sink = new Subscription();
  wrapperConfigForm: FormGroup;
  IAUrlForm: FormGroup;
  autoRetry = false;
  panIndiaCheck = false;
  companySettings = {
    allow_cod_verification: false,
    allow_prepaid_verification: false,
    fbs_settings: {},
  };
  barcodeOptions = {};
  barcodeDimensions: Dimensions[];
  barcodeSettings = {
    template_type: '',
    barcode_type: '',
    type: '',
  };
  isTypeDisabled = false;
  isDimensionsDisabled = false;
  fbsSettings: IFbsSettings;
  shippingMethod: IShippingMethod = {
    standard: 81,
    express: 117,
  };
  zoneDump: number[] = [];

  zones: Zone[] = [
    { name: 'North India Zone', value: 1, selected: false },
    { name: 'South India Zone', value: 2, selected: false },
    { name: 'West India Zone', value: 3, selected: false },
    { name: 'East India Zone', value: 4, selected: false },
    { name: 'North East And Special States', value: 5, selected: false },
    { name: 'Central India Zone', value: 6, selected: false },
  ];

  constructor(
    public settingsService: SettingsService,
    private formBuilder: FormBuilder,
    public toastr: ToastrService,
    private auth: AuthService,
    public ga: GoogleAnalyticsService
  ) {}

  ngOnInit(): void {
    this.wrapperConfigForm = this.formBuilder.group({
      url: new FormControl('', [Validators.required]),
      h_key: new FormControl(''),
      h_val: new FormControl(''),
      retry_wrapper_api: new FormControl(''),
    });

    this.IAUrlForm = this.formBuilder.group({
      key: [''],
      url: ['', [Validators.required]],
      configuration: this.formBuilder.group({
        authKey: [''],
        authValue: [''],
      }),
    });

    this.barcodeDimensions = [];
    this.fetchCompanySettings();
    this.fetchBarcodeSettings();
    this.fetchWebhookSettings();
  }

  fetchWebhookSettings() {
    const qp = {
      seller_id: this.auth.getUserData().company_id,
    };

    this.sink.add(
      this.settingsService
        .getInventoryAdjustmentConfig(qp)
        .subscribe((resp) => {
          if (resp) {
            this.IAUrlForm.patchValue(resp[0]);
          }
        }, console.error)
    );
  }

  fetchCompanySettings(): void {
    this.sink.add(
      this.settingsService.getCompanySettings().subscribe(
        (data: any) => {
          const { data: d } = data;
          this.companySettings = d;
          const { zones: selectedZones = [] } = d.fbs_settings;
          this.zoneDump = selectedZones;
          this.fbsSettings = d.fbs_settings;
          this.shippingMethod = d?.shipping_method ?? this.shippingMethod;

          this.updateZones(selectedZones);
          this.togglePanIndia();
        },
        (err: any) => {
          //console.log('Err:>> ', err);
        }
      )
    );
  }

  updateZones(selectedZones: number[]): void {
    this.zones.map((zone) => {
      zone.selected = selectedZones.includes(zone.value);
    });
  }

  onSrfSmartSubmit(isSubmitted: boolean): void {
    if (isSubmitted) {
      this.fetchCompanySettings();
    }
  }

  togglePanIndia(): void {
    this.panIndiaCheck = !this.zones.map((z) => z.selected).includes(false);
  }

  submitBarcodeSettings(): void {
    this.ga.emitEvent(
      'SRF',
      'Click on Save Barcode Settings ',
      'Barcode Settings'
    );
    this.sink.add(
      this.settingsService.postBarcodeSettings(this.barcodeSettings).subscribe(
        (onSuccess: any) => {
          this.toastr.success(onSuccess.message);
        },
        (onErr) => {
          try {
            const message = JSON.parse(onErr.error.message);
            const key = Object.keys(message);
            this.toastr.error(message[key[0]]);
          } catch (e) {
            //this.toastr.error("Something went wrong!");
            this.toastr.error(onErr.error.message);
          }
        }
      )
    );
  }

  submitIAConfig(evt: Event): void {
    evt.preventDefault();
    this.ga.emitEvent(
      'SRF',
      'Click on Inventory Adjustment Configration ',
      'Inventory Adjustment URL'
    );
    if (this.IAUrlForm.invalid) {
      return;
    }

    const payload = this.IAUrlForm.value;
    payload['key'] = payload['key'] || 'vendor.webhooks.inventory-updated';
    payload['seller_id'] = this.auth.getUserData().company_id;

    this.sink.add(
      this.settingsService.putInventoryAdjustmentConfig(payload).subscribe(
        () => {
          this.toastr.success('Updated successfully');
        },
        (err) => {
          console.error(err);
          const errObj = err?.error?.errors;
          this.toastr.error(Object.values(errObj).toString(), 'Error', {
            enableHtml: true,
          });
        }
      )
    );
  }

  submitWrapperConfig(e): void {
    this.ga.emitEvent(
      'SRF',
      'Click on Save Wrapper Configration ',
      'Configure Wrapper URL'
    );
    e.preventDefault();
    if (!this.wrapperConfigForm.valid) {
      // handle error
      return;
    }

    const payload = this.wrapperConfigForm.value;
    payload['retry_wrapper_api'] = this.autoRetry;
    if (this.autoRetry) {
      this.ga.emitEvent(
        'Fulfillment',
        'Clicked on toggle Auto Retry Orders',
        ''
      );
    }

    this.sink.add(
      this.settingsService.updateWrapperConfigration(payload).subscribe(
        (onSuccess: any) => {
          this.toastr.success(onSuccess.message);
          alert();
        },
        (onErr) => {
          this.toastr.error(onErr.error);
        }
      )
    );
  }

  fetchBarcodeSettings(): void {
    this.sink.add(
      this.settingsService.getBarcodeSettings().subscribe(
        (onSuccess: any) => {
          const {
            wrapper_settings: wrapperSettngs,
            barcode_settings: barcodeOpts,
            selected,
          } = onSuccess;
          this.wrapperConfigForm.patchValue(wrapperSettngs);
          this.barcodeOptions = barcodeOpts;

          //{template_type: "2", barcode_type: "1", type: "40", is_web: 1}
          this.barcodeSettings.template_type = selected.id.template_type;
          this.barcodeSettings.barcode_type = selected.id.barcode_type;
          this.barcodeSettings.type = selected.id.barcode_settings?.toString();
          //if(this.barcodeSettings.template_type && this.barcodeSettings.barcode_type) {
          this.getOptions(false);
          //}
        },
        (onErr) => console.error('onErr: ', onErr)
      )
    );
  }

  sumitCompanySettings(): void {
    // prepare fbs_settings/zones array
    this.companySettings.fbs_settings = {
      ...this.fbsSettings,
      zones: this.zones.filter((z) => z.selected).map((zone) => zone.value),
    };

    if (this.companySettings.allow_cod_verification) {
      this.ga.emitEvent('Fulfillment', 'Clicked on Verify COD Orders', '');
    }
    if (this.companySettings.allow_prepaid_verification) {
      this.ga.emitEvent('Fulfillment', 'Clicked on Verify Prepaid Orders', '');
    }
    this.zones.forEach((elem) => {
      if (elem.selected) {
        this.ga.emitEvent('Fulfillment', 'Clicked on ' + elem.name, '');
      }
    });
    this.ga.emitEvent('SRF', 'Click on Save Regions ', 'Region Selector');

    this.sink.add(
      this.settingsService.postCompanySettings(this.companySettings).subscribe(
        (onSuccess: any) => {
          this.toastr.success(onSuccess.message);
          this.zoneDump = this.companySettings.fbs_settings['zones'];
        },
        (onErr) => {
          this.toastr.error(onErr.error);
          this.updateZones(this.zoneDump);
        }
      )
    );
  }

  changePanIndia(e): void {
    const status = e.target.checked;
    this.panIndiaCheck = status;
    this.zones.forEach((zone) => {
      zone.selected = status;
    });
  }

  updateBarcodeSize({ value }): void {
    if (+value === 3) {
      this.isTypeDisabled = true;
      this.isDimensionsDisabled = true;
    } else {
      this.isTypeDisabled = false;
      this.isDimensionsDisabled = false;
    }

    this.barcodeSettings.barcode_type = '';
    this.barcodeDimensions = [];
    this.getOptions(true);
  }

  getOptions(change: boolean): any[] {
    if (change) {
      this.barcodeSettings.type = '';
    }
    const { template_type, barcode_type } = this.barcodeSettings;

    if (template_type && template_type != '3' && barcode_type) {
      //return this.barcodeOptions[template_type][barcode_type];
      this.barcodeDimensions = this.barcodeOptions[template_type][barcode_type];
    }
    return [];
  }

  ngOnDestroy(): void {
    this.sink.unsubscribe();
  }
}
