import {Injectable} from '@angular/core';
import {
  BaseType as D3BaseType,
  ContainerElement as D3ContainerElement,
  event as d3Event,
  mouse as d3Mouse,
  select as d3Select,
  selectAll as d3SelectAll,
  Selection as D3Selection
} from 'd3-selection';
import {Transition as D3Transition} from 'd3-transition';
import {TimeSeriesPoint} from '../../models/time-series-point.model';
import {UrlBuilderService} from '../url-builder.service';
import ContextMenuPosition from '../../models/context-menu-position.model';
import {ScaleTime as D3ScaleTime} from 'd3-scale';
import {TimeSeries} from '../../models/time-series.model';
import {BrushBehavior, brushX as d3BrushX} from 'd3-brush';
import {LineChartDrawService} from './line-chart-draw.service';
import {LineChartScaleService} from './line-chart-scale.service';
import {PointsSelection} from '../../models/points-selection.model';
import {TranslateService} from '@ngx-translate/core';
import {TimeEvent} from '../../models/event.model';
import {LineChartTimeEventService} from './line-chart-time-event.service';

@Injectable({
  providedIn: 'root'
})
export class LineChartDomEventService {

  private _DOT_HIGHLIGHT_RADIUS = 5;
  private _contextMenuBackground: D3Selection<D3BaseType, number, D3BaseType, unknown>;
  private _contextMenu: D3Selection<D3BaseType, number, D3BaseType, unknown>;
  private _dotsOnMarker: D3Selection<D3BaseType, {}, HTMLElement, any>;
  private _contextMenuPoint: D3Selection<D3BaseType, TimeSeriesPoint, D3BaseType, any>;
  private brush: BrushBehavior<{}>;

  private brushMinDate: Date = null;
  private brushMaxDate: Date = null;

  constructor(private urlBuilderService: UrlBuilderService,
              private translationService: TranslateService,
              private lineChartDrawService: LineChartDrawService,
              private lineChartScaleService: LineChartScaleService,
              private lineChartTimeEventService: LineChartTimeEventService) {
  }

  private _pointSelectionErrorHandler: Function;

  set pointSelectionErrorHandler(value: Function) {
    this._pointSelectionErrorHandler = value;
  }

  private _pointsSelection: PointsSelection;

  get pointsSelection(): PointsSelection {
    return this._pointsSelection;
  }

  private readonly contextMenu: ContextMenuPosition[] = [
    {
      title: 'summary',
      icon: 'fas fa-file-alt',
      action: (d: TimeSeriesPoint) => {
        window.open(this.urlBuilderService
          .buildSummaryUrl(d.wptInfo));
      }
    },
    {
      title: 'waterfall',
      icon: 'fas fa-bars',
      action: (d: TimeSeriesPoint) => {
        window.open(this.urlBuilderService
          .buildWaterfallUrl(d.wptInfo));
      }
    },
    {
      title: 'performanceReview',
      icon: 'fas fa-check',
      action: (d: TimeSeriesPoint) => {
        window.open(this.urlBuilderService
          .buildPerformanceReviewUrl(d.wptInfo));
      }
    },
    {
      title: 'contentBreakdown',
      icon: 'fas fa-chart-pie',
      action: (d: TimeSeriesPoint) => {
        window.open(this.urlBuilderService
          .buildContentBreakdownUrl(d.wptInfo));
      }
    },
    {
      title: 'domains',
      icon: 'fas fa-list',
      action: (d: TimeSeriesPoint) => {
        window.open(this.urlBuilderService
          .buildDomainsUrl(d.wptInfo));
      }
    },
    {
      title: 'screenshot',
      icon: 'fas fa-image',
      action: (d: TimeSeriesPoint) => {
        window.open(this.urlBuilderService
          .buildScreenshotUrl(d.wptInfo));
      }
    },
    {
      title: 'filmstrip',
      icon: 'fas fa-film',
      action: (d: TimeSeriesPoint) => {
        window.open(this.urlBuilderService
          .buildFilmstripUrl(d.wptInfo));
      }
    },
    {
      title: 'filmstripTool',
      icon: 'fas fa-money-check',
      action: (d: TimeSeriesPoint) => {
        window.open(this.urlBuilderService
          .buildFilmstripToolUrl(d.wptInfo));
      }
    },
    {
      title: 'compareFilmstrips',
      icon: 'fas fa-columns',
      visible: () => {
        return this._pointsSelection.count() > 0;
      },
      action: () => {
        const selectedDots = this._pointsSelection.getAll();
        const wptInfos = selectedDots.map(it => it.wptInfo);
        window.open(this.urlBuilderService
          .buildFilmstripsComparisionUrl(wptInfos));
      }
    },
    {
      divider: true
    },
    {
      title: 'selectPoint',
      icon: 'fas fa-dot-circle',
      visible: (d: TimeSeriesPoint) => {
        return !this._pointsSelection.isPointSelected(d);
      },
      action: (d: TimeSeriesPoint) => {
        this.changePointSelection(d);
      }
    },
    {
      title: 'deselectPoint',
      icon: 'fas fa-trash-alt',
      visible: (d: TimeSeriesPoint) => {
        return this._pointsSelection.isPointSelected(d);
      },
      action: (d: TimeSeriesPoint) => {
        this.changePointSelection(d);
      }
    },
  ];

