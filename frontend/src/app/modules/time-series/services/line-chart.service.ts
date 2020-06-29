import {ElementRef, Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {take} from 'rxjs/operators';

import {
  BaseType as D3BaseType,
  ContainerElement as D3ContainerElement,
  select as d3Select,
  selectAll as d3SelectAll,
  Selection as D3Selection
} from 'd3-selection';

import {ScaleLinear as D3ScaleLinear, ScaleTime as D3ScaleTime} from 'd3-scale';
import {axisBottom as d3AxisBottom} from 'd3-axis';
import {Transition as D3Transition} from 'd3-transition';

import {EventResultDataDTO} from 'src/app/modules/time-series/models/event-result-data.model';
import {EventResultSeriesDTO} from 'src/app/modules/time-series/models/event-result-series.model';
import {EventResultPointDTO} from 'src/app/modules/time-series/models/event-result-point.model';
import {EventDTO, TimeEvent} from 'src/app/modules/time-series/models/event.model';
import {TimeSeries} from 'src/app/modules/time-series/models/time-series.model';
import {TimeSeriesPoint} from 'src/app/modules/time-series/models/time-series-point.model';
import {parseDate} from 'src/app/utils/date.util';
import {UrlBuilderService} from './url-builder.service';
import {LineChartScaleService} from './chart-services/line-chart-scale.service';
import {LineChartDrawService} from './chart-services/line-chart-draw.service';
import {LineChartDomEventService} from './chart-services/line-chart-dom-event.service';
import {LineChartLegendService} from './chart-services/line-chart-legend.service';
import {SummaryLabel} from '../models/summary-label.model';
import {LineChartTimeEventService} from './chart-services/line-chart-time-event.service';

/**
 * Generate line charts with ease and fun 😎
 */
@Injectable({
  providedIn: 'root'
})
export class LineChartService {
  // D3 margin conventions
  // > With this convention, all subsequent code can ignore margins.
  // see: https://bl.ocks.org/mbostock/3019563
  private MARGIN: { [key: string]: number } = {top: 60, right: 60, bottom: 20, left: 75};
  private Y_AXIS_WIDTH = 65;
  private readonly LEGEND_GROUP_OFFSET = 130;

  private _margin: { [key: string]: number } = {
    top: this.MARGIN.top,
    right: this.MARGIN.right,
    bottom: this.MARGIN.bottom,
    left: this.MARGIN.left
  };
  private _width: number = 600 - this._margin.left - this._margin.right;
  private _height: number = 550 - this._margin.top - this._margin.bottom;
  private _xScale: D3ScaleTime<number, number>;

  constructor(private translationService: TranslateService,
              private urlBuilderService: UrlBuilderService,
              private lineChartScaleService: LineChartScaleService,
              private lineChartDrawService: LineChartDrawService,
              private lineChartDomEventService: LineChartDomEventService,
              private lineChartLegendService: LineChartLegendService,
              private lineChartTimeEventService: LineChartTimeEventService) {
  }

  private _dataTrimLabels: { [key: string]: string } = {};

  get dataTrimLabels(): { [p: string]: string } {
    return this._dataTrimLabels;
  }

  private _dataMaxValues: { [key: string]: number } = {};

  get dataMaxValues(): { [p: string]: number } {
    return this._dataMaxValues;
  }

  initChart(svgElement: ElementRef, pointSelectionErrorHandler: Function): void {
    this.lineChartDomEventService.pointSelectionErrorHandler = pointSelectionErrorHandler;

    const data: { [key: string]: TimeSeries[] } = {};
    const chart: D3Selection<D3BaseType, {}, D3ContainerElement, {}> = this.createChart(svgElement);
    this._xScale = this.lineChartScaleService.getXScale(data, this._width);

    this.addXAxisToChart(chart);
    this.lineChartTimeEventService.addEventMarkerGroupToChart(chart);
    this.lineChartTimeEventService.addEventMarkerTooltipBoxToSvgParent();
    this.lineChartDomEventService.prepareMouseEventCatcher(chart, this._width, this._height, this._margin.top, this._margin.left);
  }

  /**
   * Prepares the incoming data for drawing with D3.js
   */
  prepareData(incomingData: EventResultDataDTO,
              dataTrimValues: { [key: string]: { [key: string]: number } }): { [key: string]: TimeSeries[] } {
    const data: { [key: string]: TimeSeries[] } = {};
    const measurandGroups = Object.keys(incomingData.series);
    measurandGroups.forEach((measurandGroup: string) => {
      let maxValue = 0;
      data[measurandGroup] = incomingData.series[measurandGroup].map((seriesDTO: EventResultSeriesDTO) => {
        const lineChartData: TimeSeries = new TimeSeries();
        if (incomingData.summaryLabels.length === 0 ||
          (incomingData.summaryLabels.length > 0 && incomingData.summaryLabels[0].key !== 'measurand')) {
          seriesDTO.identifier = this.lineChartLegendService.translateMeasurand(seriesDTO);
        }
        lineChartData.key = this.lineChartLegendService.generateKey(seriesDTO);

        lineChartData.values = seriesDTO.data.map((point: EventResultPointDTO) => {
          const lineChartDataPoint: TimeSeriesPoint = new TimeSeriesPoint();
          lineChartDataPoint.date = parseDate(point.date);
          lineChartDataPoint.value = point.value;
          lineChartDataPoint.agent = point.agent;
          lineChartDataPoint.tooltipText = `${seriesDTO.identifier}: `;
          lineChartDataPoint.wptInfo = point.wptInfo;
          maxValue = Math.max(maxValue, point.value);
          return lineChartDataPoint;
        }).filter((point: TimeSeriesPoint) => {
          const min: boolean = dataTrimValues.min[measurandGroup] ? point.value >= dataTrimValues.min[measurandGroup] : true;
          const max: boolean = dataTrimValues.max[measurandGroup] ? point.value <= dataTrimValues.max[measurandGroup] : true;
          return min && max;
        });

        return lineChartData;
      });

      this._dataMaxValues[measurandGroup] = maxValue;
    });

    return data;
  }

  prepareLegendData(incomingData: EventResultDataDTO): void {
    this.lineChartLegendService.setLegendData(incomingData);
  }

  prepareEventsData(events: EventDTO[]): TimeEvent[] {
    this.lineChartTimeEventService.clearEventMarkerSelection();
    return events.map(eventDto => {
      return new TimeEvent(eventDto.id, new Date(eventDto.eventDate), eventDto.description, eventDto.shortName);
    });
  }

  drawLineChart(timeSeries: { [key: string]: TimeSeries[] },
                eventData: TimeEvent[],
                measurandGroups: { [key: string]: string },
                summaryLabels: SummaryLabel[],
                timeSeriesAmount: number,
                dataTrimValues: { [key: string]: { [key: string]: number } }): void {
    this.lineChartDomEventService.prepareCleanState();

    this.adjustChartDimensions(measurandGroups, summaryLabels);
    const chart: D3Selection<D3BaseType, {}, D3ContainerElement, {}> = d3Select('g#time-series-chart-drawing-area');
    const width: number = this.lineChartDrawService.getDrawingAreaWidth(this._width, this.Y_AXIS_WIDTH,
      Object.keys(measurandGroups).length);
    this._xScale = this.lineChartScaleService.getXScale(timeSeries, width);
    const yScales: { [key: string]: D3ScaleLinear<number, number> } = this.lineChartScaleService.getYScales(
      timeSeries, this._height, dataTrimValues);
    this.lineChartDrawService.setYAxesInChart(chart, yScales);
    const legendGroupHeight = this.lineChartLegendService.calculateLegendDimensions(this._width);

    d3Select('svg#time-series-chart')
      .transition()
      .duration(500)
      .attr('height', this._margin.top + this._height + this.LEGEND_GROUP_OFFSET + legendGroupHeight + this._margin.bottom);

    d3Select('.x-axis').transition().call((transition: D3Transition<SVGGElement, any, HTMLElement, any>) => {
      this.lineChartDrawService.updateXAxis(transition, this._xScale);
    });
    this.lineChartDrawService.updateYAxes(yScales, this._width, this.Y_AXIS_WIDTH);
    this.addYAxisUnits(measurandGroups, width);

    const chartContentContainer = chart.select('.chart-content');
    this.lineChartDomEventService.createContextMenu();
    this.lineChartDomEventService.addBrush(chartContentContainer, this._width, this._height, this.Y_AXIS_WIDTH, this._margin,
      this._xScale, timeSeries, dataTrimValues, this.lineChartLegendService.legendDataMap, eventData);
    this.lineChartTimeEventService.addEventTimeLineAndMarkersToChart(chart, this._xScale, eventData, width,
      this._height, this._margin);

    this.lineChartLegendService.addLegendsToChart(chartContentContainer, this._xScale, yScales, timeSeries, timeSeriesAmount);
    this.lineChartLegendService.setSummaryLabel(chart, summaryLabels, this._width);

    Object.keys(yScales).forEach((key: string, index: number) => {
      this.lineChartDrawService.addDataLinesToChart(chartContentContainer, this.lineChartDomEventService.pointsSelection,
        this._xScale, yScales[key], timeSeries[key], this.lineChartLegendService.legendDataMap, index);
    });

    this.lineChartDomEventService.addMouseMarkerToChart(chartContentContainer);
    this.lineChartDrawService.drawAllSelectedPoints(this.lineChartDomEventService.pointsSelection);

    this.setDataTrimLabels(measurandGroups);

    chartContentContainer
      .attr('width', this._width)
      .attr('height', this._height);
  }

  restoreZoom(timeSeriesData: { [key: string]: TimeSeries[] },
              dataTrimValues: { [key: string]: { [key: string]: number } },
              events: TimeEvent[]): void {
    const chartContentContainer = d3Select('g#time-series-chart-drawing-area .chart-content');
    this.lineChartDomEventService.restoreSelectedZoom(chartContentContainer, this._width, this._height,
      this.Y_AXIS_WIDTH, this._margin, this._xScale, timeSeriesData, dataTrimValues, this.lineChartLegendService.legendDataMap, events);
  }

  startResize(svgElement: ElementRef): void {
    d3Select(svgElement.nativeElement).transition().duration(100).style('opacity', 0.0);
  }

  resizeChart(svgElement: ElementRef): void {
    this._width = svgElement.nativeElement.parentElement.offsetWidth - this._margin.left - this._margin.right;
    d3Select(svgElement.nativeElement).attr('width', this._width + this._margin.left + this._margin.right);
  }

  endResize(svgElement: ElementRef): void {
    d3Select(svgElement.nativeElement).transition().duration(50).style('opacity', 1.0);
  }

  /**
   * Setup the basic chart with an x- and y-axis
   */
  private createChart(svgElement: ElementRef): D3Selection<D3BaseType, {}, D3ContainerElement, {}> {
    this._width = svgElement.nativeElement.parentElement.offsetWidth - this._margin.left - this._margin.right;
    const svg = d3Select(svgElement.nativeElement)
      .attr('id', 'time-series-chart')
      .attr('width', this._width + this._margin.left + this._margin.right)
      .attr('height', 0);

    svg.append('g')
      .attr('id', 'header-group')
      .attr('transform', `translate(${this._margin.left}, ${this._margin.top - 16})`);

    const chart = svg.append('g') // g =  grouping element; group all other stuff into the chart
      .attr('id', 'time-series-chart-drawing-area')
      // translates the origin to the top left corner (default behavior of D3)
      .attr('transform', `translate(${this._margin.left}, ${this._margin.top})`);

    svg.append('g')
      .attr('id', 'time-series-chart-legend')
      .attr('class', 'legend-group')
      .attr('transform', `translate(${this._margin.left}, ${this._margin.top + this._height + this.LEGEND_GROUP_OFFSET})`);

    return chart;
  }

  /**
   * Print the x-axis on the graph
   */
  private addXAxisToChart(chart: D3Selection<D3BaseType, {}, D3ContainerElement, {}>): void {

    const xAxis = d3AxisBottom(this._xScale);

    // Add the X-Axis to the chart
    chart.append('g')                   // new group for the X-Axis (see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/g)
      .attr('class', 'axis x-axis')  // a css class to style it later
      // even if the D3 method called `axisBottom` we have to move it to the bottom by ourselves
      .attr('transform', `translate(0, ${this._height})`)
      .call(xAxis);
  }

  private adjustChartDimensions(measurandGroups: { [key: string]: string },
                                summaryLabels: SummaryLabel[]): void {
    this._width = this._width + this._margin.right;
    if (Object.keys(measurandGroups).length > 1) {
      this._margin.right = this.MARGIN.right - 30;
    } else {
      this._margin.right = this.MARGIN.right;
    }
    this._width = this._width - this._margin.right;

    if (Object.keys(measurandGroups).length === 1) {
      this._margin.top = this.MARGIN.top;
    } else if (summaryLabels.length === 0 || Object.keys(measurandGroups).length === 2) {
      this._margin.top = this.MARGIN.top + 10;
    } else {
      this._margin.top = this.MARGIN.top + 20;
    }

    d3Select('#time-series-chart')
      .attr('width', this._width + this._margin.left + this._margin.right);

    d3Select('#header-group')
      .attr('transform', `translate(${this._margin.left}, ${this._margin.top - 16})`);

    d3Select('#time-series-chart-drawing-area')
      .attr('transform', `translate(${this._margin.left}, ${this._margin.top})`);

    d3Select('#time-series-chart-legend')
      .attr('transform', `translate(${this._margin.left}, ${this._margin.top + this._height + this.LEGEND_GROUP_OFFSET})`);
  }

  private addYAxisUnits(measurandGroups: { [key: string]: string }, width: number): void {
    d3SelectAll('.axis-unit').selectAll('*').remove();
    const axisLabelKeys = Object.keys(measurandGroups);
    axisLabelKeys.forEach((axisLabelKey: string, index: number) => {
      let xPosition: number;
      if (index === 0) {
        xPosition = -42;
      } else {
        xPosition = width - 12 + this.Y_AXIS_WIDTH * index;
      }
      this.translationService.get(`frontend.de.iteratec.isr.measurand.group.axisLabel.${axisLabelKey}`).pipe(take(1)).subscribe(title => {
        d3Select(`.axis-unit${index}`).append('text')
          .attr('class', 'description unit')
          .attr('transform', `translate(${xPosition}, ${this._height / 2}) rotate(-90)`)
          .text(`${title} [${measurandGroups[axisLabelKey]}]`);
      });
    });
  }

  private setDataTrimLabels(measurandGroups: { [key: string]: string }): void {
    this._dataTrimLabels = measurandGroups;
  }
}
