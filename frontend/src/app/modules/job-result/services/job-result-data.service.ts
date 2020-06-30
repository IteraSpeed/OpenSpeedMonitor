import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {URL} from '../../../enums/url.enum';
import {catchError, map} from 'rxjs/operators';
import {JobResult} from '../models/job-result.model';
import {Job} from '../models/job.model';

@Injectable({
  providedIn: 'root'
})
export class JobResultDataService {

  constructor(private http: HttpClient) {
  }

  getAllJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(URL.ALL_JOBS)
      .pipe(
        map((data: Job[]) => {
          data.forEach((job: Job) => {
            job.id = job[0];
            job.label = job[1];
            delete job[0];
            delete job[1];
          });
          return data;
        }),
        catchError(this.handleError<Job[]>('getAllJobs', []))
      );
  }

  getJobResults(jobId: number): Observable<JobResult[]> {
    const params = {jobId: jobId.toString(10)};
    return this.http.get<JobResult[]>(URL.JOB_RESULTS, {params: params})
      .pipe(
        map((data: JobResult[]) => {
          data.forEach((jobResult: JobResult) => jobResult.date = new Date(jobResult.date));
          return data;
        }),
        catchError(this.handleError<JobResult[]>('getJobResults', []))
      );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(operation, error.message);
      return of(result as T);
    };
  }
}
