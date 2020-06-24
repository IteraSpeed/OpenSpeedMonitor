import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {SharedModule} from '../shared/shared.module';
import {AggregationComponent} from './aggregation.component';
import {ResultSelectionModule} from '../result-selection/result-selection.module';
import {AggregationChartComponent} from './components/aggregation-chart/aggregation-chart.component';
import {BarchartDataService} from './services/barchart-data.service';
import {AggregationChartDataService} from './services/aggregation-chart-data.service';
import {FormsModule} from '@angular/forms';

const AggregationRoutes: Routes = [
  {path: 'show', component: AggregationComponent, data: {title: 'frontend.de.iteratec.osm.aggregation.title'}},
  {path: '**', redirectTo: 'show', pathMatch: 'full'}
];

@NgModule({
  declarations: [AggregationComponent, AggregationChartComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(AggregationRoutes),
    SharedModule,
    ResultSelectionModule,
    FormsModule
  ],
  providers: [
    BarchartDataService,
    AggregationChartDataService
  ]
})
export class AggregationModule {
}
