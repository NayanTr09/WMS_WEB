import { NgModule } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

const AngularMaterialModules = [
  MatTabsModule,
  MatPaginatorModule,
  MatTableModule,
  MatIconModule,
  MatFormFieldModule,
  MatInputModule,
  MatAutocompleteModule,
  MatMenuModule,
  MatButtonModule,
  MatSelectModule,
  MatChipsModule,
  MatTooltipModule,
];

@NgModule({
  imports: [AngularMaterialModules],
  exports: [AngularMaterialModules],
})
export class MaterialModule {}
