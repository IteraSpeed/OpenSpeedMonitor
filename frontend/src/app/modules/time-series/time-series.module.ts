import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TimeSeriesComponent} from './time-series.component';
import {RouterModule, Routes} from '@angular/router';
import {SharedModule} from '../shared/shared.module';
import {ResultSelectionModule} from '../result-selection/result-selection.module';
import {TimeSeriesChartComponent} from './components/time-series-chart/time-series-chart.component';
import {LineChartService} from './services/line-chart.service';
import {LineChartDataService} from './services/line-chart-data.service';
import {FormsModule} from '@angular/forms';

const TimeSeriesRoutes: Routes = [
  {path: 'showAll', component: TimeSeriesComponent, data: {title: 'frontend.de.iteratec.osm.timeSeries.title'}},
  {path: '**', redirectTo: 'showAll', pathMatch: 'full'}
];

@NgModule({
  declarations: [
    TimeSeriesComponent,
    TimeSeriesChartComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(TimeSeriesRoutes),
    SharedModule,
    ResultSelectionModule,
    FormsModule
  ],
  providers: [
    LineChartService,
    LineChartDataService
  ],
  exports: [
    TimeSeriesComponent
  ]
})
export class TimeSeriesModule {
}
