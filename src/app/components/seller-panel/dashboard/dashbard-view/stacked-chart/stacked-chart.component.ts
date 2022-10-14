import { Component, Input, OnChanges, OnInit } from '@angular/core';
import * as HighCharts from 'highcharts';
import HC_exporting from 'highcharts/modules/exporting';

HC_exporting(HighCharts);

@Component({
  selector: 'app-stacked-chart',
  templateUrl: './stacked-chart.component.html',
  styleUrls: ['./stacked-chart.component.scss'],
})
export class StackedChartComponent implements OnInit, OnChanges {
  @Input() data = [];
  @Input() xAxisData = [];
  Highcharts: typeof HighCharts = HighCharts;
  chartOptions: Highcharts.Options = null;

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges(): void {
    const newThis = this;
    if (this.data.length) {
      this.chartOptions = {
        chart: {
          type: 'column',
        },
        credits: {
          enabled: false,
        },
        title: {
          text: null,
        },
        xAxis: {
          type: 'datetime',
          labels: {
            // tslint:disable-next-line: typedef
            formatter() {
              return newThis.xAxisData[this.value];
            },
          },
        },
        yAxis: {
          gridLineColor: 'transparent',
          visible: false,
          title: {
            text: null,
          },
        },
        legend: {
          align: 'right',
          x: -30,
          verticalAlign: 'top',
          y: 0,
          floating: true,
          backgroundColor:
            this.Highcharts.defaultOptions.legend.backgroundColor || 'white',
          borderColor: '#CCC',
          borderWidth: 1,
          shadow: false,
        },
        tooltip: {
          headerFormat: '',
          pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}',
        },
        plotOptions: {
          column: {
            stacking: 'normal',
            borderColor: 'transparent',
            maxPointWidth: 20,
          },
        },
        series: this.data,
      };
    }
  }
}
