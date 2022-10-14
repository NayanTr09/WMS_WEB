import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FcsComponent } from './fcs.component';

describe('FcsComponent', () => {
  let component: FcsComponent;
  let fixture: ComponentFixture<FcsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FcsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FcsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
