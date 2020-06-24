import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {QueueDashboardComponent} from './queue-dashboard.component';
import {SharedMocksModule} from '../../testing/shared-mocks.module';
import {QueueDashboardService, ServerInfo} from './services/queue-dashboard.service';
import {LocationInfoListComponent} from './components/location-info-list/location-info-list.component';
import {OsmLangService} from '../../services/osm-lang.service';
import {GrailsBridgeService} from '../../services/grails-bridge.service';


describe('QueueDashboardComponent', () => {
  let component: QueueDashboardComponent;
  let fixture: ComponentFixture<QueueDashboardComponent>;
  let queueDashboardService: QueueDashboardService;
  let mockserver = [];
  let mockinformation = [];

  beforeEach( async( () => {
    TestBed.configureTestingModule({
      declarations: [
        QueueDashboardComponent,
        LocationInfoListComponent
      ],
      imports: [
        SharedMocksModule
      ],
      providers: [
        QueueDashboardService,
        OsmLangService,
        GrailsBridgeService
      ]
    }).compileComponents();
  }));

  beforeEach( () => {
    fixture = TestBed.createComponent(QueueDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    mockserver = [{
      label: 'prod.server02.wpt.iteratec.de',
      baseUrl: 'http://prod.server02.wpt.iteratec.de/',
      id: 11
    },
      {
        label: 'dev.server02.wpt.iteratec.de',
        baseUrl: 'http://dev.server02.wpt.iteratec.de/',
        id: 1
      }
    ];

    mockinformation = [{
      agents: 1,
      errorsLastHour: 0,
      eventResultLastHour: 0,
      eventsNextHour: 2,
      executingJobs: [
        [{jobConfigLabel: 'label',
          date: '2018-10-14 14:00:16.0',
          wptServerBaseUrl: 'url',
          testId: 55,
          jobResultStatus: {name: 'WAITING'}}]
      ],
      id: 'Dulles_GalaxyS5:undefined',
      jobResultsLastHour: 0,
      jobs: 2,
      jobsNextHour: 1,
      label: 'Dulles_GalaxyS5',
      lastHealthCheckDate: '2018-10-15 15:00:16.0',
      pendingJobs: 2,
      runningJobs: 0}];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be able to call the queueDashboardService method from the QueueDashboardService', () => {
    queueDashboardService = TestBed.get(QueueDashboardService);
    spyOn(queueDashboardService, 'getActiveWptServer');
    new QueueDashboardComponent(queueDashboardService);
    expect(queueDashboardService.getActiveWptServer).toHaveBeenCalled();
  });

  it('should show cards according to wpt servers', () => {
    queueDashboardService = TestBed.get(QueueDashboardService);

    queueDashboardService.activeServers$.next(mockserver);
    fixture.detectChanges();

    const listHeaderEl: HTMLElement = fixture.nativeElement.querySelectorAll('h2');
    expect(listHeaderEl[0].textContent).toEqual(mockserver[0].label);
    expect(listHeaderEl[1].textContent).toEqual(mockserver[1].label);
  });

  it('should not display queue information when collapsed', function () {
    queueDashboardService = TestBed.get(QueueDashboardService);
    queueDashboardService.activeServers$.next(mockserver);
    fixture.detectChanges();

    const datatableEl: HTMLCollection = fixture.nativeElement.querySelectorAll('#data-table-id');
    expect(datatableEl.length).toEqual(0);

    const buttons: HTMLButtonElement = fixture.nativeElement.querySelectorAll('#load-data-button');
    buttons[0].click();
    buttons[1].click();

    fixture.detectChanges();
    const datatableEl2: HTMLCollection = fixture.nativeElement.querySelectorAll('#data-table-id');
    expect(datatableEl2.length).toBeGreaterThan(0);
  });

  it('should show tablebody according serverinformation', () => {
    queueDashboardService = TestBed.get(QueueDashboardService);

    queueDashboardService.activeServers$.next(mockserver);
    fixture.detectChanges();

    const datarows: HTMLCollection = fixture.nativeElement.querySelectorAll('.queueRow');
    expect(datarows.length).toEqual(0);

    fixture.nativeElement.querySelectorAll('.card').forEach(card => {
      card.isOpened = true;
      card.isLoaded = true;
    });

    fixture.detectChanges();

    queueDashboardService.serverInfo$.next({
      [mockserver[0].id]: mockinformation
    });

    fixture.detectChanges();

    const datarows2: HTMLCollection = fixture.nativeElement.querySelectorAll('.queueRow');
    expect(datarows2).toBeTruthy();
    expect(datarows2[0].firstElementChild.textContent ).toEqual(mockinformation[0].id);
  });
});
