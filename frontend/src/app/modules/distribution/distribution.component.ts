import {Component, OnInit, ViewChild} from '@angular/core';
import {DistributionData, DistributionDataDTO} from './models/distribution-data.model';
import {URL} from '../../enums/url.enum';
import {ResultSelectionStore} from '../result-selection/services/result-selection.store';
import {BehaviorSubject} from 'rxjs';
import {ViolinchartDataService} from './services/violinchart-data.service';
import {ViolinChartComponent} from './components/violin-chart/violin-chart.component';

@Component({
  selector: 'osm-distribution',
  templateUrl: './distribution.component.html',
  styleUrls: ['./distribution.component.scss']
})
export class DistributionComponent implements OnInit {

  showChartCard = false;
  results$ = new BehaviorSubject<DistributionDataDTO>(new DistributionData());

  @ViewChild(ViolinChartComponent)
  private violinChartComponent: ViolinChartComponent;

  constructor(private violinChartService: ViolinchartDataService, private resultSelectionStore: ResultSelectionStore) {
  }

  ngOnInit() {
    this.showChartCard = false;
    if (this.resultSelectionStore.validQuery) {
      this.getDistributionChartData();
    }
  }

  getDistributionChartData(): void {
    this.results$.next(null);
    this.showChartCard = true;

    this.violinChartComponent.writeQueryWithAdditionalParams();

    this.violinChartService.fetchDistributionData<DistributionDataDTO>(
      this.resultSelectionStore.resultSelectionCommand,
      this.resultSelectionStore.remainingResultSelection,
      URL.DISTRIBUTION_VIOLINCHART_DATA
    ).subscribe((next: DistributionDataDTO) => {
      this.results$.next(next);
    });
  }
}
