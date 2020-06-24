import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'osm-result-selection',
  templateUrl: './result-selection.component.html',
  styleUrls: ['./result-selection.component.scss']
})
export class ResultSelectionComponent {

  @Output() submit: EventEmitter<void> = new EventEmitter<void>();

  @Input() applicationsRequired = false;
  @Input() measurandsRequired = false;
  @Input() pagesRequired = false;

  @Input() timeFrameAggregation = false;
  @Input() timeFrameComparative = false;

  @Input() multipleMeasurands = false;

  @Input() page = false;
  @Input() measuredStep = false;

  @Input() browser = false;
  @Input() location = false;

  @Input() connectivity = false;

  constructor() {  }

  emitSubmitEvent(): void {
    this.submit.emit();
  }
}
