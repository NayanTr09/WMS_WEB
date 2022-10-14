import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddWidgetCartComponent } from './add-widget-cart/add-widget-cart.component';
import { AddWidgetPdpComponent } from './add-widget-pdp/add-widget-pdp.component';
import { ShopifyWidgetStylesComponent } from './shopify-widget-styles/shopify-widget-styles.component';
import { ShopifyComponent } from './shopify.component';

const routes: Routes = [
  {
    path: '',
    component: ShopifyComponent,
  },
  {
    path: 'add-widget-on-pdp',
    component: AddWidgetPdpComponent,
  },
  {
    path: 'widget-styles',
    component: ShopifyWidgetStylesComponent,
  },
  {
    path: 'add-widget-on-cart',
    component: AddWidgetCartComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShopifyRoutingModule {}
