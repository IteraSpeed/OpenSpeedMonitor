import {
  Caller,
  ResultSelectionCommand,
  ResultSelectionCommandParameter
} from '../models/result-selection-command.model';
import {BehaviorSubject, Subject} from 'rxjs';
import {MeasuredEvent} from '../../../models/measured-event.model';
import {Location} from '../../../models/location.model';
import {Connectivity} from '../../../models/connectivity.model';
import {Injectable} from '@angular/core';
import {URL} from '../../../enums/url.enum';
import {ApplicationWithPages, SelectableApplication} from '../../../models/application.model';
import {ResponseWithLoadingState} from '../../../models/response-with-loading-state.model';
import {MeasurandGroup, SelectableMeasurand} from '../../../models/measurand.model';
import {ResultSelectionService} from './result-selection.service';
import {UiComponent} from '../../../enums/ui-component.enum';
import {RemainingResultSelection, RemainingResultSelectionParameter} from '../models/remaing-result-selection.model';
import {ActivatedRoute, Params, Router} from '@angular/router';

@Injectable()
export class ResultSelectionStore {
  _resultSelectionCommand$: BehaviorSubject<ResultSelectionCommand>;
  _remainingResultSelection$: BehaviorSubject<RemainingResultSelection>;

  applications$: BehaviorSubject<ResponseWithLoadingState<SelectableApplication[]>> = new BehaviorSubject({
    isLoading: false,
    data: []
  });
  applicationsAndPages$: BehaviorSubject<ResponseWithLoadingState<ApplicationWithPages[]>> = new BehaviorSubject({
    isLoading: false,
    data: []
  });
  eventsAndPages$: BehaviorSubject<ResponseWithLoadingState<MeasuredEvent[]>> = new BehaviorSubject({
    isLoading: false,
    data: []
  });
  locationsAndBrowsers$: BehaviorSubject<ResponseWithLoadingState<Location[]>> = new BehaviorSubject({
    isLoading: false,
    data: []
  });
  connectivities$: BehaviorSubject<ResponseWithLoadingState<Connectivity[]>> = new BehaviorSubject({
    isLoading: false,
    data: []
  });
  loadTimes$: BehaviorSubject<MeasurandGroup> = new BehaviorSubject({isLoading: false, name: '', values: []});
  userTimings$: BehaviorSubject<MeasurandGroup> = new BehaviorSubject({isLoading: false, name: '', values: []});
  heroTimings$: BehaviorSubject<MeasurandGroup> = new BehaviorSubject({isLoading: false, name: '', values: []});
  requestCounts$: BehaviorSubject<MeasurandGroup> = new BehaviorSubject({isLoading: false, name: '', values: []});
  requestSizes$: BehaviorSubject<MeasurandGroup> = new BehaviorSubject({isLoading: false, name: '', values: []});
  percentages$: BehaviorSubject<MeasurandGroup> = new BehaviorSubject({isLoading: false, name: '', values: []});
  resultCount$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  dataAvailable$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  reset$: Subject<void> = new Subject<void>();

  validQuery = false;

  private readonly oldToNewChartKeyMap: {[key: string]: string} = {
    // General
    selectedFolder: 'jobGroupIds',
    selectedPages: 'pageIds',
    selectedAggrGroupValuesUnCached: 'measurands',
    selectedBrowsers: 'browserIds',
    selectedLocations: 'locationIds',

    // Time series
    trimAboveLoadTimes: 'maxLoadTimes',
    trimAboveRequestCounts: 'maxRequestCounts',
    trimAboveRequestSizes: 'maxRequestSizes',
    trimBelowLoadTimes: 'minLoadTimes',
    trimBelowRequestCounts: 'minRequestCounts',
    trimBelowRequestSizes: 'minRequestSizes',

    // Aggregation
    selectedAggregationValue: 'aggregationType',
    selectedFilter: 'filter',
    selectedPercentile: 'precentileValue',

    // Distribution
    measurand: 'measurands'
  };

  constructor(private resultSelectionService: ResultSelectionService, private route: ActivatedRoute, private router: Router) {
    this._resultSelectionCommand$ = new BehaviorSubject<ResultSelectionCommand>({caller: Caller.EventResult});
    this._remainingResultSelection$ = new BehaviorSubject<RemainingResultSelection>({});

    this.readQueryParams();
  }

