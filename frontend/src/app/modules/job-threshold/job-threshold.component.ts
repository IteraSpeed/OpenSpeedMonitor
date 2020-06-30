import {Component, ElementRef} from '@angular/core';
import {MeasuredEventService} from './services/measured-event.service';
import {MeasuredEvent} from './models/measured-event.model';
import {ThresholdGroup} from './models/threshold-for-job.model';
import {ThresholdService} from './services/threshold.service';
import {combineLatest, Observable} from 'rxjs';
import {map, take} from 'rxjs/operators';
import {MeasurandService} from './services/measurand.service';


@Component({
  selector: 'osm-job-threshold',
  templateUrl: './job-threshold.component.html',
  styleUrls: ['./job-threshold.component.scss']
})

export class JobThresholdComponent {

  jobId: number;
  scriptId: number;

  addMeasuredEventDisabled = false;
  isEmpty = false;

  allThresholdGroups$: Observable<ThresholdGroup[]>;
  unusedMeasuredEvents$: Observable<MeasuredEvent[]>;
  hasSavedThresholds$: Observable<boolean>;

  constructor(private measuredEventService: MeasuredEventService,
              private thresholdService: ThresholdService,
              private measurandService: MeasurandService,
              elm: ElementRef) {

    this.jobId = elm.nativeElement.getAttribute('data-job-id');
    this.scriptId = elm.nativeElement.getAttribute('data-job-scriptId');

    this.initialize();
    this.measuredEventService.fetchEvents(this.scriptId, this.jobId);
    this.thresholdService.fetchThresholds(this.jobId);
    this.measurandService.fetchMeasurands();
  }

  private initialize() {
    this.hasSavedThresholds$ = this.thresholdService.thresholdGroups$.pipe(map(thresholdGroups => !!thresholdGroups.length));
    this.allThresholdGroups$ = combineLatest(
      this.thresholdService.thresholdGroups$,
      this.thresholdService.newThresholdGroup$
    ).pipe(
      map(([thresholdGroups, newThresholdGroup]: [ThresholdGroup[], ThresholdGroup]) => {
        return newThresholdGroup ? [...thresholdGroups, newThresholdGroup] : thresholdGroups;
      }));

    combineLatest(
      this.measuredEventService.measuredEvents$,
      this.allThresholdGroups$
    ).subscribe(([measuredEvents, thresholdGroups]: [MeasuredEvent[], ThresholdGroup[]]) => {
      this.isEmpty = thresholdGroups.length === 0;
      this.addMeasuredEventDisabled = thresholdGroups.length === measuredEvents.length;
    });

    this.unusedMeasuredEvents$ = combineLatest(
      this.thresholdService.thresholdGroups$,
      this.measuredEventService.measuredEvents$
    ).pipe(
      map(([thresholdGroups, measuredEvents]: [ThresholdGroup[], MeasuredEvent[]]) => {
        return measuredEvents.filter((measuredEvent: MeasuredEvent) =>
          !thresholdGroups.some(thresholdGroup => thresholdGroup.measuredEvent.id === measuredEvent.id)
        );
      })
    );
  }

  addThresholdGroup() {
    this.unusedMeasuredEvents$.pipe(take(1)).subscribe((unusedMeasuredEvents: MeasuredEvent[]) => {
      this.thresholdService.createNewThresholdGroup(unusedMeasuredEvents[0]);
    });
  }

  createScript() {
    this.thresholdService.downloadScript(this.jobId);
  }

}
