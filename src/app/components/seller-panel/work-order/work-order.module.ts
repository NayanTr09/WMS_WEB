import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from './../common/shared.module';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { FiltersModule } from './../../helper/filters/filters.module';
import { WorkOrderRoutingModule } from './work-order-routing.module';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { OrdersService } from './../../../services/http/orders.service';
import { MatPaginatorModule } from '@angular/material/paginator';
import { WorkOrderComponent } from './work-order.component';
import { KittingComponent } from './kitting/kitting.component';
import { DeKittingComponent } from './de-kitting/de-kitting.component';
import { RemovalRequestComponent } from './removal-request/removal-request.component';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CreateKitComponent } from './create-kit/create-kit.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { RemovalComponent } from './removal/removal.component';

@NgModule({
  declarations: [
    WorkOrderComponent,
    KittingComponent,
    DeKittingComponent,
    RemovalRequestComponent,
    CreateKitComponent,
    RemovalComponent,
  ],
  imports: [
    CommonModule,
    WorkOrderRoutingModule,
    SharedModule,
    MatTabsModule,
    MatTableModule,
    MatCheckboxModule,
    FiltersModule,
    MatPaginatorModule,
    MatIconModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatMenuModule,
    MatInputModule,
    MatAutocompleteModule,
    ToastrModule.forRoot({
      closeButton: true,
    }),
  ],
  exports: [MatTabsModule, MatPaginatorModule],
  providers: [OrdersService, ToastrService],
})
export class WorkOrderModule {}
