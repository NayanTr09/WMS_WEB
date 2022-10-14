import {
  Component,
  OnInit,
  ViewChild,
  TemplateRef,
  Inject,
  OnDestroy,
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
  FormArray,
} from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { MatDialog } from '@angular/material/dialog';
import { HttpService } from 'src/app/services/http/http.service';
import { environment } from 'src/environments/environment';
import { ToastrService } from 'ngx-toastr';
import { requiredFileType } from 'src/app/components/seller-panel/common/file-upload/file-upload.component';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth/auth.service';
import * as moment from 'moment';
import { WelcomeComponent } from '../welcome/welcome.component';
import { SubSink } from 'subsink';
import { uniqBy } from 'src/app/components/Utils/utils';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-account-setup',
  templateUrl: './account-setup.component.html',
  styleUrls: ['./account-setup.component.scss'],
})
export class AccountSetupComponent implements OnInit, OnDestroy {
  @ViewChild('dialogRef') dialogRef: TemplateRef<any>;
  @ViewChild('dialogChannel') dialogChannel: TemplateRef<any>;
  @ViewChild('dialogSession') dialogSession: TemplateRef<any>;
  @ViewChild('setupDone') setupDone: TemplateRef<any>;
  @ViewChild('uploadProductDialog') uploadProductDialog: TemplateRef<any>;
  @ViewChild('stepper') stepper: MatStepper;
  private subs = new SubSink();

  toggleWarehouses = [];
  warehouseList: Array<Object> = [];
  modelWarehouse: Object = {};
  selectedWarehouseList: Array<Object> = [];
  tempToken: string = '';
  showLoader: boolean = false;
  channelData: Object = {};
  stateList: Array<Object> = [];
  productsDataCount: number = 0;
  uploadedProductData: Object = {};
  modelChannel: Object = {};
  accountSetupDone = true;
  istokenRegenerated: any = null;
  sellerAccountSetupForm: FormGroup;

  constructor(
    public toastr: ToastrService,
    private request: HttpService,
    private auth: AuthService,
    private formBuilder: FormBuilder,
    public modal: MatDialog,
    private cookieService: CookieService
  ) {}

  ngOnInit(): void {
    // Form Group Init
    this.sellerAccountSetupForm = this.formBuilder.group({
      company_details: this.formBuilder.group({
        name: new FormControl('', [
          Validators.required,
          Validators.minLength(2),
        ]),
        gstn: new FormControl('', [
          Validators.required,
          Validators.minLength(15),
          Validators.maxLength(15),
          Validators.pattern(
            '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
          ),
        ]),
        address1: new FormControl('', [Validators.required]),
        address2: new FormControl(''),
        pincode: new FormControl('', [
          Validators.required,
          Validators.pattern('^[0-9]*$'),
          Validators.minLength(6),
          Validators.maxLength(6),
        ]),
        state: new FormControl('', [Validators.required]),
        logo: new FormControl('', [requiredFileType(['png', 'jpg', 'jpeg'])]),
        logo_url: new FormControl('', []),
      }),
      dynamicWarehouses: this.formBuilder.group({
        warehouseArray: this.formBuilder.array([], [Validators.required]),
      }),
      masterCatalog: this.formBuilder.group({
        upload_product: new FormControl('', [
          Validators.required,
          requiredFileType(['csv']),
        ]),
      }),
    });

    // Get Available warehouse list from api and store in warehouseList
    this.getWarehouses();

    // Check if user is still loggedin to multichannel app
    // if true get default wms login token else logout from panel
    this.getWmsToken();

    // Prefill values if exists
    this.prefillCompanyDetails();
    this.prefillWarehouseArrayFromLocalStoreage();

    this.subs.sink = this.sellerAccountSetupForm.controls[
      'company_details'
    ].valueChanges.subscribe(
      (changes) => {
        localStorage.setItem('company_details', JSON.stringify(changes));
      },
      (err) => console.error(err)
    );

    this.subscribeWarehouseArray();
  }

