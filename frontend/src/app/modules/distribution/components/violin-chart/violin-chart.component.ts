import {Component, HostListener, Input, OnChanges, ViewEncapsulation} from '@angular/core';
import * as d3 from 'd3';
import {DistributionDataDTO} from '../../models/distribution-data.model';
import '../util/chart-label-util';
import ChartLabelUtil from '../util/chart-label-util';
import {MeasurandColorService} from '../../../shared/services/measurand-color.service';
import {ViolinChartMathService} from '../../services/violin-chart-math.service';
import {SpinnerService} from '../../../shared/services/spinner.service';
import {DistributionDTO} from '../../models/distribution.model';
import {CurveFactory} from 'd3-shape';
import {TranslateService} from '@ngx-translate/core';
import {ResultSelectionStore} from '../../../result-selection/services/result-selection.store';
import {ActivatedRoute, Params} from '@angular/router';

@Component({
  selector: 'osm-violin-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './violin-chart.component.html',
  styleUrls: ['./violin-chart.component.scss']
})
export class ViolinChartComponent implements OnChanges {

  @Input()
  dataInput: DistributionDataDTO;

  maxValueForInputField: number = null;
  dataTrimValue: number = null;
  stepForInputField = 50;
  filterRules: {} = {};

  selectedSortingRule = 'desc';
  selectedFilterRule = '';

  private height = 600;
  private width = 600;
  private margin = {top: 50, right: 0, bottom: 70, left: 100};
  private violinWidth: number = null;
  private maxViolinWidth = 150;
  private interpolation: CurveFactory = d3.curveBasis;
  private mainDataResolution = 30;
  private chartData: DistributionDataDTO = null;
  private currentSeries: DistributionDTO[] = null;
  private commonLabelParts: string = null;

  constructor(private measurandColorProviderService: MeasurandColorService,
              private violinChartMathService: ViolinChartMathService,
              private spinnerService: SpinnerService,
              private translationService: TranslateService,
              private resultSelectionStore: ResultSelectionStore,
              private route: ActivatedRoute
  ) {
    this.readChartSettingsByUrl();
  }

  @HostListener('window:resize')
  windowResize() {
    this.drawChart();
  }

  ngOnChanges(): void {
    this.drawChart();
  }

  drawChart(): void {
    this.spinnerService.showSpinner('violin-chart-spinner');

    d3.select('#svg-container').selectAll('*').remove();
    if (this.dataInput == null || this.dataInput.series.length === 0) {
      return;
    }
    this.chartData = this.prepareChartData(this.dataInput);

    this.initSvg();

    this.assignShortLabels();
    this.currentSeries = this.sortSeries();

    this.drawChartElements();
    this.setSvgWidth();

    this.spinnerService.hideSpinner('violin-chart-spinner');
  }

  setDataTrimValue(): void {
    this.writeQueryWithAdditionalParams();
    this.drawChart();
  }

  setSortingRule(sortingRule: string): void {
    if (sortingRule !== 'desc' && sortingRule !== 'asc') {
      return;
    }
    this.selectedSortingRule = sortingRule;
    this.selectedFilterRule = '';
    this.writeQueryWithAdditionalParams();
    this.drawChart();
  }

  setFilterRule(filterRule: string): void {
    if (!Object.keys(this.filterRules).includes(filterRule)) {
      return;
    }
    this.selectedFilterRule = filterRule;
    this.selectedSortingRule = '';
    this.writeQueryWithAdditionalParams();
    this.drawChart();
  }

  writeQueryWithAdditionalParams(): void {
    const additionalParams: Params = {
      sortingRule: this.selectedSortingRule !== '' ? this.selectedSortingRule : null,
      filterRule: this.selectedFilterRule !== '' ? this.selectedFilterRule : null,
      maxValue: this.dataTrimValue
    };

    this.resultSelectionStore.writeQueryParams(additionalParams);
  }

  hasFilterRules(): boolean {
    return Object.keys(this.filterRules).length > 0;
  }

  private readChartSettingsByUrl(): void {
    this.route.queryParams.subscribe((params: Params) => {
      this.selectedSortingRule = params.sortingRule ? params.sortingRule : '';
      this.selectedFilterRule = params.filterRule ? params.filterRule : '';
      this.dataTrimValue = params.maxValue ? params.maxValue : this.dataTrimValue;

      if (this.selectedSortingRule === '' && this.selectedFilterRule === '') {
        this.selectedSortingRule = 'desc';
      } else if (this.selectedSortingRule !== '' && this.selectedFilterRule !== '') {
        this.selectedSortingRule = '';
      }
    });
  }

