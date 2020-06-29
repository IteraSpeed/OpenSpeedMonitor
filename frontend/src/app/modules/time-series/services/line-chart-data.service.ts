import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {ResultSelectionCommand} from '../../result-selection/models/result-selection-command.model';
import {RemainingResultSelection} from '../../result-selection/models/remaing-result-selection.model';
import {EMPTY, Observable, OperatorFunction} from 'rxjs';
import {GetBarchartCommand} from '../../aggregation/models/get-barchart-command.model';
import {catchError} from 'rxjs/operators';
import {GetEventResultDataCommand} from '../models/get-line-chart-command.model';

@Injectable({
  providedIn: 'root'
})
export class LineChartDataService {

  constructor(private http: HttpClient) {
  }

  fetchEventResultData<T>(resultSelectionCommand: ResultSelectionCommand,
                          remainingResultSelection: RemainingResultSelection,
                          url: string): Observable<T> {
    const cmd: GetEventResultDataCommand = this.buildCommand(resultSelectionCommand, remainingResultSelection);
    const params = this.createParams(cmd);
    return this.http.get<T>(url, {params: params}).pipe(
      this.handleError()
    );
  }

  fetchEvents<T>(resultSeclectionCommand: ResultSelectionCommand, url: string): Observable<T> {
    const from: Date = resultSeclectionCommand.from;
    const to: Date = resultSeclectionCommand.to;
    const jobGroupIds: number[] = resultSeclectionCommand.jobGroupIds;

    let params = new HttpParams();
    params = params.append('from', from.toISOString());
    params = params.append('to', to.toISOString());
    params = params.append('jobGroups', JSON.stringify(jobGroupIds));

    return this.http.get<T>(url, {params: params}).pipe(
      this.handleError()
    );
  }

  private buildCommand(resultSelectionCommand: ResultSelectionCommand,
                       remainingResultSelection: RemainingResultSelection): GetEventResultDataCommand {
    return new GetEventResultDataCommand({
      preconfiguredDashboard: null,
      from: resultSelectionCommand.from,
      to: resultSelectionCommand.to,
      interval: remainingResultSelection.interval,
      measurands: remainingResultSelection.measurands,
      jobGroups: resultSelectionCommand.jobGroupIds,
      pages: resultSelectionCommand.pageIds,
      measuredEvents: resultSelectionCommand.measuredEventIds,
      browsers: resultSelectionCommand.browserIds,
      locations: resultSelectionCommand.locationIds,
      connectivities: resultSelectionCommand.selectedConnectivities,
      deviceTypes: remainingResultSelection.deviceTypes,
      operatingSystems: remainingResultSelection.operatingSystems,
      performanceAspectTypes: remainingResultSelection.performanceAspectTypes
    });
  }

  private createParams(getBarchartCommand: GetBarchartCommand) {
    let params = new HttpParams();

    Object.keys(getBarchartCommand).forEach(key => {
      if (getBarchartCommand[key]) {
        if (key === 'from' || key === 'to') {
          params = params.append(key, getBarchartCommand[key].toISOString());
        } else if (key === 'interval') {
          params = params.append(key, getBarchartCommand[key].toString());
        } else {
          params = params.append(key, JSON.stringify(getBarchartCommand[key]));
        }
      }
    });

    return params;
  }

  private handleError(): OperatorFunction<any, any> {
    return catchError((error) => {
      console.error(error);
      return EMPTY;
    });
  }
}
