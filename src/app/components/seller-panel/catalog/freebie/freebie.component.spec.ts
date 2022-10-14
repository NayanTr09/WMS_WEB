import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreebieComponent } from './freebie.component';

describe('FreebieComponent', () => {
  let component: FreebieComponent;
  let fixture: ComponentFixture<FreebieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FreebieComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FreebieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
