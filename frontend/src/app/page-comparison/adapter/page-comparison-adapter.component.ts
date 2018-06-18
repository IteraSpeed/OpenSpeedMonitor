import {Component, NgZone, ViewChild} from "@angular/core";
import {IPageComparisonSelection} from "../page-comparison-selection.model";
import {PageComparisonComponent} from "../page-comparison.component";

@Component({
  selector: 'page-comparison-adapter',
  template: ' <page-comparison></page-comparison>'
})
export class PageComparisonAdapterComponent {
  @ViewChild(PageComparisonComponent) pageComparisonComponent: PageComparisonComponent;

  constructor(private zone: NgZone) {
    this.exposeComponent();
  }

  exposeComponent() {
    window['pageComparisonComponent'] = {
      zone: this.zone,
      getSelectedPageIds: () => this.getSelectedPageIds(),
      getSelectedJobGroups: () => this.getSelectedJobGroupIds(),
      getComparisons: () => this.getSelectedComparisons(),
      setComparisons: (comparisons) => this.setComparisons(comparisons),
      component: this,
    };
  }

  getSelectedJobGroupIds(): number[] {
    return this.pageComparisonComponent.pageComparisonSelections.reduce((ids: number[], comparison: IPageComparisonSelection) => {
      ids.push(comparison.firstPageId, comparison.secondPageId);
      return ids;
    }, []);
  }

  getSelectedPageIds(): number[] {
    return this.pageComparisonComponent.pageComparisonSelections.reduce((ids: number[], comparison: IPageComparisonSelection) => {
      ids.push(comparison.firstJobGroupId, comparison.secondJobGroupId);
      return ids
    }, []);
  }

  getSelectedComparisons() {
    return this.pageComparisonComponent.pageComparisonSelections;
  }

  setComparisons(comparisons: IPageComparisonSelection[]) {
    this.zone.run(() => {
      this.pageComparisonComponent.pageComparisonSelections = comparisons;
      this.pageComparisonComponent.validateComparisons();
    });
  }
}
