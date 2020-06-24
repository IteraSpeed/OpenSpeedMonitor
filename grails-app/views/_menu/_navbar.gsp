<g:set var="lang" value="${session.'org.springframework.web.servlet.i18n.SessionLocaleResolver.LOCALE'}"/>
<g:if test="${controllerName.equals('eventResultDashboard') || controllerName.equals('tabularResultPresentation') || controllerName.equals('aggregation') || controllerName.equals('pageComparison') || controllerName.equals('distributionChart') || controllerName.equals('detailAnalysis') || request.forwardURI.equals('/applicationDashboard')}">
    <g:set var="mainTab" value="results"/>
</g:if>
<g:elseif test="${controllerName.equals('csiDashboard')}"><g:set var="mainTab" value="csi"/></g:elseif>
<g:elseif test="${controllerName.equals('csiConfiguration')}"><g:set var="mainTab" value="csi"/></g:elseif>
<g:elseif test="${controllerName.equals('csiBenchmark')}"><g:set var="mainTab" value="csi"/></g:elseif>
<g:elseif test="${controllerName.equals('script')}"><g:set var="mainTab" value="management"/></g:elseif>
<g:elseif test="${controllerName.equals('job')}"><g:set var="mainTab" value="management"/></g:elseif>
<g:elseif test="${request.forwardURI.equals('/queueDashboard')}"><g:set var="mainTab" value="management"/></g:elseif>
<g:elseif test="${controllerName.equals('jobSchedule')}"><g:set var="mainTab" value="management"/></g:elseif>
<g:elseif test="${controllerName.equals('jobResult')}"><g:set var="mainTab" value="management"/></g:elseif>
<g:elseif test="${controllerName.equals('connectivityProfile')}"><g:set var="mainTab" value="management"/></g:elseif>
<g:else><g:set var="mainTab" value="unknown"/></g:else>

