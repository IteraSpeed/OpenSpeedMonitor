import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ChartSwitchMenuEntry} from '../../../result-selection/models/chart-switch-menu-entry.model';

@Component({
  selector: 'osm-menu',
  templateUrl: './chart-switch-menu.component.html',
  styleUrls: ['./chart-switch-menu.component.scss']
})
export class ChartSwitchMenuComponent implements OnInit {

  chartSwitchMenu: ChartSwitchMenuEntry[] = [
    {
      baseUrl: '/eventResultDashboard/showAll',
      label: 'frontend.de.iteratec.osm.timeSeries.title',
      icon: 'fas fa-chart-line',
      devUrl: '/eventResultDashboardDev/showAll'
    },
    {
      baseUrl: '/aggregation/show',
      label: 'frontend.de.iteratec.osm.aggregation.title',
      icon: 'fas fa-chart-bar'
    },
    {
      baseUrl: '/distributionChart/show',
      label: 'frontend.de.iteratec.osm.distribution.title',
      icon: 'fas fa-chart-area',
      devUrl: '/distributionDev/show'
    },
    {
      baseUrl: '/pageComparison/show',
      label: 'frontend.de.iteratec.osm.results.pageComparison',
      icon: 'fas fa-balance-scale'
    },
    {
      baseUrl: '/detailAnalysis/show',
      label: 'frontend.de.iteratec.osm.results.detailAnalysis',
      icon: 'fas fa-chart-pie'
    },
    {
      baseUrl: '/tabularResultPresentation/listResults',
      label: 'frontend.de.iteratec.osm.results.resultList',
      icon: 'fas fa-th-list'
    }
  ];

  queryString = '';

  constructor(public router: Router, private route: ActivatedRoute) {
    route.queryParams.subscribe(() => {
      this.queryString = window.location.search;
    });
  }

  ngOnInit() {
  }

}
