import {NgModule} from '@angular/core';
import {LandingComponent} from './landing.component';
import {RouterModule} from '@angular/router';
import {SharedModule} from '../shared/shared.module';
import {ContinueSetupComponent} from './components/continue-setup/continue-setup.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {path: '', component: LandingComponent, data: {title: 'frontend.de.iteratec.osm.landing.title'}},
      {path: 'index', component: LandingComponent, data: {title: 'frontend.de.iteratec.osm.landing.title'}},
      {path: 'continueSetup', component: ContinueSetupComponent, data: {title: 'frontend.de.iteratec.osm.landing.incomplete-setup-title'}}
    ]),
    SharedModule
  ],
  declarations: [LandingComponent, ContinueSetupComponent],
})
export class LandingModule {
}
