import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { AuthService } from 'src/app/services/auth/auth.service';
import { HttpService } from 'src/app/services/http/http.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent implements OnInit {
  welcomeStep = 0;
  displayError: any = {};
  monthlyOrders = '';
  businessCategory = '';
  PrimarySolution :any = {};
  servicesOption='';
  Service='';
  City='';
  warehouse: any = {};
  gstArray: any = {};
  gstErrors: any = {};
  noWarehouseSelected = false;
  showLoader = false;
  warehouseList: Array<object> = [];
  // orderRange: Array<object> = [
  //   { value: 'Less than 500', name: 'Less than 500' },
  //   { value: '500 - 3000', name: '500 - 3000' },
  //   { value: '3000-10000', name: '3000-10000' },
  //   { value: '10000+', name: '10000+' },
  // ];
  orderRange: Array<object> = [
    { value: 'Less than 50', name: 'Less than 50' },
    { value: '50 - 200', name: '50 - 200' },
    { value: '200 - 1000', name: '200 - 1000' },
    { value: '1000 - 5000', name: '1000 - 5000' },
    { value: 'Above 5000', name: 'Above 5000' },
  ];

  businessCategories: Array<object> = [
    { value: 'Health & Beauty', name: 'Health & Beauty' },
    { value: 'Fashion Accessories', name: 'Fashion Accessories' },
    { value: 'Footwear', name: 'Footwear' },
    { value: 'Electronics', name: 'Electronics' },
    { value: 'Others', name: 'Others' },
  ];

  PrimarySolutions: Array<object> = [
    { value: 'Next Day Or Same Day Delivery', name: 'Next Day Or Same Day Delivery' },
    { value: 'Reduction In Weight Discrepancies', name: 'Reduction In Weight Discrepancies' },
    { value: 'Lowering Operational Costs', name: 'Lowering Operational Costs' },
    { value: 'Managing, Storage And Packaging Of Your Orders', name: 'Managing, Storage And Packaging Of Your Orders' },
  ];



  Services: Array<object> = [
    { value: 'Warehousing And Order Processing Services', name: 'Warehousing And Order Processing Services' },
    { value: 'Only Shipping', name: 'Only Shipping' },
    { value: 'Both', name: 'Both' },
    { value: 'I am only exploring', name: 'I am only exploring' },
  ];

  servicesOptionArr: Array<object> = [
    { value: 'Yes', name: 'Yes' },
    { value: 'No', name: 'No' },
  ];

  Cities: Array<object> = [
    { value: 'Delhi/NCR', name: 'Delhi/NCR' },
    { value: 'Kolkata', name: 'Kolkata' },
    { value: 'Mumbai', name: 'Mumbai' },
    { value: 'Bengaluru', name: 'Bengaluru' },
    { value: 'Other', name: 'Other' },
  ];

  constructor(
    private request: HttpService,
    public welcomeDialog: MatDialogRef<WelcomeComponent>,
    private auth: AuthService,
    @Inject(MAT_DIALOG_DATA) public dialogdata: { animal: string }
  ) {}

  closeWelcome(): void {
    const data = {
      company_id: this.auth.getUserData().company_id,
      auth: true,
      token: this.dialogdata['token'],
    };

    if (this.welcomeStep === 2) {
      data['monthlyOrder'] = this.monthlyOrders;
    } else if (this.welcomeStep === 3) {
      data['businessCategory'] = this.businessCategory;
    }
    this.showLoader = true;
    this.request.postwms('signup-data', data).subscribe(
      () => {
        this.showLoader = false;
        const token = this.auth.getUserData().token;
        window.location.href =
          environment.multichannelUrl + 'login?token=' + token;
      },
      (errors) => {
        this.showLoader = false;
      }
    );
  }

  ngOnInit(): void {
    //this.getWarehouses();
  }

  getWarehouses() {
    this.request.getWithParams('warehouse/get-warehouse', {}).subscribe(
      (data) => {
        this.warehouseList = data['data'];
      },
      (errors) => {}
    );
  }

  welcomeStepper() {
    this.displayError = [];

    if (!this.monthlyOrders) {
      this.displayError[0] = true;
      return;
    }

    if (!this.businessCategory) {
      this.displayError[1] = true;
      return;
    }

    if (this.PrimarySolution.length == undefined) {
      this.displayError[2] = true;
      return;
    }
    
    if (this.servicesOption) {
      if(this.servicesOption=='Yes'){
        this.Service='';
        this.City='';
      }
    }

    if(!(this.Service =='Warehousing And Order Processing Services' || this.Service == 'Both')){
      this.City='';
    }

    // if (!Object.keys(this.warehouse).length) {
    //   this.displayError[2] = true;
    //   return;
    // }

    const data = {
      company_id: this.auth.getUserData().company_id,
      monthlyOrder: this.monthlyOrders,
      businessCategory: this.businessCategory,
      primarySolution: this.PrimarySolution,
      servicesOption: this.servicesOption,
      service: this.Service,
      city:this.City,
      auth: true,
      token: this.dialogdata['token'],
    };

    // data['selected_warehouse'] = Object.keys(this.warehouse).map((key) => ({
    //   id: key,
    // }));
    this.showLoader = true;

    this.request.postwms('signup-data', data).subscribe(
      () => {
        this.showLoader = false;
        window.location.href = '/';
      },
      (errors) => {
        this.showLoader = false;
      }
    );
  }
}