  prefillWarehouseArrayFromLocalStoreage() {
    try {
      const rawWarehouseArray = localStorage.getItem('warehouseArray');
      const warehouseArrayList = JSON.parse(rawWarehouseArray) ?? [];
      this.prefillWarehouseArray(warehouseArrayList);
    } catch (error) {
      console.log('>> ', error);
    }
  }

  prefillWarehouseArray(warehouseArrayList) {
    try {
      warehouseArrayList.forEach((warehouse, idx) => {
        const warehouseExist = this.warehouseList.find(
          (wh) => wh['warehouse_code'] === warehouse.id
        );

        if (warehouseExist) {
          this.selectedWarehouseList.push(warehouseExist);
          this.addWarehouseToForm(warehouse);
          this.warehouseArray.controls[idx]
            .get('place_of_business')
            .clearValidators();
        }
      });
    } catch (error) {
      console.log('>> ', error);
    }
  }

  subscribeWarehouseArray() {
    this.subs.sink = this.warehouseArray.valueChanges.subscribe((changes) => {
      const updatedChanges = uniqBy(changes, 'id');
      localStorage.setItem('warehouseArray', JSON.stringify(updatedChanges));
    });
  }

  prefillCompanyDetails() {
    try {
      const rawCompanyDetails = localStorage.getItem('company_details');
      const companyDetails = JSON.parse(rawCompanyDetails) ?? {};
      this.sellerAccountSetupForm.controls['company_details'].patchValue(
        companyDetails
      );
    } catch (error) {
      console.log('>> ', error);
    }
  }

  get warehouseArray(): FormArray {
    return this.sellerAccountSetupForm
      .get('dynamicWarehouses')
      .get('warehouseArray') as FormArray;
  }

  getWarehouses() {
    this.request.getWithParams('warehouse/get-warehouse', {}).subscribe(
      (data) => {
        this.warehouseList = data['data'];
      },
      (errors) => {}
    );
  }

  toggleWaerhouse(index) {
    if (
      this.sellerAccountSetupForm.controls.dynamicWarehouses['controls'][
        'warehouseArray'
      ]['controls'][index].invalid
    ) {
      this.toggleWarehouses[index] = false;
      this.toastr.warning('Please fill all warehouse details', 'Warning');
    } else if (
      !this.sellerAccountSetupForm.controls.dynamicWarehouses['controls'][
        'warehouseArray'
      ]['controls'][index].invalid &&
      !this.toggleWarehouses[index]
    ) {
      this.toggleWarehouses[index] = true;
    } else {
      this.toggleWarehouses[index] = !this.toggleWarehouses[index];
    }
  }

  removeWarehouse(index) {
    if (this.selectedWarehouseList.length) {
      this.selectedWarehouseList.splice(index, 1);
      let row = this.sellerAccountSetupForm.controls.dynamicWarehouses[
        'controls'
      ].warehouseArray;
      row.removeAt(index);
    }
  }

  getWmsToken() {
    let params = {
      company_id: this.auth.getUserData().company_id,
    };

    this.request.getwms('account-setup', {}, params).subscribe(
      (data: any) => {
        this.showLoader = false;

        const {
          is_complete,
          account_data,
          srf_signup_data,
          first_login,
        } = data;
        if (is_complete) {
          this.everythingDone();
        } else {
          this.accountSetupDone = false;
        }

        if (!first_login) {
          this.wmsFirstLoginEvent();
        }

        if (data && account_data && account_data.company_details) {
          const {
            company_logo,
            company_name,
            company_gst,
            company_address1,
            company_address2,
            company_pincode,
            company_state,
            b2b_plan_activated,
          } = account_data.company_details;

          this.sellerAccountSetupForm.controls.company_details.patchValue({
            name: company_name,
            gstn: company_gst,
            address1: company_address1,
            address2: company_address2,
            pincode: company_pincode,
            state: company_state,
            logo: '',
            logo_url: company_logo,
          });

          if (company_logo) {
            this.companyDetailsControl.get('logo').clearValidators();
          }

          this.auth.setB2bFlag(b2b_plan_activated);
          this.stepper.selectedIndex = 1;

          if (data && srf_signup_data && srf_signup_data.selected_warehouse) {
            let selected_warehouses = this.parseSelectedWarehouse(
              srf_signup_data.selected_warehouse
            );

            this.prefillWarehouseArray(selected_warehouses);
          }
        }

        if (this.stepper.selectedIndex == 1) {
          this.minimizeWarehouse();
        }

        if (data['popup']) {
          this.openDialog();
        }
      },
      (error: HttpErrorResponse) => {
        let diff = 0;
        let flag = false;
        if (this.istokenRegenerated == null) {
          flag = true;
        } else {
          diff = moment(new Date()).diff(this.istokenRegenerated, 'minutes');
          if (diff >= 5) {
            flag = true;
          }
        }

        if (
          error.status === 400 &&
          error.error.error &&
          error.error.error == 'Unauthenticated.' &&
          flag
        ) {
          this.reGenerateWmsToken();
        }
        this.showLoader = false;
      }
    );

    this.request.getWithParams('countries/show/99', {}).subscribe(
      (data) => {
        this.stateList = data['data'];
      },
      (errors) => {
        this.showLoader = false;
      }
    );
  }

