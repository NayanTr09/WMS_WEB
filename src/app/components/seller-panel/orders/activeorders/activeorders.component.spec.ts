import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveordersComponent } from './activeorders.component';

describe('ActiveordersComponent', () => {
  let component: ActiveordersComponent;
  let fixture: ComponentFixture<ActiveordersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ActiveordersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ActiveordersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
