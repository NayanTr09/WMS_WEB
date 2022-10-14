import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShopifyWidgetStylesComponent } from './shopify-widget-styles.component';

describe('ShopifyWidgetStylesComponent', () => {
  let component: ShopifyWidgetStylesComponent;
  let fixture: ComponentFixture<ShopifyWidgetStylesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShopifyWidgetStylesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShopifyWidgetStylesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
