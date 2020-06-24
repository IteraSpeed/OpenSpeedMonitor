import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {ResultSelectionStore} from '../../services/result-selection.store';
import {ResultSelectionCommand} from '../../models/result-selection-command.model';
import {RemainingResultSelection} from '../../models/remaing-result-selection.model';

@Component({
  selector: 'osm-result-selection-submit',
  templateUrl: './submit.component.html',
  styleUrls: ['./submit.component.scss']
})
export class SubmitComponent implements OnInit {

  applicationsSelected$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  pagesOrMeasuredEventsSelected$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  measurandsOrPerformanceAspectsSelected$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  resultCount$: Observable<number>;
  dataAvailable$: Observable<boolean>;

  @Input() applicationsRequired = false;
  @Input() pagesRequired = false;
  @Input() measurandsRequired = false;
  @Output() submit: EventEmitter<void> = new EventEmitter<void>();

  constructor(private resultSelectionStore: ResultSelectionStore) {
  }

  ngOnInit() {
    this.resultCount$ = this.resultSelectionStore.resultCount$;
    this.dataAvailable$ = this.resultSelectionStore.dataAvailable$;
    this.observeIfSelected();
  }

  show(): void {
    this.submit.emit();
  }

  private observeIfSelected(): void {
    this.resultSelectionStore._resultSelectionCommand$.subscribe((next: ResultSelectionCommand) => {
      if (next.jobGroupIds) {
        this.applicationsSelected$.next(next.jobGroupIds.length > 0);
      }
      if (next.pageIds) {
        this.pagesOrMeasuredEventsSelected$.next(next.pageIds.length > 0);
      }
      if (next.measuredEventIds) {
        this.pagesOrMeasuredEventsSelected$.next(this.pagesOrMeasuredEventsSelected$.getValue() || next.measuredEventIds.length > 0);
      }
    });
    this.resultSelectionStore._remainingResultSelection$.subscribe((next: RemainingResultSelection) => {
      if (next.measurands) {
        this.measurandsOrPerformanceAspectsSelected$.next(next.measurands.length > 0);
      }
      if (next.performanceAspectTypes) {
        this.measurandsOrPerformanceAspectsSelected$
          .next(this.measurandsOrPerformanceAspectsSelected$.getValue() || next.performanceAspectTypes.length > 0);
      }
    });
  }
}
