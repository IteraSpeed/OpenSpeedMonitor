import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {SelectableApplication} from 'src/app/models/application.model';
import {ResultSelectionStore} from '../../services/result-selection.store';
import {ResultSelectionCommandParameter} from '../../models/result-selection-command.model';
import {UiComponent} from '../../../../enums/ui-component.enum';
import {ResponseWithLoadingState} from '../../../../models/response-with-loading-state.model';

@Component({
  selector: 'osm-result-selection-application',
  templateUrl: './application.component.html',
  styleUrls: ['./application.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class ApplicationComponent implements OnInit {

  applications: SelectableApplication[];
  filteredApplications: SelectableApplication[];
  selectedApplications: number[] = [];
  selectableTags: string[];
  selectedTag = '';
  unfilteredSelectedApplications: number[] = [];

  constructor(private resultSelectionStore: ResultSelectionStore) {
  }

  ngOnInit() {
    this.resultSelectionStore.applications$.subscribe((applications: ResponseWithLoadingState<SelectableApplication[]>) => {
      this.updateApplicationsAndTags(applications.data);
    });

    this.resultSelectionStore.registerComponent(UiComponent.APPLICATION);
    this.resultSelectionStore.reset$.subscribe(() => this.resetResultSelection());
    if (this.resultSelectionStore.resultSelectionCommand.jobGroupIds) {
      this.selectedApplications = this.resultSelectionStore.resultSelectionCommand.jobGroupIds;
    }
  }

  onSelectionChange() {
    this.unfilteredSelectedApplications = [];
    if (this.selectedApplications) {
      this.resultSelectionStore.setResultSelectionCommandIds(this.selectedApplications, ResultSelectionCommandParameter.APPLICATIONS);
    }
  }

  selectTag(tag: string): void {
    if (tag === this.selectedTag && this.isTagSelected()) {
      this.selectedTag = '';
    } else {
      this.selectedTag = tag;
    }
    this.filterApplicationsByTag(tag);
  }

  isTagSelected(): boolean {
    return this.selectedTag !== '';
  }

  updateApplicationsAndTags(applications: SelectableApplication[]) {
    this.updateApplications(applications);
    this.updateTags(applications);
    this.filterApplicationsByTag(this.selectedTag);
  }

  private updateApplications(applications: SelectableApplication[]): void {
    if (applications != null && applications.length > 0) {
      this.applications = this.sortByName(applications);
    } else {
      this.applications = [];
    }
  }

  private updateTags(applications: SelectableApplication[]) {
    if (applications) {
      this.selectableTags = applications.map(value => value.tags).reduce((a, b) =>
        a.concat(b), []).filter((v, i, a) =>
        a.indexOf(v) === i);
    } else {
      this.selectableTags = [];
    }
    if (this.selectableTags.indexOf(this.selectedTag) === -1) {
      this.selectedTag = '';
    }
  }

  private filterApplicationsByTag(tag: string): void {
    this.filteredApplications = this.filterSelectableApplicationsByTag(tag);
    this.filterSelectedApplications();
  }

  private resetResultSelection(): void {
    if (this.unfilteredSelectedApplications.length > 0 || this.selectedApplications.length > 0 || this.isTagSelected()) {
      this.unfilteredSelectedApplications = [];
      this.selectedApplications = [];
      this.selectedTag = '';
      this.filterApplicationsByTag(this.selectedTag);
    }
  }

  private filterSelectableApplicationsByTag(tag: string): SelectableApplication[] {
    if (this.isTagSelected() && this.applications) {
      return this.applications.filter((app: SelectableApplication) => app.tags.indexOf(tag) > -1);
    } else if (!this.isTagSelected()) {
      return this.applications;
    }
  }

  private filterSelectedApplications(): void {
    let selectedApplications: number[] = [];
    if (this.unfilteredSelectedApplications.length === 0) {
      selectedApplications = this.selectedApplications.filter((selectedAppId: number) =>
        this.filteredApplications.map(item => item.id).includes(selectedAppId)
      );
      if (this.selectedApplications.length > selectedApplications.length) {
        this.unfilteredSelectedApplications = this.selectedApplications;
        this.selectedApplications = selectedApplications;
        this.resultSelectionStore.setResultSelectionCommandIds(this.selectedApplications, ResultSelectionCommandParameter.APPLICATIONS);
      }
    } else {
      selectedApplications = this.unfilteredSelectedApplications.filter((selectedAppId: number) =>
        this.filteredApplications.map(item => item.id).includes(selectedAppId)
      );
      if (this.unfilteredSelectedApplications.length === selectedApplications.length) {
        this.unfilteredSelectedApplications = [];
      }
      if (selectedApplications.length > this.selectedApplications.length) {
        this.selectedApplications = selectedApplications;
        this.resultSelectionStore.setResultSelectionCommandIds(this.selectedApplications, ResultSelectionCommandParameter.APPLICATIONS);
      }
    }
  }

  private sortByName(applications: SelectableApplication[]): SelectableApplication[] {
    return applications.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }
}
