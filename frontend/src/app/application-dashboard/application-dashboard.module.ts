import {NgModule} from '@angular/core';
import {ApplicationDashboardComponent} from './application-dashboard.component';
import {ApplicationSelectComponent} from './components/application-select/application-select.component';
import {SharedModule} from "../shared/shared.module";
import {ApplicationDashboardService} from "./services/application-dashboard.service";
import {PageComponent} from './components/page/page.component';
import {ApplicationDashboardEntryComponent} from './application-dashboard.entry-component'
import {RouterModule, Routes} from "@angular/router";
import {CsiValueComponent} from "./components/csi-value/csi-value.component";
import {CsiGraphComponent} from './components/csi-graph/csi-graph.component';
import {PageMetricComponent} from './components/page-metric/page-metric.component';

const DashboardRoutes: Routes = [
  {path: '', component: ApplicationDashboardComponent},
  {path: ':applicationId', component: ApplicationDashboardComponent}
];

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(DashboardRoutes)
  ],
  declarations: [
    ApplicationDashboardEntryComponent,
    ApplicationDashboardComponent,
    ApplicationSelectComponent,
    PageComponent,
    CsiValueComponent,
    CsiGraphComponent,
    PageMetricComponent
  ],
  exports: [
    RouterModule
  ],
  providers: [
    {
      provide: 'components',
      useValue: [ApplicationDashboardEntryComponent],
      multi: true
    },
    ApplicationDashboardService
  ],
  entryComponents: [ApplicationDashboardEntryComponent]
})
export class ApplicationDashboardModule {
}
