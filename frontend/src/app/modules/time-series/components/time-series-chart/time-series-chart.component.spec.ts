import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {TimeSeriesChartComponent} from './time-series-chart.component';
import {SharedMocksModule} from '../../../../testing/shared-mocks.module';
import {SharedModule} from '../../../shared/shared.module';
import {ResultSelectionStore} from '../../../result-selection/services/result-selection.store';
import {ResultSelectionService} from '../../../result-selection/services/result-selection.service';

describe('TimeSeriesChartComponent', () => {
  let component: TimeSeriesChartComponent;
  let fixture: ComponentFixture<TimeSeriesChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TimeSeriesChartComponent],
      imports: [SharedMocksModule, SharedModule],
      providers: [ResultSelectionStore, ResultSelectionService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeSeriesChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
