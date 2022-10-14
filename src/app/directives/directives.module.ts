import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValidatorDirective } from './validator/validator.directive';

@NgModule({
  declarations: [ValidatorDirective],
  exports: [ValidatorDirective],
})
export class DirectivesModule {}
