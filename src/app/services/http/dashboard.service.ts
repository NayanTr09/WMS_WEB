import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from '../auth/auth.service';

interface Orders {
  company_id?: number;
  token?: string;
  is_web?: number;
  from: string;
  to: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  token: string;
  constructor(private httpRequest: HttpClient, private auth: AuthService) {}

  setQueryParam(obj): HttpParams {
    let params = new HttpParams();
    for (const key in obj) {
      if (obj[key]) {
        params = params.set(key, obj[key]);
      }
    }
    return params;
  }

  getOrdersData(params: Orders): Observable<any> {
    params.is_web = 1;
    params.token = this.auth.getToken();
    const qs = this.setQueryParam(params);
    const url = `${environment.dashboard_api_url}/api/getSRFOrdersData`;
    return this.httpRequest.get(url, { params: qs });
  }

  getAvgShippingTAT(params: Orders): Observable<any> {
    params.is_web = 1;
    params.token = this.auth.getToken();
    const qs = this.setQueryParam(params);
    const url = `${environment.dashboard_api_url}/api/getSRFShippingTAT`;
    return this.httpRequest.get(url, { params: qs });
  }

  getStateWiseData(params: Orders): Observable<any> {
    params.is_web = 1;
    params.token = this.auth.getToken();
    const qs = this.setQueryParam(params);
    const url = `${environment.dashboard_api_url}/api/getSRFStateWiseOrder`;
    return this.httpRequest.get(url, { params: qs });
  }

  getWarehouseWiseData(params: Orders): Observable<any> {
    params.is_web = 1;
    params.token = this.auth.getToken();
    const qs = this.setQueryParam(params);
    const url = `${environment.dashboard_api_url}/api/getSRFWarehouseWiseData?`;
    return this.httpRequest.get(url, { params: qs });
  }

  getSrfInventoryData(params: Orders): Observable<any> {
    params.is_web = 1;
    params.company_id = this.auth.getUserData().company_id;
    const headers = new HttpHeaders().set(
      'Authorization',
      // `Bearer ${this.auth.getWMSToken()}`
      `Bearer ${this.auth.getWMSVendorToken()}`
    );
    const qs = this.setQueryParam(params);
    const url = `${environment.warehouseApiUrl}srf-inventory-barchart`;
    return this.httpRequest.get(url, { params: qs, headers });
  }
}
