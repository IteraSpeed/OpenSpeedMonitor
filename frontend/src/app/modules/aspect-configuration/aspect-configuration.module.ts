import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AspectConfigurationComponent} from './aspect-configuration.component';
import {RouterModule, Routes} from '@angular/router';
import {SharedModule} from '../shared/shared.module';
import {AspectMetricsComponent} from './components/aspect-metrics/aspect-metrics.component';
import {MetricFinderModule} from '../metric-finder/metric-finder.module';
import {EditAspectMetricsComponent} from './components/edit-aspect-metrics/edit-aspect-metrics.component';

const routes: Routes = [
  {path: ':applicationId/:pageId', component: AspectConfigurationComponent, data: {title: 'frontend.de.iteratec.osm.performance-aspect.configuration.overview.title'}},
  {path: 'edit/:applicationId/:pageId/:browserId/:aspectType', component: EditAspectMetricsComponent, data: {title: 'frontend.de.iteratec.osm.performance-aspect.configuration.edit.title'}}
];

@NgModule({
  declarations: [AspectConfigurationComponent, AspectMetricsComponent, EditAspectMetricsComponent],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    SharedModule,
    MetricFinderModule
  ],
  exports: [
    RouterModule
  ]
})
export class AspectConfigurationModule {
}
