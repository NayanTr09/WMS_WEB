import { Injectable } from '@angular/core';
import { environment } from './../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

enum EndpointsEnum {
  webhooks = 'settings/webhooks',
}

export interface IAConfig {
  key: string;
  url: string;
  configuration: {
    password: string;
    username: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor(private httpRequest: HttpClient) {}

  getCompanySettings() {
    let qs = `is_web=1`;
    let url = `${environment.apiURL}settings/company-settings?${qs}`;
    return this.httpRequest.get(url);
  }

  postCompanySettings(payload) {
    payload.is_web = 1;
    let url = `${environment.apiURL}settings/company-settings`;

    return this.httpRequest.post(url, payload);
  }

  getBarcodeSettings() {
    let qs = `is_web=1`;
    let url = `${environment.apiURL}warehouse/barcodes-settings?${qs}`;
    return this.httpRequest.get(url);
  }

  postBarcodeSettings(payload) {
    payload.is_web = 1;
    let url = `${environment.apiURL}warehouse/barcodes-settings`;

    return this.httpRequest.post(url, payload);
  }

  updateWrapperConfigration(payload) {
    /* https://medium.com/@armno/creating-a-url-with-httpparams-in-angular-42783205f3f4 */
    payload.is_web = 1;
    let url = `${environment.apiURL}warehouse/wrapper-settings`;

    return this.httpRequest.post(url, payload);
  }

  getInventoryAdjustmentConfig(qp: { seller_id: string }): Observable<any> {
    const url = `${environment.warehouseApiUrl}${EndpointsEnum.webhooks}`;
    const params = new HttpParams({ fromObject: qp });

    return this.httpRequest.get(url, { params });
  }

  putInventoryAdjustmentConfig(body: IAConfig): Observable<any> {
    const url = `${environment.warehouseApiUrl}${EndpointsEnum.webhooks}`;
    return this.httpRequest.put(url, body);
  }
}