  private prepareChartData(inputData: DistributionDataDTO): DistributionDataDTO {
    const chartData = {...inputData};
    chartData.series.forEach((elem: DistributionDTO) => {
      return elem.data.sort(d3.ascending);
    });
    chartData.sortingRules = this.getSortingRulesByMedian(chartData);
    chartData.measurandGroup = this.translationService.instant(`frontend.de.iteratec.isr.measurand.group.${chartData.measurandGroup}`);
    this.filterRules = chartData.filterRules;
    return chartData;
  }

  private initSvg(): void {
    const svgContainerSelection = d3.select('#svg-container');

    svgContainerSelection
      .append('svg')
      .attr('id', 'svg')
      .attr('class', 'd3chart')
      .attr('height', this.height)
      .attr('width', '100%');

    this.width = (<HTMLElement>svgContainerSelection.node()).getBoundingClientRect().width;
  }

  private assignShortLabels(): void {
    const seriesLabelParts = this.chartData.series.map((elem: DistributionDTO) => {
      return {grouping: elem.identifier, page: elem.page, jobGroup: elem.jobGroup, label: elem.identifier};
    });

    const labelUtil = ChartLabelUtil.processWith(seriesLabelParts);
    labelUtil.getSeriesWithShortestUniqueLabels();
    this.commonLabelParts = labelUtil.getCommonLabelParts();

    seriesLabelParts.forEach((labelPart: { grouping: string, page: string, jobGroup: string, label: string }, index: number) => {
      this.chartData.series[index].label = labelPart.label;
    });
  }

  private sortSeries(): DistributionDTO[] {
    if ((this.selectedSortingRule === 'desc' || this.selectedSortingRule === 'asc') && this.selectedFilterRule === '') {
      return this.chartData.sortingRules[this.selectedSortingRule].map(trace => {
        return this.chartData.series[trace];
      });
    } else if (Object.keys(this.filterRules).includes(this.selectedFilterRule)) {
      const keyForSelectedFilterRule = Object.keys(this.filterRules).filter((key: string) =>
        key === this.selectedFilterRule).toString();
      const filteredDistributionIdentifiers: string[] = this.filterRules[keyForSelectedFilterRule];
      return this.chartData.series.filter((distribution: DistributionDTO) =>
        filteredDistributionIdentifiers.some((distributionIdentifier: string) =>
          distribution.identifier === distributionIdentifier
        ));
    }
  }

  private drawChartElements(): void {
    this.violinWidth = this.calculateViolinWidth();
    const maxValue: number = this.violinChartMathService.getMaxValue(this.currentSeries);
    if (this.dataTrimValue && this.dataTrimValue > maxValue) {
      this.dataTrimValue = null;
    }
    const domain: number[] = this.violinChartMathService.getDomain(maxValue, this.dataTrimValue);
    this.stepForInputField = this.violinChartMathService.getAdequateStep(maxValue);
    this.maxValueForInputField = Math.ceil(maxValue / this.stepForInputField) * this.stepForInputField;

    this.drawXAxis();
    this.drawYAxis(domain, `${this.chartData.measurandGroup} [${this.chartData.dimensionalUnit}]`);
    this.drawViolins(domain);
    this.drawHeader();

    // remove the xAxis lines
    d3.select('.d3chart-axis.d3chart-x-axis > path.domain').remove();
    d3.selectAll('.d3chart-axis.d3chart-x-axis g > line').remove();
  }

  private setSvgWidth(): void {
    const lastLabelWidth: number = Math.ceil(
      (<SVGGElement>d3.select(`#x-axis-label${this.currentSeries.length - 1}`).node()).getBoundingClientRect().width
    );
    const graphWidth: number = (this.violinWidth / 2 > lastLabelWidth) ?
      120 + this.currentSeries.length * this.violinWidth :
      120 + (this.currentSeries.length - 0.5) * this.violinWidth + lastLabelWidth;

    d3.select('#svg').attr('width', graphWidth);
  }

