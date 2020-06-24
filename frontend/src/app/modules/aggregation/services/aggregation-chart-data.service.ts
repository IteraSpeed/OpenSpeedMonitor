import {Injectable} from '@angular/core';
import {scaleOrdinal} from 'd3-scale';
import {URL} from '../../../enums/url.enum';
import {BarchartDataService} from './barchart-data.service';
import {BehaviorSubject, combineLatest, Subject} from 'rxjs';
import {ResultSelectionCommand} from '../../result-selection/models/result-selection-command.model';
import {RemainingResultSelection} from '../../result-selection/models/remaing-result-selection.model';
import {AggregationChartDataByMeasurand} from '../models/aggregation-chart-data.model';
import {AggregationChartSeries} from '../models/aggregation-chart-series.model';
import {SpinnerService} from '../../shared/services/spinner.service';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {ResultSelectionStore} from '../../result-selection/services/result-selection.store';
import {TranslateService} from '@ngx-translate/core';
import {MeasurandColorService} from '../../shared/services/measurand-color.service';

@Injectable({
  providedIn: 'root'
})
export class AggregationChartDataService {

  allMeasurandDataMap: AggregationChartDataByMeasurand = {};
  filterRules = {};
  i18nMap: { comparativeDeterioration: string, comparativeImprovement: string, jobGroup: string, measurand: string, page: string };
  series: AggregationChartSeries[] = [];
  filter = 'asc';
  aggregationType = 'avg';
  percentileValue = 50;
  stackBars = false;
  dataForScoreBar: { min: number, max: number, barsToRender: Array<any> } = {min: 0, max: 0, barsToRender: []};
  dataForHeader = '';
  uniqueSideLabels: string[] = [];
  hasComparativeData = false;

  measurandOrder: string[] = [
    'CS_BY_WPT_VISUALLY_COMPLETE',
    'CS_BY_WPT_DOC_COMPLETE',
    'FULLY_LOADED_TIME',
    'VISUALLY_COMPLETE',
    'VISUALLY_COMPLETE_99',
    'VISUALLY_COMPLETE_95',
    'VISUALLY_COMPLETE_90',
    'VISUALLY_COMPLETE_85',
    'CONSISTENTLY_INTERACTIVE',
    'FIRST_INTERACTIVE',
    'SPEED_INDEX',
    'DOC_COMPLETE_TIME',
    'LOAD_TIME',
    'START_RENDER',
    'DOM_TIME',
    'FIRST_BYTE',
    'FULLY_LOADED_INCOMING_BYTES',
    'DOC_COMPLETE_INCOMING_BYTES',
    'FULLY_LOADED_REQUEST_COUNT',
    'DOC_COMPLETE_REQUESTS'
  ];

  barchartAverageData$: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  barchartMedianData$: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  ascSelected = true;
  descSelected = false;

  constructor(private barchartDataService: BarchartDataService,
              private route: ActivatedRoute,
              private router: Router,
              private resultSelectionStore: ResultSelectionStore,
              private spinnerService: SpinnerService,
              private translateService: TranslateService,
              private measurandColorService: MeasurandColorService
  ) {
    this.readChartSettingsByUrl();
  }

  getBarchartData(resultSelectionCommand: ResultSelectionCommand,
                  remainingResultSelection: RemainingResultSelection): void {
    this.spinnerService.showSpinner('aggregation-chart-spinner');
    const finishedLoadingAvg$: Subject<void> = new Subject<void>();
    const finishedLoadingPercentile$: Subject<void> = new Subject<void>();

    combineLatest(finishedLoadingAvg$, finishedLoadingPercentile$).subscribe(() => {
      this.spinnerService.hideSpinner('aggregation-chart-spinner');
      this.hideChartIfNoDataAvailable();
    });

    this.writeQueryWithAdditionalParams();

    this.barchartDataService.fetchBarchartData<any>(
      resultSelectionCommand,
      remainingResultSelection,
      'avg',
      URL.AGGREGATION_BARCHART_DATA
    ).subscribe(result => {
      this.barchartAverageData$.next(this.sortDataByMeasurandOrder(result));
      finishedLoadingAvg$.next();
    });

    this.barchartDataService.fetchBarchartData<any>(
      resultSelectionCommand,
      remainingResultSelection,
      this.percentileValue,
      URL.AGGREGATION_BARCHART_DATA
    ).subscribe(result => {
      this.barchartMedianData$.next(this.sortDataByMeasurandOrder(result));
      finishedLoadingPercentile$.next();
    });
  }

