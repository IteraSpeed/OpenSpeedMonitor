import {Component, Input, OnInit} from '@angular/core';
import {ExtendedPerformanceAspect, PerformanceAspectType} from "../../../../models/perfomance-aspect.model";
import {Observable, of} from "rxjs";
import {ApplicationService} from "../../../../services/application.service";
import {Application} from "../../../../models/application.model";
import {Page} from "../../../../models/page.model";
import {AspectConfigurationService} from "../../services/aspect-configuration.service";

@Component({
  selector: 'osm-aspect-metrics',
  templateUrl: './aspect-metrics.component.html',
  styleUrls: ['./aspect-metrics.component.scss']
})
export class AspectMetricsComponent implements OnInit {
  @Input() aspects: ExtendedPerformanceAspect[];
  @Input() aspectType: PerformanceAspectType;
  aspectsToShow$: Observable<ExtendedPerformanceAspect[]>;
  application$: Observable<Application>;
  page$: Observable<Page>;
  @Input() browserId: number;

  constructor(private applicationService: ApplicationService, private aspectConfService: AspectConfigurationService) {
    this.application$ = applicationService.selectedApplication$;
    this.page$ = aspectConfService.selectedPage$;
  }

  ngOnInit() {
    this.aspectsToShow$ = of(this.aspects.filter((aspect: ExtendedPerformanceAspect) => aspect.performanceAspectType.name == this.aspectType.name));
  }

}
