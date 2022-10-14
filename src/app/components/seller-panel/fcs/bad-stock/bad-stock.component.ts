import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { CustomFilters } from 'src/app/components/helper/filters/filters.component';
import { EndpointFCS, FcsService } from 'src/app/services/http/fcs.service';
import { GoogleAnalyticsService } from 'src/app/services/http/google-analytics.service';
import { FiltersInfo, IBadStock, IQueryParam } from './bad-stock.model';

@Component({
  selector: 'app-bad-stock',
  templateUrl: './bad-stock.component.html',
  styleUrls: ['./bad-stock.component.scss'],
})
export class BadStockComponent implements OnInit, OnDestroy {
  @Output() paramsEvent: EventEmitter<any> = new EventEmitter();
  private sink = new Subscription();
  filters_info: {
    date: CustomFilters;
    sku: CustomFilters;
    product_name: CustomFilters;
    type: CustomFilters;
    warehouse_code: CustomFilters;
  };

  queryparams: IQueryParam = {
    page: 1,
    per_page: 15,
    warehouse_code: '',
    sku: '',
    type: null,
    product_name: '',
    date_from: '',
    date_to: '',
    is_web: 1,
  };
  pageSizeOptions: number[] = [15, 30, 60];
  resultsLength: number;
  currentPage: number;

  tableSource: MatTableDataSource<IBadStock>;
  firstTimeLoad: boolean = true;
  displayedColumns: string[] = [
    'sku',
    'sr_pin',
    'product_name',
    'warehouse_code',
    'type',
    'date',
    'time',
    'quantity',
    'bad_stock_id',
  ];
  fulfillmentCenters: Record<string, { name: string; value: string }> = {};

  constructor(
    private ga: GoogleAnalyticsService,
    private fcsService: FcsService,
    private toastr: ToastrService
  ) {
    this.filters_info = Object.assign({}, FiltersInfo);
  }

  ngOnInit(): void {
    this.getWarehouses();
  }

  updateFilters($event): void {
    let filters_array = Object.keys(this.filters_info);

    for (let ft of filters_array) {
      if (ft == 'date') {
        this.queryparams.date_from = $event.filters[ft].start;
        this.queryparams.date_to = $event.filters[ft].end;
      } else {
        this.queryparams[ft] = $event.filters[ft];
      }
    }

    this.updateParams(this.queryparams);
    this.getBadStock();
  }

  updateParams(queryparams: any): void {
    this.paramsEvent.emit({ 'bad-stock': queryparams });
  }

  handlePage(e: any): void {
    if (e.previousPageIndex >= e.pageIndex) {
      if (e.previousPageIndex == 0 && e.pageIndex == 0) {
        this.queryparams.page = this.currentPage = 1;
      } else {
        this.queryparams.page = this.currentPage;
      }
    } else {
      this.queryparams.page = this.currentPage + 2;
    }
    this.queryparams.per_page = e.pageSize;
    this.updateParams(this.queryparams);
    this.getBadStock();
  }

  getBadStock(): void {
    let qp = Object.assign({}, this.queryparams);

    this.sink.add(
      this.fcsService.requestToEndpoint(EndpointFCS.badStockList, qp).subscribe(
        (resp) => {
          this.firstTimeLoad = false;
          let meta = resp.meta;
          let links = resp.links;

          if (links.next) {
            this.resultsLength = meta.per_page * (meta.current_page + 1);
          } else {
            this.resultsLength = 0;
          }

          this.currentPage = meta.current_page - 1;
          this.queryparams.page = meta.current_page;
          this.tableSource = new MatTableDataSource(resp.data);
        },
        (err) => {
          console.error(err);
        }
      )
    );
  }

  getWarehouses() {
    const endpoint = 'warehouse/get-vendor-warehouses-list';
    const params = { with_warehouse: 1, is_web: 1 };
    this.fcsService
      .requestToEndpoint(endpoint, params)
      .subscribe((resp: any) => {
        const { warehouses } = resp?.data;
        if (!warehouses?.length) {
          this.toastr.warning('No Fulfillment Center Found', 'Warning');
          return;
        }

        const temp = {};
        warehouses.forEach((wh) => {
          temp[wh.warehouse_code] = {
            name: wh.name + '(' + wh.warehouse_code + ')',
            value: wh.warehouse_code,
          };
        });

        this.fulfillmentCenters = temp;
        this.filters_info.warehouse_code.data = Object.values(
          this.fulfillmentCenters
        );
      }, console.error);
  }

  getWhByCode(whCode: string): string {
    return this.fulfillmentCenters[whCode]?.name;
  }

  ngOnDestroy(): void {
    this.sink.unsubscribe();
  }
}
