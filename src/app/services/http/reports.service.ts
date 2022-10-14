import { environment } from './../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  constructor(private httpRequest: HttpClient) {}

  public getReportsDetails(params) {
    return this.httpRequest.get(`${environment.apiURL}reports/all`, {
      params: params,
    });
  }
}