  private getSortingRulesByMedian(data: DistributionDataDTO): { desc: number[], asc: number[] } {
    data.series.forEach((seriesData: DistributionDTO) => {
      seriesData.median = this.violinChartMathService.calculateMedian(seriesData.data);
    });

    const sortings = {desc: [], asc: []};

    sortings.desc = Object.keys(data.series).sort((a, b) => {
      return data.series[b].median - data.series[a].median;
    });

    sortings.asc = Object.keys(data.series).sort((a, b) => {
      return data.series[a].median - data.series[b].median;
    });

    return sortings;
  }

  private calculateViolinWidth(): number {
    const svgWidth = this.width - this.margin.left;
    const numberOfViolins = this.currentSeries.length;

    if (numberOfViolins * this.maxViolinWidth > svgWidth) {
      return svgWidth / numberOfViolins;
    }

    return this.maxViolinWidth;
  }

  private drawXAxis(): void {
    const x = d3.scaleOrdinal(this.getXRange())
      .domain(this.currentSeries.map(elem => elem.label));

    d3.select('#svg')
      .append('g')
      .attr('id', 'x-axis')
      .attr('class', 'd3chart-axis d3chart-x-axis')
      .call(d3.axisBottom(x))
      .call(() => this.rotateLabels())
      .attr('transform', `translate(${this.margin.left}, ${(this.height - this.margin.bottom)})`);
  }

  private drawYAxis(domain: number[], text: string): void {
    const y = d3.scaleLinear()
      .range([this.height - this.margin.bottom, this.margin.top])
      .domain(domain);

    const yAxis = d3.select('#svg')
      .append('g')
      .attr('id', 'y-axis')
      .attr('class', 'd3chart-axis d3chart-y-axis')
      .attr('transform', `translate(${this.margin.left}, 0)`);

    yAxis.append('text')
      .attr('class', 'y-axis-left-label')
      .attr('transform', `translate(-50, ${(this.height - this.margin.bottom - this.margin.top) / 2}) rotate(-90)`)
      .text(text);

    yAxis.call(d3.axisLeft(y));

    yAxis.selectAll('.tick line').classed('d3chart-y-axis-line', true);
    yAxis.selectAll('path').classed('d3chart-y-axis-line', true);
  }

  private drawViolins(domain: number[]): void {
    const svgSelection = d3.select('#svg');
    svgSelection.selectAll('clipPath').remove();
    svgSelection.select('[clip-path]').remove();

    const violinGroup = svgSelection.append('g');
    this.createClipPathAroundViolins(violinGroup);
    this.currentSeries.forEach((distribution: DistributionDTO, index: number) => {
      const traceData = distribution.data;

      const g = violinGroup.append('g')
        .attr('id', `violin${index}`)
        .attr('class', 'd3chart-violin')
        .attr('style', 'fill: none;')
        .attr('transform', `translate(${(index * this.violinWidth + this.margin.left)}, 0)`);

      this.addViolin(g, traceData, this.height - this.margin.bottom, this.violinWidth, domain);
    });
  }

  private drawHeader(): void {
    const getHeaderTransform = () => {
      const widthOfAllViolins = this.currentSeries.length * this.violinWidth;
      return `translate(${(this.margin.left + widthOfAllViolins / 2)}, 20)`;
    };

    d3.select('#svg')
      .append('g')
      .attr('id', 'header')
      .selectAll('text')
      .data([this.commonLabelParts])
      .enter()
      .append('text')
      .text(this.commonLabelParts)
      .attr('id', 'header-text')
      .attr('text-anchor', 'middle')
      .attr('transform', getHeaderTransform());
  }

  private getXRange(): number[] {
    return this.currentSeries.map((_, index: number) => {
      return index * this.violinWidth + this.violinWidth / 2;
    });
  }

  private rotateLabels(): void {
    let maxLabelLength = -1;
    let rotate;
    d3.selectAll('.d3chart-x-axis g').each((_, index: number, nodes: d3.BaseType[]) => {
      const gElement = d3.select(nodes[index]);
      gElement
        .attr('id', `x-axis-label${index}`)
        .attr('class', 'x-axis-label');
      const childTextElem = gElement.select('text');
      const childTextElemNode: SVGTSpanElement = <SVGTSpanElement>childTextElem.node();
      const labelLength = childTextElemNode.getComputedTextLength();

      if (labelLength > maxLabelLength) {
        maxLabelLength = labelLength;
      }

      if (labelLength > this.violinWidth) {
        rotate = true;
      }
    });

    this.margin.bottom = Math.cos(Math.PI / 4) * maxLabelLength + 20;

    if (rotate) {
      d3.selectAll('.d3chart-x-axis g').each((_, index: number, nodes: d3.BaseType[]) => {
        const selectedLabel = d3.select(nodes[index] as SVGGElement);
        this.rotateLabel(selectedLabel);
      });
    }
  }

