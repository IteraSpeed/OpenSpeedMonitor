import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {JobResultComponent} from './job-result.component';
import {RouterModule, Routes} from '@angular/router';
import {SharedModule} from '../shared/shared.module';
import {FormsModule} from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';
import {OwlDateTimeModule, OwlNativeDateTimeModule} from 'ng-pick-datetime';

const JobResultRoutes: Routes = [
  {path: 'list', component: JobResultComponent, data: {title: 'frontend.de.iteratec.osm.jobResult.title'}},
  {path: '**', redirectTo: 'list', pathMatch: 'full'}
];

@NgModule({
  declarations: [JobResultComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(JobResultRoutes),
    SharedModule,
    FormsModule,
    NgSelectModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule
  ]
})
export class JobResultModule {
}
