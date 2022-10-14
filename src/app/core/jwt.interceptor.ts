import { catchError, tap } from 'rxjs/operators';
import { Injectable, SkipSelf } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

//import { AuthenticationService } from '@app/_services';
import { AuthService } from 'src/app/services/auth/auth.service';
import { environment } from 'src/environments/environment';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  //console.log('wokring interceptor 123');

  constructor(private authenticationService: AuthService) {
    //console.log('wokring interceptor ');
  }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // add authorization header with jwt token if available
    let isWMSUrl = request.url.indexOf(environment.warehouseApiUrl);
    let token = '';

    if (isWMSUrl == 0) {
      //token = this.authenticationService.getWMSToken();
      token = this.authenticationService.getWMSVendorToken();
    } else {
      token = this.authenticationService.getToken();
    }

    let beforeLoginApi = ['otp/send'];
    let isBeforeLoginAPI = false;
    beforeLoginApi.forEach((data) => {
      if (request.url.indexOf(data) !== -1) {
        isBeforeLoginAPI = true;
      }
    });

    //console.log(this.authenticationService.getUserData());

    if (
      token &&
      (isBeforeLoginAPI || this.authenticationService.getUserData())
    ) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(request).pipe(
      catchError((error) => {
        if (
          error instanceof HttpErrorResponse &&
          !request.url.includes('auth/login') &&
          error.status === 401 &&
          error.error.message == 'Token has expired'
        ) {
          this.authenticationService.logout();
        }
        return throwError(error);
      })
    );
  }
}
