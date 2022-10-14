import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
//import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
//import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';

import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsComponent } from './settings.component';
import { FulfillmentComponent } from './fulfillment/fulfillment.component';
import { SettingsService } from 'src/app/services/http/settings.service';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { SharedModule } from '../common/shared.module';
import { SrfSmartComponent } from './srf-smart/srf-smart.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ShopifyModule } from './shopify/shopify.module';
import { DirectivesModule } from 'src/app/directives/directives.module';

@NgModule({
  declarations: [SettingsComponent, FulfillmentComponent, SrfSmartComponent],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    //MatSlideToggleModule,
    MatTooltipModule,
    ReactiveFormsModule,
    SettingsRoutingModule,
    SharedModule,
    ShopifyModule,
    ToastrModule.forRoot({
      closeButton: true,
    }),
    DirectivesModule,
  ],
  exports: [],
  providers: [SettingsService, ToastrService],
})
export class SettingsModule {}
