package de.iteratec.osm.measurement.environment.wptserver

import de.iteratec.osm.ConfigService
import de.iteratec.osm.OsmConfigCacheService
import de.iteratec.osm.csi.*
import de.iteratec.osm.csi.transformation.TimeToCsMappingService
import de.iteratec.osm.measurement.environment.Browser
import de.iteratec.osm.measurement.environment.BrowserAlias
import de.iteratec.osm.measurement.environment.Location
import de.iteratec.osm.measurement.environment.WebPageTestServer
import de.iteratec.osm.measurement.schedule.ConnectivityProfile
import de.iteratec.osm.measurement.schedule.Job
import de.iteratec.osm.measurement.schedule.JobDaoService
import de.iteratec.osm.measurement.schedule.JobGroup
import de.iteratec.osm.measurement.script.Script
import de.iteratec.osm.report.external.GraphiteReportService
import de.iteratec.osm.report.external.MetricReportingService
import de.iteratec.osm.result.*
import de.iteratec.osm.util.PerformanceLoggingService
import grails.buildtestdata.BuildDataTest
import grails.buildtestdata.mixin.Build
import grails.testing.services.ServiceUnitTest
import org.junit.Test
import spock.lang.Specification
import spock.lang.Unroll

import static de.iteratec.osm.OsmConfiguration.DEFAULT_MAX_VALID_LOADTIME
import static de.iteratec.osm.OsmConfiguration.DEFAULT_MIN_VALID_LOADTIME

/**
 * Tests persistence of wpt infrastructure domains like locations, browsers, WebPagetestserver, etc
 * while new EventResults get persisted.
 */
