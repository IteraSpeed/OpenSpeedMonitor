import {NgModule} from '@angular/core';
import {JobThresholdComponent} from './job-threshold.component';
import {ThresholdGroupComponent} from './components/threshold-group/threshold-group.component';
import {ThresholdComponent} from './components/threshold/threshold.component';
import {SharedModule} from '../shared/shared.module';
import {ThresholdRowComponent} from './components/threshold-row/threshold-row.component';
import {MeasurandService} from './services/measurand.service';
import {MeasuredEventService} from './services/measured-event.service';
import {ThresholdService} from './services/threshold.service';
import {ThresholdRestService} from './services/threshold-rest.service';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [
    JobThresholdComponent,
    ThresholdGroupComponent,
    ThresholdComponent,
    ThresholdRowComponent
  ],
  providers: [
    {provide: 'components', useValue: [JobThresholdComponent], multi: true},
    MeasurandService,
    MeasuredEventService,
    ThresholdService,
    ThresholdRestService
  ],
  entryComponents: [JobThresholdComponent]
})
export class ThresholdModule { }
