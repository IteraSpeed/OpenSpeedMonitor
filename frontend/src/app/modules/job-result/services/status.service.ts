import {Injectable} from '@angular/core';
import {JobResultStatus} from '../models/job-result-status.enum';
import {WptStatus} from '../models/wpt-status.enum';
import {StatusGroup} from '../models/status-group.enum';
import {TranslateService} from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class StatusService {

  readonly JOB_RESULT_STATUS_GROUPS: { [key: string]: string [] } = {
    GROUP_NOT_TERMINATED: [
      JobResultStatus.WAITING,
      JobResultStatus.RUNNING
    ],
    GROUP_SUCCESS: [
      JobResultStatus.SUCCESS
    ],
    GROUP_FAILED: [
      JobResultStatus.INCOMPLETE,
      JobResultStatus.LAUNCH_ERROR,
      JobResultStatus.FETCH_ERROR,
      JobResultStatus.PERSISTENCE_ERROR,
      JobResultStatus.TIMEOUT,
      JobResultStatus.FAILED,
      JobResultStatus.CANCELED,
      JobResultStatus.ORPHANED,
      JobResultStatus.DID_NOT_START
    ]
  };

  readonly WPT_STATUS_GROUPS: { [key: string]: string [] } = {
    GROUP_NOT_TERMINATED: [
      WptStatus.UNKNOWN,
      WptStatus.PENDING,
      WptStatus.IN_PROGRESS
    ],
    GROUP_SUCCESS: [
      WptStatus.SUCCESSFUL,
      WptStatus.COMPLETED,
      WptStatus.TEST_HAS_A_UNDEFINED_PROBLEM,
      WptStatus.TEST_COMPLETED_BUT_INDIVIDUAL_REQUEST_FAILED
    ],
    GROUP_FAILED: [
      WptStatus.TESTED_APPLICATION_CLIENT_ERROR,
      WptStatus.TESTED_APPLICATION_INTERNAL_SERVER_ERROR,
      WptStatus.TEST_DID_NOT_START,
      WptStatus.TEST_FAILED_WAITING_FOR_DOM_ELEMENT,
      WptStatus.TEST_TIMED_OUT,
      WptStatus.TEST_TIMED_OUT_CONTENT_ERRORS
    ]
  };

  constructor(private translateService: TranslateService) {
  }

  compareStatus(item, selected): boolean {
    if (selected.label) {
      return item.label ? item.label === selected.label : false;
    } else {
      return item === selected;
    }
  }

  getJobResultStatusGroupLabel(jobResultStatus: string): string {
    if (this.isTestNotTerminated(jobResultStatus)) {
      return this.translateService.instant(StatusGroup.GROUP_NOT_TERMINATED);
    }
    if (this.isTestSuccessful(jobResultStatus)) {
      return this.translateService.instant(StatusGroup.GROUP_SUCCESS);
    }
    if (this.hasTestFailed(jobResultStatus)) {
      return this.translateService.instant(StatusGroup.GROUP_FAILED);
    }
  }

  getWptStatusGroupLabel(wptStatus: string): string {
    if (this.isWptNotTerminated(wptStatus)) {
      return this.translateService.instant(StatusGroup.GROUP_NOT_TERMINATED);
    }
    if (this.isWptSuccessful(wptStatus)) {
      return this.translateService.instant(StatusGroup.GROUP_SUCCESS);
    }
    if (this.hasWptFailed(wptStatus)) {
      return this.translateService.instant(StatusGroup.GROUP_FAILED);
    }
  }

  writeStatusAsQueryParam(selectedStatusList: (string | object)[], statusEnum: any, isJobSelected: boolean): string[] {
    if (isJobSelected && selectedStatusList.length > 0) {
      return selectedStatusList.map(selectedStatus => {
        if (typeof selectedStatus === 'string') {
          return encodeURIComponent(
            Object.keys(statusEnum).find(key => statusEnum[key] === selectedStatus).toLowerCase()
          );
        }
        if (typeof selectedStatus === 'object' && selectedStatus['label'] && typeof selectedStatus['label'] === 'string') {
          return encodeURIComponent(
            Object.keys(StatusGroup).find(key =>
              this.translateService.instant(StatusGroup[key]) === selectedStatus['label']).toLowerCase()
          );
        }
      });
    }
    return null;
  }

  readStatusByQueryParam(queryParam: (string | string[]),
                         statusEnum: any,
                         childrenByStatusGroup: { [key: string]: string [] }): (string | object)[] {
    if (!queryParam) {
      return [];
    }
    if (typeof queryParam === 'string') {
      queryParam = decodeURIComponent(queryParam).toUpperCase();
      return [].concat(this.getStatusLabelOrStatusGroup(queryParam, statusEnum, childrenByStatusGroup));
    }
    if (typeof queryParam === 'object' && Array.isArray(queryParam)) {
      return queryParam.map((status: string) => {
        status = decodeURIComponent(status).toUpperCase();
        return this.getStatusLabelOrStatusGroup(status, statusEnum, childrenByStatusGroup);
      });
    }
  }

  isStatusIncludingTerms(status: string, terms: any): boolean {
    return terms.find((termOrTermList: (string | string[])) => {
      if (typeof termOrTermList === 'string') {
        return status.toLowerCase().includes(termOrTermList.toLowerCase());
      }
      if (typeof termOrTermList === 'object' && termOrTermList['children'] && Array.isArray(termOrTermList['children'])) {
        return termOrTermList['children'].find((term: string) => status.toLowerCase().includes(term.toLowerCase()));
      }
      return false;
    });
  }

  isTestNotTerminated(jobResultStatus: string): boolean {
    return this.JOB_RESULT_STATUS_GROUPS.GROUP_NOT_TERMINATED.includes(jobResultStatus);
  }

  isTestSuccessful(jobResultStatus: string): boolean {
    return this.JOB_RESULT_STATUS_GROUPS.GROUP_SUCCESS.includes(jobResultStatus);
  }

  hasTestFailed(jobResultStatus: string): boolean {
    return this.JOB_RESULT_STATUS_GROUPS.GROUP_FAILED.includes(jobResultStatus);
  }

  private isWptNotTerminated(wptStatus: string): boolean {
    return this.WPT_STATUS_GROUPS.GROUP_NOT_TERMINATED.includes(wptStatus);
  }

  private isWptSuccessful(wptStatus: string): boolean {
    return this.WPT_STATUS_GROUPS.GROUP_SUCCESS.includes(wptStatus);
  }

  private hasWptFailed(wptStatus: string): boolean {
    return this.WPT_STATUS_GROUPS.GROUP_FAILED.includes(wptStatus);
  }

  private getStatusLabelOrStatusGroup(status: string,
                                      statusEnum: any,
                                      childrenByStatusGroup: { [key: string]: string [] }): (string | object) {
    if (Object.keys(StatusGroup).find(key => key === status)) {
      // status group
      return {
        label: this.translateService.instant(StatusGroup[status]),
        children: childrenByStatusGroup[status]
      };
    } else {
      // status
      return statusEnum[status];
    }
  }
}
