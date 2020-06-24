import {NgModule} from '@angular/core';
import {ResultSelectionComponent} from './result-selection.component';
import {ResultSelectionService} from './services/result-selection.service';
import {MeasurandSelectComponent} from './components/measurands/measurand-select/measurand-select.component';
import {SharedModule} from '../shared/shared.module';
import {TimeFrameComponent} from './components/time-frame/time-frame.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MeasurandsComponent} from './components/measurands/measurands.component';
import {OWL_DATE_TIME_FORMATS, OwlDateTimeModule, OwlNativeDateTimeModule} from 'ng-pick-datetime';
import {NgSelectModule} from '@ng-select/ng-select';
import {ApplicationComponent} from './components/application/application.component';
import {SelectionDataComponent} from './components/page-location-connectivity/selection-data/selection-data.component';
import {ResultSelectionStore} from './services/result-selection.store';
import {PageLocationConnectivityComponent} from './components/page-location-connectivity/page-location-connectivity.component';
import {ResetComponent} from './components/reset/reset.component';
import {SubmitComponent} from './components/submit/submit.component';
import {ChartSwitchMenuComponent} from '../shared/components/chart-switch-menu/chart-switch-menu.component';

export const TIME_FORMAT = {
  fullPickerInput: {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'},
  monthYearLabel: {year: 'numeric', month: 'short'},
};

@NgModule({
  imports: [
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule
  ],
  declarations: [
    ResultSelectionComponent,
    TimeFrameComponent,
    ApplicationComponent,
    MeasurandSelectComponent,
    MeasurandsComponent,
    PageLocationConnectivityComponent,
    SelectionDataComponent,
    ResetComponent,
    SubmitComponent,
    ChartSwitchMenuComponent
  ],
  exports: [
    ChartSwitchMenuComponent,
    ResultSelectionComponent
  ],
  providers: [
    {
      provide: OWL_DATE_TIME_FORMATS,
      useValue: TIME_FORMAT
    },
    ResultSelectionService,
    ResultSelectionStore
  ],
  entryComponents: []
})
export class ResultSelectionModule {
}
