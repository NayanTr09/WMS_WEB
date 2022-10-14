import { Component, OnInit, Input } from '@angular/core';

import { FormGroup, FormControl, Validators  } from '@angular/forms';

import { AuthService } from '../../../services/auth/auth.service';
import { HttpService } from '../../../services/http/http.service';

import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';

import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-phone-otp',
  templateUrl: './phone-otp.component.html',
  styleUrls: ['./phone-otp.component.scss']
})
export class PhoneOtpComponent implements OnInit {

	otpForm : FormGroup;
  phoneForm : FormGroup;	

  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'top';


  @Input() viewVerifyPhone:boolean;
  @Input() viewVerifyOTP:boolean
  showLoader: boolean = false;
  @Input() registeredData: any;
  @Input() userName: string;

  registerAPIError: any = {};

  constructor(private request: HttpService,private auth: AuthService,private snackBar: MatSnackBar) { }

  ngOnInit(): void {
  	this.otpForm = new FormGroup({
  	  otp : new FormControl('',[Validators.required])
  	});

  	this.phoneForm = new FormGroup({
  	  phone : new FormControl('',[Validators.required])
  	});
  }

  verifyPhone(){
    if(this.phoneForm.valid){
      this.showLoader = true;
      let params = {
        mobile : this.phoneForm.controls.phone.value,
        token: this.auth.getToken()
      }
      this.request.post('auth/'+this.registeredData.id+"/otp/send", params).subscribe(
        data => {
          this.showLoader = false;
          
          this.viewVerifyOTP = true;
          this.viewVerifyPhone = false;
          //this.router.navigate(['']);
        },
        errors => {
         
         this.snackBar.open(errors.error.errors.mobile, 'X', {
          duration: 2000,
          horizontalPosition: this.horizontalPosition,
          verticalPosition: this.verticalPosition,
        });
         this.registerAPIError = errors.error.errors;
         this.phoneForm.get('phone').setErrors({ apiError: this.registerAPIError['mobile']});
         
          this.showLoader = false;
        });
    }
  }

  verifyOTP(){    

    
      this.showLoader = true;
      let params = {
        otp : this.otpForm.controls.otp.value,
        token: this.auth.getToken()
      }
      this.request.post('users/'+this.registeredData.id+"/confirm/otp", params).subscribe(
        data => {

          
          window.location.href = environment.multichannelUrl+"login?token="+data['token'];
           this.showLoader = false;

        },errors =>{
          

          if(errors.error.errors){
            this.otpForm.get("otp").setErrors({invalidNumber:errors.error.errors.mobile});
          }
           this.showLoader = false;
          
        });
    
    
    
  }

}
