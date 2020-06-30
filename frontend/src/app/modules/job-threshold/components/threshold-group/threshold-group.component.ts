import {Component, EventEmitter, Input, Output} from '@angular/core';
import {MeasuredEvent} from '../../models/measured-event.model';
import {Threshold} from '../../models/threshold.model';
import {Measurand} from '../../models/measurand.model';
import {MeasurandService} from '../../services/measurand.service';
import {ThresholdGroup} from '../../models/threshold-for-job.model';

@Component({
  selector: 'osm-threshold-group',
  templateUrl: './threshold-group.component.html',
  styleUrls: ['./threshold-group.component.scss']
})

export class ThresholdGroupComponent {
  private _thresholdGroup: ThresholdGroup;

  @Input() unusedMeasuredEvents: MeasuredEvent[];
  @Output() removeEvent = new EventEmitter();
  @Input() newThreshold: Threshold;
  addThresholdDisabled = false;
  unusedMeasurands: Measurand[];

  @Input()
  set thresholdGroup(thresholdGroup: ThresholdGroup) {
    this._thresholdGroup = thresholdGroup;
    this.unusedMeasurands = this.measurandsService.getUnusedMeasurands(thresholdGroup.thresholds);
    this.addThresholdDisabled = this.unusedMeasurands.length < 1;
    if (thresholdGroup.isNew) {
      this.addThreshold();
    }
  }

  get thresholdGroup(): ThresholdGroup {
    return this._thresholdGroup;
  }

  constructor(private measurandsService: MeasurandService) {
  }

  addThreshold() {
    if (!this.thresholdGroup) {
      return;
    }
    this.addThresholdDisabled = true;
    this.newThreshold = {
      measurand:  this.unusedMeasurands[0],
      lowerBoundary:  0,
      upperBoundary:  0,
      isNew: true,
      measuredEvent: this.thresholdGroup.measuredEvent
    };
  }

  addedThreshold() {
    this.newThreshold = null;
    this.unusedMeasurands.length < 2 ? this.addThresholdDisabled = true : this.addThresholdDisabled = false;
  }

  removeThreshold() {
    this.addThresholdDisabled = false;
  }

  cancelNewThreshold() {
    this.newThreshold = null;
    this.addThresholdDisabled = false;
  }

}
