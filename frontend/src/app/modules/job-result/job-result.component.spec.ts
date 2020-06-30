import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {JobResultComponent} from './job-result.component';
import {SharedModule} from '../shared/shared.module';
import {SharedMocksModule} from '../../testing/shared-mocks.module';
import {OsmLangService} from '../../services/osm-lang.service';
import {GrailsBridgeService} from '../../services/grails-bridge.service';

describe('JobResultComponent', () => {
  let component: JobResultComponent;
  let fixture: ComponentFixture<JobResultComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [JobResultComponent],
      imports: [
        SharedMocksModule
      ],
      providers: [
        OsmLangService,
        GrailsBridgeService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
