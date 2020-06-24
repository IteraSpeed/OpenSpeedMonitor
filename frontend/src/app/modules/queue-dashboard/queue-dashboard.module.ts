import {LOCALE_ID, NgModule} from '@angular/core';
import {QueueDashboardComponent} from './queue-dashboard.component';
import {SharedModule} from '../shared/shared.module';
import {RouterModule, Routes} from '@angular/router';
import {QueueDashboardService} from './services/queue-dashboard.service';
import {HttpClientModule} from '@angular/common/http';
import {LocationInfoListComponent} from './components/location-info-list/location-info-list.component';
import {OsmLangService} from '../../services/osm-lang.service';

import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
registerLocaleData(localeDe, 'de');

const QueueRoutes: Routes = [
  {path: '', component: QueueDashboardComponent, data: {title: 'frontend.de.iteratec.osm.queueDashboard.title'}},
];

@NgModule({
  imports: [
    RouterModule.forChild(QueueRoutes),
    SharedModule,
    HttpClientModule
  ],
  declarations: [
    QueueDashboardComponent,
    LocationInfoListComponent
  ],
  exports: [
  RouterModule
  ],
  providers: [
    {
      provide: 'components',
      useValue: [QueueDashboardComponent],
      multi: true
    },
    QueueDashboardService,
    OsmLangService
  ],
  entryComponents: [QueueDashboardComponent]
})
export class QueueDashboardModule { }
