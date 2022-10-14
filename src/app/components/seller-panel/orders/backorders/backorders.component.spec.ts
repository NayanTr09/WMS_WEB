import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackordersComponent } from './backorders.component';

describe('BackordersComponent', () => {
  let component: BackordersComponent;
  let fixture: ComponentFixture<BackordersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BackordersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BackordersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
