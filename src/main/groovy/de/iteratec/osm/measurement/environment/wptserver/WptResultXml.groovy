package de.iteratec.osm.measurement.environment.wptserver

import de.iteratec.osm.OsmConfiguration
import de.iteratec.osm.measurement.schedule.Job
import de.iteratec.osm.result.CachedView
import de.iteratec.osm.result.Measurand
import de.iteratec.osm.result.WptStatus
import de.iteratec.osm.result.WptXmlResultVersion
import groovy.util.logging.Slf4j
import groovy.util.slurpersupport.GPathResult

/**
 * Represents webpagetests response from xmlResult.php api function.
 * @author nkuhn
 * @see https://sites.google.com/a/webpagetest.org/docs/advanced-features/webpagetest-restful-apis#TOC-XML-response
 */
@Slf4j
class WptResultXml {

    static List<Measurand> atLeastExpectedToBeValid = [Measurand.FIRST_BYTE, Measurand.START_RENDER, Measurand.VISUALLY_COMPLETE,
                                                       Measurand.SPEED_INDEX, Measurand.DOC_COMPLETE_TIME, Measurand.FULLY_LOADED_TIME]
    /**
     * Base node of results xml.
     */
    GPathResult responseNode
    /**
     * Version of webpagetests result xml.
     * @see {@link WptXmlResultVersion}
     */
    WptXmlResultVersion version

    int minValidLoadTime = OsmConfiguration.DEFAULT_MIN_VALID_LOADTIME
    int maxValidLoadTime = OsmConfiguration.DEFAULT_MAX_VALID_LOADTIME

    WptResultXml(GPathResult baseNode, int minValidLoadTime, int maxValidLoadTime) {
        this(baseNode)
        this.minValidLoadTime = minValidLoadTime
        this.maxValidLoadTime = maxValidLoadTime
    }

    WptResultXml(GPathResult baseNode) {
        this.responseNode = baseNode
        version = WptXmlResultVersion.BEFORE_MULTISTEP
        if (!this.responseNode.data.median.firstView.testStep.isEmpty()) {
            version = WptXmlResultVersion.MULTISTEP_FORK_ITERATEC
        }
        if (!this.responseNode.webPagetestVersion.isEmpty()) {
            version = WptXmlResultVersion.MULTISTEP
        }
    }

    String getLabel() {
        return responseNode.data.label.toString()
    }

    String getLocation() {
        return responseNode.data.location.toString()
    }

    Integer getRunCount() {
        if (!responseNode.data.runs.toString().isInteger())
            throw new IllegalArgumentException('data/runs missing or no integer in XML result')
        return responseNode.data.runs.toInteger()
    }

    String getTestId() {
        return responseNode.data.testId.toString()
    }

    String getTestAgent() {
        return responseNode.data.tester.toString()
    }

    WptStatus getWptStatus() {
        return WptStatus.byResultCode(responseNode?.statusCode?.toInteger())
    }

    String getStatusText() {
        return responseNode?.statusText?.toString()
    }

    Date getCompletionDate() {
        return responseNode.data.completed.isEmpty() ? new Date() : new Date(responseNode.data.completed.toString())
    }

    Integer getBwDown() {
        return responseNode.data.bwDown.toInteger()
    }

    Integer getBwUp() {
        return responseNode.data.bwUp.toInteger()
    }

    Integer getLatency() {
        return responseNode.data.latency.toInteger()
    }

    Integer getPacketLossRate() {
        return responseNode.data.plr.toInteger()
    }

    /**
     * Provides count of steps in this test. For results of wptservers before multistep 1 is returned for successful
     * results and 0 is returned for failed results.
     * @return Number of steps in this test.
     */
    Integer getTestStepCount() {
        switch (version) {
            case WptXmlResultVersion.BEFORE_MULTISTEP:
                return responseNode.data.median.isEmpty() ? 0 : 1
            case WptXmlResultVersion.MULTISTEP_FORK_ITERATEC:
                return responseNode.data.median.firstView.testStep.size()
            case WptXmlResultVersion.MULTISTEP:
                return responseNode.data.run.getAt(0).firstView.numSteps.toString() as Integer
            default:
                throw new IllegalStateException("Version of result xml isn't specified!")
        }
    }

    String getEventName(Job job, Integer testStepZeroBasedIndex) {
        switch (version) {
            case WptXmlResultVersion.BEFORE_MULTISTEP:
                return job.getEventNameIfUnknown() ?: job.getLabel()
            case WptXmlResultVersion.MULTISTEP_FORK_ITERATEC:
                return responseNode.data.median.firstView.testStep.getAt(testStepZeroBasedIndex)?.eventName?.toString()
            case WptXmlResultVersion.MULTISTEP:
                return responseNode.data.run.getAt(0).firstView.step.getAt(testStepZeroBasedIndex)?.eventName?.toString()
            default:
                throw new IllegalStateException("Version of result xml isn't specified!")

        }
    }

    def getRunNodes() {
        return responseNode.data.run
    }

