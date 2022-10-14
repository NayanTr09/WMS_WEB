import { ToastrModule, ToastrService } from 'ngx-toastr';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { SharedModule } from './../common/shared.module';
import { OrdersService } from './../../../services/http/orders.service';
import { FiltersModule } from './../../helper/filters/filters.module';
//import { QueryParams } from './../orders/orders.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrdersRoutingModule } from './orders-routing.module';
import { OrdersComponent } from './orders.component';
import { AllOrdersComponent } from './allorders/allorders.component';

import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { ActiveordersComponent } from './activeorders/activeorders.component';
import { OnholdordersComponent } from './onholdorders/onholdorders.component';
import { BackordersComponent } from './backorders/backorders.component';
import { CompletedordersComponent } from './completedorders/completedorders.component';
import { NoDataFoundComponent } from '../common/no-data-found/no-data-found.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { OrderDetailComponent } from './order-detail/order-detail.component';
import { CustomerEditComponent } from './order-detail/customer-edit/customer-edit.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
// import {  MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DownloadService } from './../../../services/http/download.service';

@NgModule({
  declarations: [
    OrdersComponent,
    AllOrdersComponent,
    ActiveordersComponent,
    OnholdordersComponent,
    BackordersComponent,
    CompletedordersComponent,
    //NoDataFoundComponent,
    OrderDetailComponent,
    CustomerEditComponent,
  ],
  imports: [
    CommonModule,
    OrdersRoutingModule,
    MatTabsModule,
    MatTableModule,
    FiltersModule,
    MatPaginatorModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatIconModule,
    MatAutocompleteModule,
    MatButtonModule,
    NgbModule,
    ToastrModule.forRoot({
      //toastClass: 'toast toast-bootstrap-compatibility-fix',
      //positionClass: 'top-center',
      //timeOut: 1000,
      closeButton: true,
    }),
  ],

  exports: [MatTabsModule, MatPaginatorModule],
  providers: [
    //AuthService,
    OrdersService,
    DownloadService,
    ToastrService,
  ],
})
export class OrdersModule {}
