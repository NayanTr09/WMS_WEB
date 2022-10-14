import { Component, Input, OnChanges, OnInit } from '@angular/core';
import * as HighCharts from 'highcharts';
import HC_exporting from 'highcharts/modules/exporting';
import HC_map from 'highcharts/modules/map';
declare var require: any; // don't remove ts
const myMap = require('@highcharts/map-collection/countries/in/custom/in-all-disputed.geo.json');
const pointer = '../../../../../../assets/images/icons/location_pointer.png';

HC_map(HighCharts);
HC_exporting(HighCharts);

@Component({
  selector: 'app-map-chart',
  templateUrl: './map-chart.component.html',
  styleUrls: ['./map-chart.component.scss'],
})
export class MapChartComponent implements OnInit, OnChanges {
  @Input() data = [];
  Highcharts: typeof HighCharts = HighCharts;
  chartConstructor = 'mapChart';
  chartOptions: Highcharts.Options = null;

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(): void {
    this.chartOptions = {
      credits: {
        enabled: false,
      },
      chart: {
        map: myMap,
      },

      title: {
        text: null,
      },

      legend: {
        enabled: true,
      },

      colorAxis: {
        maxColor: '#6F57E9',
      },

      series: [
        {
          type: undefined,
          name: 'India',
          data: this.data,
          // dataLabels: {
          //   enabled: true,
          //   useHTML: true,
          //   formatter() {
          //     console.log(this.point);

          //     return;
          //     return `<img src="${pointer}"  width="15" />`;
          //     if (this.point.value === 12) {
          //       return `<img src="../../../../../../assets/images/icons/location-pointer.png" />`;
          //     }
          //   },
          // },
          tooltip: {
            headerFormat: '',
            pointFormat: `<b>{point.name}<b>: {point.value}%`,
          },
        },
      ],
    };
  }
}
