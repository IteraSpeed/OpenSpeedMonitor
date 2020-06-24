import {TestBed} from '@angular/core/testing';

import {TitleService} from './title.service';
import {SharedMocksModule} from '../testing/shared-mocks.module';

describe('TitleService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [
      SharedMocksModule
    ]
  }));

  it('should be created', () => {
    const service: TitleService = TestBed.get(TitleService);
    expect(service).toBeTruthy();
  });
});
