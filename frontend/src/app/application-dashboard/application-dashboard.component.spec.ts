import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {ApplicationDashboardComponent} from './application-dashboard.component';
import {PageListComponent} from './components/page-list/page-list.component';
import {PageComponent} from './components/page/page.component';
import {CsiValueComponent} from './components/csi-value/csi-value.component';
import {ApplicationCsiComponent} from './components/application-csi/application-csi.component';
import {ApplicationSelectComponent} from './components/application-select/application-select.component';
import {SharedMocksModule} from '../testing/shared-mocks.module';
import {ApplicationDashboardService} from './services/application-dashboard.service';
import {CsiGraphComponent} from './components/csi-graph/csi-graph.component';
import {PageMetricComponent} from "./components/page-metric/page-metric.component";

describe('ApplicationDashboardComponent', () => {
  let component: ApplicationDashboardComponent;
  let fixture: ComponentFixture<ApplicationDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ApplicationDashboardComponent,
        PageListComponent,
        PageComponent,
        CsiValueComponent,
        CsiGraphComponent,
        ApplicationCsiComponent,
        ApplicationSelectComponent,
        PageMetricComponent
      ],
      providers: [
        ApplicationDashboardService
      ],
      imports: [
        SharedMocksModule
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
