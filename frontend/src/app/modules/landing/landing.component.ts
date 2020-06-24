import {Component} from '@angular/core';
import {filter, map} from 'rxjs/operators';
import {ApplicationService} from '../../services/application.service';
import {combineLatest, Observable, of} from 'rxjs';
import {ApplicationWithCsi} from './models/application-with-csi.model';
import {ResponseWithLoadingState} from '../../models/response-with-loading-state.model';
import {FailingJob} from './models/failing-jobs.model';

@Component({
  selector: 'osm-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  objectKeys = Object.keys;
  showApplicationEmptyState$: Observable<boolean>;
  hasData$: Observable<boolean>;
  applications$: Observable<ApplicationWithCsi[]>;
  failingJobs$: Observable<{ [application: string]: FailingJob[] }>;
  isHealthy$: Observable<boolean> = of(false);

  constructor(private applicationService: ApplicationService) {
    this.hasData$ = this.applicationService.applications$.pipe(map(response => this.dataHasLoaded(response)));
    this.showApplicationEmptyState$ = this.applicationService.applications$.pipe(
      map(response => this.dataHasLoaded(response) && response.data.length < 1),
    );
    this.applications$ = combineLatest(this.applicationService.applications$, this.applicationService.applicationCsiById$).pipe(
      filter(([applications]) => !applications.isLoading && !!applications.data),
      map(([applications, csiById]) => applications.data
        .map(app => new ApplicationWithCsi(app, csiById[app.id], csiById.isLoading))
        .sort(function (a, b) {
          if (!b.recentCsi.csiDocComplete) {
            return -1;
          } else if (!a.recentCsi.csiDocComplete) {
            return 1;
          } else {
            return b.recentCsi.csiDocComplete - a.recentCsi.csiDocComplete;
          }
        })
      )
    );
    this.applicationService.loadRecentCsiForApplications();
    this.failingJobs$ = this.applicationService.failingJobs$;

    this.failingJobs$.subscribe(next => {
      if (!next || !this.objectKeys(next).length) {
        this.isHealthy$ = of(true);
      } else {
        this.isHealthy$ = of(false);
      }
    });
  }

  private dataHasLoaded(response: ResponseWithLoadingState<object>): boolean {
    return !response.isLoading && !!response.data;
  }

}
