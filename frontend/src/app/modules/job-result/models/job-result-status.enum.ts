export enum JobResultStatus {
  WAITING = 'Waiting',
  RUNNING = 'Running',
  SUCCESS = 'Finished',
  INCOMPLETE = 'Incomplete',
  LAUNCH_ERROR = 'Failed to start',
  FETCH_ERROR = 'Failed to fetch result',
  PERSISTENCE_ERROR = 'Failed to save result',
  TIMEOUT = 'Timed out',
  FAILED = 'Failed',
  CANCELED = 'Canceled',
  ORPHANED = 'Orphaned',
  DID_NOT_START = 'Did not start'
}
