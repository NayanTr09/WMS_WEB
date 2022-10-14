import { SidebarComponent } from './common/sidebar/sidebar.component';
import { ToolbarComponent } from './common/toolbar/toolbar.component';

//import { DashboardComponent } from './dashboard/dashboard.component';
//import { DashboardModule } from './dashboard/dashboard.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SellerPanelRoutingModule } from './seller-panel-routing.module';
import { SellerPanelComponent } from './seller-panel.component';

import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { FlexLayoutModule } from '@angular/flex-layout';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { MatIconModule } from '@angular/material/icon';
//import { DownloadComponent } from './common/download/download.component';
//import { DownloadDirective } from './common/download.directive';

@NgModule({
  declarations: [SellerPanelComponent, SidebarComponent, ToolbarComponent],
  imports: [
    CommonModule,
    SellerPanelRoutingModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatButtonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatMenuModule,
    MatCardModule,
    MatProgressBarModule,
    MatStepperModule,
    MatDialogModule,
    MatExpansionModule,
    MatSnackBarModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MatListModule,
    MatIconModule,
    ToastrModule.forRoot({
      closeButton: true,
    }),
  ],
  providers: [],
  exports: [],
})
export class SellerPanelModule {}