  reloadPercentile(percentile: number,
                   resultSelectionCommand: ResultSelectionCommand,
                   remainingResultSelection: RemainingResultSelection
  ): void {
    this.percentileValue = percentile;
    this.barchartDataService.fetchBarchartData<any>(
      resultSelectionCommand,
      remainingResultSelection,
      this.percentileValue,
      URL.AGGREGATION_BARCHART_DATA
    ).subscribe(result => {
      this.barchartMedianData$.next(this.sortDataByMeasurandOrder(result));
      this.writeQueryWithAdditionalParams();
    });
  }

  setData(): void {
    let data;
    if (this.aggregationType === 'percentile') {
      data = this.barchartMedianData$.getValue();
    } else {
      data = this.barchartAverageData$.getValue();
    }
    this.filterRules = data.filterRules;
    this.i18nMap = data.i18nMap;
    this.series = data.series;
    this.hasComparativeData = data.hasComparativeData;
    this.setMeasurandDataMap(data.series);
    Object.keys(this.allMeasurandDataMap).forEach((measurand) => {
      this.sortSeriesByFilterRule(this.allMeasurandDataMap[measurand]);
    });
    this.setDataForScoreBar();
    this.setDataForHeader();
    this.setUniqueSideLabels();
    if (!this.hasComparativeData) {
      this.createEmptyBarsForMissingData();
    }
  }

  setMeasurandDataMap(series: AggregationChartSeries[]): void {
    let measurands: string[] = [];
    const measurandDataMap: AggregationChartDataByMeasurand = {};
    if (series) {
      if (this.hasComparativeData) {
        series = this.setComparativeData(series);
      }
      series.forEach(datum => {
        datum.sideLabel = this.setDataForSideLabel(series, datum);
      });

      measurands = series.map(x => x.measurand).filter((v, i, a) => a.indexOf(v) === i);
      measurands.map(measurand => {
        measurandDataMap[measurand] = {
          measurand: measurand,
          series: series.filter(datum => datum.measurand === measurand),
          aggregationValue: '',
          label: '',
          measurandGroup: '',
          unit: '',
          highlighted: false,
          selected: false,
          hasComparative: false,
          color: '',
        };
      });

      Object.keys(measurandDataMap).forEach(measurand => {
        const measurandData = measurandDataMap[measurand];
        const firstSeries = measurandData.series[0];
        measurandData.aggregationValue = firstSeries.aggregationValue;
        measurandData.label = firstSeries.measurandLabel;
        measurandData.measurandGroup = firstSeries.measurandGroup;
        measurandData.unit = firstSeries.unit;
        measurandData.highlighted = false;
        measurandData.selected = false;
        measurandData.hasComparative = this.hasComparativeData;
        measurandData.isImprovement = firstSeries.isImprovement;
        measurandData.isDeterioration = firstSeries.isDeterioration;

        if (measurandData.isImprovement || measurandData.isDeterioration) {
          const color = this.measurandColorService.getColorScaleForTrafficLight()(measurandData.isImprovement ? 'good' : 'bad');
          measurandData.color = color.toString();
        } else {
          const unit = measurandData.unit;
          const colorScales = {};
          colorScales[unit] = colorScales[unit] || this.measurandColorService.getColorScaleForMeasurandGroup(unit, this.hasComparativeData);
          measurandData.color = colorScales[unit](measurands.indexOf(measurand));
        }
      });
    }
    this.allMeasurandDataMap = measurandDataMap;
  }

  setDataForScoreBar(): void {
    const barsToRender = [];
    let minValue = 0;
    let maxValue = 0;
    const availableScoreBars = [
      {
        id: 'good',
        fill: '#bbe2bb',
        label: this.translateService.instant('frontend.de.iteratec.osm.barchart.scores.good'),
        cssClass: 'd3chart-good',
        end: 1000,
        start: 0
      },
      {
        id: 'okay',
        fill: '#f9dfba',
        label: this.translateService.instant('frontend.de.iteratec.osm.barchart.scores.ok'),
        cssClass: 'd3chart-okay',
        end: 3000,
        start: 0

      },
      {
        id: 'bad',
        fill: '#f5d1d0',
        label: this.translateService.instant('frontend.de.iteratec.osm.barchart.scores.bad'),
        cssClass: 'd3chart-bad',
        end: undefined,
        start: 0
      }
    ];
    let values = [];
    if (this.allMeasurandDataMap) {
      Object.keys(this.allMeasurandDataMap).forEach(k => {
        values = values.concat(this.allMeasurandDataMap[k].series.map(x => x.value));
      });
      minValue = values.length > 0 ? Math.min(Math.min.apply(null, values), 0) : 0;
      maxValue = values.length > 0 ? Math.max(Math.max.apply(null, values), 0) : 0;
      this.dataForScoreBar.min = minValue;
      this.dataForScoreBar.max = maxValue;

      let lastBarEnd = 0;
      for (let curScoreBar = 0; curScoreBar < availableScoreBars.length; curScoreBar++) {
        const bar = availableScoreBars[curScoreBar];
        barsToRender.push(bar);
        bar.start = lastBarEnd;
        if (!bar.end || maxValue < bar.end || !availableScoreBars[curScoreBar + 1]) {
          bar.end = maxValue;
          break;
        }
        lastBarEnd = bar.end;
      }
      barsToRender.reverse();
      this.dataForScoreBar.barsToRender = barsToRender;
    }
  }

