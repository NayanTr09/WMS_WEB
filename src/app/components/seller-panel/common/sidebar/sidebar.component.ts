import { filter } from 'rxjs/operators';
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { environment } from 'src/environments/environment';

interface MenuItem {
  displayName: string;
  iconName: string;
  route?: string;
  subNav?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  @Input() sideNavIsOpen: boolean;
  @Output() accordionToggled: EventEmitter<boolean> = new EventEmitter();

  constructor(private auth: AuthService) {}
  menu: MenuItem[] = [
    {
      displayName: 'Dashboard',
      iconName: 'assets:dashboard',
      route: '/',
    },
    {
      displayName: 'Orders',
      iconName: 'assets:orders',
      route: 'orders',
      subNav: [
        {
          displayName: 'Active Orders',
          iconName: 'assets:activeorders',
          route: 'activeorders',
        },
        {
          displayName: 'Onhold Orders',
          iconName: 'assets:onhold',
          route: 'onholdorders',
        },
        {
          displayName: 'Back Orders',
          iconName: 'assets:velocity',
          route: 'backorders',
        },
        {
          displayName: 'Completed Orders',
          iconName: 'assets:completedorders',
          route: 'completedorders',
        },
        {
          displayName: 'All Orders',
          iconName: 'assets:allorders',
          route: 'allorders',
        },
      ],
    },
    {
      displayName: 'Fulfillment Centre',
      iconName: 'assets:inventory',
      route: 'fcs',
      subNav: [
        {
          displayName: 'Inventory',
          iconName: 'assets:inventory2',
          route: 'inventory',
        },
        {
          displayName: 'ASN',
          iconName: 'assets:asn',
          route: 'asn',
        },
        {
          displayName: 'Stock Transfer',
          iconName: 'assets:stock_transfer',
          route: 'stock-transfer',
        },
        {
          displayName: 'Bad Stock',
          iconName: 'assets:stock_transfer',
          route: 'bad-stock',
        },
      ],
    },
    {
      displayName: 'Catalog',
      iconName: 'assets:catalog',
      route: 'catalog',
      subNav: [
        {
          displayName: 'Products',
          iconName: 'assets:product1',
          route: 'product-list',
        },
        {
          displayName: 'Freebie',
          iconName: 'assets:freebie',
          route: 'freebie-list',
        },
      ],
    },
    {
      displayName: 'Work Order',
      iconName: 'assets:workorder',
      route: 'work-order',
      subNav: [
        {
          displayName: 'Kit',
          iconName: 'assets:kitting',
          route: 'kitting',
        },
        {
          displayName: 'De-Kit',
          iconName: 'assets:dekitting',
          route: 'de-kitting',
        },
        // {
        //   displayName: 'Removal/Disposal',
        //   iconName: 'assets:removal2',
        //   route: 'removal',
        // },
      ],
    },
    {
      displayName: 'Reports',
      iconName: 'assets:reports',
      route: 'reports',
    },
    {
      displayName: 'Settings',
      iconName: 'assets:settings',
      route: 'settings',
    },
  ];

  ngOnInit(): void {
    this.menu = this.menuListFilter(this.menu);
  }

  menuListFilter(menu): Array<MenuItem> {
    menu.forEach((menu) => {
      if (menu.subNav) {
        menu.subNav = menu.subNav.filter((submenu) => {
          if (submenu.route == 'stock-transfer') {
            if (this.auth.getB2bFlag()) {
              console.log('get b2b flag is coming true.....');
              return true;
            } else {
              return false;
            }
          } else {
            return true;
          }
        });
      }
    });
    return menu;
  }

  navigateToPage(menuItem): void {
    const { route } = menuItem;
    // if (route.includes('products')) {
    // const token = this.auth.getUserData().token;
    // const url = environment.tokenLoginUrl;
    // window.open(`${url}?token=${token}&toState=app.products`, '_blank');
    // }
  }

  checkRoute(name): boolean {
    const pathname = window.location.pathname;
    if (name === '/') {
      return name === pathname;
    }
    return pathname.includes(name);
  }
  checkChildRoute(name): boolean {
    const pathname = window.location.pathname;
    if (name === '/') {
      return name === pathname;
    }
    const lastPart = pathname.split('/').pop();
    return lastPart == name;
  }
  toggleAccordion(): void {
    this.accordionToggled.emit(true);
  }
}
