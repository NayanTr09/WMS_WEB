import { OrderDetailComponent } from './order-detail/order-detail.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OrdersComponent } from './orders.component';
import { AllOrdersComponent } from './allorders/allorders.component';
import { ActiveordersComponent } from './activeorders/activeorders.component';
import { OnholdordersComponent } from './onholdorders/onholdorders.component';
import { BackordersComponent } from './backorders/backorders.component';
import { CompletedordersComponent } from './completedorders/completedorders.component';

const routes: Routes = [
  { path: 'orders',component: OrdersComponent,children: [
    {
      path: 'allorders', // child route path
      component: AllOrdersComponent, // child route component that the router renders
      //component: OrdersComponent
    },
    {
      path: 'activeorders', // child route path
      component: ActiveordersComponent, // child route component that the router renders
      //component: OrdersComponent
    },
    {
      path: 'onholdorders', // child route path
      component: OnholdordersComponent, // child route component that the router renders
    },
    {
      path: 'backorders', // child route path
      component: BackordersComponent, // child route component that the router renders
    },
    {
      path: 'completedorders', // child route path
      component: CompletedordersComponent, // child route component that the router renders
    }] 
  },
  { path: 'order/:order_id',component: OrderDetailComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersRoutingModule { }
