import { DownloadService } from 'src/app/services/http/download.service';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { SharedModule } from './../common/shared.module';
import { NgModule } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { FiltersModule } from './../../helper/filters/filters.module';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AccountSetupComponent } from './account-setup/account-setup.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { DashbardViewComponent } from './dashbard-view/dashbard-view.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { HighchartsChartModule } from 'highcharts-angular';
import { BubbleChartComponent } from './dashbard-view/bubble-chart/bubble-chart.component';
import { MapChartComponent } from './dashbard-view/map-chart/map-chart.component';
import { StackedChartComponent } from './dashbard-view/stacked-chart/stacked-chart.component';

@NgModule({
  declarations: [
    DashboardComponent,
    AccountSetupComponent,
    WelcomeComponent,
    DashbardViewComponent,
    BubbleChartComponent,
    MapChartComponent,
    StackedChartComponent,
  ],
  imports: [
    DashboardRoutingModule,
    CommonModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatButtonModule,
    FiltersModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatStepperModule,
    MatDialogModule,
    MatTabsModule,
    MatExpansionModule,
    FlexLayoutModule,
    MatMenuModule,
    HighchartsChartModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    ToastrModule.forRoot({
      closeButton: true,
    }),
  ],
  providers: [DownloadService, ToastrService, TitleCasePipe],
})
export class DashboardModule {}
