import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsnRescheduleComponent } from './asn-reschedule.component';

describe('AsnRescheduleComponent', () => {
  let component: AsnRescheduleComponent;
  let fixture: ComponentFixture<AsnRescheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AsnRescheduleComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AsnRescheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
