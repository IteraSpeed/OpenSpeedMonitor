import {Component, OnInit} from '@angular/core';
import {BarchartDataService} from './services/barchart-data.service';
import {ResultSelectionStore} from '../result-selection/services/result-selection.store';
import {BehaviorSubject} from 'rxjs';
import {AggregationChartDataService} from './services/aggregation-chart-data.service';

@Component({
  selector: 'osm-aggregation',
  templateUrl: './aggregation.component.html',
  styleUrls: ['./aggregation.component.scss']
})
export class AggregationComponent implements OnInit {

  barchartAverageData$: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  barchartMedianData$: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  showChart = false;

  constructor(private barchartDataService: BarchartDataService,
              private resultSelectionStore: ResultSelectionStore,
              private aggregationChartDataService: AggregationChartDataService) {
  }

  ngOnInit() {
    this.showChart = false;
    this.initDataObservables();
    if (this.resultSelectionStore.validQuery) {
      this.getBarchartData();
    }
  }

  getBarchartData(): void {
    this.showChart = true;
    this.aggregationChartDataService.getBarchartData(
      this.resultSelectionStore.resultSelectionCommand,
      this.resultSelectionStore.remainingResultSelection
    );
  }

  private initDataObservables(): void {
    this.aggregationChartDataService.barchartAverageData$.subscribe((data) => {
      this.barchartAverageData$.next(data);
    });
    this.aggregationChartDataService.barchartMedianData$.subscribe((data) => {
      this.barchartMedianData$.next(data);
    });
    this.resultSelectionStore.dataAvailable$.subscribe((dataAvailable: boolean) => {
      this.showChart = this.showChart && dataAvailable;
    });
  }
}
