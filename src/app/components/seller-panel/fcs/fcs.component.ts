import { Component, OnInit, Injectable, OnDestroy } from '@angular/core';
import { FcsService, EndpointFCS } from 'src/app/services/http/fcs.service';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { environment } from 'src/environments/environment';
import { SubSink } from 'subsink';
import { ToastrService } from 'ngx-toastr';
import { GoogleAnalyticsService } from 'src/app/services/http/google-analytics.service';

@Injectable()
export class QueryParams {
  private queryParams: any;
  constructor() {
    this.queryParams = {
      asn: {},
      inventory: {},
      products: {},
      'stock-transfer': {},
      'bad-stock': {},
    };
  }

  public setValue(type, value) {
    delete value.action;
    this.queryParams[type] = value;
  }

  public getValue(type) {
    return this.queryParams[type];
  }
}

@Component({
  selector: 'app-fcs',
  templateUrl: './fcs.component.html',
  styleUrls: ['./fcs.component.scss'],
})
export class FcsComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  navLinks: any[];
  activeLinkIndex: any;
  activeLink: any;
  query_params: any;
  qs: any;
  reportDownloadURL = 'warehouse/export-inventories?with_released=1';
  reportASNDownloadURL = 'warehouse/export-asn';
  badStockUrl = 'warehouse/export-bad-stock';
  isB2BEnabled: boolean = false;
  is_admin: boolean = false;

  constructor(
    public route: ActivatedRoute,
    public router: Router,
    public queryParams: QueryParams,
    public dialog: MatDialog,
    private auth: AuthService,
    private fcsService: FcsService,
    private toastr: ToastrService,
    public ga: GoogleAnalyticsService
  ) {
    this.navLinks = [
      {
        label: 'Inventory',
        link: '/fcs/inventory',
        index: 0,
        key: 'inventory',
      },
      {
        label: 'ASN',
        link: '/fcs/asn',
        index: 1,
        key: 'asn',
      },
    ];

    this.navLinks = [];
    this.activeLinkIndex = '';
    this.activeLink = '';
    this.query_params = {};
    this.qs = {};
    this.is_admin = this.auth.getUserData().is_admin;
  }

  downloadCsv(activeLink) {
    if (activeLink == 'asn') {
      const link = document.getElementById('downloadLinkAsn');
      link.click();
    } else if (activeLink === 'bad-stock') {
      const link = document.getElementById('badStockReport');
      link.click();
    } else if (!this.is_admin) {
      this.ga.emitEvent(
        'SRF',
        'Clicked on Download report',
        'Fulfillment Centre - Inventory'
      );
      const link = document.getElementById('downloadLink');
      link.click();
    } else {
      const link = document.getElementById('downloadLink');
      link.click();
    }
  }

  navigateToCreateAsn(): void {
    this.ga.emitEvent(
      'SRF',
      'Clicked on Add new ASN Button',
      'Fulfillment Centre - ASN'
    );
    this.router.navigate(['/fcs/create-asn']);
  }

  navigateToCreateStockTransfer(): void {
    this.ga.emitEvent(
      'SRF',
      'Clicked on Transfer Stock',
      'Fulfillment Centre - Stock Transfer'
    );
    this.router.navigate(['/fcs/create-stock-transfer']);
  }

  checkB2BStatus(): void {
    const stockLink = {
      label: 'Stock Transfer',
      link: '/fcs/stock-transfer',
      index: 2,
      key: 'stock-transfer',
    };

    const navLinks = this.createNavLinks();

    this.fcsService.requestToEndpoint(EndpointFCS.b2b_enabled).subscribe(
      (resp) => {
        const { is_b2b_enable } = resp?.data;
        this.isB2BEnabled = is_b2b_enable;

        if (is_b2b_enable) {
          navLinks.push(stockLink);
          this.navLinks = navLinks.sort((a, b) => a['index'] - b['index']);
        } else {
          this.navLinks = navLinks;
        }
      },
      // IF ANY ERROR
      (error: any) => {
        this.navLinks = navLinks;
      },
      //ON COMPLETE
      () => {
        if (this.activeLink == 'stock-transfer' && !this.isB2BEnabled) {
          this.router.navigate(['fcs/asn']);
        }
      }
    );
  }

  navigateToPage(): void {
    const token = this.auth.getUserData().token;
    const url = environment.tokenLoginUrl;
    window.open(`${url}?token=${token}&toState=app.products`, '_blank');
  }

  updateQueryParams(evt): void {
    const path = this.route.routeConfig?.path;
    const qp = this.queryParams.getValue(path);

    this.route.queryParams.subscribe((params) => {
      const paramsLen = Object.keys(params).length;
      const storedParamLen = Object.values(qp).length;

      if (paramsLen && !storedParamLen) {
        // set query params from url, if not exists
        this.queryParams.setValue(path, params);
        this.qs[path] = params;
      } else if (!paramsLen && storedParamLen) {
        // not params in url and stored in query param class so set form queryparam class
        this.queryParams.setValue(path, qp);
        this.qs[path] = qp;
      } else {
        this.queryParams.setValue(path, evt[path]);
        this.qs[path] = evt[path];
      }

      const getQP = this.queryParams.getValue(path);
      this.query_params[path] = { ...getQP };
      this.router.navigate([`fcs/${path}`], { queryParams: getQP });
    });
  }

  ngOnInit(): void {
    this.checkB2BStatus();
    this.route.url.subscribe((url: any): void => {
      this.activeLink = url[0].path;
      const qp = this.queryParams.getValue(this.activeLink) ?? {};
      const storedParamLen = Object.values(qp).length;

      if (storedParamLen) {
        this.query_params[this.activeLink] = qp;
        this.router.navigate(['fcs/' + this.activeLink], { queryParams: qp });
      } else {
        this.route.queryParams.subscribe((params) => {
          const paramsLen = Object.keys(params).length;

          if (paramsLen && !storedParamLen) {
            this.query_params[this.activeLink] = params ?? {};
            this.queryParams.setValue(this.activeLink, params);
          }
        });
      }

      this.qs = this.query_params;
    });
  }

  syncInventoryChannels(): void {
    this.ga.emitEvent(
      'SRF',
      'Clicked on Sync symbol',
      'Fulfillment Centre - Inventory'
    );
    this.fcsService
      .requestToEndpoint('warehouse/inventory/sync-on-channel')
      .subscribe(
        (success) => {
          this.toastr.success(
            'Inventory sync request created. We will update within 30 min.'
          );
        },
        // IF ANY ERROR
        (error: any) => {
          this.toastr.error('Something went wrong! Please try again later');
          console.log(error.error.message);
        }
      );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  createNavLinks(): Array<Object> {
    return [
      {
        label: 'Inventory',
        link: '/fcs/inventory',
        index: 0,
        key: 'inventory',
      },
      {
        label: 'ASN',
        link: '/fcs/asn',
        index: 1,
        key: 'asn',
      },
      {
        label: 'Bad Stock',
        link: '/fcs/bad-stock',
        index: 3,
        key: 'bs',
      },
    ];
  }
}
