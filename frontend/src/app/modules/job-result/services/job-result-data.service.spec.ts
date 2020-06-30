import {TestBed} from '@angular/core/testing';

import {JobResultDataService} from './job-result-data.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('JobResultDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule]
  }));

  it('should be created', () => {
    const service: JobResultDataService = TestBed.get(JobResultDataService);
    expect(service).toBeTruthy();
  });
});
