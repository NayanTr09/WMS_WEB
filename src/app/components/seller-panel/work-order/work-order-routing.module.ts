import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
// import { CreateWorkOrderComponent } from './create-work-order/create-work-order.component';
import { DeKittingComponent } from './de-kitting/de-kitting.component';
import { KittingComponent } from './kitting/kitting.component';
import { RemovalRequestComponent } from './removal-request/removal-request.component';
import { CreateKitComponent } from './create-kit/create-kit.component';
import { WorkOrderComponent } from './work-order.component';
import { RemovalComponent } from './removal/removal.component';

const routes: Routes = [
  {
    path: 'work-order',
    canActivate: [AuthGuard],
    component: WorkOrderComponent,
    children: [
      {
        path: 'kitting',
        component: KittingComponent,
      },
      {
        path: 'de-kitting',
        pathMatch: 'full',
        component: DeKittingComponent,
      },
      {
        path: 'removal',
        pathMatch: 'full',
        component: RemovalComponent,
      },
    ],
  },
  {
    path: 'work-order/create-kit',
    pathMatch: 'full',
    component: CreateKitComponent,
  },
  {
    path: 'work-order/removal-request',
    pathMatch: 'full',
    component: RemovalRequestComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WorkOrderRoutingModule {}