  wmsFirstLoginEvent() {
    let body = {
      company_id: this.auth.getUserData().company_id,
      utm_source: this.cookieService.get('UTM')
        ? JSON.parse(this.cookieService.get('UTM')).utm_source
        : '',
      utm_campaign: this.cookieService.get('UTM')
        ? JSON.parse(this.cookieService.get('UTM')).utm_campaign
        : '',
      utm_content: this.cookieService.get('UTM')
        ? JSON.parse(this.cookieService.get('UTM')).utm_content
        : '',
      utm_medium: this.cookieService.get('UTM')
        ? JSON.parse(this.cookieService.get('UTM')).utm_medium
        : '',
      utm_term: this.cookieService.get('UTM')
        ? JSON.parse(this.cookieService.get('UTM')).utm_term
        : '',
      first_utm: this.cookieService.get('first_utm')
        ? JSON.parse(this.cookieService.get('first_utm'))
        : '',
    };

    this.request.postwms('event/first-login', body).subscribe(
      (data) => {},
      (error) => {}
    );
  }

  parseSelectedWarehouse(warehouses): any[] {
    try {
      return JSON.parse(warehouses);
    } catch (error) {
      return [];
    }
  }

  minimizeWarehouse() {
    let len = this.selectedWarehouseList.length;
    for (let i = 0; i < len; i++) {
      if (
        !this.sellerAccountSetupForm.controls.dynamicWarehouses['controls'][
          'warehouseArray'
        ]['controls'][i].invalid
      )
        this.toggleWarehouses[i] = true;
    }
  }

  // Open Dialog for first time landing welcome modal
  openDialog() {
    const welcomeDialog = this.modal.open(WelcomeComponent, {
      panelClass: 'welcome-modal',
      backdropClass: 'backdrop-container',
      disableClose: true,
      closeOnNavigation: false,
      data: {
        token: this.tempToken,
      },
    });
  }

  addWarehouseToForm(warehouse): void {
    const warehouseArray = this.dynamicWarehousesControl.get(
      'warehouseArray'
    ) as FormArray;
    warehouseArray.push(this.createDynamicWarehouseForm(warehouse));
  }

  // Select warehouse event on submit of warehouse modal (add warehouse)
  selectWarehouse(warehouse): void {
    if (!this.modelWarehouse) {
      this.toastr.error('No warehouse selected');
      return;
    }

    // warehouse already present
    if (this.selectedWarehouseList.includes(this.modelWarehouse)) {
      const message = 'Warehouse Already Added';
      const type = 'Warning';
      this.toastr.warning(message, type);
      return;
    }

    // warehouse Not Present then add
    const warehouseDetails = { id: warehouse.warehouse_code };
    this.selectedWarehouseList.push(this.modelWarehouse);
    this.addWarehouseToForm(warehouseDetails);
    const message = 'Fulfillment Center Added';
    const type = 'Success';
    this.toastr.success(message, type);
    this.modal.closeAll();
  }

