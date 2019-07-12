import {Component, Input, OnInit} from '@angular/core';
import {BehaviorSubject, Observable} from "rxjs";
import {BarchartDataService} from "../../../chart/services/barchart-data.service";
import {ResultSelectionStore} from "../../services/result-selection.store";
import {ResultSelectionCommand} from "../../models/result-selection-command.model";
import {RemainingGetBarchartCommand} from "../../../chart/models/get-barchart-command.model";
import {URL} from "../../../../enums/url.enum";

@Component({
  selector: 'osm-result-selection-submit',
  templateUrl: './submit.component.html',
  styleUrls: ['./submit.component.scss']
})
export class SubmitComponent implements OnInit {

  applicationsSelected$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  pagesSelected$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  measuredEventsSelected$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  measurandsSelected$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  resultCount$: Observable<number>;

  @Input() applicationsRequired: boolean = false;
  @Input() pagesRequired: boolean = false;
  @Input() measurandsRequired: boolean = false;

  constructor(private barchartDataService: BarchartDataService, private resultSelectionStore: ResultSelectionStore) {
    this.resultCount$ = this.resultSelectionStore.resultCount$;
  }

  ngOnInit() {
    this.resultSelectionStore._resultSelectionCommand$.subscribe((next: ResultSelectionCommand) => {
      if (next.jobGroupIds) {
        this.applicationsSelected$.next(next.jobGroupIds.length > 0);
      }
      if (next.pageIds) {
        this.pagesSelected$.next(next.pageIds.length > 0);
      }
      if (next.measuredEventIds) {
        this.measuredEventsSelected$.next(next.measuredEventIds.length > 0);
      }
    });
    this.resultSelectionStore._remainingGetBarchartCommand$.subscribe((next: RemainingGetBarchartCommand) => {
      if (next.measurands) {
        this.measurandsSelected$.next(next.measurands.length > 0);
      }
    });
  }

  getBarchartData(): void {
    this.barchartDataService.fetchBarchartData<any>(
      this.resultSelectionStore.resultSelectionCommand,
      this.resultSelectionStore.remainingGetBarchartCommand,
      "avg",
      URL.AGGREGATION_BARCHART_DATA
    ).subscribe(result => console.log(result));

    this.barchartDataService.fetchBarchartData<any>(
      this.resultSelectionStore.resultSelectionCommand,
      this.resultSelectionStore.remainingGetBarchartCommand,
      50,
      URL.AGGREGATION_BARCHART_DATA
    ).subscribe(result => console.log(result));
  }
}