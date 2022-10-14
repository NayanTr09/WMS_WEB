import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadStockComponent } from './bad-stock.component';

describe('BadStockComponent', () => {
  let component: BadStockComponent;
  let fixture: ComponentFixture<BadStockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BadStockComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BadStockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