  private readonly backgroundContextMenu: ContextMenuPosition[] = [
    {
      title: 'compareFilmstrips',
      icon: 'fas fa-columns',
      visible: () => {
        return this._pointsSelection.count() >= 2;
      },
      action: () => {
        const selectedDots = this._pointsSelection.getAll();
        const wptInfos = selectedDots.map(it => it.wptInfo);
        window.open(this.urlBuilderService
          .buildFilmstripsComparisionUrl(wptInfos));
      }
    },
    {
      title: 'deselectAllPoints',
      icon: 'fas fa-trash-alt',
      visible: () => {
        return this._pointsSelection.count() > 0;
      },
      action: () => {
        this.unselectAllPoints();
      }
    },
  ];

  prepareCleanState(): void {
    this._pointsSelection = new PointsSelection();
    this._contextMenuPoint = null;
    this.lineChartDrawService.xAxisCluster = {};
  }

  prepareMouseEventCatcher(chart: D3Selection<D3BaseType, {}, D3ContainerElement, {}>,
                           width: number,
                           height: number,
                           marginTop: number,
                           marginLeft): void {
    if (!chart.select('.chart-content').empty()) {
      return;
    }

    // Watcher for mouse events
    chart.append('svg:g')
      .attr('class', 'chart-content')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .on('mouseenter', () => this.showMarker())
      .on('mouseleave', () => this.hideMarker())
      .on('contextmenu', () => d3Event.preventDefault())
      .on('mousemove', (_, index, nodes: D3ContainerElement[]) => {
        this.moveMarker(nodes[index], width, height, marginTop, marginLeft);
      });
  }

  createContextMenu(): void {
    if (!this._contextMenuBackground) {
      this._contextMenuBackground = d3Select('body')
        .selectAll('.d3-context-menu-background')
        .data([1])
        .enter()
        .append('div')
        .attr('class', 'd3-context-menu-background')
        .on('click', () => {
          this.closeContextMenu();
        }).on('contextmenu', () => {
          this.closeContextMenu();
        }, false);
    }

    if (!this._contextMenu) {
      this._contextMenu = d3Select('body')
        .selectAll('.d3-context-menu')
        .data([1])
        .enter()
        .append('rect')
        .attr('class', 'd3-context-menu')
        .on('contextmenu', () => d3Event.preventDefault());
    }
  }

  addBrush(chartContentContainer: D3Selection<D3BaseType, {}, D3ContainerElement, {}>,
           width: number,
           height: number,
           yAxisWidth: number,
           margin: { [key: string]: number },
           xScale: D3ScaleTime<number, number>,
           data: { [key: string]: TimeSeries[] },
           dataTrimValues: { [key: string]: { [key: string]: number } },
           legendDataMap: { [key: string]: { [key: string]: (boolean | string) } },
           events: TimeEvent[]): void {
    // remove old brush
    d3Select('.brush').remove();

    this.brush = d3BrushX()
      .extent([[0, 0], [width, height]])
      .on('end', () =>
        this.zoomInTheChart(chartContentContainer, width, height, yAxisWidth, margin, xScale, data, dataTrimValues, legendDataMap, events));
    chartContentContainer
      .append('g')
      .attr('class', 'brush')
      .call(this.brush);
    d3Select('.overlay')
      .on('dblclick', () =>
        this.resetChart(chartContentContainer, width, height, yAxisWidth, margin, xScale, data, dataTrimValues, legendDataMap, events))
      .on('contextmenu', (d, i, e) => this.showContextMenu(this.backgroundContextMenu)(d, i, e));
  }

