import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {URL} from '../../enums/url.enum';
import {LineChartDataService} from './services/line-chart-data.service';
import {ResultSelectionStore} from '../result-selection/services/result-selection.store';
import {EventResultData, EventResultDataDTO} from './models/event-result-data.model';
import {EventDTO} from './models/event.model';
import {BehaviorSubject, forkJoin} from 'rxjs';

@Component({
  selector: 'osm-time-series',
  templateUrl: './time-series.component.html',
  styleUrls: ['./time-series.component.scss'],

  // used to render context menu with styles from time-series.component.scss file
  encapsulation: ViewEncapsulation.None
})
export class TimeSeriesComponent implements OnInit {

  showTimeSeriesChart = false;
  results$ = new BehaviorSubject<EventResultDataDTO>(new EventResultData());

  constructor(private linechartDataService: LineChartDataService, private resultSelectionStore: ResultSelectionStore) {
  }

  ngOnInit() {
    if (this.resultSelectionStore.validQuery) {
      this.getData();
    }
  }

  getData() {
    this.showTimeSeriesChart = true;
    this.results$.next(null);

    forkJoin({
      eventResultData: this.getTimeSeriesChartData(),
      events: this.getEvents()
    })
      .subscribe((next) => {
        next.eventResultData.events = next.events;
        this.results$.next(next.eventResultData);
      });
  }

  private getTimeSeriesChartData() {
    return this.linechartDataService.fetchEventResultData<EventResultDataDTO>(
      this.resultSelectionStore.resultSelectionCommand,
      this.resultSelectionStore.remainingResultSelection,
      URL.EVENT_RESULT_DASHBOARD_LINECHART_DATA
    );
  }

  private getEvents() {
    return this.linechartDataService.fetchEvents<EventDTO[]>(
      this.resultSelectionStore.resultSelectionCommand,
      URL.EVENTS
    );
  }
}
