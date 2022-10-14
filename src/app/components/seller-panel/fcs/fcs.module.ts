import { StockTransferListComponent } from './stock-transfer/stock-transfer-list.component';
import { StockTransferDetailsComponent } from './stock-transfer/stock-transfer-details/stock-transfer-details.component';
import { StockTransferProductsFormComponent } from './stock-transfer/stock-transfer-products-form/stock-transfer-products-form.component';
import { StockTransferFormComponent } from './stock-transfer/shipping-form/stock-transfer-form.component';
import { AsnCreateComponent } from './asn-create/asn-create.component';
import { SharedModule } from './../common/shared.module';
import { FiltersModule } from './../../helper/filters/filters.module';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DownloadService } from './../../../services/http/download.service';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ASNListComponent } from './asn-list.component';
import { InventoryListComponent } from './inventory-list.component';
import { AuthService } from './../../../services/auth/auth.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';
import { FcsService } from './../../../services/http/fcs.service';
import { FcsRoutingModule } from './fcs-routing.module';
import { FcsComponent, QueryParams } from './fcs.component';
import { MatTabsModule } from '@angular/material/tabs';
import { NgModule } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
// import { UploadASNDialog } from './asn-upload/upload-asn-dialog.component';
import { ToastrService, ToastrModule } from 'ngx-toastr';
import { MatTooltipModule } from '@angular/material/tooltip';
// import { ProductsModule } from '../products/products.module';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { StatusBarComponent } from './asn-create/status-bar/status-bar.component';
import { ShippingFormComponent } from './asn-create/shipping-form/shipping-form.component';
import { AddProductsFormComponent } from './asn-create/add-products-form/add-products-form.component';
import { SelectBarcodesFormComponent } from './asn-create/select-barcodes-form/select-barcodes-form.component';
import { BoxConfigurationFormComponent } from './asn-create/box-configuration-form/box-configuration-form.component';
import { AsnDetailsFormComponent } from './asn-create/asn-details-form/asn-details-form.component';
import { StockTransferCreateComponent } from './stock-transfer/stock-transfer-create.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AsnSlotsComponent } from './asn-create/asn-slots/asn-slots.component';
import { AsnCalendarComponent } from './asn-create/asn-slots/asn-calendar/asn-calendar.component';
import { AsnRescheduleComponent } from './asn-create/asn-reschedule/asn-reschedule.component';
import { BadStockComponent } from './bad-stock/bad-stock.component';

@NgModule({
  declarations: [
    FcsComponent,
    ASNListComponent,
    AsnCreateComponent,
    InventoryListComponent,
    StockTransferListComponent,
    // UploadASNDialog,
    //FileUploadComponent,
    // UploadASNDialog,
    StatusBarComponent,
    ShippingFormComponent,
    AddProductsFormComponent,
    SelectBarcodesFormComponent,
    BoxConfigurationFormComponent,
    AsnDetailsFormComponent,

    StockTransferCreateComponent,
    StockTransferFormComponent,
    StockTransferProductsFormComponent,
    StockTransferDetailsComponent,
    AsnSlotsComponent,
    AsnCalendarComponent,
    AsnRescheduleComponent,
    BadStockComponent,
    //DownloadDirective
  ],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatTabsModule,
    MatTableModule,
    FcsRoutingModule,
    MatPaginatorModule,
    FormsModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatMenuModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatStepperModule,
    MatAutocompleteModule,
    FiltersModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatRadioModule,
    SharedModule,
    MatProgressBarModule,

    // ProductsModule,
    ToastrModule.forRoot({
      closeButton: true,
    }),
  ],
  exports: [],

  providers: [
    AuthService,
    FcsService,
    QueryParams,
    DownloadService,
    ToastrService,
  ],
})
export class FcsModule {}
