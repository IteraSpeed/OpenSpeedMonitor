export interface PageMetricsDto {
  pageId: number;
  pageName: string;
  speedIndex: number;
  docCompleteTimeInMillisecs: number;
  fullyLoadedIncomingBytes: number;
}
