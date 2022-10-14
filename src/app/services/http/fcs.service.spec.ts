import { TestBed } from '@angular/core/testing';

import { FcsService } from './fcs.service';

describe('FcsService', () => {
  let service: FcsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FcsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
