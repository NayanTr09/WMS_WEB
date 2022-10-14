import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UtmService {
  constructor(
    private cookieService: CookieService,
    private route: ActivatedRoute
  ) {}
  //this.cookieService.set( 'Test', 'Hello World' );

  setFirstUtm() {
    let date = new Date();
    date.setDate(date.getDate() + 30);
    let all_params = this.route.snapshot.queryParamMap;
    let domain =
      '.' + environment.apiURL.split('.').splice(-2).join('.').split('/')[0];

    if (!this.cookieService.get('first_utm') && !('recharge' in all_params)) {
      if (this.cookieService.get('UTM')) {
        let first_utm = this.cookieService.get('UTM');
        this.cookieService.set('first_utm', first_utm, {
          expires: date,
          path: '/',
          domain: domain,
          secure: true,
          sameSite: 'Strict',
        });
      }
    }
  }

  setUTM() {
    let utm = {};
    let all_params = this.route.snapshot.queryParamMap['params'];
    let keysForUtm = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
      'gclid',
      'referrer',
      'pathname',
    ];
    let date = new Date();

    date.setDate(date.getDate() + 30);
    let domain =
      '.' + environment.apiURL.split('.').splice(-2).join('.').split('/')[0];
    //let domain = "localhost";

    this.setFirstUtm();
    if (
      all_params['utm_source'] ||
      all_params['utm_medium'] ||
      all_params['utm_campaign'] ||
      all_params['utm_content'] ||
      all_params['utm_term']
    ) {
      for (let key of keysForUtm) {
        if (
          all_params[key] != null &&
          all_params[key] != 'null' &&
          all_params[key]
        ) {
          utm[key] = all_params[key];
        } else if (
          (key == 'referrer' || key == 'pathname') &&
          document.referrer.indexOf('https://www.shiprocket.in') == -1
        ) {
          utm[key] =
            key == 'referrer' ? document.referrer : window.location.pathname;
        }
      }
      //utm = JSON.stringify(utm);

      //document.cookie =  "UTM=;expires=Thu, 01 Jan 1970 00:00:00 GMT; domain="+domain;
      if (!('recharge' in all_params)) {
        this.cookieService.set('UTM', JSON.stringify(utm), {
          expires: date,
          path: '/',
          domain: domain,
          secure: true,
          sameSite: 'Strict',
        });
      }
      this.setFirstUtm(); //Set utm if first utm null and utm not exists before
    } else if (!this.cookieService.get('UTM')) {
      //if utm not exists in queryparam and cookie then set referrer and pathname
      utm['referrer'] = document.referrer;
      utm['pathname'] = window.location.pathname;
      //utm = JSON.stringify(utm);
      document.cookie =
        'UTM=;expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=' + domain;
      if (!('recharge' in all_params)) {
        this.cookieService.set('UTM', JSON.stringify(utm), {
          expires: date,
          path: '/',
          domain: domain,
          secure: true,
          sameSite: 'Strict',
        });
      }
      this.setFirstUtm();
    }
  }
}
