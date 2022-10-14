import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsnCalendarComponent } from './asn-calendar.component';

describe('AsnCalendarComponent', () => {
  let component: AsnCalendarComponent;
  let fixture: ComponentFixture<AsnCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AsnCalendarComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AsnCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
