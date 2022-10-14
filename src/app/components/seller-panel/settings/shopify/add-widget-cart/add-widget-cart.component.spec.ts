import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddWidgetCartComponent } from './add-widget-cart.component';

describe('AddWidgetCartComponent', () => {
  let component: AddWidgetCartComponent;
  let fixture: ComponentFixture<AddWidgetCartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddWidgetCartComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddWidgetCartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
