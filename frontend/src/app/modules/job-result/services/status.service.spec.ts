import {TestBed} from '@angular/core/testing';

import {StatusService} from './status.service';
import {SharedMocksModule} from '../../../testing/shared-mocks.module';

describe('StatusService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [SharedMocksModule]
  }));

  it('should be created', () => {
    const service: StatusService = TestBed.get(StatusService);
    expect(service).toBeTruthy();
  });
});
