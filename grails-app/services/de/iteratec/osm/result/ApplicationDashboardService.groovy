package de.iteratec.osm.result

import de.iteratec.osm.ConfigService
import de.iteratec.osm.OsmConfigCacheService
import de.iteratec.osm.api.dto.ApplicationCsiDto
import de.iteratec.osm.api.dto.CsiDto
import de.iteratec.osm.api.dto.PageCsiDto
import de.iteratec.osm.csi.*
import de.iteratec.osm.measurement.environment.Browser
import de.iteratec.osm.measurement.schedule.Job
import de.iteratec.osm.measurement.schedule.JobDaoService
import de.iteratec.osm.measurement.schedule.JobGroup
import de.iteratec.osm.measurement.schedule.JobGroupService
import de.iteratec.osm.report.chart.CsiAggregation
import de.iteratec.osm.report.chart.CsiAggregationInterval
import de.iteratec.osm.report.external.GraphiteServer
import de.iteratec.osm.result.dao.EventResultProjection
import de.iteratec.osm.result.dao.EventResultQueryBuilder
import de.iteratec.osm.result.dao.PerformanceAspectDto
import grails.gorm.transactions.Transactional
import org.hibernate.criterion.CriteriaSpecification
import org.joda.time.DateTime

@Transactional
class ApplicationDashboardService {
    ConfigService configService
    OsmConfigCacheService osmConfigCacheService
    PageCsiAggregationService pageCsiAggregationService
    JobGroupCsiAggregationService jobGroupCsiAggregationService
    JobDaoService jobDaoService
    JobGroupService jobGroupService

    List<EventResultProjection> getRecentAspectMetricsForJobGroup(Long jobGroupId) {

            List<PerformanceAspectType> performanceAspectTypes = [
                    PerformanceAspectType.PAGE_CONSTRUCTION_STARTED,
                    PerformanceAspectType.PAGE_IS_USABLE,
                    PerformanceAspectType.PAGE_SHOWS_USEFUL_CONTENT
            ]

        Date from = new DateTime().minusHours(configService.getMaxAgeForMetricsInHours()).toDate()
        Date to = new DateTime().toDate()
        List<Page> pages = jobGroupService.getPagesWithResultsOrActiveJobsForJobGroup(jobGroupId)

        return new EventResultQueryBuilder()
            .withJobGroupIdsIn([jobGroupId], false)
            .withJobResultDateBetween(from, to)
            .withPageIn(pages)
            .withoutPagesIn([Page.findByName(Page.UNDEFINED)])
            .withSelectedMeasurands([])
            .withPerformanceAspects(performanceAspectTypes)
            .getAverageData()
    }

    private List<PageCsiDto> getAllCsiForPagesOfJobGroup(JobGroup jobGroup) {

        List<PageCsiDto> pageCsiDtos = []
        List<JobGroup> csiGroup = [jobGroup]
        DateTime to = new DateTime()
        DateTime from = configService.getStartDateForRecentMeasurements()
        CsiAggregationInterval dailyInterval = CsiAggregationInterval.findByIntervalInMinutes(CsiAggregationInterval.DAILY)

        List<Page> pages = jobGroupService.getPagesWithResultsOrActiveJobsForJobGroup(jobGroup.id)

        pageCsiAggregationService.getOrCalculatePageCsiAggregations(from.toDate(), to.toDate(), dailyInterval,
                csiGroup, pages).each {
            PageCsiDto pageCsiDto = new PageCsiDto()
            if (it.csByWptDocCompleteInPercent) {
                pageCsiDto.pageId = it.page.id
                pageCsiDto.date = it.started.format("yyy-MM-dd")
                pageCsiDto.csiDocComplete = it.csByWptDocCompleteInPercent
                pageCsiDtos << pageCsiDto
            }
        }
        return pageCsiDtos
    }

    List<PageCsiDto> getMostRecentCsiForPagesOfJobGroup(JobGroup jobGroup) {
        List<PageCsiDto> recentCsi = getAllCsiForPagesOfJobGroup(jobGroup)
        recentCsi.sort {
            a, b -> b.date <=> a.date
        }
        recentCsi.unique()
        return recentCsi

    }

