import {Injectable} from '@angular/core';
import {EventDTO, TimeEvent} from '../../models/event.model';
import {
  BaseType as D3BaseType,
  ContainerElement as D3ContainerElement,
  select as d3Select,
  Selection as D3Selection
} from 'd3-selection';
import {ScaleTime as D3ScaleTime} from 'd3-scale';
import {parseDate} from '../../../../utils/date.util';
import {TranslateService} from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LineChartTimeEventService {

  private readonly EVENT_LINE_OFFSET = 100;
  private readonly EVENT_MARKER_RADIUS = 8;

  private selectedEventMarkerIds: number[] = [];

  constructor(private translateService: TranslateService) {
  }

  addEventMarkerGroupToChart(chart: D3Selection<D3BaseType, {}, D3ContainerElement, {}>) {
    chart
      .append('g')
      .attr('id', 'event-group');
  }

  addEventMarkerTooltipBoxToSvgParent() {
    d3Select('#time-series-chart')
      .select(function () {
        return (<SVGElement>this).parentNode;
      })
      .append('div')
      .attr('id', 'event-marker-tooltip')
      .style('opacity', '0.9');
  }

  addEventTimeLineAndMarkersToChart(chart: D3Selection<D3BaseType, {}, D3ContainerElement, {}>,
                                    xScale: D3ScaleTime<number, number>,
                                    events: EventDTO[],
                                    width: number,
                                    height: number,
                                    margin: { [key: string]: number }): void {
    const eventGroup = d3Select('#event-group');
    eventGroup.selectAll('*').remove();

    const eventTimeLineGroup = eventGroup
      .append('g')
      .attr('id', 'event-time-line-group');
    eventTimeLineGroup
      .append('text')
      .attr('class', 'event-time-line-label')
      .attr('x', 0)
      .attr('y', height + this.EVENT_LINE_OFFSET - 2.5 * this.EVENT_MARKER_RADIUS)
      .text(this.translateService.instant('frontend.de.iteratec.osm.timeSeries.chart.eventTimeLine.label'));
    eventTimeLineGroup.append('line')
      .attr('class', 'event-time-line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', height + this.EVENT_LINE_OFFSET)
      .attr('y2', height + this.EVENT_LINE_OFFSET);

    const eventMarkerGroup = eventGroup
      .selectAll('g#event-marker-group')
      .data(events, (event: EventDTO) => {
        return event.id.toString();
      })
      .join(
        enter => {
          const eventMarker = enter
            .append('g')
            .attr('class', 'event-marker');
          eventMarker
            .append('line')
            .attr('class', 'event-marker-line unselected-event-marker-line')
            .attr('y1', 0)
            .attr('y2', height);
          eventMarker
            .append('circle')
            .attr('class', 'event-marker-dot')
            .style('cursor', 'pointer')
            .on('mouseover', (event: EventDTO, index: number, nodes: []) => this.showEventMarkerTooltip(event, index, nodes, width, margin))
            .on('mouseout', () => d3Select('#event-marker-tooltip').style('opacity', 0))
            .on('click', (event: EventDTO, index: number, nodes: []) => this.setEventMarkerSelection(event.id, index, nodes))
            .attr('cy', height + this.EVENT_LINE_OFFSET)
            .attr('r', this.EVENT_MARKER_RADIUS);
          return eventMarker;
        }
      );

    eventMarkerGroup.selectAll('.event-marker-line')
      .attr('x1', (event: EventDTO) => xScale(event.eventDate))
      .attr('x2', (event: EventDTO) => xScale(event.eventDate));
    eventMarkerGroup.selectAll('.event-marker-dot')
      .attr('cx', (event: EventDTO) => xScale(parseDate(event.eventDate)));

    if (this.selectedEventMarkerIds.length > 0) {
      this.restoreEventMarkerSelection(eventMarkerGroup);
    }
  }

  clearEventMarkerSelection(): void {
    this.selectedEventMarkerIds = [];
  }

  private showEventMarkerTooltip(event: EventDTO,
                                 index: number,
                                 nodes: [],
                                 width: number,
                                 margin: { [key: string]: number }): D3Selection<SVGCircleElement, EventDTO, D3BaseType, unknown> {
    const eventMarkerTooltipBox = d3Select('#event-marker-tooltip');
    eventMarkerTooltipBox.style('opacity', '0.9');
    eventMarkerTooltipBox.html(this.createEventMarkerTooltipContent(event).outerHTML);

    const circle = d3Select(nodes[index]);
    const top = parseFloat(circle.attr('cy')) + 5;

    const tooltipWidth: number = (<HTMLDivElement>eventMarkerTooltipBox.node()).getBoundingClientRect().width;
    const xPos = parseFloat(circle.attr('cx'));
    const left = (tooltipWidth + xPos > width) ? xPos - tooltipWidth + margin.right - 10 : xPos + margin.left + 25;
    eventMarkerTooltipBox.style('top', top + 'px');
    eventMarkerTooltipBox.style('left', left + 'px');

    return nodes[index];
  }

  private setEventMarkerSelection(eventId: number, index: number, nodes) {
    const eventMarkerLineSelection = d3Select(nodes[index].parentNode).select('.event-marker-line');
    const eventMarkerDotSelection = d3Select(nodes[index]);
    const arrayIndex = this.selectedEventMarkerIds.indexOf(eventId);

    if (arrayIndex !== -1) {
      eventMarkerLineSelection.attr('class', 'event-marker-line unselected-event-marker-line');
      eventMarkerDotSelection.attr('class', 'event-marker-dot');
      this.selectedEventMarkerIds.splice(arrayIndex, 1);
    } else {
      eventMarkerLineSelection.attr('class', 'event-marker-line selected-event-marker-line');
      eventMarkerDotSelection.attr('class', 'selected-event-marker-dot');
      this.selectedEventMarkerIds.push(eventId);
    }
  }

  private createEventMarkerTooltipContent(event: EventDTO): HTMLDivElement {
    const container: HTMLDivElement = document.createElement('div');
    container.className = 'grid-container';

    const dateItem = document.createElement('div');
    dateItem.className = 'event-marker-tooltip-element event-marker-tooltip-date';
    dateItem.append(event.eventDate.toLocaleString());
    container.append(dateItem);

    const shortNameItem = document.createElement('div');
    shortNameItem.className = 'event-marker-tooltip-element';
    const shortNameParagraph = document.createElement('p');
    shortNameParagraph.className = 'event-marker-tooltip-title';
    shortNameParagraph.append(`${event.shortName}:`);
    shortNameItem.append(shortNameParagraph);
    container.append(shortNameItem);

    const descriptionItem = document.createElement('div');
    descriptionItem.className = 'event-marker-tooltip-element';
    const descriptionParagraph = document.createElement('p');
    descriptionParagraph.className = 'event-marker-tooltip-text';
    descriptionParagraph.append(event.description);
    descriptionItem.append(descriptionParagraph);
    container.append(descriptionItem);

    return container;
  }

  private restoreEventMarkerSelection(eventMarkerGroup: D3Selection<any, any, any, any>): void {
    eventMarkerGroup.selectAll('.event-marker-line')
      .attr('class', (event: EventDTO) =>
        this.selectedEventMarkerIds.includes(event.id) ?
          'event-marker-line selected-event-marker-line' :
          'event-marker-line unselected-event-marker-line'
      );
    eventMarkerGroup.selectAll('.event-marker-dot')
      .attr('class', (event: EventDTO) =>
        this.selectedEventMarkerIds.includes(event.id) ? 'selected-event-marker-dot' : 'event-marker-dot');

  }
}
