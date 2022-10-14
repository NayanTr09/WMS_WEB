import { NgModule } from '@angular/core';
import { AddWidgetPdpComponent } from './add-widget-pdp/add-widget-pdp.component';
import { AddWidgetCartComponent } from './add-widget-cart/add-widget-cart.component';
import { ShopifyWidgetStylesComponent } from './shopify-widget-styles/shopify-widget-styles.component';
import { SharedModule } from '../../common/shared.module';
import { ShopifyComponent } from './shopify.component';
import { ShopifyRoutingModule } from './shopify-routing.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [
    AddWidgetCartComponent,
    AddWidgetPdpComponent,
    ShopifyComponent,
    ShopifyWidgetStylesComponent,
  ],
  imports: [
    SharedModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    ReactiveFormsModule,
    ShopifyRoutingModule,
  ],
})
export class ShopifyModule {}
