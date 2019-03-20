<%@ page defaultCodec="none" %></page>
<%--
A card to select page & measured step, browser & location, and the connectivity
--%>

<div class="card" id="select-page-location-connectivity" data-no-auto-update="${(boolean) noAutoUpdate}">
<g:if test="${showOnlyPage}">
    <h2>
        <g:message code="de.iteratec.osm.result.page.label" default="Page"/>
        <g:if test="${!hideMeasuredEventForm}">
            &nbsp;|&nbsp;<g:message code="de.iteratec.osm.result.measured-event.label" default="Measured step"/>
        </g:if>
    </h2>
</g:if>
<g:if test="${showOnlyBrowser}">
    <h2>
        <g:message code="de.iteratec.osm.result.browser.label" default="Browser"/>
    </h2>
</g:if>
<g:else>
    <ul class="nav nav-tabs">
        <li class="active" id="filter-navtab-page">
            <a href="#page-tab" data-toggle="tab">
                <g:message code="de.iteratec.osm.result.page.label" default="Page"/>&nbsp;|&nbsp;<g:message
                        code="de.iteratec.osm.result.measured-event.label" default="Measured step"/>
            </a>
        </li>
        <li id="filter-navtab-browser-and-location">
            <a href="#browser-tab" data-toggle="tab">
                <g:message code="browser.label" default="Browser"/><g:if
                        test="${showLocationInBrowserTab}">&nbsp;|&nbsp;<g:message code="job.location.label"
                                                                                   default="Location"/></g:if>
            </a>
        </li>
        <g:if test="${showConnectivityTab}">
            <li id="filter-navtab-connectivityprofile">
                <a href="#connectivity-tab" data-toggle="tab">
                    <g:message code="de.iteratec.osm.result.connectivity.label" default="Connectivity"/>
                </a>
            </li>
        </g:if>
    </ul>
</g:else>

<div class="tab-content">
    <g:if test="${!showOnlyBrowser}">
        <div class="tab-pane active" id="page-tab">
            <g:render template="/_resultSelection/selectPageContent" model="[
                    hideMeasuredEventForm    : hideMeasuredEventForm,
                    pages                    : pages,
                    selectedPages            : selectedPages,
                    measuredEvents           : measuredEvents,
                    selectedMeasuredEventIds : selectedMeasuredEventIds,
                    selectedAllMeasuredEvents: selectedAllMeasuredEvents,
                    eventsOfPages            : eventsOfPages,
            ]"/>
        </div>
    </g:if>
    <g:if test="${!showOnlyPage}">
        <g:if test="${!showOnlyBrowser}">
            <div class="tab-pane" id="browser-tab">
        </g:if>
        <g:else>
            <div class="tab-pane active" id="browser-tab">
        </g:else>
        <div id="filter-browser-and-location">
            <g:select id="selectedBrowsersHtmlId"
                      class="form-control"
                      name="selectedBrowsers" from="${browsers}" optionKey="id"
                      optionValue="${{ it.name + ' (' + it.name + ')' }}" multiple="true"
                      value="${selectedBrowsers}"
                      title="${message(code: 'de.iteratec.isr.wptrd.labels.filterBrowser')}"/>
            <label class="checkbox-inline">
                <input type="checkbox" id="selectedAllBrowsers" ${selectedBrowsers ? '' : 'checked'}/>
                <g:message code="de.iteratec.isr.csi.eventResultDashboard.selectedAllBrowsers.label"
                           default="Select all Browsers"/>
            </label>

            <br>
            <g:if test="${showLocationInBrowserTab}">
                <label for="selectedLocationsHtmlId">
                    <strong>
                        <g:message code="de.iteratec.isr.wptrd.labels.filterLocation"
                                   default="Location:"/>
                    </strong>
                </label>
                <g:select id="selectedLocationsHtmlId"
                          class="chosen"
                          data-parent-child-mapping='${locationsOfBrowsers as grails.converters.JSON}'
                          data-placeholder="${g.message(code: 'web.gui.jquery.chosen.multiselect.placeholdermessage', 'default': 'Bitte ausw&auml;hlen')}"
                          name="selectedLocations" from="${locations}" optionKey="id"
                          optionValue="${it}"
                          multiple="true" value="${selectedLocations}"/>
                <br>
                <label class="checkbox-inline">
                    <input type="checkbox" id="selectedAllLocations" ${selectedLocations ? '' : 'checked'}/>
                    <g:message code="de.iteratec.isr.csi.eventResultDashboard.selectedAllLocations.label"
                               default="Select all locations"/>
                </label>
            </g:if>
        </div>
        </div>
        <g:if test="${showConnectivityTab}">
            <div class="tab-pane" id="connectivity-tab">
                <div id="filter-connectivityprofile">
                    <g:select id="selectedConnectivityProfilesHtmlId"
                              class="form-control"
                              name="selectedConnectivities" from="${avaiableConnectivities}" optionKey="id"
                              optionValue="name"
                              multiple="true"
                              value="${avaiableConnectivities.findAll {
                                  selectedConnectivities*.toString().contains(it.id.toString())
                              }}"
                              title="${message(code: 'de.iteratec.isr.wptrd.labels.filterConnectivityProfile')}"/>
                    <label class="checkbox-inline">
                        <input type="checkbox"
                               id="selectedAllConnectivityProfiles" ${selectedConnectivities ? '' : 'checked'}/>
                        <g:message
                                code="de.iteratec.isr.csi.eventResultDashboard.selectedAllConnectivityProfiles.label"
                                default="Select all Connectivity Profiles"/>
                    </label>
                </div>
            </div>
        </g:if>
    </g:if>
</div>
</div>
<asset:script type="text/javascript">
    $(window).on('load', function() {
        OpenSpeedMonitor.postLoader.loadJavascript('<g:assetPath
        src="_resultSelection/selectPageLocationConnectivityCard.js"/>', 'selectPageLocationConnectivityCard');
    });
</asset:script>
