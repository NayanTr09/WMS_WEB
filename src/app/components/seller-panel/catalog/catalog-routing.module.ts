import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AddComboComponent } from './add-combo/add-combo.component';
import { AddNewProductComponent } from './add-new-product/add-new-product.component';
import { CatalogComponent } from './catalog.component';
import { FreebieListComponent } from './freebie-list/freebie-list.component';
import { FreebieComponent } from './freebie/freebie.component';
import { ProductCatalogComponent } from './product-catalog/product-catalog.component';

const routes: Routes = [
  {
    path: 'product',
    children: [
      {
        path: 'add-new-product',
        component: AddNewProductComponent,
      },
      {
        path: 'add-combo',
        component: AddComboComponent,
      },
      {
        path: 'map-products',
        component: AddNewProductComponent,
      },
      {
        path: 'create-freebie',
        component: FreebieComponent,
      },
    ],
  },
  {
    path: 'catalog',
    component: CatalogComponent,
    children: [
      {
        path: 'freebie-list',
        component: FreebieListComponent,
      },
      {
        path: 'product-list',
        component: ProductCatalogComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CatalogRoutingModule {}
