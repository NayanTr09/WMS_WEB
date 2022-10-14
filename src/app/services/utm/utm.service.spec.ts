import { TestBed } from '@angular/core/testing';

import { UtmService } from './utm.service';

describe('UtmService', () => {
  let service: UtmService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UtmService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
