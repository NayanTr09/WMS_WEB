import { MY_DATE_FORMATS } from './../../../my-date-formats';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import {
  MatNativeDateModule,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  DateAdapter,
} from '@angular/material/core';
import { FiltersComponent } from './filters.component';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatChipsModule } from '@angular/material/chips';
import { FileUploadComponent } from 'src/app/components/seller-panel/common/file-upload/file-upload.component';
import { DirectivesModule } from 'src/app/directives/directives.module';

@NgModule({
  declarations: [FiltersComponent, FileUploadComponent],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatTabsModule,
    FormsModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FlexLayoutModule,
    MatChipsModule,
    NgxDaterangepickerMd.forRoot(),
    DirectivesModule,
    //FiltersRoutingModule
  ],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
  ],
  exports: [FiltersComponent, FileUploadComponent],
})
export class FiltersModule {}
