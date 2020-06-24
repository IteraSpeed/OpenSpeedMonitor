import {NgModule} from '@angular/core';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {GrailsBridgeService} from './services/grails-bridge.service';
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {OsmLangService} from './services/osm-lang.service';
import {ApplicationService} from './services/application.service';
import {ResultSelectionService} from './modules/result-selection/services/result-selection.service';
import {ResultSelectionStore} from './modules/result-selection/services/result-selection.store';
import {TitleService} from './services/title.service';

// AoT requires an exported function for factories
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, '/static/i18n/', `.json`);
}

@NgModule({
  imports: [
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    GrailsBridgeService,
    OsmLangService,
    ApplicationService,
    ResultSelectionService,
    ResultSelectionStore
  ],
})
export class GlobalModule {
  supportedLangs: string[] = ['en', 'de'];

  constructor(private osmLangService: OsmLangService,
              private translateService: TranslateService,
              private titleService: TitleService
  ) {
    translateService.addLangs(this.supportedLangs);
    translateService.setDefaultLang('en');

    translateService.use(this.supportedLangs.includes(this.osmLangService.getOsmLang()) ?
      this.osmLangService.getOsmLang() :
      translateService.getDefaultLang()
    );

    titleService.initRouteEventListener();
  }
}
