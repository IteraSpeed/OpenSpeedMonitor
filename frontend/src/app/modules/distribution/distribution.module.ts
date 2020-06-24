import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DistributionComponent} from './distribution.component';
import {RouterModule, Routes} from '@angular/router';
import {ResultSelectionModule} from '../result-selection/result-selection.module';
import {SharedModule} from '../shared/shared.module';
import {ViolinchartDataService} from './services/violinchart-data.service';
import {ViolinChartComponent} from './components/violin-chart/violin-chart.component';
import {FormsModule} from '@angular/forms';

const DistributionRoutes: Routes = [
  {path: 'show', component: DistributionComponent, data: {title: 'frontend.de.iteratec.osm.distribution.title'}},
  {path: '**', redirectTo: 'show', pathMatch: 'full'}
];

@NgModule({
  declarations: [DistributionComponent, ViolinChartComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(DistributionRoutes),
    SharedModule,
    ResultSelectionModule,
    FormsModule,
  ],
  providers: [
    ViolinchartDataService
  ]
})
export class DistributionModule {
}
