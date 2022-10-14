import { AuthGuard } from './../../../core/guards/auth.guard';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ReportsComponent } from './reports.component';
import { ReportsModule } from './reports.module';

const routes: Routes = [
  {
    path: 'reports',
    //pathMatch: 'full',
    canActivate: [AuthGuard],
    component: ReportsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportsRoutingModule {}
