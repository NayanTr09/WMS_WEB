// loader-interceptor.service.ts
import { Injectable } from '@angular/core';
import {
  HttpResponse,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoaderService } from '../services/loader.service';
import { EndpointFCS } from '../services/http/fcs.service';

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {
  private requests: HttpRequest<any>[] = [];

  constructor(private loaderService: LoaderService) {}

  removeRequest(req: HttpRequest<any>) {
    const i = this.requests.indexOf(req);
    if (i >= 0) {
      this.requests.splice(i, 1);
    }
    this.loaderService.isLoading.next(this.requests.length > 0);
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const endptsToExclude = [
      EndpointFCS.autosave_post.toString(),
      EndpointFCS.search_products.toString(),
      EndpointFCS.stock_transfer_autosave_get.toString(),
      EndpointFCS.stock_transfer_autosave_post.toString(),
      EndpointFCS.asnBarcodeDownloadRetry.toString(),
      EndpointFCS.checkBulkUploadStatus.toString(),
      '.svg',
    ];

    const found = endptsToExclude.filter((endpt) => req.url.includes(endpt));
    if (found.length === 0) {
      this.loaderService.isLoading.next(true);
    }

    this.requests.push(req);

    return Observable.create((observer) => {
      const subscription = next.handle(req).subscribe(
        (event) => {
          if (event instanceof HttpResponse) {
            this.removeRequest(req);
            observer.next(event);
          }
        },
        (err) => {
          //alert('error' + err);
          this.removeRequest(req);
          observer.error(err);
        },
        () => {
          this.removeRequest(req);
          observer.complete();
        }
      );

      // remove request from queue when cancelled
      return () => {
        this.removeRequest(req);
        subscription.unsubscribe();
      };
    });
  }
}