  createDynamicWarehouseForm(warehouse) {
    // console.log('warehouse :>> ', warehouse);
    const {
      id,
      company_gst,
      state_gst,
      place_of_business,
      pb_url,
      filename,
    } = warehouse;
    if (!id) {
      this.toastr.error('Warehouse id missing');
      return;
    }

    return this.formBuilder.group({
      id: new FormControl(id),
      company_gst: new FormControl(company_gst ?? '', [
        Validators.required,
        Validators.minLength(15),
        Validators.maxLength(15),
        Validators.pattern(
          '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
        ),
      ]),
      state_gst: new FormControl(state_gst ?? '', [
        Validators.required,
        Validators.minLength(15),
        Validators.maxLength(15),
        Validators.pattern(
          '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
        ),
      ]),
      place_of_business: new FormControl(place_of_business ?? '', [
        Validators.required,
        requiredFileType(['pdf']),
      ]),
      filename: new FormControl(filename ?? ''),
      pb_url: new FormControl(pb_url ?? '', [Validators.required]),
    });
  }

  removeLogo(): void {
    this.sellerAccountSetupForm.controls.company_details.patchValue({
      logo_url: '',
    });
  }

  uploadLogo(event) {
    if (
      this.sellerAccountSetupForm.controls.company_details['controls'].logo
        .valid
    ) {
      const formData = new FormData();
      formData.append(
        'logo',
        this.sellerAccountSetupForm.controls.company_details.get('logo').value
      );

      this.showLoader = true;

      this.request.post('settings/logo', formData).subscribe(
        (data) => {
          this.showLoader = false;

          this.sellerAccountSetupForm.controls.company_details.patchValue({
            logo_url: data['logo_url'] ? data['logo_url'] : '',
          });

          this.toastr.success('File Uploaded Successfully', 'Success');
        },
        (errors) => {
          this.showLoader = false;
          this.toastr.error(errors.error.message, 'Error');
        }
      );
    }
  }

  uploadBusinessPlace(index) {
    let control = this.sellerAccountSetupForm.controls.dynamicWarehouses[
      'controls'
    ]['warehouseArray']['controls'][index] as FormControl;
    if (control.get('place_of_business').valid) {
      const formData = new FormData();
      const file = control.get('place_of_business').value;
      control.patchValue({ filename: file.name });
      console.log('control :>> ', control);
      formData.append('file', file);

      this.showLoader = true;

      this.request.postwms('uploadDocument', formData).subscribe(
        (data) => {
          this.showLoader = false;

          this.sellerAccountSetupForm.controls.dynamicWarehouses['controls'][
            'warehouseArray'
          ]['controls'][index].patchValue({
            pb_url: data['url'] ? data['url'] : '',
          });

          this.toastr.success('File Uploaded Successfully', 'Success');
        },
        (errors) => {
          let message = 'Somthing went wrong! Please Try Again';
          if (errors.error.file) {
            message = errors.error.file;
          }
          this.showLoader = false;
          this.toastr.error(message, 'Error');
        }
      );
    }
  }

