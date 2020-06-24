import {Component, Input, OnInit} from '@angular/core';
import {ResultSelectionService} from '../../services/result-selection.service';
import {Observable} from 'rxjs';
import {MeasuredEvent} from '../../../../models/measured-event.model';
import {Location} from '../../../../models/location.model';
import {Connectivity} from '../../../../models/connectivity.model';
import {ResultSelectionStore} from '../../services/result-selection.store';
import {ResponseWithLoadingState} from '../../../../models/response-with-loading-state.model';
import {ResultSelectionCommandParameter} from '../../models/result-selection-command.model';
import {UiComponent} from '../../../../enums/ui-component.enum';

@Component({
  selector: 'osm-result-selection-page-location-connectivity',
  templateUrl: './page-location-connectivity.component.html',
  styleUrls: ['./page-location-connectivity.component.scss']
})
export class PageLocationConnectivityComponent implements OnInit {
  eventsAndPages$: Observable<ResponseWithLoadingState<MeasuredEvent[]>>;
  locationsAndBrowsers$: Observable<ResponseWithLoadingState<Location[]>>;
  connectivities$: Observable<ResponseWithLoadingState<Connectivity[]>>;

  ActiveTab: typeof ActiveTab = ActiveTab;
  activeTab: ActiveTab;
  ResultSelectionCommandParameter = ResultSelectionCommandParameter;

  @Input() showPageSelection = false;
  @Input() showBrowserSelection = false;
  @Input() showConnectivitySelection = false;
  @Input() showMeasuredStepSelection = false;
  @Input() showLocationSelection = false;
  @Input() pageRequired = false;

  constructor(private resultSelectionService: ResultSelectionService, private resultSelectionStore: ResultSelectionStore) {
  }

  ngOnInit(): void {
    this.eventsAndPages$ = this.resultSelectionStore.eventsAndPages$;
    this.locationsAndBrowsers$ = this.resultSelectionStore.locationsAndBrowsers$;
    this.connectivities$ = this.resultSelectionStore.connectivities$;

    this.registerComponentsInStore();
    this.setActiveTab();
  }

  private registerComponentsInStore(): void {
    if (this.showMeasuredStepSelection || this.showPageSelection) {
      this.resultSelectionStore.registerComponent(UiComponent.PAGE);
    }
    if (this.showLocationSelection || this.showBrowserSelection) {
      this.resultSelectionStore.registerComponent(UiComponent.LOCATION);
    }
    if (this.showConnectivitySelection) {
      this.resultSelectionStore.registerComponent(UiComponent.CONNECTIVITY);
    }
  }

  private setActiveTab(): void {
    if (this.showPageSelection) {
      this.activeTab = ActiveTab.PageAndEvent;
    } else if (!this.showPageSelection && this.showBrowserSelection) {
      this.activeTab = ActiveTab.BrowserAndLocation;
    } else {
      this.activeTab = ActiveTab.Connectivity;
    }
  }
}

export enum ActiveTab {
  PageAndEvent,
  BrowserAndLocation,
  Connectivity
}
