import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators  } from '@angular/forms';
import { HttpService } from '../../../services/http/http.service';
import {ActivatedRoute,Router} from '@angular/router';

import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';

@Component({
  selector: 'app-forgotpassword',
  templateUrl: './forgotpassword.component.html',
  styleUrls: ['./forgotpassword.component.scss']
})
export class ForgotpasswordComponent implements OnInit {

	horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'top';

	forgotform : FormGroup; 
	otpForm : FormGroup;
	passwordResetForm : FormGroup;
	showLoader : Boolean;
	resetStepper:number = 1;

	sentToData:any;

  constructor( private snackBar: MatSnackBar, private request: HttpService, private router : Router) { }

  ngOnInit(): void {
  	this.forgotform = new FormGroup({
  	  mode : new FormControl('',[Validators.required])
  	});

  	this.otpForm = new FormGroup({
  	  otp : new FormControl('',[Validators.required])
  	});

  	this.passwordResetForm = new FormGroup({
  	  newpass : new FormControl('',[Validators.required,Validators.minLength(6),Validators.pattern("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{6,}$")]),
  	  confirm : new FormControl('',[Validators.required,Validators.minLength(6),Validators.pattern("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{6,}$")])


  	})
  }

  forgotpassword(){
  	
  	

  	if(this.forgotform.valid){
  		this.showLoader = true;

  		let params = {
  			data: this.forgotform.controls.mode.value
  		}

  		this.request.post('auth/forgot/password', params).subscribe(
  	  data => {
  	    this.showLoader = false;
  	    this.sentToData = data;
  	    this.resetStepper = 2
  	  },
  	  errors => {
  	    this.showLoader = false;
  	    this.forgotform.get('mode').setErrors({ invalidUser: errors.error.message});
  	  });
  	}
  }

  sendOTP(){
  	if(this.otpForm.valid){
  		this.showLoader = true;
  		let params = {
  			data: this.forgotform.controls.mode.value,
  			otp:this.otpForm.controls.otp.value
  		}

			this.request.post('users/reset/otp/confirm', params).subscribe(
		  data => {
		    this.showLoader = false;
		    
		    this.resetStepper = 3;
		  },
		  errors => {
		    this.showLoader = false;
		    this.otpForm.get('otp').setErrors({ invalidOTP: errors.error.message});
		  });

  	}
  }

  resendOTP(){
		this.showLoader = true;

		let params = {
			data: this.forgotform.controls.mode.value
		}

		this.request.post('auth/forgot/password', params).subscribe(
	  data => {
	    this.showLoader = false;
	  },
	  errors => {
	    this.showLoader = false;
	  });
  }

  resetPassword(){

  	if(this.passwordResetForm.controls.newpass.value === this.passwordResetForm.controls.confirm.value){
  		if(this.passwordResetForm.valid){

  			this.showLoader = true;

  			
  			let params = {
  			    password: this.passwordResetForm.controls.newpass.value,
  			    password_confirm: this.passwordResetForm.controls.confirm.value,
  			    data: this.forgotform.controls.mode.value,
  			    otp: this.otpForm.controls.otp.value
  			};

				this.request.post('users/password/reset', params).subscribe(
			  data => {
			    this.showLoader = false;
			    this.snackBar.open("Password changed successfully", 'X', {
          duration: 5000,
          horizontalPosition: this.horizontalPosition,
          verticalPosition: this.verticalPosition,
        });
			    this.router.navigate(['/login']);
			  },
			  errors => {
			    this.showLoader = false;
			    this.snackBar.open(errors.error.message, 'X', {
          duration: 5000,
          panelClass: ['snackbar-success'],
          horizontalPosition: this.horizontalPosition,
          verticalPosition: this.verticalPosition,
        });
			  });


  		}
  	}
  	else{
  		this.passwordResetForm.get('confirm').setErrors({ confirm:"Confirm password should be same as new password"});
  	}

  	

  }

}