  get resultSelectionCommand(): ResultSelectionCommand {
    return this._resultSelectionCommand$.getValue();
  }

  get remainingResultSelection(): RemainingResultSelection {
    return this._remainingResultSelection$.getValue();
  }

  readQueryParams(): void {
    this.route.queryParams.subscribe((params: Params) => {
      if (params) {
        params = this.renameParamKeys(this.oldToNewChartKeyMap, params);
        this.validQuery = this.checkQuery(params);
      }

      if (this.validQuery) {
        const resultSelectionCommand: ResultSelectionCommand = {
          from: new Date(params.from),
          to: new Date(params.to),
          caller: Caller.EventResult,
          ...(params.jobGroupIds && {
            jobGroupIds: []
              .concat(params.jobGroupIds)
              .map(item => parseInt(<string>item, 10))
          }),
          ...(params.pageIds && {
            pageIds: []
              .concat(params.pageIds)
              .map(item => parseInt(<string>item, 10))
          }),
          ...(params.measuredEventIds && {
            measuredEventIds: []
              .concat(params.measuredEvendIds)
              .map(item => parseInt(<string>item, 10))
          }),
          ...(params.browserIds && {
            browserIds: []
              .concat(params.browserIds)
              .map(item => parseInt(<string>item, 10))
          }),
          ...(params.locationIds && {
            locationIds: []
              .concat(params.locationIds)
              .map(item => parseInt(<string>item, 10))
          }),
          ...(params.selectedConnectivities && {
            selectedConnectivities: []
              .concat(params.selectedConnectivities)
              .map(item => parseInt(<string>item, 10))
          })
        };

        const remainingResultSelection: RemainingResultSelection = {
          ...(params.fromComparative && {fromComparative: new Date(params.fromComparative)}),
          ...(params.toComparative && {toComparative: new Date(params.toComparative)}),
          ...(params.measurands && {measurands: [].concat(params.measurands)}),
          ...(params.performanceAspectTypes && {performanceAspectTypes: [].concat(params.performanceAspectTypes)})
        };

        this._resultSelectionCommand$.next(resultSelectionCommand);
        this._remainingResultSelection$.next(remainingResultSelection);
      }
    });
  }

  writeQueryParams(additionalParams?: Params): void {
    this.router.navigate([], {
      queryParams: {
        from: this.resultSelectionCommand.from.toISOString(),
        to: this.resultSelectionCommand.to.toISOString(),
        selectedFolder: this.resultSelectionCommand.jobGroupIds,
        selectedPages: this.resultSelectionCommand.pageIds,
        selectedMeasuredEventIds: this.resultSelectionCommand.measuredEventIds,
        selectedBrowsers: this.resultSelectionCommand.browserIds,
        selectedLocations: this.resultSelectionCommand.locationIds,
        selectedConnectivities: this.resultSelectionCommand.selectedConnectivities,
        ...(this.remainingResultSelection.fromComparative
          && {comparativeFrom: this.remainingResultSelection.fromComparative.toISOString()}),
        ...(this.remainingResultSelection.toComparative
          && {comparativeTo: this.remainingResultSelection.toComparative.toISOString()}),
        ...(this.remainingResultSelection.measurands
          && {selectedAggrGroupValuesUnCached: this.remainingResultSelection.measurands}),
        ...(this.remainingResultSelection.performanceAspectTypes
          && {performanceAspectTypes: this.remainingResultSelection.performanceAspectTypes}),
        ...additionalParams
      }
    });
  }

  registerComponent(component: UiComponent): void {
    if (component === UiComponent.MEASURAND) {
      this.loadMeasurands();
    }

    this._resultSelectionCommand$.subscribe(state => {
      if (component === UiComponent.APPLICATION) {
        this.loadSelectableApplications(state);
      } else if (component === UiComponent.PAGE) {
        this.loadSelectableEventsAndPages(state);
      } else if (component === UiComponent.LOCATION) {
        this.loadSelectableLocationsAndBrowsers(state);
      } else if (component === UiComponent.CONNECTIVITY) {
        this.loadSelectableConnectivities(state);
      } else if (component === UiComponent.MEASURAND) {
        this.loadUserTimings(state);
        this.loadHeroTimings(state);
      }
    });
  }