    List<Map> getAllActivePagesAndAspectMetrics(Long jobGroupId) {
        List<Map> recentAspectMetrics = getRecentAspectMetricsForJobGroup(jobGroupId).collect {
            return it.projectedProperties
        }

        recentAspectMetrics.each {
            Long pageId = it.get('pageId')
            it << [pageName: Page.findById(pageId).name]
        }
        return recentAspectMetrics
    }

    List<Map> getPerformanceAspects(Long jobGroupId, Long pageId, List<Long> browserIds) {

        JobGroup jobGroup = JobGroup.findById(jobGroupId)
        Page page = Page.findById(pageId)
        List<Browser> browsers = browserIds.collect { Browser.get(it) }

        List<PerformanceAspectDto> performanceAspects = getAspects(jobGroup, page, browsers)
        addDefaultsForMissing(performanceAspects, page, jobGroup, browsers)

        return performanceAspects.sort { PerformanceAspectType.valueOf(it.performanceAspectType.name) }

    }

    private void addDefaultsForMissing(List<PerformanceAspectDto> performanceAspects, Page page, JobGroup jobGroup, List<Browser> browsers) {
        PerformanceAspectType.values().each { PerformanceAspectType type ->
            browsers.each { browser ->
                if (!performanceAspects.any {
                    it.performanceAspectType.name == type.name() && it.browserId == browser.id
                }) {
                    performanceAspects.add(
                            new PerformanceAspectDto([
                                    id                   : null,
                                    pageId               : page.id,
                                    jobGroupId           : jobGroup.id,
                                    browserId            : browser.id,
                                    performanceAspectType: type,
                                    metricIdentifier     : type.defaultMetric.toString(),
                                    persistent           : false
                            ])
                    )
                }
            }
        }
    }

    private List<PerformanceAspectDto> getAspects(JobGroup jobGroup, Page page, List<Browser> browsers) {
        PerformanceAspect.createCriteria().list {
            resultTransformer(CriteriaSpecification.ALIAS_TO_ENTITY_MAP)
            eq 'jobGroup', jobGroup
            eq 'page', page
            'in' 'browser', browsers
            projections {
                property 'id', 'id'
                property 'page.id', 'pageId'
                property 'jobGroup.id', 'jobGroupId'
                property 'browser.id', 'browserId'
                property 'metricIdentifier', 'metricIdentifier'
                property 'performanceAspectType', 'performanceAspectType'
            }
        }.collect { Map aspectAsMap ->
            aspectAsMap['persistent'] = true
            new PerformanceAspectDto(aspectAsMap)
        }
    }

    def createOrReturnCsiConfiguration(Long jobGroupId) {
        JobGroup jobGroup = JobGroup.findById(jobGroupId)

        if (jobGroup.hasCsiConfiguration()) {
            return jobGroup.csiConfiguration.id
        }
        CsiConfiguration csiConfiguration
        csiConfiguration = CsiConfiguration.findByLabel(jobGroup.name)
        if (!csiConfiguration) {
            csiConfiguration = new CsiConfiguration(
                    label: jobGroup.name,
                    description: "Initial CSI configuration for JobGroup ${jobGroup.name}",
                    csiDay: CsiDay.first()
            )
        }
        jobGroup.csiConfiguration = csiConfiguration
        jobGroup.save(failOnError: true, flush: true)
        return csiConfiguration.id
    }

    ApplicationCsiDto getCsiValuesAndErrorsForJobGroup(JobGroup jobGroup) {
        Date fourWeeksAgo = configService.getStartDateForRecentMeasurements().toDate()
        Map<Long, ApplicationCsiDto> csiValuesForJobGroups = getCsiValuesForJobGroupsSince([jobGroup], fourWeeksAgo)
        return csiValuesForJobGroups.get(jobGroup.id)
    }

    Map<Long, ApplicationCsiDto> getTodaysCsiValueForJobGroups(List<JobGroup> jobGroups) {
        Date today = new DateTime().withTimeAtStartOfDay().toDate()
        return getCsiValuesForJobGroupsSince(jobGroups, today)
    }

