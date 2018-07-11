import {Component, Input} from '@angular/core';
import {PageIdDto} from "../../../shared/model/page.model";
import {PageService} from "../../service/rest/page.service";
import {map} from "rxjs/internal/operators";
import {Observable} from "rxjs";
import {JobGroupToPagesMappingDto} from "../../../shared/model/job-group-to-page-mapping.model";
import {JobGroupDTO} from "../../../shared/model/job-group.model";

@Component({
  selector: 'osm-page-list',
  templateUrl: './page-list.component.html',
  styleUrls: ['./page-list.component.scss']
})
export class PageListComponent {
  pageList$: Observable<PageIdDto[]>;

  @Input() jobGroup: JobGroupDTO;

  constructor(private pageService: PageService) {
    this.pageList$ = this.pageService.pages$.pipe(
      map((jobGroupsWithPages: JobGroupToPagesMappingDto[]) => this.filterPagesByJobGroup(this.jobGroup, jobGroupsWithPages))
    );
  }

  private filterPagesByJobGroup(jobGroup: JobGroupDTO, jobGroupsWithPages: JobGroupToPagesMappingDto[]): PageIdDto[] {
    return jobGroupsWithPages.find(a => a.id == jobGroup.id).pages;
  }
}
