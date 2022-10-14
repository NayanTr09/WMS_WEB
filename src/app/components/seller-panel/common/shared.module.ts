import { DownloadDirective } from './download/download.directive';
import { NoDataFoundComponent } from './no-data-found/no-data-found.component';
import { MyLoaderComponent } from './../../../my-loader/my-loader.component';
import { NgModule } from '@angular/core';
import { StatusBarComponent } from './status-bar/status-bar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DownloadPopupComponent } from './download-popup/download-popup.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
  ],
  declarations: [
    MyLoaderComponent,
    NoDataFoundComponent,
    StatusBarComponent,
    DownloadDirective,
    DownloadPopupComponent,
  ],
  exports: [
    MyLoaderComponent,
    NoDataFoundComponent,
    StatusBarComponent,
    DownloadDirective,
    DownloadPopupComponent,

    // modules
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
  ],
})
export class SharedModule {}
