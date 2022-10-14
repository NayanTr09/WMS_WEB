import { CustomFilters } from '../../helper/filters/filters.component';

export interface IFiltersInfo {
  date: CustomFilters;
  sku: CustomFilters;
  type: CustomFilters;
}

export interface IFilters {
  date: { start: string; end: string };
  sku: string;
}

export interface IFreebieProduct {
  id: number;
  vendor_id: number;
  type: number;
  freebie_type: string;
  condition: string;
  status: number;
  shipping_status: null;
  created_at: string;
}

export enum ActionEnum {
  product = 'product',
  combo = 'combo',
  mapped = 'mapped',
}

export interface IProductsElement {
  position: number;
  sku: string;
  brand: string;
  name: string;
  mrp: string;
  dimensions: string;
  weight: string;
  image: string;
  combo: any[];
  listings: any[];
}

export interface IOptions {
  id: any;
  value: string;
}

export type TSku = { id: number; sku: string; name: string };
