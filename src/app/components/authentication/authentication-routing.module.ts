import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AuthenticationComponent } from './authentication.component';
import { SocialLoginComponent } from './social-login/social-login.component';
import { ForgotpasswordComponent } from './forgotpassword/forgotpassword.component';

import { GuestGuard } from '../../core/guards/guest.guard';

const routes: Routes = [
  {
    path: 'register',
    component: AuthenticationComponent,
    children: [
      {
        path: '', // child route path
        component: RegisterComponent,
        canActivate: [GuestGuard], // child route component that the router renders
      },
    ],
  },
  {
    path: 'recovery',
    component: AuthenticationComponent,
    children: [
      {
        path: '', // child route path
        component: ForgotpasswordComponent,
        canActivate: [GuestGuard], // child route component that the router renders
      },
    ],
  },

  {
    path: 'social-auth',
    component: AuthenticationComponent,
    children: [
      {
        path: '', // child route path
        component: SocialLoginComponent,
        canActivate: [GuestGuard], // child route component that the router renders
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthenticationRoutingModule {}
