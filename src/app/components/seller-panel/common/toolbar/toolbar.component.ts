import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent implements OnInit {
  userData: object = this.auth.getUserData();

  constructor(private auth: AuthService) {}

  ngOnInit(): void {}

  redirectToPage(): void {
    const token = this.auth.getUserData().token;
    window.open(environment.tokenLoginUrl + '?token=' + token, '_blank');
  }

  logout(): void {
    this.auth.logout();
  }
}
