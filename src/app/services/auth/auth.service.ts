import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  //currentUser = new BehaviorSubject(null);
  api_token = 'srf_token';
  user_data = 'srf_user';
  wms_token = 'srf_wms_token';
  wms_vendor_token = 'vtoken';
  b2b_flag = 'srf_is_b2b_activated';

  private cookieValue: string;
  private loggedIn = new BehaviorSubject<boolean>(false); // {1}

  date: Date;
  all_params: any;
  userData: any;

  constructor(
    private cookieService: CookieService,
    private router: Router,
    private httpRequest: HttpClient
  ) {}

  get isLoggedIn() {
    return this.loggedIn.asObservable(); // {2}
  }

  getRcode() {
    let a = new URLSearchParams(window.location.search);
    return { rcode: a.get('rcode') };
  }

  getParsedCookie(val) {
    return val ? JSON.parse(decodeURIComponent(val)) : {};
  }

  getUTM() {
    let UTM = this.getParsedCookie(this.cookieService.get('UTM'));
    let first_utm = this.getParsedCookie(this.cookieService.get('first_utm'));
    return {
      gclid: first_utm['gclid'],
      utm_source: UTM['utm_source'],
      utm_campaign: UTM['utm_campaign'],
      utm_content: UTM['utm_content'],
      utm_medium: UTM['utm_medium'],
      utm_term: UTM['utm_term'],
      referrer: first_utm['referrer'],
      landing_page: first_utm['pathname'],
      first_utm: first_utm,
    };
  }

  setFirstUtm() {
    this.date = new Date();

    let domain =
      '.' + environment.apiURL.split('.').splice(-2).join('.').split('/')[0];
    this.date.setDate(this.date.getDate() + 30);
    this.all_params = window.location.search;
    if (!this.cookieService.get('first_utm')) {
      if (this.cookieService.get('UTM')) {
        let first_utm = this.cookieService.get('UTM');
        this.cookieService.set('first_utm', first_utm, {
          expires: this.date,
          path: '/',
          domain: domain,
          secure: true,
          sameSite: 'Strict',
        });
      }
    }
  }

  mergeAllParams(authProvider) {
    let rcode = this.getRcode();
    let utm = this.getUTM();
    let auth = { auth: authProvider };

    let newParam = JSON.stringify(Object.assign(rcode, utm, auth));

    return window.btoa(unescape(encodeURIComponent(newParam)));
  }

  fbConfig = {
    endPoint: 'https://www.facebook.com/v9.0/dialog/oauth?',
    params: {
      client_id: environment.fbAuth.appID,
      response_type: 'code',
      scope: ['email'],
      redirect_uri: window.location.origin + environment.fbAuth.redirect_uri,
      state: this.mergeAllParams('facebook'),
    },
  };

  googleConfig = {
    endPoint: 'https://accounts.google.com/o/oauth2/v2/auth?',
    params: {
      client_id: environment.googleAuth.ClientID,
      response_type: 'code',
      scope: 'email profile',
      include_granted_scopes: 'true',
      redirect_uri:
        window.location.origin + environment.googleAuth.redirect_uri,
      state: this.mergeAllParams('google'),
    },
  };

  fbLogin() {
    var qeryString = '';
    for (var p in this.fbConfig.params) {
      qeryString += p + '=' + this.fbConfig.params[p] + '&';
    }

    window.location.href = this.fbConfig.endPoint + qeryString;
  }

  googleAuth() {
    var qeryString = '';
    for (var p in this.googleConfig.params) {
      qeryString += p + '=' + this.googleConfig.params[p] + '&';
    }

    window.location.href = this.googleConfig.endPoint + qeryString;
  }
  setToken(data, wms_token?: any) {
    if (data) {
      if (wms_token) {
        //localStorage.setItem(this.wms_token, JSON.stringify(wms_token.access_token));
        this.setWMSToken(wms_token);
      }

      localStorage.setItem(this.api_token, JSON.stringify(data.token));
      this.loggedIn.next(true);
    }
  }

  setB2bFlag(b2b_flag) {
    localStorage.setItem(this.b2b_flag, b2b_flag);
  }

  getB2bFlag() {
    if (localStorage.getItem(this.b2b_flag) === 'false') {
      return false;
    } else {
      return true;
    }
  }

  setWMSToken(wms_token) {
    localStorage.removeItem(this.wms_token);
    // localStorage.setItem(
    //   this.wms_token,
    //   JSON.stringify(wms_token.access_token)
    // );

    localStorage.setItem(
      this.wms_vendor_token,
      JSON.stringify(wms_token.vtoken)
    );
  }

  setUserData(data) {
    if (data) {
      localStorage.setItem(this.user_data, JSON.stringify(data));
    }
  }

  getToken() {
    let getAPIToken = localStorage.getItem(this.api_token);
    if (getAPIToken && getAPIToken != 'undefined') {
      this.loggedIn.next(true);
      return JSON.parse(getAPIToken);
    } else {
      //this.logout();
      return false;
    }
  }

  // getWMSToken() {
  //   let getAPIToken = localStorage.getItem(this.wms_token);
  //   if (getAPIToken && getAPIToken != 'undefined') {
  //     //this.loggedIn.next(true);
  //     return JSON.parse(getAPIToken);
  //   } else {
  //     this.logout();
  //     return '';
  //   }
  // }

  getWMSVendorToken() {
    let getAPIToken = localStorage.getItem(this.wms_vendor_token);
    if (getAPIToken && getAPIToken != 'undefined') {
      //this.loggedIn.next(true);
      return JSON.parse(getAPIToken);
    } else {
      this.logout();
      return '';
    }
  }

  getUserData() {
    let getUserData = localStorage.getItem(this.user_data);
    if (getUserData) {
      return JSON.parse(getUserData);
    } else {
      return false;
    }
  }

  getUserEmail() {
    let getUserData = localStorage.getItem(this.user_data);
    if (getUserData) {
      const user_info = JSON.parse(getUserData);
      return user_info.email;
    } else {
      return;
    }
  }

  logout() {
    let getAPIToken = localStorage.getItem(this.api_token);
    let getVToken = localStorage.getItem(this.wms_vendor_token);
    
    if (getVToken && getVToken != 'undefined'){
      var v_token = JSON.parse(getVToken);
      let wmsHeaders = new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${v_token}`,
      });

      this.httpRequest.post(
        environment.warehouseApiUrl + 'auth/expire/vendor_token', {},
        {
          headers: wmsHeaders,
          params: new HttpParams(),
          withCredentials: false,
          responseType: 'text',
        }
      ).subscribe(()=>{},(error)=>{console.error(error);
      });
    }
    
    if (getAPIToken && getAPIToken != 'undefined') {
      var token = JSON.parse(getAPIToken);
      let multichannelHeaders = new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      });

      this.httpRequest.post(
        environment.apiURL + 'auth/logout', {},
        {
          headers: multichannelHeaders,
          params: new HttpParams(),
          withCredentials: false,
          responseType: 'text',
        }
      ).subscribe(()=>{},(error)=>{console.error(error);
      });
    }

    this.clearLocalStorage();
  }

  clearLocalStorage() {
    this.loggedIn.next(false);
    this.cookieService.deleteAll();
    localStorage.removeItem(this.api_token);
    localStorage.removeItem(this.user_data);
    localStorage.removeItem(this.wms_token);
    localStorage.removeItem(this.wms_vendor_token);
    localStorage.removeItem(this.b2b_flag);
    this.router.navigate(['/login']);
  }
}
