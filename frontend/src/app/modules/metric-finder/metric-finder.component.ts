import {Component, Input, ViewChild} from '@angular/core';
import {Observable} from 'rxjs';
import {TestResult} from './models/test-result.model';
import {MetricFinderService} from './services/metric-finder.service';
import {LineChartComponent} from './components/line-chart/line-chart.component';
import {ComparableFilmstripsComponent} from './components/comparable-filmstrips/comparable-filmstrips.component';

@Component({
  selector: 'osm-metric-finder',
  templateUrl: './metric-finder.component.html',
  styleUrls: ['./metric-finder.component.scss']
})
export class MetricFinderComponent {

  @Input() selectedMetric: string;

  @ViewChild(LineChartComponent)
  lineChartCmp: LineChartComponent;

  @ViewChild(ComparableFilmstripsComponent)
  compFilmstripCmp: ComparableFilmstripsComponent;

  public testResults$: Observable<TestResult[]>;
  public selectedResults: TestResult[] = [];

  constructor(private metricFinderService: MetricFinderService) {
    this.testResults$ = metricFinderService.testResults$;
  }

  setSelectedResults(results: TestResult[]) {
    this.selectedResults = [...results].sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  clearResults() {
    if (this.lineChartCmp) {
      this.lineChartCmp.clearSelection();
      this.lineChartCmp.clearResults();
      this.lineChartCmp.redraw();
    }
    this.compFilmstripCmp.clearResults();
  }
}
