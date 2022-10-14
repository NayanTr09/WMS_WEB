import { environment } from './../../../environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { EventEmitter, Injectable, SkipSelf } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  isWeb = 1;

  constructor(private httpRequest: HttpClient) {}

  getInvoice(): void {}

  getLabel(data: { shipment_id: number[]; is_web?: number }): Observable<any> {
    data.is_web = this.isWeb;
    const url = `${environment.apiURL}courier/generate/label`;

    return this.httpRequest.post(url, data);
  }

  public getASNDetails(params) {
    let queryString = '';
    queryString = `warehouse_code=${
      params.warehouse_code ? params.warehouse_code : ''
    }
      &page= ${params.page ? params.page : 1}
      &per_page= ${params.per_page ? params.per_page : 15}
      &date_to= ${params.date_to ? params.date_to : ''}
      &date_from= ${params.date_from ? params.date_from : ''}
      &with_items= ${params.with_items ? params.with_items : 1}
      &asn=${params.asn ? params.asn : ''}
      &status=${params.status ? params.status : ''}
      &is_web=${params.is_web ? params.is_web : 1}`;

    return this.httpRequest.get(
      `${environment.apiURL}warehouse/get-asn-show?${queryString}`
    );
  }

  public getInventoryDetails(params) {
    let queryString: string = '';
    queryString = `warehouse_code=${
      params.warehouse_code ? params.warehouse_code : ''
    }
      &with_items= ${params.with_items ? params.with_items : 1}
      &per_page= ${params.per_page ? params.per_page : 15}
      &page= ${params.page ? params.page : 1}
      &product= ${params.product ? params.product : ''}
      &sku=${params.sku ? params.sku : ''}
      &is_web=${params.is_web ? params.is_web : 1}`;

    return this.httpRequest.get(
      `${environment.apiURL}warehouse/get-inventories?${queryString}`
    );
  }

  public getFiltersData() {
    return this.httpRequest.get(
      `${environment.apiURL}orders/manifestfilters?web=1`
    );
  }

  public getOrderDetail(orderId) {
    return new Promise((resolve, reject) => {
      this.httpRequest
        .get(`${environment.apiURL}orders/show/${orderId}?web=1`)
        .toPromise()
        .then((response: any) => {
          resolve(response.data);
        })
        .catch((error) => {
          reject({});
        });
    });
  }

  public getOrderActivty(orderId) {
    return new Promise((resolve: any, reject) => {
      this.httpRequest
        .get(`${environment.apiURL}orders/activities/${orderId}?web=1`)
        .toPromise()
        .then((response: any) => {
          resolve(response);
        })
        .catch((error) => {
          reject({});
        });
    });
  }

  public getOrderTracking(shipmentId) {
    //https://smapi.shiprocket.in/v1/courier/track/shipment/93330271?is_web=1
    return new Promise((resolve: any, reject) => {
      this.httpRequest
        .get(`${environment.apiURL}courier/track/shipment/${shipmentId}?web=1`)
        .toPromise()
        .then((response: any) => {
          resolve(response);
        })
        .catch((error) => {
          reject({});
        });
    });
  }

  // public getCountries() {
  //   return new Promise((resolve:any,reject)=>{
  //     this.httpRequest.get(`${environment.apiURL}countries?web=1`)
  //       .toPromise()
  //       .then((response:any)=>{
  //         resolve(response);
  //       }).catch((error)=>{
  //         reject({});
  //       });
  //   });
  // }

  public getCountries() {
    return this.httpRequest.get(`${environment.apiURL}countries?web=1`);
  }

  public getStates(country_code) {
    return new Promise((resolve: any, reject) => {
      this.httpRequest
        .get(`${environment.apiURL}countries/show/${country_code}?is_web=1`)
        .toPromise()
        .then((response: any) => {
          resolve(response);
        })
        .catch((error) => {
          reject({});
        });
    });
  }

  public updateCustomerDetails(data) {
    return this.httpRequest.post(
      `${environment.apiURL}orders/address/update`,
      data
    );
  }

  public verifyOrder(data) {
    return this.httpRequest.post(
      `${environment.apiURL}orders/verify-cod-orders`,
      data
    );
  }

  public cancelOrders(data, url?: string): Observable<any> {
    if (url) {
      return this.httpRequest.post(`${environment.apiURL}${url}`, data);
    }
    return this.httpRequest.post(`${environment.apiURL}orders/cancel`, data);
  }

  public ewayDetails(data) {
    return this.httpRequest.get(
      `${environment.apiURL}shipments/${data.shipment_id}/eway-details?is_web=1`
    );
  }

  public saveEwayDetails(data, shipment_id) {
    return this.httpRequest.post(
      `${environment.apiURL}shipments/${shipment_id}/save-eway-details`,
      data
    );
  }

  sendRequestToEndpoint(data, endpoint: string): Observable<any> {
    return this.httpRequest.post(`${environment.apiURL}${endpoint}`, data);
  }

  requestToEndpoint(endpoint: string): Observable<any> {
    return this.httpRequest.get(`${environment.apiURL}${endpoint}`);
  }

  public kittingList(params) {
    let queryString = '';
    queryString = `warehouse_code=${
      params.warehouse_code ? params.warehouse_code : ''
    }
    &dekit=${params.dekit ? params.dekit : ''}
      &page= ${params.page ? params.page : 1}
      &per_page= ${params.per_page ? params.per_page : 15}
      &date_to= ${params.date_to ? params.date_to : ''}
      &date_from= ${params.date_from ? params.date_from : ''}
      &status=${params.status ? params.status : ''}
      &key=${params.search ? params.search : ''}
      &is_web=${params.is_web ? params.is_web : 1}`;
    return this.httpRequest.get(
      `${environment.apiURL}warehouse/kit?${queryString}`
    );
  }
}
