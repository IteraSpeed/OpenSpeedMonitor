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


@Component({
  selector: 'osm-time-series-line-chart',
  // needed! otherwise the scss style do not apply to svg content
  // (see https://stackoverflow.com/questions/36214546/styles-in-component-for-d3-js-do-not-show-in-angular-2/36214723#36214723)
  encapsulation: ViewEncapsulation.None,
  templateUrl: './time-series-line-chart.component.html',
  styleUrls: ['./time-series-line-chart.component.scss']
})
export class TimeSeriesLineChartComponent implements AfterContentInit, OnChanges {

  @Input()
  timeSeriesResults: EventResultData;

  @ViewChild('svg')
  svgElement: ElementRef;

  public ngxSmartModalService;
  dataTrimLabels: {[key: string]: string} = {};

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
    this.redraw();
  }

  @HostListener('window:resize', ['$event'])
  windowIsResized() {
    this.lineChartService.startResize(this.svgElement);

    // Wait until the resize is done before redrawing the chart
    clearTimeout(this._resizeTimeoutId);
    this._resizeTimeoutId = window.setTimeout(() => {
      this.lineChartService.resizeChart(this.svgElement);
      this.redraw();

      this.lineChartService.endResize(this.svgElement);
    }, 500);
  }

  redraw() {
    if (this.timeSeriesResults == null) {
      this.spinnerService.showSpinner('time-series-line-chart-spinner');
      return;
    }
    this.spinnerService.hideSpinner('time-series-line-chart-spinner');

    this.lineChartService.drawLineChart(this.timeSeriesResults);
    this.dataTrimLabels = this.lineChartService.dataTrimLabels;
  }

  handlePointSelectionError() {
    this.ngxSmartModalService.open('pointSelectionErrorModal');
  }
}
