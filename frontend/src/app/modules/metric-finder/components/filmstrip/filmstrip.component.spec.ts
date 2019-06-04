import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {FilmstripComponent} from './filmstrip.component';
import {FilmstripService} from '../../services/filmstrip.service';
import {FilmstripServiceMock} from '../../services/filmstrip.service.mock';
import {SharedMocksModule} from '../../../../testing/shared-mocks.module';
import {MetricFinderService} from '../../services/metric-finder.service';
import {MetricFinderServiceMock} from '../../services/metric-finder.service.mock';

describe('FilmstripComponent', () => {
  let component: FilmstripComponent;
  let fixture: ComponentFixture<FilmstripComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FilmstripComponent],
      providers: [{
        provide: FilmstripService,
        useClass: FilmstripServiceMock,
      }, {
        provide: MetricFinderService,
        useClass: MetricFinderServiceMock
      }]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilmstripComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
