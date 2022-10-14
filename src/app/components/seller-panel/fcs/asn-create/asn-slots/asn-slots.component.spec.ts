import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsnSlotsComponent } from './asn-slots.component';

describe('AsnSlotsComponent', () => {
  let component: AsnSlotsComponent;
  let fixture: ComponentFixture<AsnSlotsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AsnSlotsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AsnSlotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