  setResultSelectionCommandTimeFrame(timeFrame: Date[]): void {
    this.setResultSelectionCommand({...this.resultSelectionCommand, from: timeFrame[0], to: timeFrame[1]});
  }

  setResultSelectionCommandIds(ids: number[], type: ResultSelectionCommandParameter): void {
    this.setResultSelectionCommand({...this.resultSelectionCommand, [type]: ids});
  }

  setResultSelectionCommand(newState: ResultSelectionCommand): void {
    this.dataAvailable$.next(true);
    this._resultSelectionCommand$.next(newState);
    this.loadResultCount(newState);
  }

  setRemainingResultSelectionComparativeTimeFrame(timeFrame: Date[]): void {
    this.setRemainingResultSelection({
      ...this.remainingResultSelection,
      fromComparative: timeFrame[0],
      toComparative: timeFrame[1]
    });
  }

  setRemainingResultSelectionInterval(intervalInSeconds: number): void {
    this.setRemainingResultSelection({...this.remainingResultSelection, interval: intervalInSeconds});
  }

  setRemainingResultSelectionEnums(enums: string[], type: RemainingResultSelectionParameter): void {
    this.setRemainingResultSelection({...this.remainingResultSelection, [type]: enums});
  }

  private checkQuery(params: Params): boolean {
    const dates: Date[] = [new Date(params.from), new Date(params.to)];
    const datesValid: boolean = dates.every(this.isValidDate);
    const jobGroupIdsValid: boolean = !!params.jobGroupIds;

    return datesValid && jobGroupIdsValid;
  }

  private isValidDate(date: Date) {
    return date instanceof Date && !isNaN(date.getTime());
  }

  private renameParamKeys(keysMap: {[k: string]: string}, params: Params): Params {
    return Object.keys(params).reduce(
      (acc: {}, key: string) => ({
        ...acc,
        ...{[keysMap[key] || key]: this.getParamValue(key, params)}
      }),
      {}
    );
  }

  private getParamValue(key: string, params: Params): string {
    if (key === 'measurand') {
      try {
        const json = JSON.parse(decodeURIComponent(params[key]));
        if (json && typeof json === 'object' && json.hasOwnProperty('values')) {
          return json.values;
        }
      } catch {
        return params[key];
      }
    }
    return params[key];
  }

  private setRemainingResultSelection(newState: RemainingResultSelection): void {
    this.dataAvailable$.next(true);
    this._remainingResultSelection$.next(newState);
  }

  private loadSelectableApplications(resultSelectionCommand: ResultSelectionCommand): void {
    this.applications$.next({...this.applications$.getValue(), isLoading: true});
    this.resultSelectionService
      .fetchResultSelectionData<SelectableApplication[]>(URL.APPLICATIONS, resultSelectionCommand)
      .subscribe(next => this.applications$.next({isLoading: false, data: next}));
  }

  private loadSelectableApplicationsAndPages(resultSelectionCommand: ResultSelectionCommand): void {
    this.applicationsAndPages$.next({...this.applicationsAndPages$.getValue(), isLoading: true});
    this.resultSelectionService
      .fetchResultSelectionData<ApplicationWithPages[]>(URL.APPLICATIONS_AND_PAGES, resultSelectionCommand)
      .subscribe(next => this.applicationsAndPages$.next({isLoading: false, data: next}));
  }

  private loadSelectableEventsAndPages(resultSelectionCommand: ResultSelectionCommand): void {
    this.eventsAndPages$.next({...this.eventsAndPages$.getValue(), isLoading: true});
    this.resultSelectionService
      .fetchResultSelectionData<MeasuredEvent[]>(URL.EVENTS_AND_PAGES, resultSelectionCommand)
      .subscribe(next => this.eventsAndPages$.next({isLoading: false, data: next}));
  }

