import {Component, Input, OnInit} from '@angular/core';
import {
  ExtendedPerformanceAspect,
  PerformanceAspect,
  PerformanceAspectType
} from '../../../../models/perfomance-aspect.model';
import {Observable} from 'rxjs';
import {Application} from '../../../../models/application.model';
import {Page} from '../../../../models/page.model';
import {AspectConfigurationService} from '../../services/aspect-configuration.service';
import {map} from 'rxjs/operators';

@Component({
  selector: 'osm-aspect-metrics',
  templateUrl: './aspect-metrics.component.html',
  styleUrls: ['./aspect-metrics.component.scss']
})
export class AspectMetricsComponent implements OnInit {

  @Input() application: Application;
  @Input() page: Page;
  @Input() browserId: number;

  @Input() actualType: PerformanceAspectType;
  aspectsToShow$: Observable<ExtendedPerformanceAspect[]>;


  constructor(private aspectConfService: AspectConfigurationService) {
  }

  ngOnInit() {
    this.aspectsToShow$ = this.aspectConfService.extendedAspects$.pipe(
      map((aspects: ExtendedPerformanceAspect[]) => {
        return aspects.filter((aspect: ExtendedPerformanceAspect) => aspect.performanceAspectType.name === this.actualType.name);
      })
    );
  }

  getSelectedAspect(): PerformanceAspect {
    if (typeof(this.application) === 'undefined') { return null; }
    const matchingAspect: PerformanceAspect = this.aspectConfService.extendedAspects$.getValue().find((aspect: PerformanceAspect) => {
      return aspect.applicationId === this.application.id && aspect.pageId === this.page.id &&
        aspect.browserId === this.browserId && aspect.performanceAspectType.name === this.actualType.name;
    });
    return matchingAspect;
  }

}