  restoreSelectedZoom(chartContentContainer: D3Selection<D3BaseType, {}, D3ContainerElement, {}>,
                      width: number,
                      height: number,
                      yAxisWidth: number,
                      margin: { [key: string]: number },
                      xScale: D3ScaleTime<number, number>,
                      data: { [key: string]: TimeSeries[] },
                      dataTrimValues: { [key: string]: { [key: string]: number } },
                      legendDataMap: { [key: string]: { [key: string]: (boolean | string) } },
                      events: TimeEvent[]): void {
    if (this.brushMinDate !== null && this.brushMaxDate !== null) {
      this.updateChart(chartContentContainer, width, height, yAxisWidth, margin, xScale, data, dataTrimValues, legendDataMap, events);
    }
  }

  addMouseMarkerToChart(markerParent: D3Selection<D3BaseType, {}, D3ContainerElement, {}>): void {
    if (!d3Select('.marker-line').empty()) {
      return;
    }

    // Append the marker line, initially hidden
    markerParent
      .append('path')
      .attr('class', 'marker-line')
      .style('opacity', '0')
      .style('pointer-events', 'none');

    // Add tooltip box to chart
    d3Select('#time-series-chart')
      .select((_, index: number, elem) => (<SVGElement>elem[index]).parentNode)
      .append('div')
      .attr('id', 'marker-tooltip')
      .style('opacity', '1');
  }

  private moveMarker(node: D3ContainerElement, width: number, containerHeight: number, marginTop: number, marginLeft: number): void {
    // marker can only be moved from one dot to another dot if there are at least two dots
    if (this.lineChartDrawService.xAxisCluster.length < 2) {
      return;
    }

    const nearestDot = this.findNearestDot(d3Mouse(node), d3SelectAll('.dot'));

    if (!nearestDot) {
      this._dotsOnMarker = d3Select(null);
      this.hideMarker();
      return;
    }

    const markerPositionX = nearestDot.attr('cx');
    // draw marker line
    const markerPath = `M${markerPositionX},${containerHeight} ${markerPositionX},0`;
    d3Select('.marker-line').attr('d', markerPath);

    this.hideOldDotsOnMarker();
    const dotsOnMarker = this.findDotsOnMarker(markerPositionX);
    this.showDotsOnMarker(dotsOnMarker);
    nearestDot.attr('r', this._DOT_HIGHLIGHT_RADIUS);

    this._dotsOnMarker = dotsOnMarker;

    this.showTooltip(nearestDot, dotsOnMarker, nearestDot.datum().date, width, marginTop, marginLeft);
  }

  private zoomInTheChart(chartContentContainer: D3Selection<D3BaseType, {}, D3ContainerElement, {}>,
                         width: number,
                         height: number,
                         yAxisWidth: number,
                         margin: { [key: string]: number },
                         xScale: D3ScaleTime<number, number>,
                         data: { [key: string]: TimeSeries[] },
                         dataTrimValues: { [key: string]: { [key: string]: number } },
                         legendDataMap: { [key: string]: { [key: string]: (boolean | string) } },
                         events: TimeEvent[]): void {
    const extent = d3Event.selection;
    if (!extent) {
      return;
    }

    // Remove the grey brush area
    d3Select('.brush').call(this.brush.move, null);
    this.brushMinDate = xScale.invert(extent[0]);
    this.brushMaxDate = xScale.invert(extent[1]);
    this.updateChart(chartContentContainer, width, height, yAxisWidth, margin, xScale, data, dataTrimValues, legendDataMap, events);
  }

  private resetChart(chartContentContainer: D3Selection<D3BaseType, {}, D3ContainerElement, {}>,
                     width: number,
                     height: number,
                     yAxisWidth: number,
                     margin: { [key: string]: number },
                     xScale: D3ScaleTime<number, number>,
                     data: { [key: string]: TimeSeries[] },
                     dataTrimValues: { [key: string]: { [key: string]: number } },
                     legendDataMap: { [key: string]: { [key: string]: (boolean | string) } },
                     events: TimeEvent[]): void {
    if (this.brushMinDate === null || this.brushMaxDate === null) {
      return;
    }
    this.brushMinDate = null;
    this.brushMaxDate = null;
    // Change X axis domain
    xScale.domain([this.lineChartScaleService.getMinDate(data), this.lineChartScaleService.getMaxDate(data)]);
    d3Select('.x-axis').transition().call((transition: D3Transition<SVGGElement, any, HTMLElement, any>) =>
      this.lineChartDrawService.updateXAxis(transition, xScale));
    this.lineChartTimeEventService.addEventTimeLineAndMarkersToChart(chartContentContainer, xScale, events, width, height, margin);
    const yNewScales = this.lineChartScaleService.getYScales(data, height, dataTrimValues);
    this.lineChartDrawService.updateYAxes(yNewScales, width, yAxisWidth);
    Object.keys(yNewScales).forEach((key: string, index: number) => {
      this.lineChartDrawService.addDataLinesToChart(
        chartContentContainer, this._pointsSelection, xScale, yNewScales[key], data[key], legendDataMap, index);
    });
    this.showMarker();
  }

