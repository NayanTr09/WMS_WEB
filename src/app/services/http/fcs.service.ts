import { environment } from './../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { encoder } from 'src/app/components/Utils/utils';

export enum EndpointFCS {
  autosave_get = 'warehouse/get-asn-auto-save',
  autosave_post = 'warehouse/asn-auto-save',
  barcode = 'warehouse/asn-generate-barcode',
  courier_list = 'courier/courierList',
  asn_address = 'warehouse/asn-address-detail',
  asn_detail = 'warehouse/asn-detail',
  update_asn = 'warehouse/update-asn-awb',
  shipping_phone = 'settings/update/shipping-phone',
  confirm_otp = 'settings/confirm/otp',
  postcode = 'external/open/postcode/details',
  add_pickup = 'settings/company/addpickup',
  search_products = 'products/searchProduct',
  b2b_enabled = 'warehouse/seller-b2b-enabled',

  stock_transfer_autosave_get = 'stock-transfer/get-auto-save',
  stock_transfer_autosave_post = 'stock-transfer/auto-save',
  stock_transfer_save = 'stock-transfer/save-data',

  asnBarcodeDownloadRetry = 'warehouse/barcode-download-status',
  checkBulkUploadStatus = 'warehouse/get-asn-count',
  availableAsnAppointments = 'warehouse/available-asn-appointments?asn_id=',
  badStockList = 'warehouse/seller-bad-stock',
}

@Injectable({
  providedIn: 'root',
})
export class FcsService {
  is_add_product: boolean;
  constructor(private httpRequest: HttpClient) {}

  setQueryParam(obj): HttpParams {
    let params = new HttpParams({ encoder });
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

  public getASNDetails(params): Observable<any> {
    params = this.setQueryParam(params);
    return this.httpRequest.get(`${environment.apiURL}warehouse/get-asn-show`, {
      params,
    });
  }

  public getInventoryDetails(params): Observable<any> {
    return this.httpRequest.get(
      `${environment.apiURL}warehouse/get-inventories?`,
      { params }
    );
  }
  public getInventoryDetailsUpdate(params): Observable<any> {
    params = this.setQueryParam(params);
    return this.httpRequest.get(
      `${environment.warehouseApiUrl}inventories/all-warehouses?`,
      { params }
    );
  }

  public getInventoryWarehouse(): Observable<any> {
    // param : if <b2b> param is 1 then api will check is b2b enable
    // if yes then it will return wms db warehouses data
    // if no then it will return only shipping address and wms_channel_locations

    return this.httpRequest.get(
      `${environment.apiURL}warehouse/get-shipping-address-list?channel_id=0&is_web=1&b2b=1`
    );
  }

  public getWarehouse(): Observable<any> {
    return this.httpRequest.get(
      `${environment.apiURL}warehouse/get-vendor-warehouses-list?with_warehouse=1&is_web=1`
    );
  }

  public getStockTransferWarehouses(): Observable<any> {
    return this.httpRequest.get(
      `${environment.apiURL}stock-transfer/warehouse-list?is_web=1`
    );
  }

  public getSampleSheet(): Observable<any> {
    return this.httpRequest.get(
      `${environment.apiURL}warehouse/get-dummy-csv?is_web=1`
    );
  }

  public uploadCSV(data: any): Observable<any> {
    return this.httpRequest.post(
      `${environment.apiURL}warehouse/create-product-asn-register`,
      data,
      {}
    );
  }

  public getPickupAddresses(): Observable<any> {
    return this.httpRequest.get(
      `${environment.apiURL}settings/company/pickup?is_web=1`
    );
  }

  public getSearchProduct(params): Observable<any> {
    return this.httpRequest.get(`${environment.apiURL}products/searchProduct`, {
      params,
    });
  }

  public saveManualASN(params): Observable<any> {
    return this.httpRequest.post(
      `${environment.apiURL}warehouse/create-asn`,
      params
    );
  }

  public getSearchKitProduct(params): Observable<any> {
    return this.httpRequest.get(
      `${environment.apiURL}products/search-kit-product`,
      {
        params,
      }
    );
  }

  public getSearchKitItems(params): Observable<any> {
    return this.httpRequest.get(
      `${environment.apiURL}warehouse/search-product`,
      {
        params,
      }
    );
  }

  public getMaxKit(params): Observable<any> {
    return this.httpRequest.post(
      `${environment.apiURL}warehouse/max-kit`,
      params
    );
  }

  public saveManualStockTransfer(params): Observable<any> {
    return this.httpRequest.post(
      `${environment.apiURL}stock-transfer/add-products`,
      params
    );
  }

  public getStockTransferDetails(params): Observable<any> {
    params = this.setQueryParam(params);
    return this.httpRequest.get(`${environment.apiURL}stock-transfer/list`, {
      params,
    });
  }

  public getInventoryDetail(params): Observable<any> {
    return this.httpRequest.get(
      `${environment.apiURL}stock-transfer/get-inventory-detail`,
      {
        params,
      }
    );
  }

  public checkBarcodeComplete(url, params): Observable<any> {
    return this.httpRequest.get(`${environment.apiURL}${url}`, {
      params,
    });
  }
  public checkUploadStatus(url, params): Observable<any> {
    return this.httpRequest.get(`${environment.apiURL}${url}`, {
      params,
    });
  }
  public getAsnAppointments(url): Observable<any> {
    return this.httpRequest.get(`${environment.apiURL}${url}`, {});
  }

  public deleteAsn(params): Observable<any> {
    return this.httpRequest.post(
      `${environment.apiURL}warehouse/seller-delete-asn`,
      params
    );
  }
}
