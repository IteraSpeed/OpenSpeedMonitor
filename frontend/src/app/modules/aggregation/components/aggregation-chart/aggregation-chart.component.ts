import {Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {ChartCommons} from '../../../../enums/chart-commons.enum';
import {select} from 'd3-selection';
import {max} from 'd3-array';
import {ScaleBand, scaleBand, ScaleLinear, scaleLinear} from 'd3-scale';
import 'd3-transition';
import {AggregationChartDataService} from '../../services/aggregation-chart-data.service';
import {BarchartDataService} from '../../services/barchart-data.service';
import {ResultSelectionStore} from '../../../result-selection/services/result-selection.store';
import {AggregationChartDataByMeasurand} from '../../models/aggregation-chart-data.model';

@Component({
  selector: 'osm-aggregation-chart',
  templateUrl: './aggregation-chart.component.html',
  styleUrls: ['./aggregation-chart.component.scss']
})
export class AggregationChartComponent implements OnChanges {

  @ViewChild('svg') svgElement: ElementRef;
  @Input() barchartAverageData = {};
  @Input() barchartMedianData = {};

  filterRules = {};
  hasFilterRules = false;
  showDiagramTypeSwitch = false;

  svgWidth: number;
  svgHeight: number;
  private xScale: ScaleLinear<number, number>;
  private yScale: ScaleBand<string>;

  private sideLabelWidth: number;
  private barsWidth: number;
  private barsHeight: number;

  private headerHeight: number;
  private barScorePosY: number;
  private barScoreHeight: number;
  private legendPosY: number;
  private legendHeight: number;

  private dataForScoreBar: { min: number, max: number, barsToRender: Array<any> };
  private measurandDataMap: AggregationChartDataByMeasurand = {};
  private dataForHeader = '';
  private sideLabels: string[] = [];
  private anyHighlighted = false;
  private anySelected = false;
  private clickedMeasurand = '';

  constructor(public aggregationChartDataService: AggregationChartDataService,
              private barchartDataService: BarchartDataService,
              private resultSelectionStore: ResultSelectionStore
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.redraw();
  }

  selectDiagramType(diagramType: string) {
    this.aggregationChartDataService.stackBars = (diagramType === 'stacked');
    this.aggregationChartDataService.writeQueryWithAdditionalParams();
    this.redraw();
  }

  selectAggregationType(aggregationType: string): void {
    this.aggregationChartDataService.aggregationType = aggregationType;
    this.aggregationChartDataService.writeQueryWithAdditionalParams();
    this.redraw();
  }

  selectFilter(filter: string): void {
    this.aggregationChartDataService.filter = filter;
    this.aggregationChartDataService.writeQueryWithAdditionalParams();
    this.redraw();
  }

  redraw(): void {
    if (Object.keys(this.barchartAverageData).length < 1 || Object.keys(this.barchartMedianData).length < 1) {
      return;
    } else if (this.barchartMedianData.hasOwnProperty('series') && this.barchartMedianData['series'].length === 0) {
      this.aggregationChartDataService.aggregationType = 'avg';
      this.aggregationChartDataService.writeQueryWithAdditionalParams();
    }

    this.aggregationChartDataService.setData();
    this.filterRules = this.aggregationChartDataService.filterRules;
    this.hasFilterRules = Object.keys(this.filterRules).length > 0;
    this.measurandDataMap = this.aggregationChartDataService.allMeasurandDataMap;
    this.dataForScoreBar = this.aggregationChartDataService.dataForScoreBar;
    this.dataForHeader = this.aggregationChartDataService.dataForHeader;
    this.sideLabels = this.aggregationChartDataService.uniqueSideLabels;
    if (this.clickedMeasurand.length > 0 && Object.keys(this.measurandDataMap).includes(this.clickedMeasurand)) {
      this.measurandDataMap[this.clickedMeasurand].selected = true;
    } else {
      this.anySelected = false;
    }
    this.svgWidth = this.svgElement.nativeElement.getBoundingClientRect().width;
    this.svgHeight = this.svgElement.nativeElement.parentElement.offsetHeight;

    this.sideLabelWidth = max(this.getTextWidths(this.svgElement.nativeElement, this.sideLabels));
    this.barsWidth = this.svgWidth - 2 * ChartCommons.COMPONENT_MARGIN - this.sideLabelWidth;
    this.barsHeight = this.calculateChartBarsHeight();

    this.headerHeight = ChartCommons.CHART_HEADER_HEIGHT + ChartCommons.COMPONENT_MARGIN;
    this.barScorePosY = this.barsHeight + ChartCommons.COMPONENT_MARGIN;
    this.barScoreHeight = ChartCommons.BAR_BAND + ChartCommons.COMPONENT_MARGIN;
    this.legendPosY = this.barScorePosY + this.barScoreHeight + ChartCommons.COMPONENT_MARGIN;
    this.legendHeight = this.estimateHeight(this.svgElement.nativeElement) + ChartCommons.COMPONENT_MARGIN;
    this.svgHeight = this.legendPosY + this.legendHeight + this.headerHeight;
    this.svgElement.nativeElement.setAttribute('height', this.svgHeight);
    this.showDiagramTypeSwitch = !this.aggregationChartDataService.hasComparativeData &&
      Object.keys(this.aggregationChartDataService.allMeasurandDataMap).length > 1;
    if (this.aggregationChartDataService.hasComparativeData) {
      this.aggregationChartDataService.stackBars = true;
    }

    this.xScale = scaleLinear()
      .domain([this.dataForScoreBar.min, max(this.aggregationChartDataService.series.map(it => it.value))])
      .range([0, this.barsWidth]);

    this.yScale = scaleBand()
      .domain(this.sideLabels)
      .range([0, this.barsHeight]);

    this.render();
  }

  reloadPercentile(): void {
    if (this.aggregationChartDataService.percentileValue === null || this.aggregationChartDataService.percentileValue < 1) {
      this.aggregationChartDataService.percentileValue = 1;
    } else if (this.aggregationChartDataService.percentileValue > 100) {
      this.aggregationChartDataService.percentileValue = 100;
    }
    this.aggregationChartDataService.reloadPercentile(
      this.aggregationChartDataService.percentileValue,
      this.resultSelectionStore.resultSelectionCommand,
      this.resultSelectionStore.remainingResultSelection
    );
  }

  enoughPercentileValues(): boolean {
    return this.barchartMedianData.hasOwnProperty('series') && this.barchartMedianData['series'].length > 0;
  }

  private render(): void {
    const svgElement: SVGElement = this.svgElement.nativeElement;

    this.renderHeader(svgElement);
    this.renderSideLabels(svgElement);
    this.renderBarsContent(svgElement);
  }

  private renderHeader(svgElement: SVGElement) {
    const header = select(svgElement).selectAll('.header-group').data([this.dataForHeader]);
    header.join(
      enter => enter
        .append('g')
        .attr('class', 'header-group'),
      update => update,
      exit => exit.remove()
    );

    const headerText = select('.header-group').selectAll('.header-text').data([this.dataForHeader]);
    headerText.join(
      enter => enter
        .append('text')
        .attr('class', 'header-text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'alphabetic')
        .style('opacity', 0),
      update => update,
      exit => exit
        .transition()
        .duration(ChartCommons.TRANSITION_DURATION)
        .style('opacity', 0)
        .remove()
    )
      .attr('x', this.svgWidth / 2)
      .attr('y', ChartCommons.CHART_HEADER_HEIGHT)
      .transition()
      .duration(ChartCommons.TRANSITION_DURATION)
      .text(datum => datum)
      .style('opacity', 1);
  }

  private renderSideLabels(svgElement: SVGElement): void {
    const sideLabelGroup = select(svgElement).selectAll('.side-labels-group').data(this.sideLabels);
    sideLabelGroup.join(
      enter => enter
        .append('g')
        .attr('class', 'side-labels-group'),
      update => update,
      exit => exit.remove()
    )
      .attr('transform', `translate(0, ${this.headerHeight})`);

    const sideLabels = select('.side-labels-group').selectAll('.side-label').data(this.sideLabels);
    sideLabels.join(
      enter => enter
        .append('text')
        .attr('class', 'side-label')
        .attr('dominant-baseline', 'middle')
        .attr('x', 0)
        .style('opacity', 0),
      update => update,
      exit => exit
        .transition()
        .duration(ChartCommons.TRANSITION_DURATION)
        .style('opacity', 0)
        .remove()
    )
      .text(datum => datum)
      .transition()
      .duration(ChartCommons.TRANSITION_DURATION)
      .style('opacity', 1)
      .attr('y', datum => this.yScale(datum) + this.yScale.bandwidth() / 2);
  }

  private renderBarsContent(svgElement: SVGElement): void {
    const contentGroup = select(svgElement).selectAll('.bars-content-group').data([1]);
    contentGroup.join(
      enter => enter
        .append('g')
        .attr('class', 'bars-content-group'),
      update => update,
      exit => exit.remove()
    )
      .attr(
        'transform',
        `translate(${this.sideLabelWidth + ChartCommons.COMPONENT_MARGIN}, ${ChartCommons.CHART_HEADER_HEIGHT + ChartCommons.COMPONENT_MARGIN})`
      );

    const contentGroupSelector = '.bars-content-group';

    this.renderBarGroup(contentGroupSelector);
    this.renderChartScoreGroup(contentGroupSelector);
    this.renderLegendGroup(contentGroupSelector);
  }

  private renderBarGroup(contentGroupSelector: string): void {
    const barGroup = select(contentGroupSelector).selectAll('.chart-bar-group').data([1]);
    barGroup.join(
      enter => enter
        .append('g')
        .attr('class', 'chart-bar-group'),
      update => update,
      exit => exit.remove()
    );

    const chartBars = select('.chart-bar-group').selectAll('.chart-bars').data(Object.keys(this.measurandDataMap));
    const barOffset = this.aggregationChartDataService.stackBars ? 0 : ChartCommons.BAR_BAND;

    chartBars.join(
      enter => enter
        .append('g')
        .attr('class', 'chart-bars'),
      update => update,
      exit => exit
        .transition()
        .duration(ChartCommons.TRANSITION_DURATION)
        .attr('transform', 'translate(0, 0)')
        .style('opacity', 0)
        .remove()
    )
      .transition()
      .duration(ChartCommons.TRANSITION_DURATION)
      .attr('transform', (datum, index) => `translate(0, ${index * barOffset})`)
      .each((datum, index, groups) => this.renderBar(select(groups[index]), datum));
  }

  private renderBar(chartBarSelection, measurand: string): void {
    const bar = chartBarSelection.selectAll('.bar').data(this.measurandDataMap[measurand].series);
    bar.join(
      enter => {
        const barElement = enter
          .append('g')
          .attr('class', 'bar')
          .style('opacity', () => {
            return (
              (this.anyHighlighted && !this.measurandDataMap[measurand].highlighted) ||
              (this.anySelected && !this.measurandDataMap[measurand].selected)) ? 0.2 : 1;
          });
        barElement
          .append('rect')
          .attr('class', 'bar-rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('height', ChartCommons.BAR_BAND)
          .attr('fill', this.measurandDataMap[measurand].color)
          .transition()
          .duration(ChartCommons.TRANSITION_DURATION)
          .attr('x', datum => this.barStart(this.xScale, datum.value))
          .attr('y', datum => this.yScale(datum.sideLabel))
          .attr('width', datum => this.barWidth(this.xScale, datum.value));
        barElement
          .append('text')
          .attr('class', 'bar-value')
          .attr('dominant-baseline', 'middle')
          .style('fill', 'white')
          .style('font-weight', 'bold')
          .style('opacity', 0)
          .text(datum => `${this.formatBarValue(datum.value)} ${datum.unit}`)
          .attr('x', datum =>
            (datum.value < 0) ?
              (this.barStart(this.xScale, datum.value) + 10) :
              (this.barEnd(this.xScale, datum.value) - 10))
          .attr('y', datum => (this.yScale(datum.sideLabel) + ChartCommons.BAR_BAND / 2))
          .attr('text-anchor', datum => (datum.value < 0) ? 'start' : 'end')
          .style('opacity', (datum, index, groups) =>
            ((groups[index].getComputedTextLength() + 2 * 10) > this.barWidth(this.xScale, datum.value)) ? 0 : 1);

        barElement.select('.bar-value')
          .transition()
          .duration(ChartCommons.TRANSITION_DURATION);

        return barElement;
      },
      update => {
        update
          .transition()
          .duration(ChartCommons.TRANSITION_DURATION)
          .style('opacity', () => {
            return (
              (this.anyHighlighted && !this.measurandDataMap[measurand].highlighted) ||
              (this.anySelected && !this.measurandDataMap[measurand].selected)) ?
              0.2 : 1;
          });

        update.select('.bar-rect')
          .transition()
          .duration(ChartCommons.TRANSITION_DURATION)
          .attr('x', datum => this.barStart(this.xScale, datum.value))
          .attr('y', datum => this.yScale(datum.sideLabel))
          .attr('width', datum => this.barWidth(this.xScale, datum.value))
          .attr('fill', this.measurandDataMap[measurand].color);
        update.select('.bar-value')
          .transition()
          .duration(ChartCommons.TRANSITION_DURATION)
          .text(datum => `${this.formatBarValue(datum.value)} ${datum.unit}`)
          .attr('x', datum =>
            (datum.value < 0) ?
              (this.barStart(this.xScale, datum.value) + 10) :
              (this.barEnd(this.xScale, datum.value) - 10))
          .attr('y', datum => (this.yScale(datum.sideLabel) + ChartCommons.BAR_BAND / 2))
          .attr('text-anchor', datum => (datum.value < 0) ? 'start' : 'end')
          .style('opacity', (datum, index, groups) =>
            ((groups[index].getComputedTextLength() + 2 * 10) > this.barWidth(this.xScale, datum.value)) ? 0 : 1);
        return update;
      },
      exit => exit
        .transition()
        .duration(ChartCommons.TRANSITION_DURATION)
        .style('opacity', 0)
        .remove()
    )
      .on('click', () => this.onMouseClick(measurand));
  }

  private renderChartScoreGroup(contentGroupSelector: string): void {
    const scoreGroup = select(contentGroupSelector).selectAll('.chart-score-group').data([1]);
    scoreGroup.join(
      enter => enter
        .append('g')
        .attr('class', 'chart-score-group'),
      update => update,
      exit => exit.remove()
    )
      .attr('transform', `translate(0, ${this.barScorePosY})`);

    const scoreBars = select('.chart-score-group').selectAll('.score-bar').data(this.dataForScoreBar.barsToRender);
    const scaleForScoreBar = scaleLinear().rangeRound([0, this.barsWidth]).domain([this.dataForScoreBar.min, this.dataForScoreBar.max]);

    scoreBars.join(
      enter => {
        const scoreBarElement = enter
          .append('g')
          .attr('class', 'score-bar');
        scoreBarElement
          .append('rect')
          .attr('class', 'score-rect')
          .attr('height', ChartCommons.BAR_BAND)
          .attr('width', 0)
          .attr('x', 0)
          .transition()
          .duration(ChartCommons.TRANSITION_DURATION)
          .attr('fill', datum => datum.fill)
          .attr('width', datum => scaleForScoreBar(datum.end) - scaleForScoreBar(datum.start))
          .attr('x', datum => scaleForScoreBar(datum.start));
        scoreBarElement
          .append('text')
          .attr('class', 'score-value')
          .attr('dominant-baseline', 'middle')
          .attr('text-anchor', 'middle')
          .attr('x', 0)
          .attr('y', ChartCommons.BAR_BAND / 2)
          .style('opacity', 0)
          .transition()
          .duration(ChartCommons.TRANSITION_DURATION)
          .text(datum => datum.label)
          .style('opacity', (datum, index, groups) =>
            groups[index].getComputedTextLength() + 20 > (scaleForScoreBar(datum.end) - scaleForScoreBar(datum.start)) / 2 ? 0 : 1)
          .attr('x', datum => (scaleForScoreBar(datum.end) + scaleForScoreBar(datum.start)) / 2);
        return scoreBarElement;
      },
      update => {
        update.select('.score-rect')
          .transition()
          .duration(ChartCommons.TRANSITION_DURATION)
          .attr('fill', datum => datum.fill)
          .attr('width', datum => scaleForScoreBar(datum.end) - scaleForScoreBar(datum.start))
          .attr('x', datum => scaleForScoreBar(datum.start));
        update.select<SVGTextElement>('.score-value')
          .transition()
          .duration(ChartCommons.TRANSITION_DURATION)
          .text(datum => datum.label)
          .style('opacity', (datum, index, groups) =>
            groups[index].getComputedTextLength() + 20 > (scaleForScoreBar(datum.end) - scaleForScoreBar(datum.start)) / 2 ? 0 : 1)
          .attr('x', datum => (scaleForScoreBar(datum.end) + scaleForScoreBar(datum.start)) / 2);
        return update;
      },
      exit => exit
        .transition()
        .duration(ChartCommons.TRANSITION_DURATION)
        .style('opacity', 0)
        .remove()
    );
  }

  private renderLegendGroup(contentGroupSelector: string): void {
    const legendGroup = select(contentGroupSelector).selectAll('.chart-legend-group').data([1]);
    legendGroup.join(
      enter => enter
        .append('g')
        .attr('class', 'chart-legend-group')
        .style('cursor', 'pointer'),
      update => update,
      exit => exit.remove()
    )
      .attr('transform', `translate(0, ${this.legendPosY})`);

    const legendEntry = select('.chart-legend-group').selectAll('.legend-entry').data(Object.keys(this.measurandDataMap));
    const maxEntryGroupSize = this.calculateMaxEntryGroupWidth(this.svgElement.nativeElement);
    const maxEntriesInRow = Math.floor(this.svgWidth / maxEntryGroupSize);

    legendEntry.join(
      enter => {
        const legendElement = enter
          .append('g')
          .attr('class', 'legend-entry')
          .style('opacity', (datum) => {
            return (
              (this.anyHighlighted && !this.measurandDataMap[datum].highlighted) ||
              (this.anySelected && !this.measurandDataMap[datum].selected)) ?
              0.2 : 1;
          });
        legendElement
          .append('rect')
          .attr('class', 'legend-rect')
          .attr('height', ChartCommons.COLOR_PREVIEW_SIZE)
          .attr('width', ChartCommons.COLOR_PREVIEW_SIZE)
          .attr('rx', 2)
          .attr('ry', 2)
          .attr('fill', datum => this.measurandDataMap[datum].color);
        legendElement
          .append('text')
          .attr('class', 'legend-text')
          .attr('x', ChartCommons.COLOR_PREVIEW_SIZE + ChartCommons.COLOR_PREVIEW_MARGIN)
          .attr('y', ChartCommons.COLOR_PREVIEW_SIZE)
          .text(datum => this.measurandDataMap[datum].label);
        return legendElement;
      },
      update => {
        update
          .transition()
          .duration(ChartCommons.TRANSITION_DURATION)
          .style('opacity', (datum) => {
            return (
              (this.anyHighlighted && !this.measurandDataMap[datum].highlighted) ||
              (this.anySelected && !this.measurandDataMap[datum].selected)) ?
              0.2 : 1;
          });

        update.select('.legend-rect')
          .attr('fill', datum => this.measurandDataMap[datum].color);
        update.select('.legend-text')
          .text(datum => this.measurandDataMap[datum].label);
        return update;
      },
      exit => exit
        .transition()
        .duration(ChartCommons.TRANSITION_DURATION)
        .style('opacity', 0)
        .remove()
    )
      .attr('transform', (datum, index) => `translate(${maxEntryGroupSize * (index % maxEntriesInRow)}, 0)`)
      .on('mouseover', (datum) => this.onMouseOver(datum))
      .on('mouseout', (datum) => this.onMouseOut(datum))
      .on('click', (datum) => this.onMouseClick(datum));
  }


  private formatBarValue(value: string): string {
    const precision = this.dataForScoreBar.max >= 1000 || this.dataForScoreBar.min <= -1000 ? 0 : 2;
    return parseFloat(value).toFixed(precision).toString();
  }

  private estimateHeight(svgForEstimation: SVGElement): number {
    const maxEntryGroupSize = this.calculateMaxEntryGroupWidth(svgForEstimation);
    const maxEntriesInRow = Math.floor(this.svgWidth / maxEntryGroupSize);
    return Math.floor(this.aggregationChartDataService.series.length / maxEntriesInRow) * 20;
  }

  private calculateMaxEntryGroupWidth(svgForEstimation: SVGElement): number {
    const dataMap = this.measurandDataMap;
    const labels = Object.keys(dataMap).map(measurand => dataMap[measurand].label);
    const labelWidths = this.getTextWidths(svgForEstimation, labels);
    return max(labelWidths) + 10 + 20 + 5;
  }

  private getTextWidths(svgForEstimation: SVGElement, texts: string[]): number[] {
    const widths = [];
    select(svgForEstimation).selectAll('.invisible-text-to-measure')
      .data(texts)
      .enter()
      .append('text')
      .attr('opacity', 0)
      .text((d) => d.toString())
      .each(function () {
        widths.push(this.getComputedTextLength());
        this.remove();
      });
    return widths;
  }

  private barWidth(xScale: ScaleLinear<number, number>, value: number): number {
    return value === null ? 0 : (this.barEnd(xScale, value) - this.barStart(xScale, value));
  }

  private barEnd(xScale: ScaleLinear<number, number>, value: number): number {
    return (value < 0) ? xScale(0) : xScale(value);
  }

  private barStart(xScale: ScaleLinear<number, number>, value: number): number {
    return (value < 0) ? xScale(value) : xScale(0);
  }

  private calculateChartBarsHeight(): number {
    const barBand = ChartCommons.BAR_BAND;
    const barGap = ChartCommons.BAR_GAP;
    const numberOfMeasurands = Object.keys(this.measurandDataMap).length;
    let numberOfPages = 0;
    Object.keys(this.measurandDataMap).forEach((k) => {
      numberOfPages = (this.measurandDataMap[k].series.length > numberOfPages) ? this.measurandDataMap[k].series.length : numberOfPages;
    });
    const numberOfBars = numberOfPages * (this.aggregationChartDataService.stackBars ? 1 : numberOfMeasurands);
    const gapSize = barGap * ((this.aggregationChartDataService.stackBars || numberOfMeasurands < 2) ? 1 : 2);
    return ((numberOfPages - 1) * gapSize) + numberOfBars * barBand;
  }

  private onMouseOver(measurand: string): void {
    if (this.anySelected === false) {
      this.anyHighlighted = true;
      this.measurandDataMap[measurand].highlighted = true;
      this.renderBarGroup('.bars-content-group');
      this.renderLegendGroup('.legend-content-group');
    }
  }

  private onMouseOut(measurand: string): void {
    if (this.anyHighlighted === true) {
      this.anyHighlighted = false;
      this.measurandDataMap[measurand].highlighted = false;
      this.renderBarGroup('.bars-content-group');
      this.renderLegendGroup('.legend-content-group');
    }
  }

  private onMouseClick(measurand: string): void {
    if (this.anySelected === false) {
      this.measurandDataMap[measurand].selected = true;
      this.clickedMeasurand = measurand;
      this.anySelected = true;
    } else if (this.anySelected === true && this.clickedMeasurand !== measurand) {
      this.measurandDataMap[this.clickedMeasurand].selected = false;
      this.measurandDataMap[measurand].selected = true;
      this.clickedMeasurand = measurand;
    } else {
      this.anySelected = false;
      this.measurandDataMap[measurand].selected = false;
      this.clickedMeasurand = '';
    }
    this.renderBarGroup('.bars-content-group');
    this.renderLegendGroup('.legend-content-group');
  }
}