  setDataForHeader(): void {
    const data = this.getDataForLabels();
    let header = '';
    let aggregation = '';
    const pages = data.map(x => x.page).filter((el, i, a) => i === a.indexOf(el));
    const jobGroups = data.map(x => x.jobGroup).filter((el, i, a) => i === a.indexOf(el));
    this.aggregationType === 'avg' ?
      aggregation = this.translateService.instant('frontend.de.iteratec.osm.barchart.settings.average') :
      aggregation = `${this.translateService.instant('frontend.de.iteratec.osm.barchart.settings.percentile')} ${this.percentileValue}%`;

    if (pages.length > 1 && jobGroups.length > 1) {
      header = aggregation;
    } else if (pages.length > 1 && jobGroups.length === 1) {
      header = `${jobGroups[0]} - ${aggregation}`;
    } else if (jobGroups.length > 1 && pages.length === 1) {
      pages[0] !== null ? header = `${pages[0]} - ${aggregation}` : header = aggregation;
    } else if (pages.length === 1 && jobGroups.length === 1) {
      pages[0] !== null ? header = `${jobGroups[0]}, ${pages[0]} - ${aggregation}` : header = `${jobGroups[0]} - ${aggregation}`;
    }
    this.dataForHeader = header;
  }

  setUniqueSideLabels(): void {
    this.uniqueSideLabels = this.getDataForLabels().map(x => x.sideLabel).filter((el, i, a) => i === a.indexOf(el));
  }

  createEmptyBarsForMissingData(): void {
    let sideLabelsForMeasurand: string[] = [];
    Object.keys(this.allMeasurandDataMap).forEach((measurand) => {
      const data = this.allMeasurandDataMap[measurand];
      if (this.uniqueSideLabels.length === data.series.length) {
        return this.allMeasurandDataMap;
      } else if (this.uniqueSideLabels.length > data.series.length) {
        sideLabelsForMeasurand = data.series.map(x => x.sideLabel);
        this.uniqueSideLabels.forEach((label) => {
          if (!sideLabelsForMeasurand.includes(label)) {
            data.series.push({
              aggregationValue: data.aggregationValue,
              sideLabel: label,
              value: null,
              measurand: measurand,
              jobGroup: null,
              page: null,
              measurandGroup: data.measurandGroup,
              measurandLabel: data.label,
              unit: data.unit
            });
          }
        });
      }
    });
  }

  setComparativeData(series: AggregationChartSeries[]) {
    const comparativeData: AggregationChartSeries[] = [];
    series.forEach(datum => {
      const difference = datum.value - datum.valueComparative;
      const isImprovement = (datum.measurandGroup === 'PERCENTAGES') ? difference > 0 : difference < 0;
      const measurandSuffix = isImprovement ? 'improvement' : 'deterioration';
      const label = isImprovement ?
        (this.i18nMap.comparativeImprovement || 'improvement') :
        (this.i18nMap.comparativeDeterioration || 'deterioration');
      comparativeData.push({
        measurand: datum.measurand + '_' + measurandSuffix,
        aggregationValue: datum.aggregationValue,
        jobGroup: datum.jobGroup,
        measurandGroup: datum.measurandGroup,
        measurandLabel: label,
        page: datum.page,
        value: difference,
        unit: datum.unit,
        sideLabel: datum.sideLabel,
        browser: datum.browser,
        deviceType: datum.deviceType,
        operatingSystem: datum.operatingSystem,
        isImprovement: isImprovement,
        isDeterioration: !isImprovement
      });
    });
    return series.concat(comparativeData);
  }

