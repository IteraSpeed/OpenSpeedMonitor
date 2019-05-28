import {Component, Input} from '@angular/core';
import {Observable} from "rxjs/internal/Observable";
import {PageMetricsDto} from "../../models/page-metrics.model";
import {ApplicationService} from "../../../../services/application.service";
import {map} from "rxjs/operators";
import {CalculationUtil} from "../../../../utils/calculation.util";
import {PageCsiDto} from "../../models/page-csi.model";
import {ResponseWithLoadingState} from "../../../../models/response-with-loading-state.model";
import {Metrics} from "../../../../enums/metric.enum";
import {Application} from "../../../../models/application.model";

@Component({
  selector: 'osm-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss']
})
export class PageComponent {
  @Input() lastDateOfResult: string;
  @Input() metricsForPage: PageMetricsDto;
  @Input() application: Application;
  pageCsi$: Observable<number>;
  pageCsiDate$: Observable<string>;
  isLoading: boolean = true;
  metrics = Metrics;

  constructor(private applicationDashboardService: ApplicationService) {
    this.pageCsi$ = applicationDashboardService.pageCsis$.pipe(
      map((next: ResponseWithLoadingState<PageCsiDto[]>) => {
        this.isLoading = next.isLoading;
        if (this.isLoading) return 0;
        const pageCsiDto: PageCsiDto = next.data.find((pageCsiDto: PageCsiDto) => pageCsiDto.pageId == this.metricsForPage.pageId);
        return pageCsiDto ? pageCsiDto.csiDocComplete : null;
      })
    );

    this.pageCsiDate$ = applicationDashboardService.pageCsis$.pipe(
      map((next: ResponseWithLoadingState<PageCsiDto[]>) => {
        this.isLoading = next.isLoading;
        if (this.isLoading) return null;
        const pageCsiDto: PageCsiDto = next.data.find((pageCsiDto: PageCsiDto) => pageCsiDto.pageId == this.metricsForPage.pageId);
        return pageCsiDto ? pageCsiDto.date : null;
      })
    );
  }


  transform(value: number): string {
    if (value) {
      return CalculationUtil.toRoundedStringWithFixedDecimals(value, 2);
    }
    return "";
  }

  convertToMib(value: number): number {
    if (value) {
      return CalculationUtil.convertBytesToMiB(value);
    }
    return value;
  }

  convertMillisecsToSecs(value: number): number {
    if (value) {
      return CalculationUtil.convertMillisecsToSecs(value);
    }
    return value;
  }
}
