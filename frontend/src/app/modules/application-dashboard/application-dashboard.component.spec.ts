import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ApplicationDashboardComponent} from './application-dashboard.component';
import {PageComponent} from './components/page/page.component';
import {ApplicationSelectComponent} from './components/application-select/application-select.component';
import {CsiGraphComponent} from './components/csi-graph/csi-graph.component';
import {PageMetricComponent} from './components/page-metric/page-metric.component';
import {CsiInfoComponent} from './components/csi-info/csi-info.component';
import {SharedMocksModule} from '../../testing/shared-mocks.module';
import {ApplicationService} from '../../services/application.service';
import {CsiValueBigComponent} from '../shared/components/csi-value/csi-value-big/csi-value-big.component';
import {CsiValueBaseComponent} from '../shared/components/csi-value/csi-value-base.component';
import {CsiValueMediumComponent} from '../shared/components/csi-value/csi-value-medium/csi-value-medium.component';
import {ApplicationJobStatusComponent} from './components/application-job-status/application-job-status.component';
import {GraphiteIntegrationComponent} from './components/application-job-status/graphite-integration/graphite-integration.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MeasurandSelectComponent} from '../result-selection/components/measurands/measurand-select/measurand-select.component';
import {ResultSelectionService} from '../result-selection/services/result-selection.service';
import {GrailsBridgeService} from '../../services/grails-bridge.service';

describe('ApplicationDashboardComponent', () => {
  let component: ApplicationDashboardComponent;
  let fixture: ComponentFixture<ApplicationDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedMocksModule,
        FormsModule,
        ReactiveFormsModule
      ],
      declarations: [
        ApplicationDashboardComponent,
        PageComponent,
        CsiGraphComponent,
        CsiInfoComponent,
        ApplicationSelectComponent,
        ApplicationJobStatusComponent,
        GraphiteIntegrationComponent,
        PageMetricComponent,
        CsiValueBigComponent,
        CsiValueBaseComponent,
        CsiValueMediumComponent,
        MeasurandSelectComponent
      ],
      providers: [
        ApplicationService,
        ResultSelectionService,
        GrailsBridgeService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
