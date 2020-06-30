import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {JobResultDataService} from './services/job-result-data.service';
import {JobResult} from './models/job-result.model';
import {Job} from './models/job.model';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {JobResultStatus} from './models/job-result-status.enum';
import {WptStatus} from './models/wpt-status.enum';
import {JobResultFilter} from './models/job-result-filter.model';
import {StatusService} from './services/status.service';
import {DateTimeAdapter, OwlDateTimeComponent} from 'ng-pick-datetime';
import {fromEvent, merge, Observable, Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {OsmLangService} from '../../services/osm-lang.service';

@Component({
  selector: 'osm-job-result',
  templateUrl: './job-result.component.html',
  styleUrls: ['./job-result.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class JobResultComponent implements OnInit {

  jobs: Job[] = [];
  jobResults: JobResult[] = [];
  allJobResultStatus: string[] = Object.values(JobResultStatus);
  allWptStatus: string[] = Object.values(WptStatus);

  filteredJobResults: JobResult[] = [];
  selectedJob: Job = null;
  currentSortingRule: { [key: string]: string } = {column: 'date', direction: 'desc'};
  filter: JobResultFilter = {dateTimeRange: [], testAgent: '', jobResultStatus: [], wptStatus: [], description: ''};

  DateTimeRange: typeof DateTimeRange = DateTimeRange;

  @ViewChild('dateTimeRangeFrom') private dateTimeRangeFrom: OwlDateTimeComponent<Date>;
  @ViewChild('dateTimeRangeTo') private dateTimeRangeTo: OwlDateTimeComponent<Date>;
  private calendarClick$: Observable<MouseEvent>;
  private calendarEnter$: Observable<KeyboardEvent>;
  private calendarEventSubscription: Subscription;

  constructor(private dataService: JobResultDataService,
              private statusService: StatusService,
              private route: ActivatedRoute,
              private router: Router,
              private dateTimeAdapter: DateTimeAdapter<any>,
              private osmLangService: OsmLangService) {
  }

  compareStatusFn = (item, selected): boolean => this.statusService.compareStatus(item, selected);

  jobResultStatusGroupByFn = (jobResultStatus: string): string => this.statusService.getJobResultStatusGroupLabel(jobResultStatus);

  wptStatusGroupByFn = (wptStatus: string): string => this.statusService.getWptStatusGroupLabel(wptStatus);

  groupValueFn = (groupName: string, children: any[]): any => ({label: groupName, children: children});

  ngOnInit() {
    this.setCalendarLanguage();
    this.getAllJobs();
  }

  setJob(job: Job): void {
    if (job) {
      this.writeQueryParams();
      this.getJobResults(job.id);
    } else {
      this.writeQueryParams();
      this.jobResults = [];
      this.filteredJobResults = [];
    }
  }

  sort(column: string) {
    if (column === this.currentSortingRule.column) {
      if (this.currentSortingRule.direction === 'desc') {
        this.currentSortingRule.direction = 'asc';
      } else if (this.currentSortingRule.direction === 'asc') {
        this.currentSortingRule.direction = 'desc';
      }
    } else {
      this.currentSortingRule.column = column;
      this.currentSortingRule.direction = 'asc';
    }

    this.filteredJobResults.sort((a: JobResult, b: JobResult) =>
      this.compareJobResults(a, b, this.currentSortingRule.column, this.currentSortingRule.direction)
    );
  }

  applyFilter(): void {
    this.writeQueryParams();
    this.filteredJobResults = this.jobResults.filter((jobResult: JobResult) => {
      if (this.arePropertiesThatAreFilteredEmpty(jobResult)) {
        return false;
      }
      return this.isJobResultIncludingTerms(jobResult);
    });
  }

  clearDateFilter(dateTimeComponent: DateTimeRange): void {
    if (dateTimeComponent === DateTimeRange.FROM) {
      const to = this.filter.dateTimeRange[1];
      this.filter.dateTimeRange = [];
      this.filter.dateTimeRange[1] = to;
    }
    if (dateTimeComponent === DateTimeRange.TO) {
      const from = this.filter.dateTimeRange[0];
      this.filter.dateTimeRange = [];
      this.filter.dateTimeRange[0] = from;
    }
    this.applyFilter();
  }

  clearTextFilter(column: string): void {
    this.filter[column] = '';
    this.applyFilter();
  }

  setDateTimeRange(dateTimeComponent: DateTimeRange): void {
    this.calendarEventSubscription.unsubscribe();

    this.filter.dateTimeRange = this[dateTimeComponent].selecteds;
    this.applyFilter();
  }

  isDateTimeRangeSet(dateTimeComponent: DateTimeRange): boolean {
    if (dateTimeComponent === DateTimeRange.FROM && this.filter.dateTimeRange[0]) {
      return !isNaN(this.filter.dateTimeRange[0].valueOf());
    }
    if (dateTimeComponent === DateTimeRange.TO && this.filter.dateTimeRange[1]) {
      return !isNaN(this.filter.dateTimeRange[1].valueOf());
    }
    return false;
  }

  isTestNotTerminated(jobResultStatus: string): boolean {
    return this.statusService.isTestNotTerminated(jobResultStatus);
  }

  isTestSuccessful(jobResultStatus: string): boolean {
    return this.statusService.isTestSuccessful(jobResultStatus);
  }

  hasTestFailed(jobResultStatus: string): boolean {
    return this.statusService.hasTestFailed(jobResultStatus);
  }

  observeCalendarEvents(dateTimeComponent: DateTimeRange): void {
    if (!this.dateTimeRangeFrom || !this.dateTimeRangeTo) {
      return;
    }

    const calendarDates: HTMLElement = document.querySelector('owl-date-time-calendar');
    const dayTableDataCellsInMonthView = 'owl-date-time-month-view > table > tbody > tr > td';
    const dayElementsInMonthView = 'owl-date-time-month-view > table > tbody > tr > td > span';

    this.calendarClick$ = fromEvent<MouseEvent>(calendarDates, 'click');
    this.calendarEnter$ = fromEvent<KeyboardEvent>(calendarDates, 'keydown').pipe(
      filter(event => event.key === 'Enter')
    );

    this.calendarEventSubscription = merge(this.calendarClick$, this.calendarEnter$).subscribe((event: MouseEvent | KeyboardEvent) => {
      if ((event.target as HTMLTableDataCellElement).matches(dayTableDataCellsInMonthView) ||
        (event.target as HTMLSpanElement).matches(dayElementsInMonthView)
      ) {
        if (dateTimeComponent === DateTimeRange.FROM) {
          this.dateTimeRangeFrom.close();
          this.dateTimeRangeTo.open();
        } else if (dateTimeComponent === DateTimeRange.TO) {
          this.dateTimeRangeTo.close();
        }
      }
    });
  }

  private setCalendarLanguage(): void {
    if (this.osmLangService.getOsmLang() === 'en') {
      this.dateTimeAdapter.setLocale('en-GB');
    } else {
      this.dateTimeAdapter.setLocale(this.osmLangService.getOsmLang());
    }
  }

  private getAllJobs(): void {
    this.dataService.getAllJobs()
      .subscribe((jobs: Job[]) => {
        this.jobs = jobs;
        this.readQueryParams();
      });
  }

  private readQueryParams(): void {
    this.route.queryParams.subscribe((params: Params) => {
      if (this.checkQuery(params)) {
        const jobId = parseInt(decodeURIComponent(params.job), 10);
        if (jobId) {
          this.selectedJob = this.jobs.find((job: Job) => job.id === jobId);
          this.filter.dateTimeRange = [new Date(decodeURIComponent(params.from)), new Date (decodeURIComponent(params.to))];
          this.filter.testAgent = params.testAgent ? decodeURIComponent(params.testAgent) : '';
          this.filter.jobResultStatus = this.statusService.readStatusByQueryParam(
            params.status, JobResultStatus, this.statusService.JOB_RESULT_STATUS_GROUPS
          );
          this.filter.wptStatus = this.statusService.readStatusByQueryParam(
            params.wptStatus, WptStatus, this.statusService.WPT_STATUS_GROUPS
          );
          this.filter.description = params.description ? decodeURIComponent(params.description) : '';
          this.getJobResults(jobId);
        }
      }
    }).unsubscribe();
  }

  private writeQueryParams(): void {
    const params: Params = {
      job: this.selectedJob ? encodeURIComponent(this.selectedJob.id.toString(10)) : null,
      from: this.selectedJob && this.filter.dateTimeRange[0] && !isNaN(this.filter.dateTimeRange[0].valueOf()) ?
        encodeURIComponent(this.filter.dateTimeRange[0].toISOString()) :
        null,
      to: this.selectedJob && this.filter.dateTimeRange[1] && !isNaN(this.filter.dateTimeRange[1].valueOf()) ?
        encodeURIComponent(this.filter.dateTimeRange[1].toISOString()) :
        null,
      testAgent: this.selectedJob && this.filter.testAgent !== '' ? encodeURIComponent(this.filter.testAgent) : null,
      status: this.statusService.writeStatusAsQueryParam(this.filter.jobResultStatus, JobResultStatus, !!this.selectedJob),
      wptStatus: this.statusService.writeStatusAsQueryParam(this.filter.wptStatus, WptStatus, !!this.selectedJob),
      description: this.selectedJob && this.filter.description !== '' ? encodeURIComponent(this.filter.description) : null
    };

    this.router.navigate([], {
      queryParams: params,
      replaceUrl: true
    });
  }

  private getJobResults(jobId: number): void {
    this.dataService.getJobResults(jobId)
      .subscribe((jobResults: JobResult[]) => {
        this.jobResults = jobResults;
        this.filteredJobResults = jobResults;
        this.applyFilter();
      });
  }

  private compareJobResults(a: JobResult, b: JobResult, column: string, direction: string): number {
    let directionFactor = 1;
    if (direction === 'desc') {
      directionFactor = -1;
    }

    if (a[column] && b[column]) {
      if (a[column] < b[column]) {
        return -directionFactor;
      }
      if (a[column] > b[column]) {
        return directionFactor;
      }
    } else {
      if (a[column]) {
        return directionFactor;
      }
      if (b[column]) {
        return -directionFactor;
      }
    }
    return 0;
  }

  private checkQuery(params: Params): boolean {
    if (params) {
      return !!params.job;
    }
    return false;
  }

  private arePropertiesThatAreFilteredEmpty(jobResult: JobResult): boolean {
    if (!jobResult.testAgent && this.filter.testAgent) {
      return true;
    }
    if (!jobResult.jobResultStatus && this.filter.jobResultStatus.length > 0) {
      return true;
    }
    if (!jobResult.wptStatus && this.filter.wptStatus.length > 0) {
      return true;
    }
    if (!jobResult.description && this.filter.description) {
      return true;
    }
    return false;
  }

  private isJobResultIncludingTerms(jobResult: JobResult): boolean {
    if (jobResult.date && this.filter.dateTimeRange.length > 0) {
      if (this.filter.dateTimeRange[0] && jobResult.date < this.filter.dateTimeRange[0]) {
        return false;
      }
      if (this.filter.dateTimeRange[1] && jobResult.date > this.filter.dateTimeRange[1]) {
        return false;
      }
    }
    if (jobResult.testAgent && !jobResult.testAgent.toLowerCase().includes(this.filter.testAgent.toLowerCase())) {
      return false;
    }
    if (jobResult.jobResultStatus && this.filter.jobResultStatus.length > 0) {
      if (!this.statusService.isStatusIncludingTerms(jobResult.jobResultStatus, this.filter.jobResultStatus)) {
        return false;
      }
    }
    if (jobResult.wptStatus && this.filter.wptStatus.length > 0) {
      if (!this.statusService.isStatusIncludingTerms(jobResult.wptStatus, this.filter.wptStatus)) {
        return false;
      }
    }
    if (jobResult.description && !jobResult.description.toLowerCase().includes(this.filter.description.toLowerCase())) {
      return false;
    }
    return true;
  }
}

export enum DateTimeRange {
  FROM = 'dateTimeRangeFrom',
  TO = 'dateTimeRangeTo'
}
