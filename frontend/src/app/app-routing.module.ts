import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {NotFoundComponent} from './not-found.component';


const appRoutes: Routes = [
  {
    path: 'aspectConfiguration',
    loadChildren: './modules/aspect-configuration/aspect-configuration.module#AspectConfigurationModule'
  },
  {
    path: 'applicationDashboard',
    loadChildren: './modules/application-dashboard/application-dashboard.module#ApplicationDashboardModule'
  },
  {
    path: 'queueDashboard',
    loadChildren: './modules/queue-dashboard/queue-dashboard.module#QueueDashboardModule'
  },
  {
    path: 'landing',
    loadChildren: './modules/landing/landing.module#LandingModule'
  },
  {
    path: 'metricFinder',
    loadChildren: './modules/metric-finder/metric-finder.module#MetricFinderModule'
  },
  {
    path: 'aggregation',
    loadChildren: './modules/aggregation/aggregation.module#AggregationModule'
  },
  {
    path: 'eventResultDashboardDev',
    loadChildren: './modules/time-series/time-series.module#TimeSeriesModule'
  },
  {
    path: 'distributionDev',
    loadChildren: './modules/distribution/distribution.module#DistributionModule'
  },
  {
    path: 'jobResult',
    loadChildren: './modules/job-result/job-result.module#JobResultModule'
  },
  {
    path: '',
    loadChildren: './modules/landing/landing.module#LandingModule',
    pathMatch: 'full'
  },
  {path: '**', component: NotFoundComponent}];

@NgModule({
  imports: [
    // RouterModule.forRoot(appRoutes, {enableTracing: true})
    RouterModule.forRoot(appRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {
}
