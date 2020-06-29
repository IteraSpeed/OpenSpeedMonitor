import {Injectable} from '@angular/core';
import {
  BaseType as D3BaseType,
  ContainerElement as D3ContainerElement,
  event as d3Event,
  select as d3Select,
  Selection as D3Selection
} from 'd3-selection';
import {ChartCommons} from '../../../../enums/chart-commons.enum';
import {ScaleLinear as D3ScaleLinear, ScaleTime as D3ScaleTime} from 'd3-scale';
import {TimeSeries} from '../../models/time-series.model';
import {getColorScheme} from '../../../../enums/color-scheme.enum';
import {SummaryLabel} from '../../models/summary-label.model';
import {take} from 'rxjs/operators';
import {EventResultSeriesDTO} from '../../models/event-result-series.model';
import {EventResultDataDTO} from '../../models/event-result-data.model';
import {TranslateService} from '@ngx-translate/core';
import {LineChartDrawService} from './line-chart-draw.service';
import {LineChartDomEventService} from './line-chart-dom-event.service';

@Injectable({
  providedIn: 'root'
})
export class LineChartLegendService {

  private _legendGroupColumnWidth: number;
  private _legendGroupColumns: number;
  private _focusedLegendEntry: string;
  private _legendDataMap: { [key: string]: { [key: string]: (boolean | string) } } = {};

  constructor(private translationService: TranslateService,
              private lineChartDrawService: LineChartDrawService,
              private lineChartDomEventService: LineChartDomEventService) {
  }

  get legendDataMap(): { [p: string]: { [p: string]: boolean | string } } {
    return this._legendDataMap;
  }

  /**
   * Set the data for the legend after the incoming data is received
   */
  setLegendData(incomingData: EventResultDataDTO): void {
    if (incomingData.series.length === 0) {
      return;
    }

    const labelDataMap = {};
    const measurandInIdentifier: boolean = incomingData.summaryLabels.length === 0 ||
      (incomingData.summaryLabels.length > 0 && incomingData.summaryLabels[0].key !== 'measurand');
    const measurandGroups = Object.keys(incomingData.series);
    measurandGroups.forEach((series: string) => {
      incomingData.series[series].forEach((data: EventResultSeriesDTO) => {
        if (measurandInIdentifier) {
          data.identifier = this.translateMeasurand(data);
        }
        const key = this.generateKey(data);
        labelDataMap[key] = {
          text: data.identifier,
          key: key,
          show: true
        };
      });
    });
    this._legendDataMap = labelDataMap;
  }

  calculateLegendDimensions(width: number): number {
    let maximumLabelWidth = 1;
    const labels = Object.keys(this._legendDataMap);

    d3Select('g#time-series-chart-legend')
      .append('g')
      .attr('id', 'renderToCalculateMaxWidth')
      .selectAll('.renderToCalculateMaxWidth')
      .data(labels)
      .enter()
      .append('text')
      .attr('class', 'legend-text')
      .text(datum => this._legendDataMap[datum].text)
      .each((datum, index, groups) => {
        Array.from(groups).forEach((text) => {
          if (text) {
            maximumLabelWidth = Math.max(maximumLabelWidth, text.getBoundingClientRect().width);
          }
        });
      });

    d3Select('g#renderToCalculateMaxWidth').remove();

    this._legendGroupColumnWidth = maximumLabelWidth + ChartCommons.COLOR_PREVIEW_SIZE + 30;
    this._legendGroupColumns = Math.floor(width / this._legendGroupColumnWidth);
    if (this._legendGroupColumns < 1) {
      this._legendGroupColumns = 1;
    }
    return Math.ceil(labels.length / this._legendGroupColumns) * ChartCommons.LABEL_HEIGHT;
  }

  addLegendsToChart(chartContentContainer: D3Selection<D3BaseType, {}, D3ContainerElement, {}>,
                    xScale: D3ScaleTime<number, number>,
                    yScales: { [key: string]: D3ScaleLinear<number, number> },
                    data: { [key: string]: TimeSeries[] },
                    numberOfTimeSeries: number): void {
    const legend: D3Selection<D3BaseType, {}, D3ContainerElement, {}> = d3Select('g#time-series-chart-legend');
    legend.selectAll('.legend-entry').remove();
    const legendEntry = legend.selectAll('.legend-entry').data(Object.keys(this._legendDataMap));
    legendEntry.join(
      enter => {
        const legendElement = enter
          .append('g')
          .attr('class', 'legend-entry')
          .style('opacity', (datum) => {
            return (this._legendDataMap[datum].show) ? 1 : 0.2;
          });
        legendElement
          .append('rect')
          .attr('class', 'legend-rect')
          .attr('height', ChartCommons.COLOR_PREVIEW_SIZE)
          .attr('width', ChartCommons.COLOR_PREVIEW_SIZE)
          .attr('rx', 2)
          .attr('ry', 2)
          .attr('fill', (key: string, index: number) => {
            return getColorScheme()[(numberOfTimeSeries - index - 1) % getColorScheme().length];
          });
        legendElement
          .append('text')
          .attr('class', 'legend-text')
          .attr('x', 15)
          .attr('y', ChartCommons.COLOR_PREVIEW_SIZE)
          .text(datum => this._legendDataMap[datum].text);
        return legendElement;
      },
      update => update,
      exit => exit
        .transition()
        .duration(ChartCommons.TRANSITION_DURATION)
        .style('opacity', 0)
        .remove()
    )
      .attr('transform', (_, index: number) => this.getLegendEntryPosition(index))
      .on('click', (datum: string) =>
        this.setSelectedLegendEntries(datum, chartContentContainer, xScale, yScales, data, numberOfTimeSeries));
  }

