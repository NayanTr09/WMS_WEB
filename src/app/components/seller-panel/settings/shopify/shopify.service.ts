import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import {
  apiEnum,
  IAppStatus,
  IAvailableStyle,
  IStyles,
  SCOPE,
} from './shopify.model';
import { HttpService } from '../../../../services/http/http.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShopifyService {
  basePath: string;
  clientId: string;
  redirectUri: string;
  scope = SCOPE;
  appStatus: IAppStatus;
  availableStyle: IAvailableStyle;

  constructor(private request: HttpService) {
    this.clientId =
      environment['shopifyClient'] || 'adc69ce50829691168009210f575c6fe';

    this.basePath =
      environment['shopifyBaseUrl'] || 'https://rush-api.shiprocket.in/';

    this.redirectUri = `${this.basePath}${apiEnum.callback}`;
  }

  fetchStoreList(): Observable<any> {
    return this.request.requestToEndpoint(apiEnum.storeUrlList);
  }

  checkAppInstalled(store: string): Observable<IAppStatus> {
    const endpoint = `${this.basePath}${apiEnum.appInstalled}/${store}`;
    return this.request.requestByUrl(endpoint);
  }

  fetchStyles(store: string): Observable<any> {
    const endpoint = `${this.basePath}${apiEnum.getStyle}/${store}`;
    return this.request.requestByUrl(endpoint);
  }

  updateStyles(body: IStyles): Observable<any> {
    const endpoint = `${this.basePath}${apiEnum.updateStyle}`;
    return this.request.postByUrl(endpoint, body);
  }

  fetchPreviewLink(store: string): Observable<any> {
    const endpoint = `${this.basePath}${apiEnum.showPreview}/${store}`;
    return this.request.requestByUrl(endpoint);
  }

  integrateSnippet(store: string): Observable<any> {
    const endpoint = `${this.basePath}${apiEnum.productPage}/${store}`;
    return this.request.requestByUrl(endpoint);
  }

  removeSnippet(store: string): Observable<any> {
    const endpoint = `${this.basePath}${apiEnum.removeSnippet}/${store}`;
    return this.request.requestByUrl(endpoint);
  }

  addSnippetToCart(store: string): Observable<any> {
    const endpoint = `${this.basePath}${apiEnum.addSnippetCart}/${store}`;
    return this.request.requestByUrl(endpoint);
  }

  removeSnippetFromCart(store: string): Observable<any> {
    const endpoint = `${this.basePath}${apiEnum.removeSnippetCart}/${store}`;
    return this.request.requestByUrl(endpoint);
  }

  getHostname(url: string): string {
    const hostname = new URL(url)?.hostname;
    return hostname;
  }
}
