import { formatCurrency, getCurrencySymbol } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as moment from 'moment';
import { DashboardService } from 'src/app/services/http/dashboard.service';
import { GoogleAnalyticsService } from 'src/app/services/http/google-analytics.service';

interface CardsData {
  total_orders: number;
  total_shipped: number;
  total_revenue: number;
  avgTAT: number;
}

interface Warehouse {
  type: undefined | string;
  name: string;
  data: [
    {
      name: string;
      value: number;
      color: string | undefined;
    }
  ];
}

interface SrfInventory {
  type: undefined | string;
  name: string;
  data: number[];
  color: string;
}

@Component({
  selector: 'app-dashbard-view',
  templateUrl: './dashbard-view.component.html',
  styleUrls: ['./dashbard-view.component.scss'],
})
export class DashbardViewComponent implements OnInit {
  //template reference for cancel shipment dialog box data
  @ViewChild('cancelShipmentDialog') cancelShipmentDialog: TemplateRef<any>;
  warehouseColorMapping = {
    'nct of delhi': '#3F99FE',
    haryana: '#21CC82',
    maharastra: '#FEAF3F',
    karnataka: '#633EEF',
    'west bengal': '#9884E2',
  };

  cardsMapping = {
    total_orders: {
      title: 'Order Received',
      logoUrl: 'assets:boxopen',
    },
    total_shipped: {
      title: 'Order shipped',
      logoUrl: 'assets:van',
    },
    total_revenue: {
      title: 'Revenue',
      logoUrl: 'assets:revenue',
    },
    avgTAT: {
      title: 'Order Fulfillment Time',
      logoUrl: 'assets:clock',
    },
  };
  objectEntries = Object.entries;
  cardsData: CardsData = {
    total_orders: null,
    total_shipped: null,
    total_revenue: null,
    avgTAT: null,
  };
  cardsFilterText = 'Monthly';
  fcFilterText = 'Monthly';
  stateFilterText = 'Monthly';
  tabFilterText = 'Monthly';
  stateData = [];
  warehouseData: Warehouse[] = [];
  srfInventory: SrfInventory[] = [];
  log = console.log;
  srfAxisData: any[];

  constructor(
    public modal: MatDialog,
    private dashbardService: DashboardService,
    public ga: GoogleAnalyticsService
  ) {}

  ngOnInit(): void {
    // Important hack for charts
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 1000);

    this.cardDurationFilterClick();
    this.fetchStatewiseData();
    this.fetchWarehouseWise();
    this.fetchSrfInventory();
  }

  calculateDate(period?: string) {
    const dateFmt = 'YYYY-MM-DD';
    const lastDay = moment().subtract(1, 'd');
    const before1Day = lastDay.format(dateFmt);

    switch (period) {
      case 'yesterday':
        return { to: before1Day, from: before1Day };
      case 'week':
        const before7days = moment(lastDay).subtract(7, 'd').format(dateFmt);
        return { to: before1Day, from: before7days };
      default:
        // Monthly
        const before30days = moment(lastDay).subtract(30, 'd').format(dateFmt);
        return { to: before1Day, from: before30days };
    }
  }

  identify(index, item): string {
    return item[1];
  }

  formatText(value: number, key: string): string | number {
    if (key.includes('revenue')) {
      const symbol = getCurrencySymbol('INR', 'narrow');
      return formatCurrency(value, 'en-IN', symbol);
    }

    if (key.includes('avgTAT')) {
      return `${+value} hrs`;
    }

    return value;
  }

  cardDurationFilterClick(ts?: string): void {
    this.cardsFilterText = ts || 'Monthly';
    this.fetchOrdersData(ts);
    this.fetchAvgTAT(ts);
    this.ga.emitEvent('SRF', 'Dashboard Event', this.cardsFilterText);
  }

  fetchOrdersData(ts?: string): void {
    const duration = this.calculateDate(ts);
    this.dashbardService.getOrdersData(duration).subscribe(
      (resp) => {
        const { data } = resp;
        this.cardsData = { ...this.cardsData, ...data };
      },
      (err) => console.error(err)
    );
  }

  fetchAvgTAT(ts?: string): void {
    const duration = this.calculateDate(ts);
    this.dashbardService.getAvgShippingTAT(duration).subscribe(
      (resp) => {
        const { data } = resp;
        this.cardsData = { ...this.cardsData, ...data };
      },
      (err) => console.error(err)
    );
  }

  fetchStatewiseData(ts?: string): void {
    this.stateFilterText = ts || 'Monthly';
    const duration = this.calculateDate(ts);
    this.dashbardService.getStateWiseData(duration).subscribe(
      (resp) => {
        const { data } = resp;
        this.stateData = data.map((d) => [
          d.delivery_state,
          d.order_count_percentage,
        ]);
      },
      (err) => console.error(err)
    );
    this.ga.emitEvent(
      'SRF',
      'Statewise Order % Breakdown',
      this.stateFilterText
    );
  }

  getFirstWord(txt: string): string {
    if (!txt) {
      return '';
    }
    const temp = txt.split(' ');
    const removeLastWord = temp.splice(0, temp.length - 1);
    const requiredWord = removeLastWord.join();
    return requiredWord;
  }

  fetchWarehouseWise(ts?: string): void {
    this.fcFilterText = ts || 'Monthly';
    const duration = this.calculateDate(ts);
    this.dashbardService.getWarehouseWiseData(duration).subscribe(
      (resp) => {
        const { data } = resp;
        const temp = [];
        data.forEach((d) => {
          temp.push({
            type: undefined,
            name: this.getFirstWord(d.pickup_state),
            data: [
              {
                name: d.pickup_state,
                value: d.order_count_percentage,
                color: this.warehouseColorMapping[d.pickup_state],
              },
            ],
          });
        });
        this.warehouseData = [...temp];
      },
      (err) => console.error(err)
    );
    this.ga.emitEvent(
      'SRF',
      'Fulfillment Center wise % Breakdown',
      this.fcFilterText
    );
  }

  fetchSrfInventory(ts?: string): void {
    const duration = this.calculateDate(ts);
    this.dashbardService.getSrfInventoryData(duration).subscribe(
      (resp) => {
        const { data } = resp;
        const sortedKeys = Object.keys(data).sort((a, b) => {
          const dateA = moment(a, 'DD-MM-YYYY');
          const dateB = moment(b, 'DD-MM-YYYY');
          return +dateA - +dateB;
        });
        this.srfAxisData = sortedKeys;
        const temp = [
          {
            type: undefined,
            name: 'ASN',
            data: sortedKeys.map((d) => +data[d].total_asn),
            color: '#63E77C',
          },
          {
            type: undefined,
            name: 'Inventory In',
            data: sortedKeys.map((d) => +data[d].total_inbound),
            color: '#FEAF3F',
          },
          {
            type: undefined,
            name: 'Inventory Out',
            data: sortedKeys.map((d) => +data[d].inventory_out),
            color: '#9884E2',
          },
          {
            type: undefined,
            name: 'RTO',
            data: sortedKeys.map((d) => +data[d].total_rto),
            color: '#3F99FE',
          },
        ];
        this.srfInventory = [...temp];
      },
      (err) => {
        console.error(err);
      }
    );
  }
}
