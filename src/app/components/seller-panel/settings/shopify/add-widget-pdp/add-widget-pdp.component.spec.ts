import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddWidgetPdpComponent } from './add-widget-pdp.component';

describe('AddWidgetPdpComponent', () => {
  let component: AddWidgetPdpComponent;
  let fixture: ComponentFixture<AddWidgetPdpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddWidgetPdpComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddWidgetPdpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
