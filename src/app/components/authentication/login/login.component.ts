import { Component, OnInit } from '@angular/core';

import { FormGroup, FormControl, Validators } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../services/auth/auth.service';

import { HttpService } from '../../../services/http/http.service';

import { environment } from 'src/environments/environment';
import { UtmService } from '../../../services/utm/utm.service';

import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'top';
  otpForm: FormGroup;
  phoneForm: FormGroup;
  hide = true;

  constructor(
    private snackBar: MatSnackBar,
    private request: HttpService,
    private auth: AuthService,
    private router: Router,
    private activeRouter: ActivatedRoute,
    private utmservice: UtmService
  ) {}

  loginUser: FormGroup;
  loginError: any = {};

  viewVerifyOTP: boolean = false;
  viewVerifyPhone: boolean = false;
  showLoader: boolean = false;
  token: string = '';
  redirect_page: string = '';

  registeredData: any = {};

  ngOnInit(): void {
    this.utmservice.setUTM();
    this.loginUser = new FormGroup({
      userid: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
      ]),
    });
    this.token = this.activeRouter.snapshot.queryParamMap.get('token');
    this.redirect_page =
      this.activeRouter.snapshot.queryParamMap.get('redirection');

    this.otpForm = new FormGroup({
      otp: new FormControl('', [Validators.required]),
    });

    this.phoneForm = new FormGroup({
      phone: new FormControl('', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(10),
        Validators.pattern('^[0-9]*$'),
      ]),
    });

    if (this.token !== '' && this.token != null) {
      let params = { token: this.token, is_web: 1 };
      //console.log(this.token);
      //http://multichannel.local/v1/auth/login/user?is_web=1&token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjExNSwiaXNzIjoiaHR0cDovL211bHRpY2hhbm5lbC5sb2NhbC92MS9hdXRoL2xvZ2luIiwiaWF0IjoxNjE4MjI3NTA3LCJleHAiOjE2MTkwOTE1MDcsIm5iZiI6MTYxODIyNzUwNywianRpIjoiRUN5MFpVODd4MVVHUUZYcCJ9.Fqir9feYbg9PtHuyUsTCI03J7YoVAxEF-lKULqOEEZk
      this.request.getWithParams('auth/login/user', params).subscribe(
        (data: any) => {
          if (data.token) {
            this.loginWMS(data, this.redirect_page);
          } else {
            //this.toastr.error(onErr.error.message);
            this.snackBar.open('User Not Authorised', 'X', {
              duration: 5000,
              horizontalPosition: this.horizontalPosition,
              verticalPosition: this.verticalPosition,
            });
          }
        },
        (error: any) => {}
      );
    }
  }

  onLogin() {
    this.loginError = {};
    if (this.loginUser.valid) {
      this.showLoader = true;
      let params = {
        email: this.loginUser.controls.userid.value,
        password: this.loginUser.controls.password.value,
      };
      this.request.post('auth/login', params).subscribe(
        (data) => {
          this.showLoader = false;
          //this.auth.setUserData(data);

          if (data['is_crm_user']) {
            this.snackBar.open('User Not Authorised', 'X', {
              duration: 5000,
              horizontalPosition: this.horizontalPosition,
              verticalPosition: this.verticalPosition,
            });
          } else {
            //let wms_data : any;

            this.loginWMS(data);
          }

          //window.location.href = environment.tokenLoginUrl+"?token="+data['token'];
        },
        (errors) => {
          this.showLoader = false;
          if (errors.error.errors) {
            for (let error in errors.error.errors) {
              this.loginUser.controls[error].setErrors({ incorrect: true });
              this.loginUser[error] = errors.error.errors[error];
            }
          } else {
            if (errors.error.otp_confirmed == false) {
              this.registeredData.id = errors.error.id;
              this.token = errors.error.token;
              this.auth.setToken({ token: this.token });
              this.viewVerifyOTP = false;
              this.viewVerifyPhone = true;
              //this.router.navigate(['//'+_this.route.snapshot.params['id'],{mode: 'test'}]);
            }
            this.snackBar.open(errors.error.message, 'X', {
              duration: 5000,
              horizontalPosition: this.horizontalPosition,
              verticalPosition: this.verticalPosition,
            });
          }
        }
      );
    }
  }

  signInWithFB(): void {
    this.auth.fbLogin();
  }

  loginWMS(data, redirection_url = '') {
    let params = {
      token: data.token,
      auth: true,
    };

    this.request.post('warehouse/srf/token', params).subscribe(
      (wmsData: any) => {
        // console.log('DATA WMS');
        // console.log(data);
        // console.log(wmsData);

        this.auth.setToken(data, wmsData);
        this.auth.setUserData(data);
        if (redirection_url) this.router.navigate([redirection_url]);
        else this.router.navigate(['']);
        //this.toastr.success(onSuccess.message);
        //this.auth.setWMSToken(data);
      },
      (onErr) => {
        //this.toastr.error(onErr.error.message);
        this.snackBar.open('Login Failed, Something went wrong!', 'X', {
          duration: 5000,
          horizontalPosition: this.horizontalPosition,
          verticalPosition: this.verticalPosition,
        });
        return;
      }
    );
  }

  signInWithGoogle(): void {
    this.auth.googleAuth();
  }

  verifyPhone() {
    if (this.phoneForm.valid) {
      this.showLoader = true;
      let params = {
        mobile: this.phoneForm.controls.phone.value,
        token: this.token,
      };
      this.request
        .post('auth/' + this.registeredData.id + '/otp/send', params)
        .subscribe(
          (data) => {
            this.showLoader = false;
            this.viewVerifyOTP = true;
            this.viewVerifyPhone = false;
          },
          (errors) => {
            this.showLoader = false;
            if (errors.error.errors) {
              var registerAPIError = errors.error.errors;
              this.phoneForm
                .get('phone')
                .setErrors({ apiError: registerAPIError['mobile'] });
            } else if (errors.error.message) {
              this.snackBar.open(errors.error.message, 'X', {
                duration: 5000,
                horizontalPosition: this.horizontalPosition,
                verticalPosition: this.verticalPosition,
              });
            }
            //this.showLoader = false;
          }
        );
    }
  }

  verifyOTP() {
    if (this.otpForm.valid) {
      this.showLoader = true;
      let params = {
        otp: this.otpForm.controls.otp.value,
        //token: this.auth.getToken()
      };
      this.request
        .post('users/' + this.registeredData.id + '/confirm/otp', params)
        .subscribe(
          (data) => {
            console.log('set token here....');

            this.loginWMS(data);
            //window.location.href = environment.tokenLoginUrl+"?token="+data['token'];

            this.showLoader = false;
          },
          (errors) => {
            this.otpForm
              .get('otp')
              .setErrors({ invalidNumber: errors.error.message });
            this.showLoader = false;
          }
        );
    }
  }

  resendOTP() {
    this.showLoader = true;
    let params = {
      token: this.auth.getToken(),
    };
    this.request
      .getWithParams('auth/' + this.registeredData.id + '/otp/resend', params)
      .subscribe(
        (data) => {
          this.otpForm.get('otp').setErrors(null);
          this.showLoader = false;
          this.snackBar.open('OTP sent successfully', 'X', {
            duration: 3000,
            panelClass: ['snackbar-success'],
            horizontalPosition: this.horizontalPosition,
            verticalPosition: this.verticalPosition,
          });
        },
        (errors) => {
          this.snackBar.open(errors.error.message, 'X', {
            duration: 3000,
            horizontalPosition: this.horizontalPosition,
            verticalPosition: this.verticalPosition,
          });
          this.showLoader = false;
        }
      );
  }
}
