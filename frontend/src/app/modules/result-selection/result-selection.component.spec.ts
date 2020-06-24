import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ResultSelectionComponent} from './result-selection.component';
import {TimeFrameComponent} from './components/time-frame/time-frame.component';
import {ApplicationComponent} from './components/application/application.component';
import {SharedMocksModule} from '../../testing/shared-mocks.module';
import {ResultSelectionService} from './services/result-selection.service';
import {OsmLangService} from '../../services/osm-lang.service';
import {GrailsBridgeService} from '../../services/grails-bridge.service';
import {MeasurandsComponent} from './components/measurands/measurands.component';
import {MeasurandSelectComponent} from './components/measurands/measurand-select/measurand-select.component';
import {PageLocationConnectivityComponent} from './components/page-location-connectivity/page-location-connectivity.component';
import {ResultSelectionStore} from './services/result-selection.store';
import {SelectionDataComponent} from './components/page-location-connectivity/selection-data/selection-data.component';
import {ResetComponent} from './components/reset/reset.component';
import {SubmitComponent} from './components/submit/submit.component';

describe('ResultSelectionComponent', () => {
  let component: ResultSelectionComponent;
  let fixture: ComponentFixture<ResultSelectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ResultSelectionComponent,
        TimeFrameComponent,
        ApplicationComponent,
        PageLocationConnectivityComponent,
        SelectionDataComponent,
        MeasurandsComponent,
        MeasurandSelectComponent,
        ResetComponent,
        SubmitComponent
      ],
      imports: [
        SharedMocksModule
      ],
      providers: [
        ResultSelectionService,
        ResultSelectionStore,
        OsmLangService,
        GrailsBridgeService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