  private createClipPathAroundViolins(violinGroup: d3.Selection<SVGGElement, {}, HTMLElement, any>): void {
    const clipPathId = 'drawing-area';
    d3.select('#svg')
      .append('clipPath')
      .attr('id', clipPathId)
      .append('rect')
      .attr('x', this.margin.left)
      .attr('y', this.margin.top)
      .attr('width', this.width - this.margin.left - this.margin.right)
      .attr('height', this.height - this.margin.top - this.margin.bottom);
    violinGroup.attr('clip-path', `url(#${clipPathId})`);
  }

  private addViolin(gElement: d3.Selection<SVGGElement, {}, HTMLElement, {}>,
                    traceData: number[],
                    height: number,
                    violinWidth: number,
                    domain: number[]): void {
    const resolution = this.violinChartMathService
      .histogramResolutionForTraceData(this.currentSeries, traceData, this.mainDataResolution);

    const data = d3.histogram()
      .thresholds(resolution)
      (traceData);

    // y is now the horizontal axis because of the violin being a 90 degree rotated histogram
    const y: d3.ScaleLinear<number, number> = d3.scaleLinear()
      .range([violinWidth / 2, 0])
      .domain([0, d3.max(data, datum => datum.length)]);

    // x is now the vertical axis because of the violin being a 90 degree rotated histogram
    const x: d3.ScaleLinear<number, number> = d3.scaleLinear()
      .range([height, this.margin.top])
      .domain(domain)
      .nice();

    const area: d3.Area<number[]> = d3.area()
      .curve(this.interpolation)
      .x(datum => x(datum['x0']))
      .y0(violinWidth / 2)
      .y1(d => y(d.length));

    const line: d3.Line<number[]> = d3.line()
      .curve(this.interpolation)
      .x(datum => x(datum['x0']))
      .y(datum => y(datum.length));

    const gPlus: d3.Selection<SVGGElement, {}, HTMLElement, {}> = gElement.append('g');
    const gMinus: d3.Selection<SVGGElement, {}, HTMLElement, {}> = gElement.append('g');

    const colorScale: d3.ScaleOrdinal<string, any>
      = this.measurandColorProviderService.getColorScaleForMeasurandGroup(this.chartData.dimensionalUnit);
    const violinColor: string = colorScale('0');

    gPlus.append('path')
      .datum(data)
      .attr('class', 'd3chart-violin-area')
      .attr('d', area)
      .style('fill', violinColor);

    gPlus.append('path')
      .datum(data)
      .attr('class', 'd3chart-violin-outline')
      .attr('d', line)
      .style('stroke', violinColor);

    gMinus.append('path')
      .datum(data)
      .attr('class', 'd3chart-violin-area')
      .attr('d', area)
      .style('fill', violinColor);

    gMinus.append('path')
      .datum(data)
      .attr('class', 'd3chart-violin-outline')
      .attr('d', line)
      .style('stroke', violinColor);

    gPlus.attr('transform', `rotate(90, 0, 0)  translate(0, -${violinWidth})`);
    gMinus.attr('transform', 'rotate(90, 0, 0) scale(1, -1)');
  }

  private rotateLabel(labelElem: d3.Selection<SVGGElement, {}, null, undefined>): void {
    labelElem.style('text-anchor', 'start');

    const childTextElem = labelElem.select('text');
    const y = childTextElem.attr('y');

    const transformBaseVal: SVGTransformList = labelElem.node().transform.baseVal;
    const transformMatrix: SVGMatrix = transformBaseVal.getItem(0).matrix;

    const translateX = transformMatrix.e;
    const translateY = transformMatrix.f;

    labelElem.attr('transform', `translate(${translateX - 30}, ${translateY}) rotate(45, 0, ${y})`);
  }
}
