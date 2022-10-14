import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth/auth.service';
import { HttpService } from 'src/app/services/http/http.service';
import { SubSink } from 'subsink';
import { DownloadPopupComponent } from '../common/download-popup/download-popup.component';
import { ActionEnum } from './catalog-model';
import { GoogleAnalyticsService } from 'src/app/services/http/google-analytics.service';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss'],
})
export class CatalogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  actions = ActionEnum;
  params: {};
  navLinks = [
    {
      label: 'Products',
      link: '/catalog/product-list',
      index: 1,
      key: 'products',
    },
    {
      label: 'Freebie',
      link: '/catalog/freebie-list',
      index: 1,
      key: 'freebie-list',
    },
  ];

  constructor(
    public router: Router,
    private toastr: ToastrService,
    private http: HttpService,
    public dialog: MatDialog,
    private auth: AuthService,
    private route: ActivatedRoute,
    private domSanitizer: DomSanitizer,
    private matIconRegistry: MatIconRegistry,
    public ga: GoogleAnalyticsService
  ) {
    Object.values(ActionEnum).forEach((name) => {
      this.registerSvg(name);
    });
  }

  ngOnInit(): void {
    this.subs.sink = this.route.queryParams.subscribe((params) => {
      this.params = params;
    });
  }

  registerSvg(name: string): void {
    this.matIconRegistry.addSvgIconInNamespace(
      'assets',
      name,
      this.domSanitizer.bypassSecurityTrustResourceUrl(
        `../../../../../assets/svg/${name}.svg`
      )
    );
  }

  navigateTo(route): void {
    this.router.navigateByUrl(route);
  }

  isActive(routeName: string): boolean {
    return this.router.url.includes(routeName);
  }

  handleClick(actionName): void {
    switch (actionName) {
      case ActionEnum.product:
        this.ga.emitEvent('SRF', 'Clicked on Product', 'Catalog Page');
        this.router.navigate(['product/add-new-product']);
        break;

      case ActionEnum.combo:
        this.ga.emitEvent('SRF', 'Click on Combo', 'Catalog Page');
        this.router.navigate(['product/add-combo']);
        break;

      case ActionEnum.mapped:
        this.ga.emitEvent('SRF', 'Click on Mapping', 'Catalog Page');
        this.router.navigate(['product/map-products']);
        break;

      default:
        break;
    }
  }

  allImportClicked(): void {
    this.ga.emitEvent('SRF', 'Click on All Products', 'Catalog Page');
    const endpoint = 'products/export/all';
    this.subs.sink = this.http
      .requestToEndpoint(endpoint, this.params)
      .subscribe(
        (onSuccess) => {
          this.openPopup('All Products');
        },
        (onErr) => {
          console.error(onErr);
          this.toastr.error(onErr.message, 'Error');
        }
      );
  }

  channelProductsClicked(): void {
    this.ga.emitEvent('SRF', 'Click on Channel Products', 'Catalog Page');
    const payload = {
      fbs: 1,
      search: '',
      channel_id: '',
      action: 'channel_products',
      is_web: 1,
    };
    const endpoint = 'listings/export';
    this.subs.sink = this.http.postToEndpint(endpoint, payload).subscribe(
      (onSuccess) => {
        this.openPopup('Channel Products');
      },
      (onErr) => {
        this.toastr.error(onErr.message, 'Error');
      }
    );
  }

  openPopup(reportName: string): void {
    const commonPopupRef = this.dialog.open(DownloadPopupComponent, {
      data: {
        reportName,
        email: this.auth.getUserEmail(),
        endpoint: '/reports',
      },
    });

    commonPopupRef.afterClosed().subscribe((result) => {
      // when popup close, this will run
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
