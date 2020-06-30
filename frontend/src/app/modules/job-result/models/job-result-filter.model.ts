export interface JobResultFilter {
  dateTimeRange: Date[];
  testAgent: string;
  jobResultStatus: (string | object)[];
  wptStatus: (string | object)[];
  description: string;
}
