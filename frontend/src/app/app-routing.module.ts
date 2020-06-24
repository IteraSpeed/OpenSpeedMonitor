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
    path: '',
    loadChildren: './modules/landing/landing.module#LandingModule',
    pathMatch: 'full'
  },
  {path: '**', component: NotFoundComponent, data: {title: 'frontend.de.iteratec.osm.error.notFound.title'}}];

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