    private Map<Long, ApplicationCsiDto> getCsiValuesForJobGroupsSince(List<JobGroup> jobGroups, Date startDate) {

        DateTime todayDateTime = new DateTime().withTimeAtStartOfDay()
        Date today = todayDateTime.toDate()

        CsiAggregationInterval dailyInterval = CsiAggregationInterval.findByIntervalInMinutes(CsiAggregationInterval.DAILY)

        Map<Boolean, JobGroup[]> jobGroupsByExistingCsiConfiguration = jobGroups.groupBy { jobGroup ->
            new Boolean(jobGroup.hasCsiConfiguration())
        } as Map<Boolean, JobGroup[]>

        Map<Long, ApplicationCsiDto> dtosById = [:]
        if (jobGroupsByExistingCsiConfiguration[false]) {
            dtosById.putAll(jobGroupsByExistingCsiConfiguration[false].collectEntries { jobGroup ->
                [(jobGroup.id): ApplicationCsiDto.createWithoutConfiguration()]
            })
        }

        List<JobGroup> csiGroups = jobGroupsByExistingCsiConfiguration[true]
        if (csiGroups) {
            Map<Long, ApplicationCsiDto> dtosByIdWithValues = jobGroupCsiAggregationService
                    .getOrCalculateShopCsiAggregations(startDate, today, dailyInterval, csiGroups)
                    .groupBy { csiAggregation -> csiAggregation.jobGroup.id }
                    .collectEntries { jobGroupId, csiAggregations ->
                        [(jobGroupId): csiAggregationsToDto(jobGroupId, csiAggregations, startDate)]
                    } as Map<Long, ApplicationCsiDto>
            dtosById.putAll(dtosByIdWithValues)
        }
        return dtosById
    }

    private ApplicationCsiDto csiAggregationsToDto(Long jobGroupId, List<CsiAggregation> csiAggregations, Date startDate) {
        ApplicationCsiDto dto = new ApplicationCsiDto()
        dto.hasCsiConfiguration = true
        dto.hasJobResults = true
        ArrayList<CsiDto> csiDtos = new ArrayList<CsiDto>()
        csiAggregations.each {
            if (it.csByWptDocCompleteInPercent) {
                CsiDto csiDto = new CsiDto()
                csiDto.date = it.started.format("yyyy-MM-dd")
                csiDto.csiDocComplete = it.csByWptDocCompleteInPercent
                csiDtos << csiDto
            }
        }
        dto.csiValues = csiDtos
        if (!dto.csiValues.length) {
            List<Job> jobs = jobDaoService.getJobs(JobGroup.findById(jobGroupId))
            List<JobResult> jobResults = JobResult.findAllByJobInListAndDateGreaterThan(jobs, startDate)
            if (jobResults) {
                dto.hasJobResults = true
                dto.hasInvalidJobResults = jobResults.every { it.jobResultStatus.isFailed() }
            } else {
                dto.hasJobResults = false
            }
        }
        return dto
    }

    def getFailingJobStatistics(Long jobGroupId) {
        def jobsWithErrors = Job.createCriteria().get {
            projections {
                countDistinct 'id'
                jobStatistic {
                    min 'percentageSuccessfulTestsOfLast5'
                }
            }
            and {
                eq 'jobGroup.id', jobGroupId
                eq 'deleted', false
                eq 'active', true
                jobStatistic {
                    lt 'percentageSuccessfulTestsOfLast5', 90d
                }
            }
        }
        return jobsWithErrors
    }

    def getFailingJobs() {
        def results = Job.withCriteria {
            resultTransformer(CriteriaSpecification.ALIAS_TO_ENTITY_MAP)
            projections {
                property 'id', 'job_id'
                jobGroup { property 'name', 'application' }
                script { property 'label', 'script' }
                location { property 'location', 'location' }
                location { browser { property 'name', 'browser' } }
                jobStatistic { property 'percentageSuccessfulTestsOfLast5', 'percentageFailLast5' }
            }
            and {
                eq 'deleted', false
                eq 'active', true
                jobStatistic {
                    lt 'percentageSuccessfulTestsOfLast5', 90d
                }
            }
        }

        /**
         * Object JobStatistic saves percentage of successful measurements. Since we are interested in failed
         * measurements, value is subtracted from 100.
         */
        results.each { result ->
            result.percentageFailLast5 = (100 - result.percentageFailLast5);
        }

        return results
    }