  private updateChart(chartContentContainer: D3Selection<D3BaseType, {}, D3ContainerElement, {}>,
                      width: number,
                      height: number,
                      yAxisWidth: number,
                      margin: { [key: string]: number },
                      xScale: D3ScaleTime<number, number>,
                      data: { [key: string]: TimeSeries[] },
                      dataTrimValues: { [key: string]: { [key: string]: number } },
                      legendDataMap: { [key: string]: { [key: string]: (boolean | string) } },
                      events: TimeEvent[]): void {
    xScale.domain([this.brushMinDate, this.brushMaxDate]);

    d3Select('.x-axis').transition().call((transition: D3Transition<SVGGElement, any, HTMLElement, any>) =>
      this.lineChartDrawService.updateXAxis(transition, xScale));
    this.lineChartTimeEventService.addEventTimeLineAndMarkersToChart(chartContentContainer, xScale, events, width, height, margin);
    const yNewScales = this.lineChartScaleService.getYScalesInTimeRange(data, height, dataTrimValues, this.brushMinDate, this.brushMaxDate);
    this.lineChartDrawService.updateYAxes(yNewScales, width, yAxisWidth);
    Object.keys(yNewScales).forEach((key: string, index: number) => {
      this.lineChartDrawService.addDataLinesToChart(
        chartContentContainer, this._pointsSelection, xScale, yNewScales[key], data[key], legendDataMap, index);
    });
  }

  private findNearestDot(mouseCoordinates: [number, number], dots): D3Selection<any, TimeSeriesPoint, null, any> {
    const mousePosition = {x: mouseCoordinates[0], y: mouseCoordinates[1]};

    let currentNearestDot = null;
    let minCompareDistance;
    dots.each((_, index: number, nodes: []) => {
      const pointSelection = d3Select(nodes[index]);
      const cx = parseFloat(pointSelection.attr('cx'));
      const cy = parseFloat(pointSelection.attr('cy'));
      const compareDistance = this.pointsCompareDistance(mousePosition, {x: cx, y: cy});
      if (minCompareDistance === undefined || compareDistance < minCompareDistance) {
        currentNearestDot = pointSelection;
        minCompareDistance = compareDistance;
      }
    });
    return currentNearestDot;
  }

  private showDotsOnMarker(dots: D3Selection<D3BaseType, {}, HTMLElement, any>): void {
    // show dots on marker
    dots
      .attr('visibility', 'visible')
      .style('fill', 'white')
      .style('cursor', 'pointer')
      .on('contextmenu', (d, i, e) => {
        this._contextMenuPoint = d3Select(e[i]);
        this.showContextMenu(this.contextMenu)(d, i, e);
      })
      .on('click', (dotData: TimeSeriesPoint) => {
        d3Event.preventDefault();
        if (d3Event.metaKey || d3Event.ctrlKey) {
          this.changePointSelection(dotData);
        } else {
          window.open(this.urlBuilderService
            .buildWaterfallUrl(dotData.wptInfo));
        }
      });
  }

  private pointsCompareDistance(p1: { [key: string]: number }, p2: { [key: string]: number }): number {
    // Taxicab/Manhattan approximation of euclidean distance
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
  }

  private findDotsOnMarker(pointX: string): D3Selection<D3BaseType, {}, HTMLElement, any> {
    const cx = pointX.toString().replace('.', '_');
    return d3SelectAll(`.dot-x-${cx}`);
  }

  private showMarker(): void {
    d3Select('.marker-line').style('opacity', 0.5);
    d3Select('#marker-tooltip').style('opacity', 1);
  }

  private hideMarker(): void {
    d3Select('.marker-line').style('opacity', 0);
    d3Select('#marker-tooltip').style('opacity', 0);
    this.hideOldDotsOnMarker();
  }

