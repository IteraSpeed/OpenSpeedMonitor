package de.iteratec.osm.linechart

import de.iteratec.osm.measurement.environment.Location
import de.iteratec.osm.measurement.schedule.ConnectivityProfile
import de.iteratec.osm.measurement.schedule.JobGroup
import de.iteratec.osm.report.chart.WptEventResultInfo
import de.iteratec.osm.result.CachedView
import de.iteratec.osm.result.MeasurandGroup
import de.iteratec.osm.result.MeasuredEvent
import de.iteratec.osm.result.PerformanceAspectType
import de.iteratec.osm.result.SelectedMeasurand
import de.iteratec.osm.result.dao.EventResultProjection
import de.iteratec.osm.result.dao.EventResultQueryBuilder
import de.iteratec.osm.util.PerformanceLoggingService
import de.iteratec.osm.util.PerformanceLoggingService.IndentationDepth
import grails.gorm.transactions.Transactional
import org.apache.commons.lang.StringUtils

import static de.iteratec.osm.util.PerformanceLoggingService.LogLevel.DEBUG

@Transactional
class LineChartTimeSeriesService {

    PerformanceLoggingService performanceLoggingService

    static int MEGA_BYTE = 1048576

    TimeSeriesChartDTO getTimeSeriesFor(GetLinechartCommand cmd) {
        Date from = cmd.from.toDate()
        Date to = cmd.to.toDate()
        List<JobGroup> jobGroups = []
        if (cmd.jobGroups) {
            jobGroups = JobGroup.findAllByIdInList(cmd.jobGroups)
        }
        List<MeasuredEvent> measuredEvents = []
        if (cmd.measuredEvents) {
            measuredEvents = MeasuredEvent.findAllByIdInList(cmd.measuredEvents)
        }
        List<Location> locations = []
        if (cmd.locations) {
            locations = Location.findAllByIdInList(cmd.locations)
        }
        List<ConnectivityProfile> connectivityProfiles = []
        if (cmd.connectivities) {
            connectivityProfiles = ConnectivityProfile.findAllByIdInList(cmd.connectivities)
        }
        List<SelectedMeasurand> measurands = []
        if (cmd.measurands) {
            measurands = cmd.measurands.collect { new SelectedMeasurand(it, CachedView.UNCACHED) }.unique()
        }
        List<PerformanceAspectType> performanceAspectTypes = []
        if (cmd.performanceAspectTypes) {
            performanceAspectTypes = cmd.performanceAspectTypes.collect {
                it.toString().toUpperCase() as PerformanceAspectType
            }.unique()
        }

        List<EventResultProjection> eventResultProjections = getResultProjections(cmd, from, to, measurands,
                performanceAspectTypes)
        return buildDTO(eventResultProjections, jobGroups, measuredEvents, locations, connectivityProfiles, measurands,
                performanceAspectTypes)
    }

    private List<EventResultProjection> getResultProjections(GetLinechartCommand cmd, Date from, Date to,
                                                             List<SelectedMeasurand> measurands,
                                                             List<PerformanceAspectType> performanceAspectTypes) {
        EventResultQueryBuilder queryBuilder = (EventResultQueryBuilder) performanceLoggingService.logExecutionTime(DEBUG, 'getting event-results - with builder', IndentationDepth.ONE) {
            return new EventResultQueryBuilder()
                    .withJobResultDateBetween(from, to)
                    .withJobGroupIdsIn(cmd.jobGroups as List)
                    .withMeasuredEventIdsIn(cmd.measuredEvents as List)
                    .withPageIdsIn(cmd.pages as List)
                    .withLocationIdsIn(cmd.locations as List)
                    .withBrowserIdsIn(cmd.browsers as List)
                    .withConnectivity(cmd.connectivities as List, null, false)
                    .withSelectedMeasurands(measurands)
        }
        if (performanceAspectTypes) {
            queryBuilder = (EventResultQueryBuilder) performanceLoggingService.logExecutionTime(DEBUG, 'getting event-results - with builder', IndentationDepth.ONE) {
                queryBuilder.withPerformanceAspects(performanceAspectTypes)
            }
        }

        List<EventResultProjection> eventResultProjections = (List<EventResultProjection>) performanceLoggingService.logExecutionTime(DEBUG, 'getting event-results - actually query the data', IndentationDepth.TWO) {
            queryBuilder.getRawData()
        }
        return eventResultProjections
    }

