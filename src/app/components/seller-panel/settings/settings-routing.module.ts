import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FulfillmentComponent } from './fulfillment/fulfillment.component';
import { SettingsComponent } from './settings.component';

const routes: Routes = [
  {
    path: 'settings',
    component: SettingsComponent,
    children: [
      { path: '', redirectTo: 'fulfillment', pathMatch: 'full' },
      {
        path: 'fulfillment', // child route path
        component: FulfillmentComponent, // child route component that the router renders
      },
    ],
  },
  {
    path: 'shopify',
    loadChildren: () =>
      import('./shopify/shopify.module').then((m) => m.ShopifyModule),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule {}
