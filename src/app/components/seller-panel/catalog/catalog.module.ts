import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CatalogRoutingModule } from './catalog-routing.module';
import { CatalogComponent } from './catalog.component';
import { FreebieListComponent } from './freebie-list/freebie-list.component';
import { SharedModule } from '../common/shared.module';
import { FiltersModule } from '../../helper/filters/filters.module';
import { FreebieComponent } from './freebie/freebie.component';
import { MaterialModule } from './material.module';
import { AddComboComponent } from './add-combo/add-combo.component';
import { AddNewProductComponent } from './add-new-product/add-new-product.component';
import { ProductCatalogComponent } from './product-catalog/product-catalog.component';

@NgModule({
  declarations: [
    CatalogComponent,
    FreebieListComponent,
    FreebieComponent,
    AddComboComponent,
    AddNewProductComponent,
    ProductCatalogComponent,
  ],
  imports: [
    CommonModule,
    CatalogRoutingModule,
    FormsModule,
    SharedModule,
    FiltersModule,
    ReactiveFormsModule,
    MaterialModule,
  ],
})
export class CatalogModule {}
