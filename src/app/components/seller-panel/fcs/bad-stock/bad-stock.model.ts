import { CASE } from 'src/app/components/helper/filters/filters.component';
export interface IBadStock {
  sr_pin: string;
  quantity: number;
  product_name: string;
  warehouse_code: string;
  type: string;
  bad_stocks_date: string;
  sku: string;
  bad_stock_id: string;
}

export interface IQueryParam {
  page: number;
  per_page: number;
  product_name: string;
  sku: string;
  warehouse_code: string;
  type: number;
  date_from: string;
  date_to: string;
  is_web: number;
}

export const FiltersInfo = {
  date: {
    name: 'Date',
    label: 'Search by Date Range',
    type: 'date_range',
    data: [],
    field_values: {},
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
  type: {
    label: 'Search by Type',
    name: 'type',
    placeholder: 'Select Type',
    type: 'select',
    field_values: {},
    data: [
      { name: 'ASN', value: 1, case: 'uppercase' as CASE },
      { name: 'RTO', value: 2, case: 'uppercase' as CASE },
    ],
  },
  product_name: {
    tag_name: 'Product Name',
    name: 'search',
    label: 'Product',
    placeholder: 'Search by Product Name',
    type: 'input',
    main_filter: 1,
    field_values: {},
    data: [],
  },
  warehouse_code: {
    label: 'Search by Fulfillment Center',
    type: 'select',
    placeholder: 'Select Fulfillment Center',
    name: 'Fulfillment Center',
    field_values: {},
    data: [],
  },
};
