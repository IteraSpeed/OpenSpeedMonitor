import {BrowserModule} from '@angular/platform-browser';
import {ApplicationRef, Injector, NgModule, NgModuleFactory, SystemJsNgModuleLoader, Type} from '@angular/core';
import {AppRoutingModule} from './app-routing.module';
import {APP_BASE_HREF} from '@angular/common';
import {NotFoundComponent} from './not-found.component';
import {APP_COMPONENT_SELECTOR, AppComponent} from './app.component';
import {GlobalModule} from './global.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';


@NgModule({
  declarations: [NotFoundComponent, AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    GlobalModule
  ],
  providers: [SystemJsNgModuleLoader,
    {provide: APP_BASE_HREF, useValue: '/'}
  ],
  entryComponents: [
    AppComponent
  ]
})
export class AppModule {
  constructor(private injector: Injector, private moduleLoader: SystemJsNgModuleLoader) {
  }

  ngDoBootstrap(appRef: ApplicationRef) {
    this.bootstrapAppComponentIfExists(appRef);
    this.bootstrapLazyModulesIfExist(appRef);
  }

  private bootstrapAppComponentIfExists(appRef: ApplicationRef) {
    if (document.querySelector(APP_COMPONENT_SELECTOR)) {
      appRef.bootstrap(AppComponent);
    }
  }

  private bootstrapLazyModulesIfExist(appRef: ApplicationRef) {
    const widgets = document.querySelectorAll('[data-module-path]');
    for (const i in widgets) {
      if (!widgets.hasOwnProperty(i)) {
        continue;
      }
      const modulePath = (widgets[i] as HTMLElement).getAttribute('data-module-path');
      if (!modulePath) {
        continue;
      }
      this.moduleLoader.load(modulePath).then((moduleFactory: NgModuleFactory<any>) => {
        this.bootstrapComponentsFromModule(appRef, moduleFactory);
      }, (error) => {
        console.error(error);
      });
    }
  }

  private bootstrapComponentsFromModule(appRef: ApplicationRef, moduleFactory: NgModuleFactory<any>) {
    const ngModuleRef = moduleFactory.create(this.injector);
    ngModuleRef.injector.get('components').forEach((components: Type<{}>[]) => {
      components.forEach((component: Type<{}>) => {
        const compFactory = ngModuleRef.componentFactoryResolver.resolveComponentFactory(component);
        if (document.querySelector(compFactory.selector)) {
          appRef.bootstrap(compFactory);
        }
      });
    });
  }
}