  private loadSelectableLocationsAndBrowsers(resultSelectionCommand: ResultSelectionCommand): void {
    this.locationsAndBrowsers$.next({...this.locationsAndBrowsers$.getValue(), isLoading: true});
    this.resultSelectionService
      .fetchResultSelectionData<Location[]>(URL.LOCATIONS_AND_BROWSERS, resultSelectionCommand)
      .subscribe(next => this.locationsAndBrowsers$.next({isLoading: false, data: next}));
  }

  private loadSelectableConnectivities(resultSelectionCommand: ResultSelectionCommand): void {
    this.connectivities$.next({...this.connectivities$.getValue(), isLoading: true});
    this.resultSelectionService
      .fetchResultSelectionData<Connectivity[]>(URL.CONNECTIVITIES, resultSelectionCommand)
      .subscribe(next => this.connectivities$.next({isLoading: false, data: next}));
  }

  private loadMeasurands(): void {
    this.loadTimes$.next({...this.loadTimes$.getValue(), isLoading: true});
    this.requestCounts$.next({...this.requestCounts$.getValue(), isLoading: true});
    this.requestSizes$.next({...this.requestSizes$.getValue(), isLoading: true});
    this.percentages$.next({...this.percentages$.getValue(), isLoading: true});
    this.resultSelectionService.fetchMeasurands().subscribe((groups: MeasurandGroup[]) => {
      if (groups) {
        groups.forEach((group: MeasurandGroup) => {
          const responseWithLoadingState: MeasurandGroup = {
            isLoading: false,
            name: 'frontend.de.iteratec.isr.measurand.group.' + group.name,
            values: group.values.map(measurand => ({
              kind: 'selectable-measurand',
              name: 'frontend.de.iteratec.isr.measurand.' + measurand.name,
              id: measurand.id
            } as SelectableMeasurand))
          };
          const concerningSubject$ = this.getDefaultSubjectByMeasurandGroup(group.name);
          if (concerningSubject$) {
            concerningSubject$.next(responseWithLoadingState);
          }
        });
      }
    });
  }

  private loadUserTimings(resultSelectionCommand: ResultSelectionCommand): void {
    this.userTimings$.next({...this.userTimings$.getValue(), isLoading: true});
    this.resultSelectionService.fetchResultSelectionData<SelectableMeasurand[]>(URL.USER_TIMINGS, resultSelectionCommand)
      .subscribe(next => {
        next.forEach((userTiming: SelectableMeasurand) => userTiming.kind = 'selectable-measurand');
        const groupName = 'User Timings';
        const responseWithLoadingState: MeasurandGroup = {
          isLoading: false,
          name: groupName,
          values: next
        };
        this.userTimings$.next(responseWithLoadingState);
      });
  }

  private loadHeroTimings(resultSelectionCommand: ResultSelectionCommand): void {
    this.heroTimings$.next({...this.heroTimings$.getValue(), isLoading: true});
    this.resultSelectionService.fetchResultSelectionData<SelectableMeasurand[]>(URL.HERO_TIMINGS, resultSelectionCommand)
      .subscribe(next => {
        next.forEach((heroTiming: SelectableMeasurand) => heroTiming.kind = 'selectable-measurand');
        const groupName = 'Hero Timings';
        const responseWithLoadingState: MeasurandGroup = {
          isLoading: false,
          name: groupName,
          values: next
        };
        this.heroTimings$.next(responseWithLoadingState);
      });
  }

  private loadResultCount(resultSelectionCommand: ResultSelectionCommand): void {
    this.resultSelectionService.fetchResultSelectionData<string>(URL.RESULT_COUNT, resultSelectionCommand)
      .subscribe(next => this.resultCount$.next(+next));
  }

  private getDefaultSubjectByMeasurandGroup(name: string): BehaviorSubject<MeasurandGroup> | undefined {
    let subject$: BehaviorSubject<MeasurandGroup>;
    switch (name) {
      case 'LOAD_TIMES':
        subject$ = this.loadTimes$;
        break;
      case 'REQUEST_COUNTS':
        subject$ = this.requestCounts$;
        break;
      case 'REQUEST_SIZES':
        subject$ = this.requestSizes$;
        break;
      case 'PERCENTAGES':
        subject$ = this.percentages$;
        break;
    }
    return subject$;
  }
}
