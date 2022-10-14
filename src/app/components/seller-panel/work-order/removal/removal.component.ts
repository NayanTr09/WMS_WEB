import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { CustomFilters } from 'src/app/components/helper/filters/filters.component';
import { HttpService } from 'src/app/services/http/http.service';
import { SubSink } from 'subsink';

interface RemovalTable {
  return_type: string;
  pyrops_return_id?: null | number;
  total_skus: number;
  total_inventory: number;
  created_at: string;
  status: string;
}

interface Warehouse {
  value: string;
  name: string;
}

interface RemovalResponseInterface {
  status: number;
  data: RemovalTable[];
}

interface QueryParamsInterface {
  page: number;
  per_page: number;
  date_from: string;
  date_to: string;
  is_web: number;
  status: number;
  sku: string;
  type: number;
}

interface ParamsEventInterface {
  removal: QueryParamsInterface;
}

const DefaultQP = {
  date_from: '',
  date_to: '',
  is_web: 1,
  page: 1,
  per_page: 15,
  status: 1,
  sku: '',
  type: null,
};

const RESP = {
  status: 1,
  data: [
    {
      return_type: 'Inventory Return',
      pyrops_return_id: null,
      total_skus: 2,
      total_inventory: 4,
      created_at: '2021-06-03 10:53:17',
      status: 'Pending Approval',
    },
    {
      return_type: 'Inventory Disposal',
      pyrops_return_id: null,
      total_skus: 2,
      total_inventory: 4,
      created_at: '2021-06-04 10:53:59',
      status: 'Pending Approval',
    },
    {
      return_type: 'Inventory Return',
      pyrops_return_id: null,
      total_skus: 2,
      total_inventory: 14,
      created_at: '2021-06-04 10:56:33',
      status: 'Pending Approval',
    },
  ],
};

@Component({
  selector: 'app-removal',
  templateUrl: './removal.component.html',
  styleUrls: ['./removal.component.scss'],
})
export class RemovalComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  @Output()
  paramsEvent: EventEmitter<ParamsEventInterface> = new EventEmitter();
  @Input() query: QueryParamsInterface;
  private subs = new SubSink();
  pageSizeOptions: number[] = [15, 30, 60];
  resultsLength: number;
  dataSource: RemovalTable[];
  warehouses: Warehouse[];
  changed: any = {};
  tableSource: MatTableDataSource<RemovalTable>;
  currentPage: number;
  queryparams: QueryParamsInterface;

  filtersInfo: {
    date: CustomFilters;
    sku: CustomFilters;
    type: CustomFilters;
  };

  displayedColumns: string[] = [
    'return_type',
    'total_skus',
    'total_inventory',
    'created_at',
    'status',
  ];

  constructor(private http: HttpService) {
    this.queryparams = DefaultQP;

    this.filtersInfo = {
      date: {
        name: 'Date',
        label: 'Search by Date Range',
        type: 'date_range',
        data: [],
        field_values: {},
      },
      type: {
        label: 'Search by Type',
        name: 'type',
        placeholder: 'Select Type',
        type: 'select',
        field_values: {},
        data: [
          { name: 'Inventory return', value: 0 },
          { name: 'Disposal', value: 1 },
        ],
      },
      sku: {
        name: 'sku',
        label: 'SKU',
        placeholder: 'Search by SKU',
        tag_name: 'SKU',
        type: 'input',
        main_filter: 1,
        field_values: {},
        data: [],
      },
    };
  }

  ngOnInit(): void {
    this.setFilters();
    this.tableSource = new MatTableDataSource([]);
  }

  ngOnChanges(): void {
    if (this.query && Object.keys(this.query).length) {
      this.queryparams = { ...this.query };
    } else {
      this.queryparams = DefaultQP;
    }

    this.getRemovalList();
  }

  getRemovalList(): void {
    const payload = { ...this.queryparams };

    // HERE: Add company_id to payload
    const endpoint = 'get-return-to-vendor-list';
    this.subs.sink = this.http.getWithParams(endpoint, {}, payload).subscribe(
      (success: RemovalResponseInterface) => {
        console.log('success :>> ', success);
        this.tableSource = new MatTableDataSource(success.data);
      },
      (onErr) => {
        console.error(onErr);
        // this.tableSource = new MatTableDataSource(RESP.data);
      }
    );
  }

  updateParams(queryparams: QueryParamsInterface): void {
    this.paramsEvent.emit({ removal: queryparams });
  }

  setFilters(): void {
    const filtersArray = Object.keys(this.filtersInfo);

    filtersArray.forEach((key) => {
      if (key === 'date') {
        this.filtersInfo[key].field_values = {
          start: this.query?.date_from,
          end: this.query?.date_to,
        };
      } else {
        this.filtersInfo[key].field_values = {
          value: this.query && this.query[key],
        };
      }
    });

    // new chagnes for pagination
    const qpkeys = Object.keys(this.queryparams);
    qpkeys.forEach((key) => {
      if (
        !filtersArray[key] &&
        key !== 'date_from' &&
        key !== 'date_to' &&
        this.query &&
        this.query[key]
      ) {
        this.queryparams[key] = this.query[key];
      }
    });
  }

  updateFilters($event): void {
    const filtersArray = Object.keys(this.filtersInfo);
    this.queryparams.page = this.currentPage = 1;
    filtersArray.forEach((ft) => {
      if (ft === 'date') {
        this.queryparams.date_from = $event.filters[ft].start;
        this.queryparams.date_to = $event.filters[ft].end;
      } else {
        this.queryparams[ft] = $event.filters[ft];
      }
    });

    this.updateParams(this.queryparams);

    // this.getRemovalList();
  }

  handlePage(e): void {
    this.queryparams.page = e.pageIndex;
    this.queryparams.per_page = e.pageSize;
    this.updateParams(this.queryparams);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
