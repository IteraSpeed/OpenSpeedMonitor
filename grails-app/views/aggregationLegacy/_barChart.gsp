<div id="chart-container">
    <div id="filter-dropdown-group">
        <div class="btn-group pull-left perc-element" data-toggle="buttons" id="stackBarSwitch">
            <label class="btn btn-sm btn-default" id="besideButton"><input type="radio" name="stackBars" value="0" >Beside</label>
            <label class="btn btn-sm btn-default active" id="inFrontButton"><input type="radio" name="stackBars" value="1" checked>In Front</label>
        </div>

        <div class="btn-group pull-left perc-element" data-toggle="buttons" id="aggregationValueSwitch">
            <label class="btn btn-sm btn-default active" id="averageButton"><input type="radio" name="aggregationValue"
                                                                                   value="avg"
                                                                                   checked>Average</label>
            <label class="btn btn-sm btn-default" id="percentileButton"><input type="radio" name="aggregationValue"
                                                                               value="percentile">
                ${g.message(code: 'de.iteratec.isocsi.aggregationChart.percentile.label', 'default': 'Percentile')}
            </label>
        </div>
        <input class="btn btn-sm btn-default perc-element"
               id="percentageField"
               type="number"
               placeholder="%"
               value="50"
               min="0" max="100"/>
        <input class="form-control perc-element perc-slider"
               id="percentageSlider"
               type="range"
               min="0" max="100"
               step="5"/>
        <button id="filter-dropdown" type="button" class="btn btn-default btn-sm dropdown-toggle perc-element" data-toggle="dropdown"
                aria-haspopup="true" aria-expanded="false">
            <g:message code="de.iteratec.osm.barchart.filter.label" default="filter"/> <span
                class="caret"></span>
        </button>
        <ul class="dropdown-menu pull-right">
            <li id="all-bars-header" class="dropdown-header">
                <g:message code="de.iteratec.osm.barchart.filter.noFilterHeader" default="no filter"/>
            </li>
            <li>
                <a id="all-bars-desc" class="chart-filter" data-filter="desc" href="#">
                    <i class="fas fa-check" aria-hidden="true"></i>
                    <g:message code="de.iteratec.osm.barchart.filter.noFilterDesc"
                               default="no filter, sorting desc"/>
                </a>
            </li>
            <li>
                <a id="all-bars-asc" class="chart-filter" data-filter="asc" href="#">
                    <i class="fas fa-check filterInactive" aria-hidden="true"></i>
                    <g:message code="de.iteratec.osm.barchart.filter.noFilterAsc"
                               default="no filter, sorting asc"/>
                </a>
            </li>
            <li id="customer-journey-header" class="dropdown-header">
                <g:message code="de.iteratec.osm.barchart.filter.customerJourneyHeader"
                           default="Customer Journey"/>
            </li>
        </ul>
    </div>
    <div class="in-chart-buttons">
        <a href="#downloadAsPngModal" id="download-as-png-button"
           data-toggle="modal" role="button" onclick="initPngDownloadModal()"
           title="${message(code: 'de.iteratec.ism.ui.button.save.name', default:'Download as PNG')}">
            <i class="fas fa-download"></i>
        </a>
    </div>
    <div id="svg-container">
        <svg id="aggregation-svg" class="d3chart" width="100%"></svg>
    </div>
</div>
<g:render template="/aggregationLegacy/adjustBarchartModal"/>
