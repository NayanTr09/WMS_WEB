import { TitleCasePipe } from '@angular/common';
import { Component, Input, OnChanges, OnInit } from '@angular/core';
import * as HighCharts from 'highcharts';
import HC_more from 'highcharts/highcharts-more';
import HC_exporting from 'highcharts/modules/exporting';

HC_more(HighCharts);
HC_exporting(HighCharts);

@Component({
  selector: 'app-bubble-chart',
  templateUrl: './bubble-chart.component.html',
  styleUrls: ['./bubble-chart.component.scss'],
})
export class BubbleChartComponent implements OnInit, OnChanges {
  @Input() warehouseData = [];
  Highcharts: typeof HighCharts = HighCharts;
  chartOptions: Highcharts.Options = null;

  constructor(private titlecasePipe: TitleCasePipe) {}

  ngOnInit(): void {}

  ngOnChanges(): void {
    const newThis = this;
    if (this.warehouseData.length) {
      this.chartOptions = {
        credits: {
          enabled: false,
        },
        chart: {
          type: 'packedbubble',
        },
        title: {
          text: null,
        },
        tooltip: {
          useHTML: true,
          pointFormat: '{point.value} fulfillments',
        },
        legend: {
          enabled: true,
          // tslint:disable-next-line: typedef
          labelFormatter() {
            return newThis.titlecasePipe.transform(this.name);
          },
        },
        plotOptions: {
          packedbubble: {
            minSize: '10%',
            maxSize: '120%',
            // zMin: 0,
            // zMax: 1000,
            layoutAlgorithm: {
              // splitSeries: false,
              gravitationalConstant: 0.01,
            },
            dataLabels: {
              enabled: true,
              // tslint:disable-next-line: typedef
              formatter() {
                const updatedName = newThis.getFirstWord(this.point.name);
                return newThis.titlecasePipe.transform(updatedName);
              },
              filter: {
                property: 'y',
                operator: '>',
                value: 30,
              },
              style: {
                color: 'black',
                textOutline: 'none',
                fontWeight: 'normal',
              },
            },
          },
        },
        series: this.warehouseData,
      };
    }
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
}
