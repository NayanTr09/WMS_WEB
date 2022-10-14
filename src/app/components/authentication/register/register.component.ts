import { Component, OnInit } from '@angular/core';

import { FormGroup, FormControl, Validators } from '@angular/forms';

import { HttpService } from '../../../services/http/http.service';

import { CookieService } from 'ngx-cookie-service';

import { AuthService } from '../../../services/auth/auth.service';
import { UtmService } from '../../../services/utm/utm.service';

import { ActivatedRoute, Router } from '@angular/router';

import { environment } from 'src/environments/environment';

import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'top';

  registerUser: FormGroup;
  otpForm: FormGroup;
  phoneForm: FormGroup;

  registerError: any = {};
  registerAPIError: any = {};
  isLoading: boolean = false;
  viewVerifyOTP: boolean = false;
  viewVerifyPhone: boolean = false;
  registeredData: any = {};
  showLoader: boolean = false;
  userName: string = '';

  getToken: any = {};

  optMobileError: string;

  loggedIn: boolean;

  phoneErr: string =
    "Phone no. is not valid. It should start with '9/8/7/6' and should be of length 10.";
  phoneUniqueErr: string =
    'Mobile Number already registered with a Shiprocket account. Please use another number.';

  passwordErr: string =
    '• Must contain both uppercase and\n  lowercase characters' +
    '\n• Minimum 1 number and\n  a special character' +
    '\n• Avoid repeating characters' +
    '\n• Avoid common phrases';

  constructor(
    private utmservice: UtmService,
    private request: HttpService,
    private cookieService: CookieService,
    private snackBar: MatSnackBar,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.utmservice.setUTM();
    const urlRegex = '[.A-Za-z0-9-]+\\.[a-zA-Z0-9]{2,4}';

    this.registerUser = new FormGroup({
      first_name: new FormControl('', [
        Validators.required,
        Validators.pattern('^[a-zA-Z]+$'),
        Validators.minLength(2),
      ]),
      last_name: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.pattern('^[a-zA-Z]+$'),
      ]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(
          '^(?!.*([A-Za-z0-9@$!%*#?&])\\1{2})(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$'
        ),
      ]),
      phone: new FormControl('', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(10),
        Validators.pattern('^[0-9]*$'),
      ]),
      company: new FormControl('', [Validators.pattern(urlRegex)]),
      agree: new FormControl(true),
    });

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

    if (window.history.state.authState) {
      this.viewVerifyPhone = true;
      this.registeredData.id = window.history.state.id;
      this.auth.setToken(window.history.state);
      this.userName = window.history.state.first_name;
    }
  }

  verifyPhone() {
    if (this.phoneForm.valid) {
      this.showLoader = true;
      let params = {
        mobile: this.phoneForm.controls.phone.value,
        token: this.auth.getToken(),
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
            /* this.snackBar.open(errors.error.errors.mobile, 'X', {
          duration: 2000,
          horizontalPosition: this.horizontalPosition,
          verticalPosition: this.verticalPosition,
        });*/
            this.registerAPIError = errors.error.errors;
            this.phoneForm
              .get('phone')
              .setErrors({ apiError: this.registerAPIError['mobile'] });

            this.showLoader = false;
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

            this.wmsLogin(data);
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

  wmsLogin(userData) {
    let wmsParams = {
      email: environment.wmsLogin.userId,
      password: environment.wmsLogin.password,
      auth: false,
    };

    console.log('wms login here....');
    this.request.postwms('auth/login', wmsParams).subscribe((wmsData: any) => {
      this.auth.setWMSToken(wmsData);
      this.auth.setToken(userData);
      this.auth.setUserData(userData);
      this.router.navigate(['']);
    });
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

  signInWithGoogle(): void {
    this.auth.googleAuth();
  }

  signInWithFB(): void {
    this.auth.fbLogin();
  }

  onRegister() {
    if (this.registerUser.valid) {
      let params = {
        company_name: this.registerUser.controls.company.value,
        first_name: this.registerUser.controls.first_name.value,
        last_name: this.registerUser.controls.last_name.value,
        email: this.registerUser.controls.email.value,
        password: this.registerUser.controls.password.value,
        phone: this.registerUser.controls.phone.value,
        from_srf: 1,
        gclid: this.cookieService.get('first_utm')
          ? this.cookieService.get('first_utm')
          : '',
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
        referrer: this.cookieService.get('first_utm')
          ? JSON.parse(this.cookieService.get('first_utm')).referrer
          : '',
        landing_page: this.cookieService.get('first_utm')
          ? JSON.parse(this.cookieService.get('first_utm')).pathname
          : '',
        first_utm: this.cookieService.get('first_utm')
          ? JSON.parse(this.cookieService.get('first_utm'))
          : '',
      };
      this.userName = this.registerUser.controls.first_name.value;
      this.showLoader = true;
      this.request.post('auth/register', params).subscribe(
        (data) => {
          this.showLoader = false;
          this.viewVerifyOTP = true;
          this.registeredData = data;

          let params = { mobile: this.registerUser.controls.phone.value };

          this.auth.setToken(this.registeredData);
          this.request
            .post('auth/' + this.registeredData.id + '/otp/send', params)
            .subscribe(
              (data) => {
                this.viewVerifyOTP = true;
                this.viewVerifyPhone = false;
                this.showLoader = false;
              },
              (errors) => {
                if (errors.error.errors.mobile) {
                  this.viewVerifyPhone = true;
                  this.phoneForm
                    .get('phone')
                    .setErrors({ apiError: errors.error.errors.mobile });
                  this.phoneForm.controls.phone.markAsTouched();
                } else {
                  this.otpForm
                    .get('otp')
                    .setErrors({ invalidNumber: errors.error.errors.message });
                }
              }
            );
        },
        (errors) => {
          this.showLoader = false;

          this.registerAPIError = errors.error.errors;

          for (let key in this.registerAPIError) {
            this.registerUser
              .get(key)
              .setErrors({ apiError: this.registerAPIError[key] });
          }
        }
      );
    }
  }
}