    def getActiveJobHealthGraphiteServers(Long jobGroupId) {
        def jobHealthGraphiteServers = Job.createCriteria().list {
            eq 'jobGroup.id', jobGroupId
            eq 'deleted', false
            jobGroup {
                isNotEmpty 'jobHealthGraphiteServers'
            }
            resultTransformer(CriteriaSpecification.ALIAS_TO_ENTITY_MAP)
            projections {
                jobGroup {
                    jobHealthGraphiteServers {
                        distinct('id', 'id')
                        property('serverAdress', 'address')
                        property('port', 'port')
                        property('reportProtocol', 'protocol')
                        property('webappUrl', 'webAppAddress')
                        property('prefix', 'prefix')
                    }
                }
            }
        }
        jobHealthGraphiteServers.each {
            it.protocol = it.protocol.toString()
        }
        return jobHealthGraphiteServers
    }

    def getAvailableGraphiteServers(Long jobGroupId) {

        Collection<GraphiteServer> graphiteServers = GraphiteServer.list()
        def availableGraphiteServers = []
        JobGroup jobGroup = JobGroup.findById(jobGroupId)

        if (!jobGroup.jobHealthGraphiteServers) {
            graphiteServers.each { graphiteServer ->
                availableGraphiteServers << [
                        id           : graphiteServer.id,
                        address      : graphiteServer.serverAdress,
                        port         : graphiteServer.port,
                        protocol     : graphiteServer.reportProtocol.toString(),
                        webAppAddress: graphiteServer.webappUrl,
                        prefix       : graphiteServer.prefix
                ]
            }
            return availableGraphiteServers
        } else {
            graphiteServers.each { graphiteServer ->
                if (!jobGroup.jobHealthGraphiteServers.contains(graphiteServer)) {
                    availableGraphiteServers << [
                            id           : graphiteServer.id,
                            address      : graphiteServer.serverAdress,
                            port         : graphiteServer.port,
                            protocol     : graphiteServer.reportProtocol.toString(),
                            webAppAddress: graphiteServer.webappUrl,
                            prefix       : graphiteServer.prefix
                    ]
                }
            }
            return availableGraphiteServers
        }
    }

    def saveJobHealthGraphiteServers(Long jobGroupId, List<Long> graphiteServerIds) {
        JobGroup jobGroup = JobGroup.findById(jobGroupId)
        Collection<GraphiteServer> graphiteServers = GraphiteServer.findAllByIdInList(graphiteServerIds)

        graphiteServers.each { graphiteServer ->
            if (!jobGroup.jobHealthGraphiteServers.contains(graphiteServer)) {
                jobGroup.jobHealthGraphiteServers.add(graphiteServer)
            }
        }
        jobGroup.save(failOnError: true, flush: true)

        if (jobGroup.jobHealthGraphiteServers.containsAll(graphiteServers)) {
            return [added: true]
        } else {
            return [added: false]
        }
    }

    def removeJobHealthGraphiteServers(Long jobGroupId, List<Long> graphiteServerIds) {
        JobGroup jobGroup = JobGroup.findById(jobGroupId)
        Collection<GraphiteServer> graphiteServers = GraphiteServer.findAllByIdInList(graphiteServerIds)

        graphiteServers.each { graphiteServer ->
            if (jobGroup.jobHealthGraphiteServers.contains(graphiteServer)) {
                jobGroup.jobHealthGraphiteServers.remove(graphiteServer)
            }
        }
        jobGroup.save(failOnError: true, flush: true)

        if (!jobGroup.jobHealthGraphiteServers.containsAll(graphiteServers)) {
            return [removed: true]
        } else {
            return [removed: false]
        }
    }
}