<nav class="navbar navbar-inverse sidebar-fixed">
    <div class="navbar-header">
        <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#main-navbar">
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
        </button>
        <g:link class="navbar-brand" uri="/">
            <img class="icon osm-icon-small" src="${resource(dir: 'images', file: 'OpenSpeedMonitor_small.svg')}"
                 alt="${meta(name: 'app.name')}"/>
            <img class="logo" src="${resource(dir: 'images', file: 'OpenSpeedMonitor.svg')}"
                 alt="${meta(name: 'app.name')}"/>
        </g:link>
    </div>

    <div class="collapse navbar-collapse" id="main-navbar">
        <ul class="nav navbar-nav">
            <li class="${controllerName.equals("landing") ? 'active' : ''}" data-active-matches="^/$">
                <g:link uri="/"><i class="fas fa-home"></i>
                    <g:message code="frontend.de.iteratec.osm.landing.title" default="Home"/>
                </g:link>
            </li>
            <li class="dropdown ${mainTab.equals('results') ? 'active open' : ''}"
                data-active-matches="^/applicationDashboard/?"
                data-open-matches="^/applicationDashboard/?">
                <a href="#" class="dropdown-toggle" role="button" aria-haspopup="true" aria-expanded="false">
                    <i class="fas fa-tachometer-alt"></i>
                    <g:message code="de.iteratec.isr.measurementresults" default="Results"/> <span class="caret"></span>
                </a>
                <ul class="dropdown-menu">
                    <li class="${request.forwardURI.equals('/applicationDashboard') ? 'active' : ''}"
                        data-active-matches="/applicationDashboard/?.*">
                        <a href="${createLink(uri: '/applicationDashboard')}">
                            <i class="fas fa-table"></i>
                            <g:message message="frontend.de.iteratec.osm.applicationDashboard.title"/>
                        </a>
                    </li>
                    <li class="${controllerName.equals('eventResultDashboard') ? 'active' : ''}" id="eventResultMainMenu">
                        <g:link controller="eventResultDashboard" action="showAll"
                                title="${message(code:'eventResultDashboard.label', default:'Time Series')}">
                            <i class="fas fa-chart-line"></i>
                                <g:message code="eventResultDashboard.label" default="Time Series"/>
                        </g:link>
                    </li>
                    <li class="${controllerName.equals('aggregation') ? 'active' : ''}" id="aggregationMainMenu"
                        data-active-matches="/aggregation/show/?.*">
                        <a href="${createLink(uri: '/aggregation/show')}">
                            <i class="fas fa-chart-bar"></i>
                            <g:message code="frontend.de.iteratec.osm.aggregation.title" default="Aggregation"/>
                        </a>
                    </li>
                    <li class="${controllerName.equals('distributionChart') ? 'active' : ''}" id="distributionMainMenu">
                        <g:link controller="distributionChart" action="show"
                                title="${message(code:'de.iteratec.osm.distributionChart', default:'Distribution Chart')}">
                            <i class="fas fa-chart-area"></i>
                            <g:message code="frontend.de.iteratec.osm.distribution.title" default="Distribution Chart"/>
                        </g:link>
                    </li>
                    <li class="${controllerName.equals('pageComparison') ? 'active' : ''}" id="pageComparisonMainMenu">
                        <g:link controller="pageComparison" action="show"
                                title="${message(code:'de.iteratec.isocsi.pageComparision.title', default:'Page Comparison')}">
                            <i class="fas fa-balance-scale"></i>
                            <g:message code="de.iteratec.isocsi.pageComparision.title" default="Page Comparison"/>
                        </g:link>
                    </li>
                    <g:if test="${grailsApplication.config.getProperty('grails.de.iteratec.osm.detailAnalysis.enablePersistenceOfDetailAnalysisData')?.equals("true")}">
                        <li class="${controllerName.equals('detailAnalysis') ? 'active' : ''}" id="detailAnalysisMainMenu">
                            <g:link controller="detailAnalysis" action="show"
                                    title="Detail Analysis">
                                <i class="fas fa-chart-pie"></i>
                                    Detail Analysis
                            </g:link>
                        </li>
                    </g:if>
                    <li class="${controllerName.equals('tabularResultPresentation') ? 'active' : ''}" id="tabularResultMainMenu">
                        <g:link controller="tabularResultPresentation" action="listResults"
                                title="${message(code:'de.iteratec.result.title', default:'Result List')}">
                            <i class="fas fa-th-list"></i>
                                <g:message code="de.iteratec.result.title" default="Result List"/>
                        </g:link>
                    </li>
                </ul>
            </li>
            <li class="dropdown ${mainTab.equals('csi') ? 'active open' : ''}">
                <a href="#" class="dropdown-toggle" role="button" aria-haspopup="true" aria-expanded="false">
                    <i class="fas fa-users"></i>
                    <g:message code="customerSatisfation.label" default="Customer Satisfaction"/><span class="caret"></span>
                </a>
                <ul class="dropdown-menu">
                    <li class="${controllerName.equals('csiDashboard') ? 'active' : ''}">
                        <g:link controller="csiDashboard" action="showAll">
                            <i class="fas fa-chart-line"></i>
                            <g:message code="csiDashboard.label" default="CSI"/>
                        </g:link>
                    </li>
                    <li class="${controllerName.equals('csiConfiguration') ? 'active' : ''}">
                        <g:link controller="csiConfiguration" action="configurations">
                            <i class="fas fa-cogs"></i>
                            <g:message code="de.iteratec.isocsi.csiConfiguration" default="Configuration"/>
                        </g:link>
                    </li>
                    <li class="${controllerName.equals('csiBenchmark') ? 'active' : ''}">
                        <g:link controller="csiBenchmark" action="show">
                            <i class="fas fa-chart-bar"></i>
                            <g:message code="de.iteratec.isocsi.csiBenchmark.title" default="Csi Benchmark"/>
                        </g:link>
                    </li>
                </ul>
            </li>
            <li class="dropdown ${mainTab.equals('management') ? 'active open' : ''}">
                <a href="#" class="dropdown-toggle" role="button" aria-haspopup="true" aria-expanded="false">
                    <i class="fas fa-tasks"></i>
                    <g:message code="de.iteratec.isr.managementDashboard" default="Measurement"/> <span class="caret"></span>
                </a>
                <ul class="dropdown-menu">
                    <li class="${controllerName.equals('job') ? 'active' : ''}">
                        <g:link controller="job" action="index" title="${message(code:'de.iteratec.isj.jobs', default:'Jobs')}">
                            <i class="fas fa-calendar-alt"></i>
                            <g:message code="de.iteratec.isj.jobs" default="Jobs"/>
                        </g:link>
                    </li>
                    <li class="${controllerName.equals('script') ? 'active' : ''}">
                        <g:link controller="script" action="list">
                            <i class="fas fa-file-alt"></i>
                            <g:message code="de.iteratec.iss.scripts" default="Skripte"/>
                        </g:link>
                    </li>
                    <li class="${request.forwardURI.equals('/queueDashboard') ? 'active' : ''}">
                        <a href="${createLink(uri: '/queueDashboard')}">
                            <i class="fas fa-inbox"></i>
                            <g:message message="frontend.de.iteratec.osm.queueDashboard.title"/>
                        </a>
                    </li>
                    <li class="${controllerName.equals('jobSchedule') ? 'active' : ''}">
                        <g:link controller="jobSchedule" action="schedules">
                            <i class="fas fa-clock"></i>
                            <g:message code="job.Schedule.label"/>
                        </g:link>
                    </li>
                    <li class="${controllerName.equals('connectivityProfile') ? 'active' : ''}">
                        <g:link controller="connectivityProfile" action="list">
                            <i class="fas fa-signal"></i>
                            <g:message code="connectivityProfile.label.plural"/>
                        </g:link>
                    </li>
                    <li class="${controllerName.equals('jobResult') ? 'active' : ''}">
                        <g:link controller="jobResult" action="listFailed">
                            <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
                            <g:message code="de.iteratec.osm.failedJobResults.buttonToPage" default="Failed JobResults"/>
                        </g:link>
                    </li>
                </ul>
            </li>
        </ul>
        <ul class="nav navbar-nav bottom">
            <g:render template="/_menu/user"/>
            <g:render template="/_menu/admin"/>
            <g:render template="/_menu/info"/>
            <g:render template="/_menu/language"/>
        </ul>
    </div>
</nav>
