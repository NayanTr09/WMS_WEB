import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnholdordersComponent } from './onholdorders.component';

describe('OnholdordersComponent', () => {
  let component: OnholdordersComponent;
  let fixture: ComponentFixture<OnholdordersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OnholdordersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OnholdordersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
