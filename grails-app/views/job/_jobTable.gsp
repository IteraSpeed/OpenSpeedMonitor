<%@ defaultCodec="none" %>
<g:set var="jobService" bean="jobService"/>
<tbody>
<g:each var="job" in="${jobs}">
    <g:set var="tags" value="${job.tags}"/>
    <tr class="${flash.massExecutionResults ? (flash.massExecutionResults[job.id] ? 'highlight ' + flash.massExecutionResults[job.id].status : '') : ''}"
        <g:if test="${tags}">data-tags="${tags.join(',')}"</g:if>>
        <td>
            <g:checkBox name="selected.${job.id}" value="on"
                        checked="${flash.selectedIds?.contains(job.id)}"
                        class="jobCheckbox"/>
        </td>
        <td class="summary">
            <div class="show-chart-buttons">
                <g:if test="${job.lastRun}">
                    <a href="${createLink(action: 'showLastResultForJob', id: job.id)}" class="show-chart"><i
                            class="fas fa-chart-line"></i></a>
                    <a href="${createLink(action: 'showLastAggregationForJob', id: job.id)}" class="show-chart"><i
                            class="fas fa-chart-bar"></i></a>
                </g:if>
            </div>

            <div class="jobNameContainer"><a
                    href="${createLink(action: 'edit', id: job.id)}"
                    class="jobName ${job.active == false ? 'inactiveJob' : ''} ${(job.jobStatistic == null ? '' : job.jobStatistic.getJobStatusLast5CssClass())}">
                ${job.label ?: job.script.label + ' ' + job.location.browser.name}
            </a></div>
            <g:if test="${job.script}">
                <a href="${createLink(controller: 'script', action: 'edit', id: job.script.id)}"
                   class="script ${(job.jobStatistic == null ? '' : job.jobStatistic.getJobStatusLast5CssClass())}">
                    ${job.script.label}
                </a>
                <span title="${message(code: 'script.measuredEventsCount.label')}">(${job.script.measuredEventsCount})</span>
            </g:if>
            <ul class="tags">
                <g:if test="${tags}">
                    <g:each in="${tags}">
                        <li>${it}</li>
                    </g:each>
                </g:if>
            </ul>
            <span class="status" id="runningstatus-${job.id}"></span>
            <span class="status">${flash.massExecutionResults ? (flash.massExecutionResults[job.id]?.message ? "<br />" + flash.massExecutionResults[job.id].message : '') : ''}</span>
        </td>
        <td class="jobgroup">
            ${job.jobGroup.name}
        </td>
        <td class="location">
            ${job.location.removeBrowser(job.location.uniqueIdentifierForServer ?: job.location.location)}
        </td>
        <td class="browser">
            ${job.location.browser.name != de.iteratec.osm.measurement.environment.Browser.UNDEFINED ? job.location.browser.name : ''}
        </td>
        <td>
            <g:render template="timeago"
                      model="${['date': job.lastRun, 'defaultmessage': message(code: 'job.lastRun.label.never', default: 'Noch nie'),
                                'url' : createLink(controller: 'tabularResultPresentation', action: 'listResultsForJob', params: ['job.id': job.id])]}"/>
            <a href="/jobResult/list?job=${job.id}&status=group_failed" data-toggle="popover"
               title="${g.message(code: 'de.iteratec.osm.job.status.description.title', default: 'State') + ': ' + job.label}"
               data-placement="bottom" data-trigger="hover" data-html="true"
               data-content="${render(template: "jobStatusBarHoverInfo")}">
                <g:render template="jobStatusBar"
                          model="${[
                                  'status5CssClass'  : (job.jobStatistic == null ? 'job-status-nodata' : job.jobStatistic.getJobStatusLast5CssClass()),
                                  'status25CssClass' : (job.jobStatistic == null ? 'job-status-nodata' : job.jobStatistic.getJobStatusLast25CssClass()),
                                  'status150CssClass': (job.jobStatistic == null ? 'job-status-nodata' : job.jobStatistic.getJobStatusLast150CssClass())]}"/>
            </a>
        </td>
        <td>
            <g:if test="${job.active}">
                <g:hiddenField name="job_active" class="job_active" value="true"/>
                <g:render template="timeago"
                          model="['cronstring': job.executionSchedule]"/>
            </g:if>
            <g:else><g:hiddenField name="job_active" class="job_active" value="false"/></g:else>
        </td>
        <td>
            <g:render template="cronExpression" bean="${job.executionSchedule}"/>
        </td>
        <td>
            ${job.runs}
        </td>
        <td>
            ${job.firstViewOnly ? '' : message(code: 'job.2x.label')}
        </td>
    </tr>
</g:each>
</tbody>