    private TimeSeriesChartDTO buildDTO(List<EventResultProjection> eventResultProjections, List<JobGroup> jobGroups,
                                        List<MeasuredEvent> measuredEvents, List<Location> locations,
                                        List<ConnectivityProfile> connectivityProfiles,
                                        List<SelectedMeasurand> measurands,
                                        List<PerformanceAspectType> performanceAspectTypes) {
        TimeSeriesChartDTO timeSeriesChartDTO = new TimeSeriesChartDTO()
        JobGroup jobGroup
        MeasuredEvent measuredEvent
        Location location
        ConnectivityProfile connectivity
        if (measurands.size() == 1 && performanceAspectTypes.size() == 0) {
            timeSeriesChartDTO.summaryLabels.add new SummaryLabel("measurand", "${measurands[0]?.name}")
        } else if (performanceAspectTypes.size() == 1 && measurands.size() == 0) {
            timeSeriesChartDTO.summaryLabels.add new SummaryLabel("measurand", "${performanceAspectTypes[0]}")
        }
        if (jobGroups.size() == 1) {
            jobGroup = jobGroups[0]
            timeSeriesChartDTO.summaryLabels.add new SummaryLabel("application", "${jobGroup?.name}")
        }
        if (measuredEvents.size() == 1) {
            measuredEvent = measuredEvents[0]
            timeSeriesChartDTO.summaryLabels.add new SummaryLabel("measuredEvent", "${measuredEvent?.name}")
        }
        if (locations.size() == 1) {
            location = locations[0]
            timeSeriesChartDTO.summaryLabels.add new SummaryLabel("location", "${location?.uniqueIdentifierForServer}")
        }
        if (connectivityProfiles.size() == 1) {
            connectivity = connectivityProfiles[0]
            timeSeriesChartDTO.summaryLabels.add new SummaryLabel("connectivity", "${connectivity?.name}")
        }

        timeSeriesChartDTO = fillData(timeSeriesChartDTO, eventResultProjections, measurands, performanceAspectTypes,
                jobGroups, measuredEvents, locations, connectivityProfiles, jobGroup, measuredEvent, location, connectivity)

        timeSeriesChartDTO = rebuildIdentifierForEdgeCases(timeSeriesChartDTO, measuredEvents, locations, connectivityProfiles)
        timeSeriesChartDTO.series.each { series ->
            series.value.sort { it.identifier.toUpperCase() }
            timeSeriesChartDTO.numberOfTimeSeries += series.value.size()
        }
        return timeSeriesChartDTO
    }

