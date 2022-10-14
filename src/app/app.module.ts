import { LoaderInterceptor } from './core/loader-interceptor.service';
//import { MY_DATE_FORMATS } from './my-date-formats';
import { JwtInterceptor } from './core/jwt.interceptor';
import { AuthenticationModule } from './components/authentication/authentication.module';
//import { SellerPanelRoutingModule } from './components/seller-panel/seller-panel-routing.module';
import { SellerPanelModule } from './components/seller-panel/seller-panel.module';
//import { SellerPanelComponent } from './components/seller-panel/seller-panel.component';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoaderService } from './services/loader.service';
import { WindowRef } from 'src/app/app/window-ref';

//import { MAT_DATE_FORMATS } from '@angular/material/core';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    //NgbModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    SellerPanelModule,
    AuthenticationModule,
  ],
  providers: [
    // { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    WindowRef,
    LoaderService,
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
