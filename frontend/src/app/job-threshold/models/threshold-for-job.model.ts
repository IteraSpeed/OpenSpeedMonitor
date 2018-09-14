/**
 * Created by glastra on 27.06.18.
 */
import {MeasuredEvent} from './measured-event.model';
import {Threshold} from './threshold.model';

export type ThresholdGroup = {
  measuredEvent: MeasuredEvent;
  thresholds: Threshold[];
  isNew?: boolean;
}