  downloadSample(url, name) {
    this.showLoader = true;
    this.request.getWithParams(url, {}).subscribe(
      (data) => {
        let csvData = data;
        let blob = new Blob([csvData.toString()], { type: 'text/csv' });
        let link = document.createElement('a');
        if (link.download !== undefined) {
          // feature detection
          // Browsers that support HTML5 download attribute
          let url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', name);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        this.showLoader = false;
      },
      (errors) => {
        let csvData = errors;
        let blob = new Blob([csvData.error.text], { type: 'text/csv' });
        let link = document.createElement('a');
        if (link.download !== undefined) {
          // feature detection
          // Browsers that support HTML5 download attribute
          let url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', name);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        this.showLoader = false;
      }
    );
  }

  jumpToNext() {
    this.stepper.selectedIndex += 1;
    if (this.stepper.selectedIndex === 2) {
      this.next();
    }
  }

  get companyDetailsControl(): FormControl {
    return this.sellerAccountSetupForm.controls.company_details as FormControl;
  }

  get dynamicWarehousesControl(): FormControl {
    return this.sellerAccountSetupForm.controls
      .dynamicWarehouses as FormControl;
  }

  next(): void {
    switch (this.stepper.selectedIndex) {
      case 0:
        this.companyDetailsControl.markAllAsTouched();
        if (this.companyDetailsControl.valid) {
          this.showLoader = true;
          const params = this.companyDetailsControl.value;
          params.auth = true;

          const data = {
            company_details: params,
            is_detail: 'company',
            company_id: this.auth.getUserData().company_id,
          };

          this.request.postwms('save-company-details', data).subscribe(
            () => {
              this.showLoader = false;
              localStorage.removeItem('company_details');

              this.selectedWarehouseList.forEach((warehouse, index) => {
                this.warehouseArray.controls[index].patchValue({
                  company_gst: this.companyDetailsControl.value?.gstn,
                });
              });

              // let selected_warehouses = this.selectedWarehouseList.length;

              // for (let index = 0; index < selected_warehouses; index++) {
              //   this.sellerAccountSetupForm.controls.dynamicWarehouses[
              //     'controls'
              //   ]['warehouseArray']['controls'][index].patchValue({
              //     company_gst: this.sellerAccountSetupForm.controls.company_details.get(
              //       'gstn'
              //     ).value,
              //   });
              // }
              this.jumpToNext();
            },
            (errors) => {
              this.showLoader = false;
              localStorage.removeItem('company_details');
              this.jumpToNext();
            }
          );
        }

        this.minimizeWarehouse();

        break;

      case 1:
        this.dynamicWarehousesControl.markAllAsTouched();
        if (!this.warehouseArray.controls.length) {
          // add error
          this.toastr.error('Need atleast one fulfillment center', 'Error');
          return;
        }

        if (this.warehouseArray.valid) {
          const data = {
            company_id: this.auth.getUserData().company_id,
            selected_warehouse: this.warehouseArray.value,
            auth: true,
          };

          this.request.postwms('signup-data', data).subscribe(
            () => {
              localStorage.removeItem('warehouseArray');
              this.setupComplete();
            },
            (errors) => {
              this.showLoader = false;
            }
          );
          // this.jumpToNext();
        }
        break;

      // case 2:
      //   this.request
      //     .getWithParams(
      //       'products?page=1&per_page=1&sort_by=&sort=DESC&filter=&filter_by=status',
      //       {}
      //     )
      //     .subscribe(
      //       (data: any) => {
      //         if (data.meta && data.meta.pagination) {
      //           this.productsDataCount = data.meta.pagination.total;
      //         }

      //         if (data.data.length) {
      //           this.sellerAccountSetupForm.controls.masterCatalog
      //             .get('upload_product')
      //             .clearValidators();
      //           this.sellerAccountSetupForm.controls.masterCatalog
      //             .get('upload_product')
      //             .updateValueAndValidity();

      //           if (
      //             this.sellerAccountSetupForm.controls.masterCatalog.invalid
      //           ) {
      //             this.sellerAccountSetupForm.controls.masterCatalog.markAllAsTouched();
      //           } else {
      //             this.setupComplete();
      //           }
      //         } else {
      //           this.toastr.error(
      //             'No product added, Please atleast one product to complete',
      //             'Error'
      //           );
      //         }
      //       },
      //       (errors) => {}
      //     );

      //   break;

      default:
        break;
    }
  }

  downloadReport(): void {
    const link = document.getElementById('downloadErrorLink');
    link.click();
  }

  uploadProducts(evt): void {
    if (this.sellerAccountSetupForm.controls.masterCatalog.invalid) {
      this.sellerAccountSetupForm.controls.masterCatalog.markAllAsTouched();
    } else {
      const formData = new FormData();
      formData.append(
        'file',
        this.sellerAccountSetupForm.value.masterCatalog.upload_product
      );

      this.request.post('products/import', formData).subscribe(
        (importData: any) => {
          this.request
            .getWithParams(`errors/${importData.id}/check`, {})
            .subscribe(
              (data: any) => {
                const { updated, added, errors } = data.data;
                this.productsDataCount = added;
                let errorUrl: string;
                if (errors) {
                  errorUrl = `errors/${importData.id}/download?is_web=1`;
                  evt.target.value = null; // hack
                }
                // this.toastr.success("Uploaded Successfully","Success");
                this.modal.open(this.uploadProductDialog, {
                  disableClose: !!errors,
                  data: {
                    updated,
                    added,
                    errors,
                    error_url: errorUrl,
                  },
                });
              },
              (errors) => console.error(errors)
            );
        },
        (errors) => console.error(errors)
      );
    }
  }

  everythingDone() {
    this.accountSetupDone = true;
    // window.location.href = '/orders/allorders';
  }

  previous() {
    this.stepper.selectedIndex -= 1;
    if (this.stepper.selectedIndex === 1) {
      this.minimizeWarehouse();
    }
  }

  selectFulfillmentDialog(): void {
    this.modal.open(this.dialogRef, { data: this.warehouseList });
  }

  selectChannel(channelId): void {
    if (channelId == 0) {
      let token = this.auth.getUserData().token;

      window.open(
        environment.multichannelUrl + 'channels?token=' + token,
        '_blank'
      );
    }
    let channelLogo = {
      1: 'amazon.png',
      5: 'shopify.png',
      6: 'magento.png',
      7: 'woocommerce.png',
    };

    // Get channel Data
    this.request.getWithParams('channels/create/' + channelId, {}).subscribe(
      (data) => {
        this.channelData = data;
        this.modal.open(this.dialogChannel, {
          panelClass: 'channel-dialog',
          data: {
            channel: channelId,
            channelData: this.channelData,
            channelLogo: channelLogo,
          },
        });
      },
      (errors) => {}
    );
  }
  integrateChannel(channelId, channelData) {
    this.showLoader = true;
    let data = {};
    switch (channelId) {
      case 1:
        data['auth'] = {
          seller_id: this.modelChannel['merchantId'],
          mws_auth_token: this.modelChannel['authToken'],
          marketplace_id: this.modelChannel['marketPlaceId'],
        };
        break;
      case 5:
        data['auth'] = {
          store_url: this.modelChannel['storeUrl'],
          api_key: this.modelChannel['apiKey'],
          api_password: this.modelChannel['apiPassword'],
          shared_secret: this.modelChannel['sharedSecret'],
        };
        break;
      case 6:
        data['auth'] = {
          store_url: this.modelChannel['storeUrl'],
          api_key: this.modelChannel['apiPassword'],
          api_username: this.modelChannel['apiUsername'],
        };
        break;
      default:
    }

    if (channelId == 7) {
      this.request
        .getWithParams(
          'channels/get-redirect-url/7?store_url=' +
            this.modelChannel['storeUrl'],
          {}
        )
        .subscribe(
          (data) => {
            window.open(data['redirect_url'], '_blank');
          },
          (errors) => {}
        );
    } else {
      data['base_channel_code'] = channelData['data']['code'];
      data['name'] = channelData['data']['name'];
      this.request.post('channels', data).subscribe(
        (data) => {},
        (errors) => {}
      );
    }
  }
  setupComplete(): void {
    const formData = new FormData();
    formData.append('company_id', this.auth.getUserData().company_id);

    this.request.postwms('complete-profile', formData).subscribe(
      (data) => {},
      (error) => {}
    );

    if (!this.accountSetupDone) {
      this.accountSetupDone = true;
      this.modal.open(this.setupDone, {
        panelClass: 'modal-setup-done',
        disableClose: true,
      });
    }
  }
  sessionExpired(): void {
    this.modal.open(this.dialogSession, { panelClass: 'modal-session' });
  }

  // In future remove this function from here and place at one common place and after
  // finished this subscribe call another function appropriately.
  reGenerateWmsToken() {
    let wmsParams = {
      email: environment.wmsLogin.userId,
      password: environment.wmsLogin.password,
      auth: false,
    };

    this.request.postwms('auth/login', {}, wmsParams).subscribe(
      (wmsData: any) => {
        this.auth.setWMSToken(wmsData);
        this.istokenRegenerated = moment(new Date());
        this.getWmsToken();
      },
      (err) => {}
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
