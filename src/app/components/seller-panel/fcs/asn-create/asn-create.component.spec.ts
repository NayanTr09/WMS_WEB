import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsnCreateComponent } from './asn-create.component';

describe('AsnCreateComponent', () => {
  let component: AsnCreateComponent;
  let fixture: ComponentFixture<AsnCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AsnCreateComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AsnCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