    private TimeSeriesChartDTO fillData(TimeSeriesChartDTO timeSeriesChartDTO, List<EventResultProjection> eventResultProjections,
                                        List<SelectedMeasurand> measurands, List<PerformanceAspectType> performanceAspectTypes,
                                        List<JobGroup> jobGroups, List<MeasuredEvent> measuredEvents, List<Location> locations,
                                        List<ConnectivityProfile> connectivityProfiles, JobGroup jobGroup,
                                        MeasuredEvent measuredEvent, Location location, ConnectivityProfile connectivity) {
        performanceLoggingService.logExecutionTime(DEBUG, "create DTO for TimeSeriesChart", IndentationDepth.ONE) {
            eventResultProjections.each { EventResultProjection eventResultProjection ->
                String identifier = ""
                Date date = (Date) eventResultProjection.jobResultDate
                String testAgent = eventResultProjection.testAgent
                if (jobGroups.size() > 1) {
                    jobGroup = (JobGroup) jobGroups.find {
                        jobGroupEntry -> jobGroupEntry.id == eventResultProjection.jobGroupId
                    }
                    identifier = jobGroup?.name
                }
                if (measuredEvents.size() > 1) {
                    measuredEvent = (MeasuredEvent) measuredEvents.find {
                        measuredEventEntry -> measuredEventEntry.id == eventResultProjection.measuredEventId
                    }
                    identifier = addToIdentifier(measuredEvent?.name, identifier)
                } else if (measuredEvents.size() == 0) {
                    measuredEvent = (MeasuredEvent) MeasuredEvent.findById(eventResultProjection.measuredEventId)
                    identifier = addToIdentifier(measuredEvent?.name, identifier)
                }
                if (locations.size() > 1) {
                    location = (Location) locations.find {
                        locationEntry -> locationEntry.id == eventResultProjection.locationId
                    }
                    identifier = addToIdentifier(location?.uniqueIdentifierForServer, identifier)
                } else if (locations.size() == 0) {
                    location = (Location) Location.findById(eventResultProjection.locationId)
                    identifier = addToIdentifier(location?.uniqueIdentifierForServer, identifier)
                }
                if (connectivityProfiles.size() > 1) {
                    connectivity = (ConnectivityProfile) connectivityProfiles.find {
                        connectivityProfile -> connectivityProfile.name == eventResultProjection.connectivityProfile
                    }
                    identifier = addToIdentifier(connectivity?.name, identifier)
                } else if (connectivityProfiles.size() == 0) {
                    connectivity = (ConnectivityProfile) ConnectivityProfile.findByName(eventResultProjection.connectivityProfile)
                    identifier = addToIdentifier(connectivity?.name, identifier)
                }

                TimeSeriesDataPointWptInfo wptInfo = new TimeSeriesDataPointWptInfo(
                        baseUrl: eventResultProjection.wptServerBaseurl,
                        testId: eventResultProjection.testId,
                        runNumber: eventResultProjection.numberOfWptRun,
                        indexInJourney: eventResultProjection.oneBasedStepIndexInJourney)

                measurands.each { measurand ->
                    String dataBaseRelevantName = measurand.getDatabaseRelevantName()
                    String measurandName = measurand.getName()
                    Double value = (Double) eventResultProjection."$dataBaseRelevantName"
                    String identifierMeasurand = identifier
                    if ((measurands.size() + performanceAspectTypes.size()) > 1) {
                        identifierMeasurand = addMeasurandToIdentifier(measurandName, identifier)
                    }
                    MeasurandGroup measurandGroup = measurand.measurandGroup
                    String unit = measurandGroup.unit.label
                    if (MeasurandGroup.REQUEST_SIZES.equals(measurandGroup)) {
                        if (value) {
                            value = (value / MEGA_BYTE).round(2)
                        }
                    }
                    timeSeriesChartDTO.measurandGroups.put(measurandGroup, unit)
                    buildSeries(value, identifierMeasurand, date, testAgent, wptInfo, measurandName, jobGroup, measuredEvent, location,
                            connectivity, timeSeriesChartDTO, measurandGroup)
                }

                performanceAspectTypes.each { performanceAspectType ->
                    Double value = (Double) eventResultProjection."$performanceAspectType"
                    String identifierAspect = identifier
                    if ((measurands.size() + performanceAspectTypes.size()) > 1) {
                        identifierAspect = addMeasurandToIdentifier(performanceAspectType.toString(), identifier)
                    }
                    MeasurandGroup measurandGroup = MeasurandGroup.LOAD_TIMES
                    String unit = measurandGroup.unit.label
                    timeSeriesChartDTO.measurandGroups.put(measurandGroup, unit)
                    buildSeries(value, identifierAspect, date, testAgent, wptInfo, performanceAspectType.toString(), jobGroup,
                            measuredEvent, location, connectivity, timeSeriesChartDTO, measurandGroup)
                }
            }
            timeSeriesChartDTO.series.each { series ->
                series.value.any {
                    if (it.data.findAll { it.value == null }.size() == it.data.size()) {
                        timeSeriesChartDTO.series.remove(it)
                    }
                }
            }
        }
        return timeSeriesChartDTO
    }

    private void buildSeries(Double value, String identifier, Date date, String testAgent, TimeSeriesDataPointWptInfo wptInfo,
                             String measurandName, JobGroup jobGroup, MeasuredEvent measuredEvent, Location location,
                             ConnectivityProfile connectivity, TimeSeriesChartDTO timeSeriesChartDTO, MeasurandGroup measurandGroup) {
        if (!timeSeriesChartDTO.series[measurandGroup]) {
            timeSeriesChartDTO.series[measurandGroup] = []
        }
        TimeSeries timeSeries = timeSeriesChartDTO.series[measurandGroup].find({ it.identifier == identifier })
        if (!timeSeries) {
            timeSeries = new TimeSeries(
                    identifier: identifier,
                    measurand: measurandName,
                    jobGroup: jobGroup.name,
                    measuredEvent: measuredEvent.name,
                    location: location.uniqueIdentifierForServer,
                    connectivity: connectivity.name
            )
            timeSeriesChartDTO.series[measurandGroup].add(timeSeries)
        }
        TimeSeriesDataPoint timeSeriesDataPoint = new TimeSeriesDataPoint(date: date, value: value, agent: testAgent, wptInfo: wptInfo)
        timeSeries.data.add(timeSeriesDataPoint)
    }

