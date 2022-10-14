import { SharedModule } from './../common/shared.module';
import { FiltersModule } from './../../helper/filters/filters.module';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DownloadService } from './../../../services/http/download.service';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ReportsComponent, QueryParams } from './reports.component';
import { AuthService } from './../../../services/auth/auth.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';

import { ReportsService } from './../../../services/http/reports.service';

import { ReportsRoutingModule } from './reports-routing.module';

import { MatTabsModule } from '@angular/material/tabs';
import { NgModule } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
//import { FileUploadComponent } from 'src/app/components/seller-panel/common/file-upload/file-upload.component';
//import { DownloadDirective } from '../common/download/download.directive';
import { MatStepperModule } from '@angular/material/stepper';
import { ToastrService, ToastrModule } from 'ngx-toastr';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [ReportsComponent],
  imports: [
    CommonModule,
    ReportsRoutingModule,
    SharedModule,
    MatTableModule,
    CommonModule,
    MatFormFieldModule,
    MatTabsModule,
    MatTableModule,
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
    MatTooltipModule,
    SharedModule,

    ToastrModule.forRoot({
      //toastClass: 'toast toast-bootstrap-compatibility-fix',
      //positionClass: 'top-center',
      //timeOut: 1000,
      closeButton: true,
    }),
  ],
  exports: [MatTabsModule, MatPaginatorModule],
  providers: [
    AuthService,
    ReportsService,
    QueryParams,
    DownloadService,
    ToastrService,
  ],
})
export class ReportsModule {}
