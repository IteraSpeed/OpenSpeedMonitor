import {Component, Input, OnInit} from '@angular/core';
import {Subject} from "rxjs";
import {ResultSelectionStore} from "../../services/result-selection.store";

@Component({
  selector: 'osm-result-selection-reset',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.scss']
})
export class ResetComponent implements OnInit {

  constructor(private resultSelectionStore: ResultSelectionStore) { }

  ngOnInit() {
  }

  emitResetEventToComponent() {
    this.resultSelectionStore.reset$.next();
  }
}