  writeQueryWithAdditionalParams(): void {
    const additionalParams: Params = {
      filter: this.filter,
      aggregationType: this.aggregationType,
      percentileValue: this.percentileValue,
      stackBars: this.stackBars ? 1 : 0
    };

    this.resultSelectionStore.writeQueryParams(additionalParams);
  }

  private readChartSettingsByUrl(): void {
    this.route.queryParams.subscribe((params: Params) => {
      this.filter = params.filter ? params.filter : this.filter;
      this.aggregationType = params.aggregationType ? params.aggregationType : this.aggregationType;
      this.stackBars = params.stackBars === '1';
      this.percentileValue = params.percentileValue ? parseInt(params.percentileValue, 10) : this.percentileValue;
    });
  }

  private sortDataByMeasurandOrder(data) {
    if (Object.getOwnPropertyNames(data).length < 1) {
      return data;
    }
    data.series.sort((a, b) => {
      const idxA = this.measurandOrder.indexOf(a.measurand);
      const idxB = this.measurandOrder.indexOf(b.measurand);
      if (idxA < 0) {
        return (idxB < 0) ? 0 : 1;
      }
      return (idxB < 0) ? -1 : (idxA - idxB);
    });
    return data;
  }

  private sortSeriesByFilterRule(data): void {
    if (this.filter === 'desc') {
      this.ascSelected = false;
      this.descSelected = true;
      Object.keys(this.filterRules).forEach((key) => this.filterRules[key].selected = false);
      data.series = data.series.sort((a, b) => (a.value > b.value) ? -1 : ((b.value > a.value) ? 1 : 0));
    } else if (Object.keys(this.filterRules).includes(this.filter)) {
      this.ascSelected = false;
      this.descSelected = false;
      Object
        .keys(this.filterRules)
        .forEach((key) => key === this.filter ? this.filterRules[key].selected = true : this.filterRules[key].selected = false);
      const keyForFilterRule = Object.keys(this.filterRules).filter((key) => key === this.filter).toString();
      const filterRule = this.filterRules[keyForFilterRule];
      data.series = data.series.filter(datum => filterRule.some(x => datum.jobGroup === x.jobGroup && datum.page === x.page));
    } else {
      this.filter = 'asc';
      this.ascSelected = true;
      this.descSelected = false;
      Object.keys(this.filterRules).forEach((key) => this.filterRules[key].selected = false);
      data.series = data.series.sort((a, b) => (a.value < b.value) ? -1 : ((b.value < a.value) ? 1 : 0));
    }
  }

  private setDataForSideLabel(series: AggregationChartSeries[], datum: AggregationChartSeries): string {
    const pages = series.map(x => x.page).filter((el, i, a) => i === a.indexOf(el));
    const jobGroups = series.map(x => x.jobGroup).filter((el, i, a) => i === a.indexOf(el));
    const browsers = series.map(x => x.browser).filter((el, i, a) => i === a.indexOf(el));
    let sideLabel = '';
    if (pages.length > 1 && jobGroups.length > 1) {
      sideLabel = `${datum.page}, ${datum.jobGroup}`;
    } else if (pages.length > 1 && jobGroups.length === 1) {
      sideLabel = datum.page;
    } else if (jobGroups.length > 1 && pages.length === 1) {
      sideLabel = datum.jobGroup;
    } else if (pages.length === 1 && jobGroups.length === 1) {
      sideLabel = '';
    }
    if (browsers.length > 1) {
      if (sideLabel.length > 0) {
        sideLabel = `${sideLabel}, ${datum.browser}`;
      } else if (sideLabel.length === 0) {
        sideLabel = datum.browser;
      }
    }

    return sideLabel;
  }

  private getDataForLabels(): any[] {
    const dataForLabels = [];
    Object.keys(this.allMeasurandDataMap).forEach(measurand => {
      const measurandData = this.allMeasurandDataMap[measurand];
      measurandData.series.forEach(datum => {
        dataForLabels.push({
          jobGroup: datum.jobGroup,
          page: datum.page,
          sideLabel: datum.sideLabel
        });
      });
    });
    return dataForLabels;
  }

  private hideChartIfNoDataAvailable(): void {
    if (
      Object.keys(this.barchartAverageData$.getValue()).length < 1 &&
      Object.keys(this.barchartMedianData$.getValue()).length < 1 &&
      this.barchartAverageData$.getValue().length !== 0 &&
      this.barchartMedianData$.getValue().length !== 0
    ) {
      this.resultSelectionStore.dataAvailable$.next(false);
      this.router.navigate([], {
        replaceUrl: true
      });
    }
  }
}
