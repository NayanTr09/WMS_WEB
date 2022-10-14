import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompletedordersComponent } from './completedorders.component';

describe('CompletedordersComponent', () => {
  let component: CompletedordersComponent;
  let fixture: ComponentFixture<CompletedordersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompletedordersComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompletedordersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
