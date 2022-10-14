import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpService } from 'src/app/services/http/http.service';
import { GoogleAnalyticsService } from 'src/app/services/http/google-analytics.service';

interface DataValues {
  name: string;
  value: any;
}

interface RequiredData {
  warehouses: DataValues[];
}

@Component({
  selector: 'app-work-order',
  templateUrl: './work-order.component.html',
  styleUrls: ['./work-order.component.scss'],
})
export class WorkOrderComponent implements OnInit {
  path: string;
  activeLinkIndex: any;
  activeLink: string;
  queryParams: any;
  tabLinks: any[];
  isTabSwitched: boolean;
  filtersData: RequiredData;
  showButton: boolean = true;

  constructor(
    public route: ActivatedRoute,
    private router: Router,
    public httpService: HttpService,
    public ga: GoogleAnalyticsService
  ) {
    this.isTabSwitched = false;

    this.queryParams = {};
    this.filtersData = {
      warehouses: [],
    };
    this.httpService.getWithParams('warehouse/get-warehouse', {}).subscribe(
      (data: any) => {
        if (data) {
          let local_fd: RequiredData = {
            warehouses: [],
          };
          let k = 0;
          for (let wh of data.data) {
            local_fd.warehouses.push({
              value: wh.warehouse_code,
              name: wh.name?.split(' ')[0]?.toLowerCase(),
            });
            k++;
          }
          this.filtersData = local_fd;
        }
      },
      (errors) => console.error(errors)
    );
    this.tabLinks = [
      {
        label: 'Kitting',
        link: '/work-order/kitting',
        index: 0,
        key: 'kitting',
        is_active: true,
      },
      {
        label: 'De-Kitting',
        link: '/work-order/de-kitting',
        index: 1,
        key: 'de-kitting',
        is_active: false,
      },
      // {
      //   label: 'Removal/Disposal',
      //   link: '/work-order/removal',
      //   index: 2,
      //   key: 'removal',
      //   is_active: false,
      // },
    ];

    this.activeLinkIndex = '';
    this.activeLink = '';
  }

  ngOnInit(): void {
    this.route.url.subscribe(() => {
      this.path = this.router.url;

      this.tabLinks.forEach((tab) => {
        if (this.path.includes(tab.link)) {
          tab.is_active = true;
        } else {
          tab.is_active = false;
        }
      });

      this.route.queryParams.subscribe((params) => {
        this.tabLinks.forEach((tab) => {
          if (tab.is_active) {
            this.queryParams[tab.key] = params;
          }
        });
      });
    });
  }

  isActive(endpoint): boolean {
    return this.path.includes(endpoint);
  }

  tabClick($event): void {
    this.isTabSwitched = true;

    this.route.queryParams.subscribe((params) => {
      this.tabLinks.forEach((tab) => {
        if (tab.is_active) {
          this.queryParams[tab.key] = params;
        }
      });
    });
  }

  updateQueryParams($event): void {
    const { pathname } = window.location;
    const urlSegement = pathname.split('/');

    this.router.navigate(['work-order/' + urlSegement[2]], {
      queryParams: $event[urlSegement[2]],
    });
    this.queryParams[urlSegement[2]] = $event[urlSegement[2]];
  }

  showCreateButton($event): void {
    if ($event) {
      this.showButton = true;
    } else {
      this.showButton = false;
    }
  }

  navigateToCreateKitting(): void {
    this.ga.emitEvent('SRF', 'Click on Add New(Kitting)', 'Work Order');
    this.router.navigate(['/work-order/create-kit']);
  }

  raiseARequest(): void {
    this.router.navigate(['/work-order/removal-request']);
  }
}
