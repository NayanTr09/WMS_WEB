import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FulfillmentComponent } from './fulfillment.component';

describe('FulfillmentComponent', () => {
  let component: FulfillmentComponent;
  let fixture: ComponentFixture<FulfillmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FulfillmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FulfillmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