  private hideOldDotsOnMarker(): void {
    if (this._dotsOnMarker) {
      const contextMenuPointData = this._contextMenuPoint ? this._contextMenuPoint.data()[0] : null;

      this._dotsOnMarker
        .filter((s: TimeSeriesPoint) => !s.equals(contextMenuPointData))
        .attr('r', this.lineChartDrawService.DOT_RADIUS)
        .attr('visibility', 'hidden')
        .style('cursor', 'auto')
        .on('click', null)
        .on('contextmenu', null);
      this.lineChartDrawService.drawSelectedPoints(this._dotsOnMarker, this._pointsSelection);
    }
  }

  private showContextMenu(menu: ContextMenuPosition[]) {
    // this gets executed when a contextmenu event occurs
    return (data, currentIndex, viewElements): void => {
      const selectedNode = viewElements[currentIndex];

      const visibleMenuElements = menu.filter(elem => {
        // visible is optional value, so even without this property the element is visible
        return (elem.visible === undefined) || (elem.visible(data, currentIndex, selectedNode));
      });

      if (visibleMenuElements.length === 0) {
        // do not show empty context menu
        return;
      }

      const background = this._contextMenuBackground.html('');
      const contextMenu = this._contextMenu.html('');
      const contextMenuPositions = contextMenu
        .selectAll('li')
        .data(visibleMenuElements)
        .enter()
        .append('li');

      const clickListener = (e: ContextMenuPosition) => {
        e.action(data, currentIndex, selectedNode);
        this.closeContextMenu();
      };

      contextMenuPositions.each((ctxMenuPositionData: ContextMenuPosition, ctxMenuPositionIndex, ctxMenuPositions) => {
        const currentMenuPosition = d3Select(ctxMenuPositions[ctxMenuPositionIndex]);
        if (ctxMenuPositionData.divider) {
          currentMenuPosition
            .attr('class', 'd3-context-menu-divider')
            .on('contextmenu', () => d3Event.preventDefault());
        } else {
          currentMenuPosition.append('i').attr('class', (d: ContextMenuPosition) => d.icon);
          currentMenuPosition.append('span').html((d: ContextMenuPosition) => {
            return this.translationService.instant(`frontend.de.iteratec.chart.contextMenu.${d.title}`);
          });
          currentMenuPosition
            .on('click', clickListener)
            .on('contextmenu', clickListener);
        }
      });

      // display context menu
      background.style('display', 'block');
      contextMenu.style('display', 'block');

      // context menu must be displayed to take its width
      const contextMenuWidth = (<HTMLDivElement>this._contextMenu.node()).offsetWidth;
      const left = ((d3Event.pageX + contextMenuWidth + 40) < window.innerWidth) ? (d3Event.pageX) : (d3Event.pageX - contextMenuWidth);

      // move context menu
      contextMenu
        .style('left', `${left}px`)
        .style('top', `${(d3Event.pageY - 2)}px`);

      d3Event.preventDefault();
    };
  }

  private closeContextMenu() {
    d3Event.preventDefault();
    this._contextMenuBackground.style('display', 'none');
    this._contextMenu.style('display', 'none');

    // hide context menu point
    this._contextMenuPoint = null;
    this.hideOldDotsOnMarker();
  }

  private changePointSelection(point: TimeSeriesPoint) {
    let canPointBeSelected = true;
    if (this._pointsSelection.count() > 0) {
      const testServerUrl = this._pointsSelection.getFirst().wptInfo.baseUrl;
      if (point.wptInfo.baseUrl !== testServerUrl) {
        canPointBeSelected = false;
      }
    }

    if (!canPointBeSelected) {
      this._pointSelectionErrorHandler();
      return;
    }

    if (this._pointsSelection.isPointSelected(point)) {
      this._pointsSelection.unselectPoint(point);
    } else {
      this._pointsSelection.selectPoint(point);
    }
    this.lineChartDrawService.drawAllSelectedPoints(this._pointsSelection);
  }

  private unselectAllPoints() {
    this._pointsSelection.unselectAll();
    d3SelectAll('.dot').each((currentDotData: TimeSeriesPoint, index: number, dots: D3BaseType[]) => {
      const isDotOnMarkerLine: boolean = this._dotsOnMarker.data().some((elem: TimeSeriesPoint) => {
        return currentDotData.equals(elem);
      });
      if (!isDotOnMarkerLine) {
        d3Select(dots[index]).attr('visibility', 'hidden');
      }
    });
  }