@Build([Location, Job, Page, WebPageTestServer, CsiConfiguration])
class WptInfrastructurePersistenceWithIncomingResultsSpec extends Specification implements BuildDataTest,
        ServiceUnitTest<EventResultPersisterService> {

    WebPageTestServer server1, server2

    Closure doWithSpring() {
        return {
            performanceLoggingService(PerformanceLoggingService)
            pageService(PageService)
            csiValueService(CsiValueService)
            jobDaoService(JobDaoService)
        }
    }

    def setup() {
        createTestDataCommonToAllTests()
        mocksCommonToAllTests()
    }

    void setupSpec() {
        mockDomains(WebPageTestServer, Browser, Location, Job, JobResult, EventResult, BrowserAlias, Page,
                MeasuredEvent, JobGroup, Script, CsiConfiguration, TimeToCsMapping, CsiDay, ConnectivityProfile)
    }

    @Test
    @Unroll
    void "1 JobResult, #runs * #cachedViews * #steps EventResults and #steps MeasuredEvents get persisted listening to #xml"() {

        given: "xml file of result parsed and WebPageTestServer and Locations already in place"
        File xmlFile = new File("src/test/resources/WptResultXmls/${xml}.xml")
        WptResultXml xmlResult = new WptResultXml(new XmlSlurper().parse(xmlFile))
        createLocationIfNotExistent(xmlResult.responseNode.data.location.toString(), server1)
        Job job = Job.findByLabel(jobLabel)
        JobResult.build(job: job, testId: xmlResult.testId, jobResultStatus: JobResultStatus.SUCCESS, wptServerBaseurl: server1.baseUrl)

        when: "ResultPersister listens to xml result files"
        service.listenToResult(xmlResult, server1, job.id)

        then: "all EventResult dependent Domains got persisted as expected"
        //check for steps
        List<MeasuredEvent> writtenSteps = MeasuredEvent.list()
        writtenSteps.size() == steps
        writtenSteps.findAll { !it.testedPage.isUndefinedPage() }.size() == stepsWithPage
        //check for results
        List<EventResult> allResults = EventResult.list()
        allResults.size() == runs * cachedViews * steps

        EventResult.findAllByMedianValue(true).size() == cachedViews * steps

        int expectedSizeOfAllNonMedianValues = (runs - 1) * cachedViews * steps
        EventResult.findAllByMedianValue(false).size() == expectedSizeOfAllNonMedianValues

        runs.times {
            int expectedSizeOfResults = cachedViews * steps
            EventResult.findAllByNumberOfWptRun(it + 1).size() == expectedSizeOfResults
        }

        int expectedSizeOfUnCachedViewResults = runs * steps
        EventResult.findAllByCachedView(CachedView.UNCACHED).size() == expectedSizeOfUnCachedViewResults

        int expectedSizeOfCachedViewResults = cachedViews == 2 ? runs * steps : 0
        EventResult.findAllByCachedView(CachedView.CACHED).size() == expectedSizeOfCachedViewResults

        where:
        xml                                                                     | jobLabel                          || runs | steps | stepsWithPage | execTime                          | cachedViews
        'BEFORE_MULTISTEP_3Runs'                                                | 'ie_step_testjob'                 || 3    | 1     | 0             | 'Thu, 25 Apr 2013 09:52:21 +0000' | 2
        'MULTISTEP_FORK_ITERATEC_3Runs_6EventNames'                             | '3Runs_6Events'                   || 3    | 6     | 0             | 'Thu, 25 Apr 2013 09:52:21 +0000' | 2
        'BEFORE_MULTISTEP_1Run_NotCsiRelevantCauseDocTimeTooHighResponse'       | 'FF_BV1_Step01_Homepage - netlab' || 1    | 1     | 0             | 'Wed, 03 Apr 2013 11:46:22 +0000' | 2
        'BEFORE_MULTISTEP_1Run_JustFirstView'                                   | 'testjob'                         || 1    | 1     | 0             | 'Sat, 22 Jun 2013 20:33:35 +0000' | 1
        'MULTISTEP_FORK_ITERATEC_1Run_2EventNamesWithPagePrefix_JustFirstView'  | 'testjob'                         || 1    | 2     | 2             | 'Wed, 30 Jan 2013 12:00:48 +0000' | 1
        'MULTISTEP_FORK_ITERATEC_1Run_2EventNames_PagePrefix'                   | 'FF_BV1_Multistep_2'              || 1    | 2     | 2             | 'Wed, 11 Dec 2013 15:42:43 +0000' | 2
        'BEFORE_MULTISTEP_1Run_WithoutVideo'                                    | 'IE_otto_hp_singlestep'           || 1    | 1     | 0             | 'Wed, 21 Apr 2016 12:06:53 +0000' | 2
        'BEFORE_MULTISTEP_1Run_WithVideo'                                       | 'IE_otto_hp_singlestep'           || 1    | 1     | 0             | 'Wed, 21 Apr 2016 12:03:14 +0000' | 2

    }

    void "EventResult dependent domains get persisted correctly when an invalid result xml arrives"() {

        given: "an invalid EventResult as XML and WebPageTestServer and Locations already in place"
        File xmlFile = new File("src/test/resources/WptResultXmls/BEFORE_MULTISTEP_Error_testCompletedButThereWereNoSuccessfulResults.xml")
        WptResultXml xmlResult = new WptResultXml(new XmlSlurper().parse(xmlFile))
        createLocationIfNotExistent(xmlResult.responseNode.data.location.toString(), server1)

        when: "ResultListener listens to the result xml"
        service.listenToResult(xmlResult, server1, 746847897)

        then: "Because of invalid xml result no EventResult dependent domains get persisted"
        JobResult.list().size() == 0
        EventResult.list().size() == 0
        MeasuredEvent.list().size() == 0

    }

    @Test
    void "Location gets persisted and associated to Job when it doesn't exist while listening to new result"() {

        given: "result xml file and no Location with location string from xml file in db"
        File xmlFile = new File("src/test/resources/WptResultXmls/BEFORE_MULTISTEP_1Run_JustFirstView.xml")
        WptResultXml xmlResult = new WptResultXml(new XmlSlurper().parse(xmlFile))
        String locationFromResultXml = xmlResult.responseNode.data.location.toString()
        mockProxyService(locationFromResultXml)
        int numberOfLocationsFromCommonTestData = Location.count()

        when: "ResultPersister listens to result xml"
        Job job = Job.findByLabel('testjob')
        service.listenToResult(xmlResult, server1, job.id)

        then: "Missing Location got persisted and correctly assigned to Job"
        Location.count() == numberOfLocationsFromCommonTestData + 1
        job.location.uniqueIdentifierForServer == locationFromResultXml
        job.location.wptServer == server1

    }

    private void createLocationIfNotExistent(String locationIdentifier, WebPageTestServer server) {
        if (!Location.findByWptServerAndUniqueIdentifierForServer(server, locationIdentifier)) {
            Location.build(
                active: true,
                uniqueIdentifierForServer: locationIdentifier,
                wptServer: server,
            )
        }
    }

    void createTestDataCommonToAllTests() {

        server1 = WebPageTestServer.build(active: true)
        server2 = WebPageTestServer.build(active: true)

        createPages()

        Job.build(label: 'ie_step_testjob', persistNonMedianResults: true)
        Job.build(label: '3Runs_6Events', persistNonMedianResults: true)
        Job.build(label: 'FF_BV1_Step01_Homepage - netlab', persistNonMedianResults: true)
        Job.build(label: 'testjob', persistNonMedianResults: true)
        Job.build(label: 'FF_BV1_Multistep_2', persistNonMedianResults: true)
        Job.build(label: 'IE_otto_hp_singlestep', persistNonMedianResults: true)
        Job.build(label: 'HP:::FF_BV1_Step01_Homepage - netlab', persistNonMedianResults: true)
        Job.build(label: 'example.de - Multiple steps with event names + dom elements', persistNonMedianResults: true)
        Job.build(label: 'FF_Otto_multistep', persistNonMedianResults: true)
        
    }

    private void createPages() {
        ['HP', 'MES', Page.UNDEFINED].each { pageName ->
            Page.build(name: pageName)
        }
    }

    private void mocksCommonToAllTests() {
        service.metricReportingService = Mock(MetricReportingService)
        service.csiAggregationUpdateService = Mock(CsiAggregationUpdateService)
        service.timeToCsMappingService = Stub(TimeToCsMappingService){
            getCustomerSatisfactionInPercent(_, _, _) >> 1
        }
        service.csiValueService.osmConfigCacheService = Stub(OsmConfigCacheService) {
            getMinValidLoadtime(_) >> DEFAULT_MIN_VALID_LOADTIME
            getMaxValidLoadtime(_) >> DEFAULT_MAX_VALID_LOADTIME
        }

        service.configService = Stub(ConfigService) {
            getMaxValidLoadtime() >> DEFAULT_MAX_VALID_LOADTIME
            getMinValidLoadtime() >> DEFAULT_MIN_VALID_LOADTIME
        }

        service.graphiteReportService = Mock(GraphiteReportService)
    }

    private void mockProxyService(String locationIdentifier) {
        service.wptInstructionService = Stub(WptInstructionService) {
            fetchLocations(_) >> { WebPageTestServer server ->
                createLocationIfNotExistent(locationIdentifier, server);
            }
        }
    }
}
