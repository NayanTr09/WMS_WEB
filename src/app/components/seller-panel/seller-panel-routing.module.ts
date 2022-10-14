import { ActivatedRoute } from '@angular/router';
//import { FcsComponent } from './fcs/fcs.component';
import { AuthGuard } from './../../core/guards/auth.guard';
//import { DashboardComponent } from './dashboard/dashboard.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SellerPanelComponent } from './seller-panel.component';
//import { OrdersComponent } from './orders/orders.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SettingsComponent } from './settings/settings.component';
//import { DashboardModule } from './dashboard/dashboard.module';

//const routes: Routes = [{ path: '', component: SellerPanelComponent }];

//const routes: Routes = [{ path: '', component: SellerPanelComponent, canActivate: [AuthGuard] }];

const routes: Routes = [
  {
    path: '',
    component: SellerPanelComponent,
    pathMatch: 'full',
    loadChildren: () =>
      import('./dashboard/dashboard.module').then((m) => m.DashboardModule),
  },
  {
    path: '',
    component: SellerPanelComponent,
    //pathMatch: 'full',
    loadChildren: () => import('./fcs/fcs.module').then((m) => m.FcsModule),
  },
  {
    path: '',
    component: SellerPanelComponent,
    //pathMatch: 'full',
    loadChildren: () =>
      import('./orders/orders.module').then((m) => m.OrdersModule),
  },
  {
    path: '',
    component: SellerPanelComponent,
    //pathMatch: 'full',
    loadChildren: () =>
      import('./settings/settings.module').then((m) => m.SettingsModule),
  },
  {
    path: '',
    component: SellerPanelComponent,
    //pathMatch: 'full',
    loadChildren: () =>
      import('./reports/reports.module').then((m) => m.ReportsModule),
  },
  {
    path: '',
    component: SellerPanelComponent,
    //pathMatch: 'full',
    loadChildren: () =>
      import('./work-order/work-order.module').then((m) => m.WorkOrderModule),
  },
  {
    path: '',
    component: SellerPanelComponent,
    loadChildren: () =>
      import('./catalog/catalog.module').then((m) => m.CatalogModule),
  },
  // {
  //   path: 'products/',
  //   component: SellerPanelComponent,
  //   loadChildren: () =>
  //     import('./products/products.module').then((m) => m.ProductsModule),
  // },
  /*children: [
    {
      path: '', // child route path,
      pathMatch: 'full',
      //loadChildren: () => import('./dashboard/dashboard.module'),
      component: DashboardComponent, canActivate: [AuthGuard] // child route component that the router renders
    },
    {
      path: 'dashboard', // child route path
      //loadChildren: () => import('./dashboard/dashboard.module'),
      component: DashboardComponent, canActivate: [AuthGuard] // child route component that the router renders
    },
    // {
    //   path: 'orders', // child route path
    //   component: OrdersComponent, canActivate: [AuthGuard] // child route component that the router renders
    // },
    // {
    //   path: 'fcs', // child route path
    //   loadChildren: () => import('./fcs/fcs.module'),
    //   component: FcsComponent, canActivate: [AuthGuard] // child route component that the router renders
    // }
  ] */
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SellerPanelRoutingModule {
  constructor(private route: ActivatedRoute) {}
}
