import {TranslateService} from '@ngx-translate/core';
import {TestBed} from '@angular/core/testing';
import {OsmLangService} from './services/osm-lang.service';
import {GlobalModule} from './global.module';
import {TitleService} from './services/title.service';
import {RouterTestingModule} from '@angular/router/testing';

describe('GlobalModule', () => {
  let globalModule: GlobalModule;
  const osmLangServiceSpy = jasmine.createSpyObj('OsmLangService',
    ['getOsmLang']);
  const translateServiceSpy = jasmine.createSpyObj('TranslateService',
    ['getDefaultLang', 'setDefaultLang', 'use', 'addLangs']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      providers: [
        {provide: TranslateService, useValue: translateServiceSpy},
        {provide: OsmLangService, useValue: osmLangServiceSpy}
      ]
    });
    globalModule = new GlobalModule(TestBed.get(OsmLangService), TestBed.get(TranslateService), TestBed.get(TitleService));
  });

  it('sets en as default lang', () => {
    expect(getMostRecentCallsArgs(translateServiceSpy.setDefaultLang)).toEqual(['en']);
  });
  it('sets en and de as supported languages', () => {
    const supportedLangs: string[] = ['en', 'de'];
    expect(getMostRecentCallsArgs(translateServiceSpy.addLangs)).toEqual([supportedLangs]);

  });
  it('osm lang is used if it is within supported langs', () => {
    osmLangServiceSpy.getOsmLang.and.returnValue('de');
    globalModule = new GlobalModule(
      TestBed.get(OsmLangService),
      TestBed.get(TranslateService),
      TestBed.get(TitleService)
    );
    expect(getMostRecentCallsArgs(translateServiceSpy.use)).toEqual(['de']);
    osmLangServiceSpy.getOsmLang.and.returnValue('en');
    globalModule = new GlobalModule(
      TestBed.get(OsmLangService),
      TestBed.get(TranslateService),
      TestBed.get(TitleService)
    );
    expect(getMostRecentCallsArgs(translateServiceSpy.use)).toEqual(['en']);
  });
  it('default lang is used if osm lang is not supported', () => {
    osmLangServiceSpy.getOsmLang.and.returnValue('not_supported_lang');
    const defaultLang = 'en';
    translateServiceSpy.getDefaultLang.and.returnValue(defaultLang);
    globalModule = new GlobalModule(
      TestBed.get(OsmLangService),
      TestBed.get(TranslateService),
      TestBed.get(TitleService)
    );
    expect(getMostRecentCallsArgs(translateServiceSpy.use)).toEqual([defaultLang]);
  });
});

function getMostRecentCallsArgs(method) {
  return method.calls.argsFor(method.calls.count() - 1);
}
