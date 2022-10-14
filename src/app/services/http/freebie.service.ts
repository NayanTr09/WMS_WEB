import { environment } from './../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class FreebieService {
  constructor(private httpRequest: HttpClient) {}

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
    params = this.setQueryParam(params);
    const url = `${environment.apiURL}${endpoint}`;
    return this.httpRequest.get(url, { params });
  }

  postToEndpint(endpoint: string, params): Observable<any> {
    const url = `${environment.apiURL}${endpoint}`;
    return this.httpRequest.post(url, params);
  }

  public getSearchProduct(params): Observable<any> {
    return this.httpRequest.get(`${environment.apiURL}products/searchProduct`, {
      params,
    });
  }

  public createCondition(params): Observable<any> {
    return this.httpRequest.post(
        `${environment.apiURL}freebie-products/create`,
        params
    );
  }

  public checkValdition(params): Observable<any> {
    return this.httpRequest.post(
      `${environment.apiURL}freebie-products/validate-condition`,
      params
  );
  } 

  
}
