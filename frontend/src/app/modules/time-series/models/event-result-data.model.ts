import {EventResultSeriesDTO} from './event-result-series.model';
import {EventDTO} from './event.model';
import {SummaryLabel} from './summary-label.model';

export interface EventResultDataDTO {
  measurandGroups: { [key: string]: string };
  series: EventResultSeriesDTO[];
  events: EventDTO[];
  summaryLabels: SummaryLabel[];
  numberOfTimeSeries: number;
}

export class EventResultData implements EventResultDataDTO {
  measurandGroups: { [key: string]: string };
  series: EventResultSeriesDTO[];
  events: EventDTO[];
  summaryLabels: SummaryLabel[];
  numberOfTimeSeries: number;

  constructor() {
    this.measurandGroups = {};
    this.series = [];
    this.events = [];
    this.summaryLabels = [];
    this.numberOfTimeSeries = 0;
  }
}
