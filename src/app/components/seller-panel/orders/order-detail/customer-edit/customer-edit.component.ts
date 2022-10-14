// import { UploadASNDialog } from './../../../fcs/asn-upload/upload-asn-dialog.component';
import { OrdersService } from './../../../../../services/http/orders.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
} from '@angular/forms';
import { Component, OnInit, Inject } from '@angular/core';

@Component({
  selector: 'app-customer-edit',
  templateUrl: './customer-edit.component.html',
  styleUrls: ['./customer-edit.component.scss'],
})
export class CustomerEditComponent implements OnInit {
  updateCustomerForm: FormGroup;
  customerData: any;
  countries: any;
  states: any;

  constructor(
    public fb: FormBuilder,
    public dialogRef: MatDialogRef<CustomerEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public orderService: OrdersService
  ) {
    // console.log(this.customerData);
    this.customerData = data.customerData;
    this.orderService.getCountries().subscribe((data: any) => {
      this.countries = data.data;
      //this.updateCustomerForm.controls['country'].patchValue(this.customerData.country_code);
      this.updateCustomerForm.controls['country'].patchValue(
        this.customerData.country_code
      );
      this.getStates(this.customerData.country_code);
      this.updateCustomerForm.controls['state'].patchValue(
        this.customerData.state_code
      );

      if (this.customerData.status_code === 3) {
        this.updateCustomerForm.controls.country.disable();
        this.updateCustomerForm.controls.state.disable();
      }
    });
  }

  getStates(country_code) {
    this.orderService.getStates(country_code).then((data: any) => {
      this.states = data.data;
    });
  }

  ngOnInit(): void {
    console.log('this.data :>> ', this.data);
    this.updateCustomerForm = this.fb.group({
      fullname: new FormControl(this.customerData.fullname, [
        Validators.required,
        Validators.maxLength(120),
      ]),
      address1: new FormControl(this.customerData.address1, [
        Validators.required,
      ]),
      address2: new FormControl(this.customerData.address2),
      country: new FormControl('', [Validators.required]),
      postcode: new FormControl(this.customerData.pincode, [
        Validators.required,
        Validators.pattern('^[0-9]*$'),
        Validators.minLength(6),
        Validators.maxLength(6),
      ]),
      state: new FormControl('', [Validators.required]),
      city: new FormControl(this.customerData.city, [Validators.required]),
      email: new FormControl(this.customerData.email, [
        Validators.required,
        Validators.email,
      ]),
      phone: new FormControl(this.customerData.phone, [Validators.required]),
      alternate_phone: new FormControl(''),
      company_name: new FormControl(this.customerData.company_name, [
        Validators.required,
      ]),
    });

    if (this.customerData.status_code === 3) {
      this.updateCustomerForm.get('company_name').clearValidators();
    }

    if (this.customerData.status_code === 3) {
      const keysToExclude = ['address1', 'address2'];
      Object.keys(this.updateCustomerForm.value).forEach((key) => {
        if (!keysToExclude.includes(key)) {
          this.updateCustomerForm.get(key).disable();
        }
      });
    }
  }

  getCountryData(country_code) {
    return this.countries.filter((data) => {
      if (data.id == country_code) return data;
    });
  }

  getStateData(state_code) {
    return this.states.filter((data) => {
      if (data.id == state_code) return data;
    });
  }

  updateDetails() {
    if (this.updateCustomerForm.invalid) {
      return;
    } else {
      let country_data = this.getCountryData(
        this.updateCustomerForm.get('country').value
      );
      let state_data = this.getStateData(
        this.updateCustomerForm.get('state').value
      );

      const formData = new FormData();
      formData.append('order_id', this.customerData.order_id);
      formData.append('edit_data', 'true');
      formData.append('is_web', '1');
      formData.append(
        'shipping_address',
        this.updateCustomerForm.get('address1').value
      );
      formData.append(
        'shipping_address_2',
        this.updateCustomerForm.get('address2').value
      );

      // condition for status "NEW"
      if (this.customerData.status_code === 1) {
        formData.append(
          'shipping_customer_name',
          this.updateCustomerForm.get('fullname').value
        );
        formData.append(
          'shipping_phone',
          this.updateCustomerForm.get('phone').value
        );

        formData.append(
          'billing_alternate_phone',
          this.updateCustomerForm.get('alternate_phone').value
        );
        formData.append(
          'company_name',
          this.updateCustomerForm.get('company_name').value
        );
        formData.append(
          'shipping_email',
          this.updateCustomerForm.get('email').value
        );

        formData.append(
          'shipping_city',
          this.updateCustomerForm.get('city').value
        );
        formData.append('shipping_state', state_data[0].name);
        formData.append('shipping_country', country_data[0].name);
        formData.append(
          'shipping_pincode',
          this.updateCustomerForm.get('postcode').value
        );
        formData.append('isd_code', country_data[0].isd_code);
      }

      this.orderService.updateCustomerDetails(formData).subscribe(
        (data) => {
          this.dialogRef.close({ orderId: this.customerData.order_id });
        },
        (err) => console.error(err)
      );
    }

    return false;
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
