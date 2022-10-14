import { Component } from '@angular/core';
import { Meta, MetaDefinition } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';
import { AuthService } from './services/auth/auth.service';
import { GoogleAnalyticsService } from './services/http/google-analytics.service';
import { IdleTimerService } from './services/idle-timer.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  cspTag: MetaDefinition = {
    httpEquiv: 'Content-Security-Policy',
    content: `
  default-src 'self'
    https://www.googletagmanager.com/
    https://www.google-analytics.com/;

    img-src https://* 'self' data:;

    connect-src 'self' 
    https://www.googletagmanager.com/
    https://www.google-analytics.com/
    ${environment.apiURL}
    ${environment.warehouseApiUrl}
    ${environment.tokenLoginUrl}
    ${environment.shopifyBaseUrl}
    ${environment.dashboard_api_url};

    frame-src 'self' https://www.googletagmanager.com/;

    font-src 'self' https://fonts.googleapis.com/ 
    https://fonts.gstatic.com/ ;

    style-src 'self' 'unsafe-inline';

    style-src-elem 'self' 'unsafe-inline'
    https://fonts.googleapis.com/ 
    https://fonts.gstatic.com/ ;

    script-src 'self'
    https://www.googletagmanager.com/
    https://www.google-analytics.com/;
  `,
  };

  constructor(
    public ga: GoogleAnalyticsService,
    private idleTimer: IdleTimerService,
    private auth: AuthService,
    private meta: Meta
  ) {}
  ngOnInit(): void {
    this.ga.emitEvent('Support', 'SOP & TnC', 'test');
    // this.meta.updateTag(this.cspTag, "name='csp'");

    this.idleTimer.startWatching(900).subscribe((expired: boolean) => {
      if (expired && this.auth.getToken()) {
        this.auth.logout();
      }
    });
  }

  title = 'SRF-Web';
}