    private TimeSeriesChartDTO rebuildIdentifierForEdgeCases(TimeSeriesChartDTO timeSeriesChartDTO, List<MeasuredEvent> measuredEvents,
                                                             List<Location> locations, List<ConnectivityProfile> connectivityProfiles) {
        TimeSeries[] timeSeriesListOfFirstMeasurandGroup = timeSeriesChartDTO.series.entrySet().toArray()[0].value as TimeSeries[]
        if (timeSeriesChartDTO.series.size() == 1 && timeSeriesListOfFirstMeasurandGroup.size() == 1) {
            timeSeriesListOfFirstMeasurandGroup.each { TimeSeries timeSeries ->
                timeSeries.identifier = "${timeSeries.measurand} | ${timeSeries.jobGroup} | ${timeSeries.measuredEvent} | ${timeSeries.location} | ${timeSeries.connectivity}"
                }
            timeSeriesChartDTO.summaryLabels.clear()
        } else if (measuredEvents.size() == 0 || locations.size() == 0 || connectivityProfiles.size() == 0) {
            boolean sameMeasuredEvent = measuredEvents.size() == 0
            boolean sameLocation = locations.size() == 0
            boolean sameConnectivity = connectivityProfiles.size() == 0

            TimeSeries firstTimeSeries = timeSeriesListOfFirstMeasurandGroup[0]
            String measuredEventName = firstTimeSeries.measuredEvent
            String locationName = firstTimeSeries.location
            String connectivityName = firstTimeSeries.connectivity
            timeSeriesChartDTO.series.each { series ->
                if (!sameMeasuredEvent && !sameLocation && !sameConnectivity) {
                    return
                }
                series.value.each { TimeSeries timeSeries ->
                    if (!sameMeasuredEvent && !sameLocation && !sameConnectivity) {
                        return
                    }
                    sameMeasuredEvent = sameMeasuredEvent && timeSeries.measuredEvent == measuredEventName
                    sameLocation = sameLocation && timeSeries.location == locationName
                    sameConnectivity = sameConnectivity && timeSeries.connectivity == connectivityName
                }
            }
            if (sameMeasuredEvent) {
                timeSeriesChartDTO.summaryLabels.add new SummaryLabel("measuredEvent", measuredEventName)
            }
            if (sameLocation) {
                timeSeriesChartDTO.summaryLabels.add new SummaryLabel("location", locationName)
            }
            if (sameConnectivity) {
                timeSeriesChartDTO.summaryLabels.add new SummaryLabel("connectivity", connectivityName)
            }
            if (sameMeasuredEvent || sameLocation || sameConnectivity) {
                boolean oneMeasurand = false;
                boolean oneApplication = false;
                boolean oneMeasuredEvent = false;
                boolean oneLocation = false;
                boolean oneConnectivity = false;
                timeSeriesChartDTO.summaryLabels.each { SummaryLabel label ->
                    if (label.key == "measurand") {
                        oneMeasurand = true
                    }
                    if (label.key == "application") {
                        oneApplication = true
                    }
                    if (label.key == "measuredEvent") {
                        oneMeasuredEvent = true
                    }
                    if (label.key == "location") {
                        oneLocation = true
                    }
                    if (label.key == "connectivity") {
                        oneConnectivity = true
                    }
                }
                timeSeriesChartDTO.series.each { series ->
                    series.value.each { TimeSeries timeSeries ->
                        String identifier = ""
                        if (!oneMeasurand) {
                            identifier = timeSeries.measurand
                        }
                        if (!oneApplication) {
                            identifier = addToIdentifier(timeSeries.jobGroup, identifier)
                        }
                        if (!oneMeasuredEvent) {
                            identifier = addToIdentifier(timeSeries.measuredEvent, identifier)
                        }
                        if (!oneLocation) {
                            identifier = addToIdentifier(timeSeries.location, identifier)
                        }
                        if (!oneConnectivity) {
                            identifier = addToIdentifier(timeSeries.connectivity, identifier)
                        }
                        timeSeries.identifier = identifier
                    }
                }
            }
        }
        return timeSeriesChartDTO
    }

    private String addToIdentifier(String element, String identifier) {
        if (StringUtils.isBlank(identifier)) {
            return element
        } else {
            return "$identifier | $element"
        }
    }

    private String addMeasurandToIdentifier(String element, String identifier) {
        if (StringUtils.isBlank(identifier)) {
            return element
        } else {
            return "$element | $identifier"
        }
    }
}
