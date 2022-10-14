import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthenticationRoutingModule } from './authentication-routing.module';

import { AuthenticationComponent } from './authentication.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

import { FlexLayoutModule } from '@angular/flex-layout';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { CookieService } from 'ngx-cookie-service';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { SocialLoginComponent } from './social-login/social-login.component';
import { ForgotpasswordComponent } from './forgotpassword/forgotpassword.component';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [
    AuthenticationComponent,
    LoginComponent,
    RegisterComponent,
    SocialLoginComponent,
    ForgotpasswordComponent,
  ],
  imports: [
    CommonModule,
    AuthenticationRoutingModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MatInputModule,
    MatIconModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatButtonModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  providers: [CookieService],
})
export class AuthenticationModule {}
