import {
  AfterContentInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';

import {EventResultData} from '../../models/event-result-data.model';
import {LineChartService} from '../../services/line-chart.service';
import {NgxSmartModalService} from 'ngx-smart-modal';
import {SpinnerService} from '../../../shared/services/spinner.service';
import {TranslateService} from '@ngx-translate/core';
import {TimeEvent} from '../../models/event.model';
import {TimeSeries} from '../../models/time-series.model';


@Component({
  selector: 'osm-time-series-line-chart',
  // needed! otherwise the scss style do not apply to svg content
  // (see https://stackoverflow.com/questions/36214546/styles-in-component-for-d3-js-do-not-show-in-angular-2/36214723#36214723)
  encapsulation: ViewEncapsulation.None,
  templateUrl: './time-series-chart.component.html',
  styleUrls: ['./time-series-chart.component.scss']
})
export class TimeSeriesChartComponent implements AfterContentInit, OnChanges {

  @Input()
  timeSeriesResults: EventResultData;

  @ViewChild('svg')
  svgElement: ElementRef;

  public ngxSmartModalService;

  dataTrimLabels: { [key: string]: string } = {};
  dataTrimInputRange: { [key: string]: { [key: string]: number } } = {min: {}, max: {}};
  dataTrimInputStep: { [key: string]: number } = {};
  maxInputTmpRange: { [key: string]: boolean } = {};

  selectedTrimValues: { [key: string]: { [key: string]: number } } = {min: {}, max: {}};

  private _resizeTimeoutId: number;

  constructor(private lineChartService: LineChartService,
              private spinnerService: SpinnerService,
              private translateService: TranslateService,
              ngxSmartModalService: NgxSmartModalService) {
    this.ngxSmartModalService = ngxSmartModalService;
  }

  ngAfterContentInit(): void {
    this.lineChartService.initChart(this.svgElement, () => this.handlePointSelectionError());
  }

  ngOnChanges(changes: SimpleChanges): void {
    for (const property in changes) {
      if (changes.hasOwnProperty(property)) {
        switch (property) {
          case 'timeSeriesResults': {
            this.redraw();
            this.setDataTrimSettings();
          }
        }
      }
    }
  }

  @HostListener('window:resize', ['$event'])
  windowIsResized(): void {
    this.lineChartService.startResize(this.svgElement);

    // Wait until the resize is done before redrawing the chart
    clearTimeout(this._resizeTimeoutId);
    this._resizeTimeoutId = window.setTimeout(() => {
      this.lineChartService.resizeChart(this.svgElement);
      this.redrawWithRestoredZoomAndLegendSelection();

      this.lineChartService.endResize(this.svgElement);
    }, 500);
  }

  redraw(): void {
    if (this.timeSeriesResults == null) {
      this.spinnerService.showSpinner('time-series-line-chart-spinner');
      return;
    }

    const timeSeries: { [key: string]: TimeSeries[] } = this.lineChartService.prepareData(this.timeSeriesResults, this.selectedTrimValues);
    const eventData: TimeEvent[] = this.lineChartService.prepareEventsData(this.timeSeriesResults.events);

    this.lineChartService.prepareLegendData(this.timeSeriesResults);
    this.lineChartService.drawLineChart(timeSeries, eventData, this.timeSeriesResults.measurandGroups,
      this.timeSeriesResults.summaryLabels, this.timeSeriesResults.numberOfTimeSeries, this.selectedTrimValues);

    this.spinnerService.hideSpinner('time-series-line-chart-spinner');
  }

  redrawWithRestoredZoomAndLegendSelection(): void {
    if (this.timeSeriesResults == null) {
      this.spinnerService.showSpinner('time-series-line-chart-spinner');
      return;
    }

    const timeSeries: { [key: string]: TimeSeries[] } = this.lineChartService.prepareData(this.timeSeriesResults, this.selectedTrimValues);
    const eventData: TimeEvent[] = this.lineChartService.prepareEventsData(this.timeSeriesResults.events);

    this.lineChartService.drawLineChart(timeSeries, eventData, this.timeSeriesResults.measurandGroups,
      this.timeSeriesResults.summaryLabels, this.timeSeriesResults.numberOfTimeSeries, this.selectedTrimValues);
    this.lineChartService.restoreZoom(timeSeries, this.selectedTrimValues, eventData);

    this.spinnerService.hideSpinner('time-series-line-chart-spinner');
  }

  handlePointSelectionError(): void {
    this.ngxSmartModalService.open('pointSelectionErrorModal');
  }

  adjustInputByEvent(event, selectedInput: string, otherInput: string, measurandGroup: string): void {
    if (event.inputType !== 'insertText' && !event.inputType.startsWith('delete')) {
      this.considerMaxInputTmpRange(selectedInput, measurandGroup);
      this.adjustInputRangeAndInputValues(selectedInput, otherInput, measurandGroup);
    }
    this.redrawWithRestoredZoomAndLegendSelection();
  }

  adjustInputRangeAndInputValues(selectedInput: string, otherInput: string, measurandGroup: string): void {
    const previousSelectedMin = this.selectedTrimValues.min[measurandGroup];
    const previousSelectedMax = this.selectedTrimValues.max[measurandGroup];

    if (this.selectedTrimValues.min[measurandGroup] && this.selectedTrimValues.max[measurandGroup] &&
        this.selectedTrimValues.min[measurandGroup] >= this.selectedTrimValues.max[measurandGroup]) {
      this.selectedTrimValues[otherInput][measurandGroup] = selectedInput === 'min' ?
        this.selectedTrimValues[selectedInput][measurandGroup] + this.dataTrimInputStep[measurandGroup] :
        this.selectedTrimValues[selectedInput][measurandGroup] - this.dataTrimInputStep[measurandGroup];
    }

    const inputRangeMin = this.selectedTrimValues.min[measurandGroup] ?
      Math.max(this.dataTrimInputRange.min[measurandGroup], this.selectedTrimValues.min[measurandGroup]) :
      this.dataTrimInputRange.min[measurandGroup];

    const inputRangeMax = this.selectedTrimValues.max[measurandGroup] ?
      Math.min(this.dataTrimInputRange.max[measurandGroup], this.selectedTrimValues.max[measurandGroup]) :
      this.dataTrimInputRange.max[measurandGroup];

    this.adjustInputValues(otherInput, inputRangeMin, inputRangeMax, measurandGroup);
    this.maxInputTmpRange[measurandGroup] = this.selectedTrimValues.min[measurandGroup] &&
      (this.selectedTrimValues.max[measurandGroup] === undefined || this.selectedTrimValues.max[measurandGroup] === null);

    if (previousSelectedMin !== this.selectedTrimValues.min[measurandGroup] ||
        previousSelectedMax !== this.selectedTrimValues.max[measurandGroup]) {
      this.redrawWithRestoredZoomAndLegendSelection();
    }
  }

  private setDataTrimSettings(): void {
    this.dataTrimLabels = this.lineChartService.dataTrimLabels;
    const dataMaxValues = this.lineChartService.dataMaxValues;

    Object.keys(dataMaxValues).forEach((measurandGroup: string) => {
      this.dataTrimInputStep[measurandGroup] = this.getAdequateStep(dataMaxValues[measurandGroup]);
      this.dataTrimInputRange.min[measurandGroup] = 0;
      this.dataTrimInputRange.max[measurandGroup] = this.dataTrimInputStep[measurandGroup] *
        Math.ceil(dataMaxValues[measurandGroup] / this.dataTrimInputStep[measurandGroup]);
    });
  }

  private getAdequateStep(maximumValue: number): number {
    const orderOfMagnitudeOfMaxValue: number = Math.max(Math.floor(Math.log(maximumValue) * Math.LOG10E), 0);
    return 5 * Math.pow(10, orderOfMagnitudeOfMaxValue - 2);
  }

  private adjustInputValues(type: string, inputRangeMin: number, inputRangeMax: number, measurandGroup: string): void {
    if (this.selectedTrimValues[type][measurandGroup] === null || this.selectedTrimValues[type][measurandGroup] === undefined) {
      return;
    }

    if (this.selectedTrimValues[type][measurandGroup] < inputRangeMin) {
      this.selectedTrimValues[type][measurandGroup] = inputRangeMin;
    }
    if (this.selectedTrimValues[type][measurandGroup] > inputRangeMax) {
      this.selectedTrimValues[type][measurandGroup] = inputRangeMax;
    }
  }

  private considerMaxInputTmpRange(selectedInput: string, measurandGroup: string): void {
    if (selectedInput === 'max' && this.maxInputTmpRange[measurandGroup]) {
      this.selectedTrimValues.max[measurandGroup] = this.selectedTrimValues.min[measurandGroup] + this.dataTrimInputStep[measurandGroup];
    }
  }
}