    GPathResult getResultNodeForRunAndView(runZeroBasedIndex, cachedView) {
        GPathResult runNode = getRunNodes()[runZeroBasedIndex]
        if (cachedView == CachedView.UNCACHED) {
            return runNode.firstView
        } else if (cachedView == CachedView.CACHED) {
            return runNode.repeatView
        } else {
            throw new IllegalArgumentException("Argument cachedView should be UNCACHED or CACHED, but was ${cachedView}!")
        }
    }

    Boolean resultExistForRunAndView(runZeroBasedIndex, cachedView) {
        return !getResultNodeForRunAndView(runZeroBasedIndex, cachedView).isEmpty()
    }
    /**
     * Provides the xml node which contains the measured values of this result (like requestsDoc, docTime or score_cdn) for
     * given runZeroBasedIndex, cachedView and testStepZeroBasedIndex.
     * @param runZeroBasedIndex
     * 	Zero based index of the run.
     * @param cachedView
     * 	CachedView.CACHED or CachedView.UNCACHED.
     * @param testStepZeroBasedIndex
     * 	Zero based index of the teststep. For results of wptservers before multistep param testStepZeroBasedIndex isn't involved at all.
     * @return Xml node which contains the measured values of this result.
     */
    GPathResult getResultsContainingNode(runZeroBasedIndex, cachedView, testStepZeroBasedIndex) {

        GPathResult viewNode = getResultNodeForRunAndView(runZeroBasedIndex, cachedView)

        switch (version) {
            case WptXmlResultVersion.BEFORE_MULTISTEP:
                return viewNode.results
            case WptXmlResultVersion.MULTISTEP_FORK_ITERATEC:
                return viewNode.results.testStep.getAt(testStepZeroBasedIndex)
            case WptXmlResultVersion.MULTISTEP:
                return viewNode.step.getAt(testStepZeroBasedIndex).results
            default:
                throw new IllegalStateException("Version of result xml isn't specified!")
        }
    }

    /**
     * Determines if a node is a median node
     *
     * @param viewNode expects a view node of a run: (response -> data -> run -> firstView or repeatedView)
     * @param currentRun
     * @return
     */
    boolean isMedian(Integer runZeroBasedIndex, CachedView cachedView, Integer testStepZeroBasedIndex) {

        if (version == null) throw new IllegalStateException("Version of result xml isn't specified!")

        Integer medianRunNumber = getRunNumberOfMedianViewNode(cachedView, testStepZeroBasedIndex)
        if (runZeroBasedIndex + 1 == medianRunNumber) {
            return true
        } else {
            return false
        }

    }

    Integer getRunNumberOfMedianViewNode(CachedView cachedView, Integer testStepZeroBasedIndex) {
        boolean firstView = cachedView == CachedView.UNCACHED

        switch (version) {
            case WptXmlResultVersion.BEFORE_MULTISTEP:
                return firstView ? responseNode.data.median.firstView.run.getAt(0).toInteger() : responseNode.data.median.repeatView.run.getAt(0).toInteger()
            case WptXmlResultVersion.MULTISTEP_FORK_ITERATEC:
                return firstView ? responseNode.data.median.firstView.testStep.getAt(testStepZeroBasedIndex).run.getAt(0).toInteger() : responseNode.data.median.repeatView.testStep.getAt(testStepZeroBasedIndex).run.getAt(0).toInteger()
            case WptXmlResultVersion.MULTISTEP:
                return firstView ? responseNode.data.median.firstView.run.getAt(0).toInteger() : responseNode.data.median.repeatView.run.getAt(0).toInteger()
            default:
                throw new IllegalArgumentException("Unknown WptXmlResultVersion: ${version}")
        }
    }

    boolean hasRuns() {
        return responseNode.data.runs.toString().isInteger()
    }

    int countValidResults(int expectedRuns, int expectedSteps, boolean firstViewOnly) {
        int validResults = 0
        List<CachedView> expectedCached = firstViewOnly ? [CachedView.UNCACHED] : [CachedView.UNCACHED, CachedView.CACHED]
        expectedRuns.times { run ->
            expectedCached.each { cached ->
                expectedSteps.times { step ->
                    if (isValidTestStep(getResultsContainingNode(run, cached, step))) {
                        validResults++
                    }
                }
            }
        }
        return validResults
    }

    boolean isValidTestStep(GPathResult testStepNode) {
        if (!testStepNode || testStepNode.isEmpty()) {
            log.error("Step node is empty: ${testStepNode}")
            return false
        }
        int statusCode = testStepNode.result?.toInteger()
        if (statusCode == null) {
            log.error("Can't parse status code for step result from wpt: ${testStepNode}")
            return false
        }
        if (!WptStatus.byResultCode(statusCode).isSuccess()) {
            return false
        }
        if (noMetricsWithValidData(testStepNode)) {
            return false
        }
        return true
    }

    private noMetricsWithValidData(testStepNode) {
        return !atLeastExpectedToBeValid.any { measurand ->
            Integer value = testStepNode.getProperty(measurand.getTagInResultXml())?.toInteger()
            return value != null && value > minValidLoadTime && value < maxValidLoadTime
        }
    }
}
