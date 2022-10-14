import { AuthGuard } from './core/guards/auth.guard';
//import { SellerPanelComponent } from './components/seller-panel/seller-panel.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthenticationComponent } from './components/authentication/authentication.component';
import { LoginComponent } from './components/authentication/login/login.component';

import { GuestGuard } from './core/guards/guest.guard';

const routes: Routes = [
  //{ path: '', component: SellerPanelComponent, canActivate: [AuthGuard] }
  //{ path: '', loadChildren: () => import('./components/seller-panel/seller-panel.module').then(m => m.SellerPanelModule) },
  //{ path: '', loadChildren: () => import('./components/seller-panel/dashboard/dashboard.module').then(m => m.DashboardModule) },
  //{ path: '', loadChildren: () => import('./components/authentication/authentication.module').then(m => m.AuthenticationModule) },
  //{ path: 'orders', loadChildren: () => import('./components/seller-panel/orders/orders.module').then(m => m.OrdersModule) },
  {
    path: 'login',
    component: AuthenticationComponent,
    children: [
      {
        path: '', // child route path
        component: LoginComponent,
        canActivate: [GuestGuard], // child route component that the router renders
      },
    ],
  },
  {
    path: '',
    loadChildren: () =>
      import('./components/seller-panel/seller-panel.module').then(
        (m) => m.SellerPanelModule
      ),
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