  setSummaryLabel(chart: D3Selection<D3BaseType, {}, D3ContainerElement, {}>,
                  summaryLabels: SummaryLabel[],
                  width: number): void {
    const addSummaryLabel = (key: string, label: string, index: number): void => {
      d3Select(`#summary-label-part${index}`)
        .append('tspan')
        .attr('id', `summary-label-part${index + 1}`)
        .attr('class', 'summary-label-key')
        .text(`${key}: `)
        .append('tspan')
        .attr('class', 'summary-label')
        .text(label);
    };

    d3Select('g#header-group').selectAll('.summary-label-text').remove();
    if (summaryLabels.length > 0) {
      d3Select('#header-group')
        .append('g')
        .attr('class', 'summary-label-text')
        .append('text')
        .attr('id', 'summary-label-part0')
        .attr('x', width / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#555555');

      summaryLabels.forEach((summaryLabel: SummaryLabel, index: number) => {
        this.translationService
          .get(`frontend.de.iteratec.osm.timeSeries.chart.label.${summaryLabel.key}`)
          .pipe(take(1))
          .subscribe((key: string) => {
            if (summaryLabel.key === 'measurand') {
              this.translationService
                .get(`frontend.de.iteratec.isr.measurand.${summaryLabel.label}`)
                .pipe(take(1))
                .subscribe((label: string) => {
                  if (label.startsWith('frontend.de.iteratec.isr.measurand.')) {
                    label = summaryLabel.label;
                  }
                  label = index < summaryLabels.length - 1 ? `${label} | ` : label;
                  addSummaryLabel(key, label, index);
                });
            } else {
              const label: string = index < summaryLabels.length - 1 ? `${summaryLabel.label} | ` : summaryLabel.label;
              addSummaryLabel(key, label, index);
            }
          });
      });
      chart.selectAll('.summary-label-text').remove();
    }
  }

  generateKey(data: EventResultSeriesDTO): string {
    // remove every non alpha numeric character
    const key: string = data.identifier.replace(/[^_a-zA-Z0-9-]/g, '');

    // if first character is digit, replace it with '_'
    const digitRegex = /[0-9]/;
    if (digitRegex.test(key.charAt(0))) {
      return key.replace(digitRegex, '_');
    }
    return key;
  }

  translateMeasurand(data: EventResultSeriesDTO): string {
    const splitLabelList: string[] = data.identifier.split(' | ');
    const splitLabel: string = this.translationService.instant(`frontend.de.iteratec.isr.measurand.${splitLabelList[0]}`);
    if (!splitLabel.startsWith('frontend.de.iteratec.isr.measurand.')) {
      splitLabelList[0] = splitLabel;
    }
    return splitLabelList.join(' | ');
  }

  private getLegendEntryPosition(index: number): string {
    const x = index % this._legendGroupColumns * this._legendGroupColumnWidth;
    const y = Math.floor(index / this._legendGroupColumns) * ChartCommons.LABEL_HEIGHT + 12;

    return `translate(${x}, ${y})`;
  }

  private setSelectedLegendEntries(labelKey: string,
                                   chartContentContainer: D3Selection<D3BaseType, {}, D3ContainerElement, {}>,
                                   xScale: D3ScaleTime<number, number>,
                                   yScales: { [key: string]: D3ScaleLinear<number, number> },
                                   data: { [key: string]: TimeSeries[] },
                                   numberOfTimeSeries: number): void {
    if (d3Event.metaKey || d3Event.ctrlKey) {
      this._legendDataMap[labelKey].show = !this._legendDataMap[labelKey].show;
    } else {
      if (labelKey === this._focusedLegendEntry) {
        Object.keys(this._legendDataMap).forEach((legend) => {
          this._legendDataMap[legend].show = true;
        });
        this._focusedLegendEntry = '';
      } else {
        Object.keys(this._legendDataMap).forEach((legend) => {
          if (legend === labelKey) {
            this._legendDataMap[legend].show = true;
            this._focusedLegendEntry = legend;
          } else {
            this._legendDataMap[legend].show = false;
          }
        });
      }
    }

    Object.keys(yScales).forEach((key: string, index: number) => {
      this.lineChartDrawService.addDataLinesToChart(
        chartContentContainer, this.lineChartDomEventService.pointsSelection, xScale, yScales[key], data[key], this._legendDataMap, index);
    });

    // redraw legend
    this.addLegendsToChart(chartContentContainer, xScale, yScales, data, numberOfTimeSeries);
  }
}
