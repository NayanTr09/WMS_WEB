import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/services/auth/auth.service';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class HttpService {
  public APIURL = environment.apiURL;
  constructor(private httpRequest: HttpClient, private auth: AuthService) {
    //console.log(testing);
  }

  getQueryParam(obj): HttpParams {
    let search = new HttpParams();
    for (let key in obj) {
      search = search.set(key, obj[key]);
    }
    return search;
  }

  getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    let data = this.auth.getToken();

    if (data) {
      headers = headers.set('Authorization', `Bearer ${data}`);
    }
    return headers;
  }

  requestToEndpoint(endpoint: string, params = {}): Observable<any> {
    params = this.getQueryParam(params);
    const url = `${environment.apiURL}${endpoint}`;
    return this.httpRequest.get(url, { params });
  }

  postToEndpint(endpoint: string, params): Observable<any> {
    const url = `${environment.apiURL}${endpoint}`;
    return this.httpRequest.post(url, params);
  }

  deleteRequest(endpoint: string): Observable<any> {
    const url = `${environment.apiURL}${endpoint}`;
    return this.httpRequest.delete(url);
  }

  requestByUrl(url: string, params = {}): Observable<any> {
    params = this.getQueryParam(params);
    return this.httpRequest.get(url, { params });
  }

  postByUrl(url: string, body: any, params = {}): Observable<any> {
    params = this.getQueryParam(params);
    return this.httpRequest.post(url, body, { params });
  }

  getWithParams(URL, body, params?: {}) {
    let paramsData = this.getQueryParam(params);
    let CompleteURL = `${this.APIURL}` + URL;
    return this.httpRequest
      .get(CompleteURL, {
        params: body,
        headers: this.getHeaders(),
        withCredentials: false,
      })
      .pipe();
  }

  post(URL, body, params?: {}) {
    let paramsData = this.getQueryParam(params);

    let CompleteURL = `${this.APIURL}` + URL;

    if (body.auth) {
      let headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${body.token}`,
      });
      delete body.auth;

      return this.httpRequest
        .post(CompleteURL, body, {
          params: paramsData,
          headers: headers,
          withCredentials: false,
        })
        .pipe();
    } else {
      return this.httpRequest
        .post(CompleteURL, body, { params: paramsData })
        .pipe();
    }
  }

  postwms(URL, body, params?: {}) {
    let paramsData = this.getQueryParam(params);
    let CompleteURL = environment.warehouseApiUrl + URL;

    //console.log(CompleteURL);

    if (body.auth) {
      let headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${body.token}`,
      });
      delete body.auth;

      return this.httpRequest
        .post(CompleteURL, body, {
          params: paramsData,
          headers: headers,
          withCredentials: false,
        })
        .pipe();
    } else {
      delete body.auth;
      return this.httpRequest
        .post(CompleteURL, body, { params: paramsData, withCredentials: false })
        .pipe();
    }
  }

  getwms(URL, body, params?: {}) {
    let paramsData = this.getQueryParam(params);
    let CompleteURL = environment.warehouseApiUrl + URL + '?' + paramsData;
    //console.log(paramsData);

    if (body.auth) {
      let headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${body.token}`,
      });

      delete body.token;
      return this.httpRequest
        .get(CompleteURL, { params: body, headers, withCredentials: false })
        .pipe();
    } else {
      delete body.token;
      return this.httpRequest.get(CompleteURL).pipe();
    }
  }
}
