import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
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

  requestToEndpoint(endpoint: string, params = {}): Observable<any> {
    const qp = this.setQueryParam(params);
    return this.httpRequest.get(`${environment.apiURL}${endpoint}`, {
      params: qp,
    });
  }

  postRequestToEndpoint(data, endpoint: string): Observable<any> {
    return this.httpRequest.post(`${environment.apiURL}${endpoint}`, data);
  }
}