  private showTooltip(nearestDot: D3Selection<any, TimeSeriesPoint, null, undefined>,
                      visibleDots: D3Selection<D3BaseType, {}, HTMLElement, any>,
                      highlightedDate: Date,
                      svgWidth: number,
                      marginTop: number,
                      marginLeft: number) {
    const tooltip = d3Select('#marker-tooltip');

    const tooltipText = this.generateTooltipText(nearestDot, visibleDots, highlightedDate);
    tooltip.html(tooltipText.outerHTML);

    const tooltipWidth: number = (<HTMLDivElement>tooltip.node()).getBoundingClientRect().width;
    const nearestDotXPosition: number = parseFloat(nearestDot.attr('cx'));

    const top = parseFloat(nearestDot.attr('cy')) + marginTop;
    const left = (nearestDotXPosition + tooltipWidth > svgWidth) ?
      (nearestDotXPosition - tooltipWidth + marginLeft) : nearestDotXPosition + marginLeft + 50;
    tooltip.style('top', `${top}px`);
    tooltip.style('left', `${left}px`);
  }

  private generateTooltipText(nearestDot: D3Selection<any, TimeSeriesPoint, null, undefined>,
                              visibleDots: D3Selection<D3BaseType, {}, HTMLElement, any>,
                              highlightedDate: Date): HTMLTableElement {
    const nearestDotData = nearestDot.datum() as TimeSeriesPoint;

    const table: HTMLTableElement = document.createElement('table');
    const tableBody: HTMLTableSectionElement = document.createElement('tbody');
    table.append(tableBody);
    tableBody.append(this.generateTooltipTimestampRow(highlightedDate));

    const tempArray = [];
    let testAgent: string | Node = '';
    visibleDots
      .each((timeSeriesPoint: TimeSeriesPoint, index: number, nodes: D3BaseType[]) => {
        tempArray.push({
          'htmlNode': this.generateTooltipDataPointRow(timeSeriesPoint, nodes[index], nearestDotData),
          'yPosition': nodes[index]['cy'].animVal.value
        });
        if (index === 0) {
          testAgent = this.generateTooltipTestAgentRow(timeSeriesPoint);
        }
      });
    tempArray
      .sort((a, b) => a.yPosition - b.yPosition)
      .forEach(elem => tableBody.append(elem.htmlNode));
    tableBody.append(testAgent);

    return table;
  }

  private generateTooltipTimestampRow(highlightedDate: Date): string | Node {
    const label: HTMLTableCellElement = document.createElement('td');
    const translatedLabel: string = this.translationService.instant('frontend.de.iteratec.osm.timeSeries.chart.label.timestamp');
    label.append(translatedLabel);

    const date: HTMLTableCellElement = document.createElement('td');
    date.append(highlightedDate.toLocaleString());

    const row: HTMLTableRowElement = document.createElement('tr');
    row.append(label);
    row.append(date);
    return row;
  }

  private generateTooltipDataPointRow(currentPoint: TimeSeriesPoint,
                                      node: D3BaseType,
                                      nearestDotData: TimeSeriesPoint): string | Node {
    const label: HTMLTableCellElement = document.createElement('td');
    label.append(currentPoint.tooltipText);

    const value: HTMLTableCellElement = document.createElement('td');
    const lineColorDot: HTMLElement = document.createElement('i');
    lineColorDot.className = 'fas fa-circle';
    lineColorDot.style.color = d3Select(node).style('stroke');
    value.append(lineColorDot);
    if (currentPoint.value !== undefined && currentPoint.value !== null) {
      value.append(currentPoint.value.toString());
    } else {
      value.append(' -');
    }

    const row: HTMLTableRowElement = document.createElement('tr');
    if (currentPoint.equals(nearestDotData)) {
      row.className = 'active';
    }
    row.append(label);
    row.append(value);
    return row;
  }

  private generateTooltipTestAgentRow(currentPoint: TimeSeriesPoint): string | Node {
    const label: HTMLTableCellElement = document.createElement('td');
    const translatedLabel: string = this.translationService.instant('frontend.de.iteratec.osm.timeSeries.chart.label.testAgent');
    label.append(translatedLabel);
    const testAgent: HTMLTableCellElement = document.createElement('td');
    testAgent.append(currentPoint.agent);

    const row: HTMLTableRowElement = document.createElement('tr');
    row.append(label);
    row.append(testAgent);
    return row;
  }
}
