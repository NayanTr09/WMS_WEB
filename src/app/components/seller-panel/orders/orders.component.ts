import { OrdersService } from './../../../services/http/orders.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, ActivationEnd } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { filter } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { GoogleAnalyticsService } from 'src/app/services/http/google-analytics.service';

interface DataValues {
  name: string;
  value: any;
}

interface RequiredData {
  channels: DataValues[];
  shipment_status: DataValues[];
  couriers: DataValues[];
  payment_types: DataValues[];
  onhold_reason: DataValues[];
}

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit, OnDestroy {
  activeLinkIndex: any;
  activeLink: string;
  queryParams: any;
  tabLinks: any[];
  isTabSwitched: boolean;
  filtersData: RequiredData;
  reportDownloadURL = 'orders/export';
  reportTypeName = 'All Orders';
  qs: any;
  is_admin: boolean = false;

  //URLS
  //v1/orders/manifestfilters

  constructor(
    public route: ActivatedRoute,
    public router: Router,
    public orderService: OrdersService,
    public authService: AuthService,
    private toastr: ToastrService,
    public ga: GoogleAnalyticsService
  ) {
    this.isTabSwitched = false;

    //console.log("ORDER PARENT CONSTRUCTOR");
    this.queryParams = {
      allorders: {},
      activeorders: {},
      onholdorders: {},
      backorders: {},
      completedorders: {},
    };

    this.tabLinks = [
      {
        label: 'Active',
        link: '/orders/activeorders',
        index: 1,
        key: 'activeorders',
        is_active: false,
      },
      {
        label: 'On-Hold',
        link: '/orders/onholdorders',
        index: 2,
        key: 'onholdorders',
        is_active: false,
      },
      {
        label: 'Back Orders',
        link: '/orders/backorders',
        index: 3,
        key: 'backorders',
        is_active: false,
      },
      {
        label: 'Completed',
        link: '/orders/completedorders',
        index: 4,
        key: 'completedorders',
        is_active: false,
      },
      {
        label: 'All',
        link: '/orders/allorders',
        index: 0,
        key: 'allorders',
        is_active: true,
      },
    ];

    this.activeLinkIndex = '';
    this.activeLink = '';
    this.is_admin = this.authService.getUserData().is_admin;
    this.filtersData = {
      couriers: [],
      channels: [],
      shipment_status: [],
      payment_types: [],
      onhold_reason: [],
    };

    this.orderService.getFiltersData().subscribe((data: any) => {
      //console.log("prepopulated data is STARTS ");

      if (!data || data == undefined) {
        return;
      }

      let local_fd: RequiredData = {
        couriers: [],
        channels: [],
        shipment_status: [],
        payment_types: [],
        onhold_reason: [],
      };

      if (data.channels) {
        for (let channel of data.channels) {
          local_fd.channels.push({
            value: channel.value,
            name: channel.display_value,
          });
        }
      }

      if (data.shipment_status) {
        // for(let shipment_status of data.shipment_status) {
        //   local_fd.shipment_status.push({value:shipment_status.value,name:shipment_status.display_value});
        // }

        local_fd.shipment_status = [
          /*{
            name: 'New',
            value: 1
          },
          {
            name: 'Invoiced',
            value: 2
          },*/
          {
            name: 'Ready to Pack',
            value: 3,
          },
          /*{
              name: 'Pickup Scheduled',
              value: '4|12'
          },*/
          {
            name: 'Picked Up',
            value: 51,
          },
          /*{
            name: 'Out for Pickup',
            value: 34
          },
          {
            name: 'Pickup Rescheduled',
            value:13
          },
          {
            name: 'Pickup Error',
            value: 14
          },
          {
            name: 'Pickup Exception',
            value: 35
          },*/
          {
            name: 'Shipped',
            value: 6,
          },
          /*{
            name: 'In Transit',
            value: 20
          },
          {
            name: 'Out For Delivery',
            value: 19
          },*/
          {
            name: 'Delivered',
            value: 7,
          },
          /*{
            name: 'Cancelled',
            value: 5
          },
          {
            name: 'ePayment failed',
            value: 8
          },
          {
            name: 'Returned',
            value: 9
          },
          {
            name: 'RTO Initiated',
            value: 15
          },
          {
           name: 'RTO In-Transit',
           value: 46
          },
          {
            name: 'RTO Delivered',
            value: 16
          },
          {
            name: 'RTO Acknowledged',
            value: 17
          },
          {
            name: 'Return Pending',
            value: 21
          },
          {
            name: 'Return Initiated',
            value: 22
          },
          {
            name: 'Return Pickup Generated',
            value: 28
          },
          {
            name: 'Return Picked Up',
            value: 32
          },
          {
            name: 'Return Pickup Error',
            value: 24
          },
          {
            name: 'Return In Transit',
            value: 25
          },
          {
            name: 'Return Delivered',
            value: 26
          },
          {
            name: 'Return Cancelled',
            value: 27
          },
          {
            name: 'Return Pickup Rescheduled',
            value: 31
          },
          {
            name: 'Lost Shipment',
            value: 33
          },
          {
            name: 'Undelivered',
            value: 36
          },
          {
            name: 'Delayed',
            value: 37
          },
          {
            name: 'Destroyed',
            value: 39
          },
          {
            name: 'Damaged',
            value: 40
          },                     
          {
           name: 'Disposed OFF',
           value: 53
          },
          {
            name: 'Archived',
            value: 42
          },
          {
            name: 'Reached At Destination Hub',
            value: 43
          },
          {
            name: 'Misrouted',
            value: 44
          },
          {
            name: 'RTO-OFD',
            value: 45
          },
          {
            name: 'RTO-NDR',
            value: 46
          },
          {
            name: 'SELF FULFILLED',
            value: 52
          }*/
        ];
      }

      if (data.shippingPartners) {
        for (let courier of data.shippingPartners) {
          local_fd.couriers.push({
            value: courier.value,
            name: courier.display_value,
          });
        }
      }
      //console.log("prepopulated data is Checkpoint 3 ");
      if (data.paymentTypes) {
        for (let paymentTypes of data.paymentTypes) {
          local_fd.payment_types.push({
            value: paymentTypes.value,
            name: paymentTypes.display_value,
          });
        }
      }

      if (data.srf_failed_order_status) {
        for (let failed_status of data.srf_failed_order_status) {
          local_fd.onhold_reason.push({
            value: failed_status.value,
            name: failed_status.display_value,
          });
        }
      }

      //console.log("---prepopulated data is DONE---");
      //console.log( local_fd);
      this.filtersData = local_fd;
    });

    //console.log(this.activeLink);
    //console.log("main order page constructor called .....");

    this.router.events
      .pipe(filter((event) => event instanceof ActivationEnd))
      .subscribe((event: ActivationEnd) => {
        let data = event.snapshot;
        if (!data.children.length) {
          this.activeLink = '/orders/' + data.routeConfig.path;
          //console.log("----- THIS ROUTE ACTIVE ----- ",this.activeLink);

          //NEED TO CHANGE BELOW LOGIC, after navigate routeactivelink not changing
          for (let link of this.tabLinks) {
            if (link.key != data.routeConfig.path) {
              this.tabLinks[this.tabLinks.indexOf(link)].is_active = false;
            } else {
              //console.log("TAB SWITCHED .... ");

              this.tabLinks[this.tabLinks.indexOf(link)].is_active = true;
            }
          }

          // console.log("----coming in router activation ENd.");
          // console.log(this.queryParams);
          // console.log(data.routeConfig.path)
          if (
            data.routeConfig.path &&
            Object.keys(this.queryParams[data.routeConfig.path]).length
          ) {
            let q = this.queryParams[data.routeConfig.path];
            this.router.navigate([this.activeLink], {
              queryParams: q,
              //relativeTo: this.route,
              //queryParamsHandling: 'merge'
            });
          } else {
            //is_complete
            //console.log("QUERY PARAMS------ ELSE PART OF MAIN ORDER COMPONENT ");
            //console.log(this.queryParams);

            if (data.routeConfig.path) {
              let params_len = Object.keys(data.queryParamMap['params']).length;
              let stored_p_len = Object.keys(
                this.queryParams[data.routeConfig.path]
              ).length;

              if (params_len && !stored_p_len) {
                //console.log('inside else condition');
                this.queryParams[data.routeConfig.path] = {};
                this.queryParams[data.routeConfig.path] = data.queryParams;
              }
            }
          }
        }
      });
  }

  tabClick($event) {
    this.isTabSwitched = true;
  }

  downloadCsv() {
    // const { search } = window.location;
    // if (search) {
    //   this.reportDownloadURL += search;
    // } else {
    //   this.reportDownloadURL += '?is_web=1';
    // }
    // console.log(activeLink);
    // console.log(this.qs);
    if (!this.is_admin) {
      const link = document.getElementById('downloadLink');
      link.click();
      this.ga.emitEvent('SRF', 'download Csv on order page', '');
    } else {
      this.toastr.error('Not Authorized');
    }
  }

  ngOnInit(): void {}

  ngOnDestroy() {
    //console.log('Main Orders : ChildComponent:OnDestroy');
  }

  updateQueryParams($event): void {
    //console.log("updateQueryParams function ---");
    //console.log("update Query Params Events");
    //console.log($event);
    let key = Object.keys($event);
    let urlSegement = this.activeLink.split('/');
    //let paramslen = Object.keys(this.queryParams[urlSegement[2]]);

    //console.log("changes....");

    //if(this.isTabSwitched && paramslen.length) {
    /*if(paramslen.length) {
      console.log('tab switched and param length is set');
      //this.isTabSwitched = false;
      this.router.navigate(['orders/'+urlSegement[2]], { queryParams: this.queryParams[urlSegement[2]] });
    } else { */
    this.router.navigate(['orders/' + urlSegement[2]], {
      queryParams: $event[urlSegement[2]],
    });
    this.queryParams[urlSegement[2]] = $event[urlSegement[2]];

    this.qs = Object.assign({}, this.queryParams[urlSegement[2]]);

    this.qs.is_srf = 1;
    this.qs.status =
      this.qs.filter != '' && typeof this.qs.filter != 'undefined'
        ? this.qs.filter.split(',').map(Number)
        : [];
    this.qs.courier = this.qs.courier_id;
    switch (urlSegement[2]) {
      case 'allorders':
        this.qs.action = 'all_orders';
        this.qs.fbs_all_orders = 1;
        this.reportTypeName = 'All Orders';
        this.ga.emitEvent('SRF', 'All Orders', '');

        break;
      case 'activeorders':
        this.qs.action = 'active_orders';
        this.qs.fbs_active = 1;
        this.qs.fbs = 1;
        this.reportTypeName = 'Active Orders';
        this.ga.emitEvent('SRF', 'Active Orders', '');
        break;
      case 'onholdorders':
        this.qs.action = 'on_hold_orders';
        this.reportTypeName = 'On-Hold Orders';
        this.ga.emitEvent('SRF', 'On Hold Orders', '');
        break;
      case 'backorders':
        this.qs.action = 'back_orders';
        this.qs.back_order = 1;
        this.reportTypeName = 'Back Orders';
        this.ga.emitEvent('SRF', 'Back Orders', '');
        break;
      case 'completedorders':
        this.qs.action = 'completed_orders';
        this.qs.fbs_completed = 1;
        this.qs.fbs = 1;

        this.reportTypeName = 'Fulfilled Orders';
        this.ga.emitEvent('SRF', 'Fulfilled Orders', '');
        break;

      default:
        break;
    }
    //}
  }
}
