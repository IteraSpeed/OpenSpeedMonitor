import {NgModule} from '@angular/core';
import {ResultSelectionComponent} from './result-selection.component';
import {ResultSelectionService} from "./services/result-selection.service";
import {MeasurandSelectComponent} from "./components/measurand-select/measurand-select.component";
import {SharedModule} from "../shared/shared.module";
import {TimeFrameComponent} from './components/time-frame/time-frame.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MeasurandsComponent} from './components/measurands/measurands.component';
import {
  OWL_DATE_TIME_FORMATS,
  OwlDateTimeModule,
  OwlNativeDateTimeModule
} from 'ng-pick-datetime';
import {PageLocationConnectivityComponent} from './components/page-location-connectivity/page-location-connectivity.component';
import {NgSelectModule} from "@ng-select/ng-select";
import {ApplicationComponent} from './components/application/application.component';
import {ResultSelectionStore} from "./services/result-selection.store";

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
    PageLocationConnectivityComponent,
    MeasurandSelectComponent,
    MeasurandsComponent
  ],
  exports: [MeasurandSelectComponent],
  providers: [
    {
      provide: 'components',
      useValue: [ResultSelectionComponent],
      multi: true
    },
    {
      provide: OWL_DATE_TIME_FORMATS,
      useValue: TIME_FORMAT
    },
    ResultSelectionService,
    ResultSelectionStore
  ],
  entryComponents: [
    ResultSelectionComponent
  ]
})
export class ResultSelectionModule { }
