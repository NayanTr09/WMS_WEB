export const SCOPE =
  'read_orders,write_orders,write_shipping,read_themes,write_themes,read_content,write_content,read_products';

export enum apiEnum {
  callback = 'shopify/callback',
  storeUrlList = 'settings/get-shopify-store-url',
  appInstalled = 'settings/app_installed',
  getStyle = 'settings/getStyle',
  updateStyle = 'settings/updateStyle',
  showPreview = 'settings/show_preview',
  productPage = 'settings/product_page',
  removeSnippet = 'settings/remove_snippet_product',
  addSnippetCart = 'settings/add_snippet',
  removeSnippetCart = 'settings/remove_snippet',
}

export interface IStoreUrl {
  store_url: string;
}

export interface IStyles {
  buttonStyle: string;
  textColor: string;
  show_widget: boolean;
  cart_page_snippet: boolean;
  product_page_snippet: boolean;
  _id: string;
  shopName: string;
  __v: number;
  company_id: string;
  textStyle: string;
}

export interface IAvailableStyle {
  style: IStyles;
  success: boolean;
}

export interface IAppStatus {
  success: boolean;
}
