import { StockTransferListComponent } from './stock-transfer/stock-transfer-list.component';
import { AsnCreateComponent } from './asn-create/asn-create.component';
import { AuthGuard } from './../../../core/guards/auth.guard';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FcsComponent } from './fcs.component';
import { StockTransferCreateComponent } from './stock-transfer/stock-transfer-create.component';
import { BadStockComponent } from './bad-stock/bad-stock.component';

const routes: Routes = [
  {
    path: 'fcs',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'inventory',
        component: FcsComponent,
      },
      {
        path: 'stock-transfer',
        pathMatch: 'full',
        component: FcsComponent,
        //module: AsnCreateModule
        //canActivate: [AuthGuard]
      },
      {
        path: 'asn',
        pathMatch: 'full',
        component: FcsComponent,
      },
      {
        path: 'bad-stock',
        pathMatch: 'full',
        component: FcsComponent,
      },
      {
        path: 'create-asn',
        pathMatch: 'full',
        component: AsnCreateComponent,
      },
      {
        path: 'create-stock-transfer',
        pathMatch: 'full',
        component: StockTransferCreateComponent,
        //module: AsnCreateModule
        //canActivate: [AuthGuard]
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FcsRoutingModule {}
