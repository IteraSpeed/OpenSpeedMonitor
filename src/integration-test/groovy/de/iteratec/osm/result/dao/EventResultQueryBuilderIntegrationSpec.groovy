package de.iteratec.osm.result.dao

import de.iteratec.osm.csi.NonTransactionalIntegrationSpec
import de.iteratec.osm.csi.Page
import de.iteratec.osm.measurement.environment.Browser
import de.iteratec.osm.measurement.environment.Location
import de.iteratec.osm.measurement.schedule.ConnectivityProfile
import de.iteratec.osm.measurement.schedule.JobGroup
import de.iteratec.osm.result.*
import de.iteratec.osm.result.dao.query.TrimQualifier
import grails.gorm.transactions.Rollback
import grails.testing.mixin.integration.Integration
import org.joda.time.DateTime
import org.joda.time.DateTimeZone

@Integration(applicationClass = openspeedmonitor.Application.class)
@Rollback
class EventResultQueryBuilderIntegrationSpec extends NonTransactionalIntegrationSpec {

    Browser browser
    Location location
    JobGroup jobGroup
    JobResult jobResult
    MeasuredEvent measuredEvent
    Page page
    ConnectivityProfile connectivityProfile
    DateTime runDate = new DateTime(DateTimeZone.UTC)

    void "check base projections"() {
        given: "two matching and 10 other Eventresults"
        page = Page.build()
        jobGroup = JobGroup.build()
        browser = Browser.build()
        location = Location.build()
        measuredEvent = MeasuredEvent.build()
        connectivityProfile = ConnectivityProfile.build(name: "my-name")
        jobResult = JobResult.build()

        10.times {
            EventResult.build(fullyLoadedTimeInMillisecs: 500, medianValue: true)
        }
        2.times {
            EventResult.build(
                    jobGroup: jobGroup,
                    page: page,
                    measuredEvent: measuredEvent,
                    browser: browser,
                    location: location,
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 500,
                    numberOfWptRun: 23,
                    cachedView: CachedView.UNCACHED,
                    oneBasedStepIndexInJourney: 15,
                    jobResultDate: runDate.toDate(),
                    medianValue: true,
                    testAgent: "testAgent",
                    jobResult: jobResult
            )
        }


        when: "the builder just has one measurand and one connectivity profile"
        SelectedMeasurand selectedMeasurand = new SelectedMeasurand("FULLY_LOADED_TIME", CachedView.UNCACHED)
        List<EventResultProjection> result = new EventResultQueryBuilder().withSelectedMeasurands([selectedMeasurand]).withConnectivity([connectivityProfile.id], null, false).getRawData()

        then: "only both matching Eventresults are found with baseline projections"
        result.size() == 2

        result.every {
            it.connectivityProfile == connectivityProfile.name &&
                    it.fullyLoadedTimeInMillisecs == 500 &&
                    it.pageId == page.id &&
                    it.jobGroupId == jobGroup.id &&
                    it.browserId == browser.id &&
                    it.measuredEventId == measuredEvent.id &&
                    it.testAgent == "testAgent" &&
                    it.jobResultDate == runDate.toDate() &&
                    it.wptServerBaseurl == jobResult.wptServerBaseurl &&
                    it.testId == jobResult.testId &&
                    it.numberOfWptRun == 23 &&
                    it.cachedView == CachedView.UNCACHED &&
                    it.oneBasedStepIndexInJourney == 15
        }
    }

    void "check trims "(MeasurandGroup measurandGroup) {
        given: "two matching and 20 other Eventresults"
        connectivityProfile = ConnectivityProfile.build(name: "my-name")

        10.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 300,
                    fullyLoadedRequestCount: 300,
                    firstByteInMillisecs: 300,
                    fullyLoadedIncomingBytes: 300,
                    medianValue: true
            )
        }
        2.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 200,
                    fullyLoadedRequestCount: 200,
                    firstByteInMillisecs: 200,
                    fullyLoadedIncomingBytes: 200,
                    medianValue: true
            )
        }
        10.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 100,
                    fullyLoadedRequestCount: 100,
                    firstByteInMillisecs: 100,
                    fullyLoadedIncomingBytes: 100,
                    medianValue: true
            )
        }

        when: "the builder is trimmed"
        SelectedMeasurand selectedMeasurandFullyLoadedTime = new SelectedMeasurand(Measurand.FULLY_LOADED_TIME.toString(), CachedView.UNCACHED)
        SelectedMeasurand selectedMeasurandFullyLoadedCount = new SelectedMeasurand(Measurand.FULLY_LOADED_REQUEST_COUNT.toString(), CachedView.UNCACHED)
        SelectedMeasurand selectedMeasurandTTFB = new SelectedMeasurand(Measurand.FIRST_BYTE.toString(), CachedView.UNCACHED)
        SelectedMeasurand selectedMeasurandFullyLoadedBytes = new SelectedMeasurand(Measurand.FULLY_LOADED_INCOMING_BYTES.toString(), CachedView.UNCACHED)
        List<EventResultProjection> result = new EventResultQueryBuilder()
                .withSelectedMeasurands([selectedMeasurandFullyLoadedTime, selectedMeasurandFullyLoadedCount, selectedMeasurandTTFB, selectedMeasurandFullyLoadedBytes])
                .withConnectivity([connectivityProfile.id], null, false)
                .withTrim(250, TrimQualifier.LOWER_THAN, measurandGroup)
                .withTrim(150, TrimQualifier.GREATER_THAN, measurandGroup)
                .getRawData()

        then: "only both matching Eventresults are found"
        result.size() == 2
        result.every {
            it.fullyLoadedRequestCount == 200 &&
                    it.firstByteInMillisecs == 200 &&
                    it.fullyLoadedIncomingBytes == 200
        }

        where:
        measurandGroup                | _
        MeasurandGroup.LOAD_TIMES     | _
        MeasurandGroup.REQUEST_COUNTS | _
        MeasurandGroup.REQUEST_SIZES  | _
    }

    void "check if trim for percentages"() {
        given: "two matching and 20 other Eventresults"
        connectivityProfile = ConnectivityProfile.build(name: "my-name")

        10.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 200,
                    csByWptDocCompleteInPercent: new Double(300),
                    medianValue: true
            )
        }
        2.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 200,
                    csByWptDocCompleteInPercent: new Double(200),
                    medianValue: true
            )
        }
        10.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 200,
                    csByWptDocCompleteInPercent: new Double(100),
                    medianValue: true
            )
        }

        when: "the builder is trimmed with precentage"
        SelectedMeasurand selectedMeasurandCsByDCinPercent = new SelectedMeasurand(Measurand.CS_BY_WPT_DOC_COMPLETE.toString(), CachedView.UNCACHED)
        List<EventResultProjection> result = new EventResultQueryBuilder()
                .withSelectedMeasurands([selectedMeasurandCsByDCinPercent])
                .withConnectivity([connectivityProfile.id], null, false)
                .withTrim(new Double(250), TrimQualifier.LOWER_THAN, MeasurandGroup.PERCENTAGES)
                .withTrim(new Double(150), TrimQualifier.GREATER_THAN, MeasurandGroup.PERCENTAGES)
                .getRawData()

        then: "only both matching Eventresults are found"
        result.size() == 2
        result.every {
            it.csByWptDocCompleteInPercent == 200
        }
    }


    void "check trims for UserTiming Marks"() {
        given: "two matching and 20 other Eventresults"
        connectivityProfile = ConnectivityProfile.build(name: "my-name")

        10.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 300,
                    medianValue: true,
                    userTimings: [
                            UserTiming.build(name: "usertiming", startTime: new Double(300), duration: null, type: UserTimingType.MARK),
                            UserTiming.build(name: "usertimingME", duration: new Double(200), type: UserTimingType.MEASURE)
                    ],
                    flush: true
            )
        }
        2.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 200,
                    medianValue: true,
                    userTimings: [
                            UserTiming.build(name: "usertiming", startTime: new Double(200), duration: null, type: UserTimingType.MARK),
                            UserTiming.build(name: "usertimingME", duration: new Double(300), type: UserTimingType.MEASURE)
                    ],
                    flush: true
            )
        }
        10.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 100,
                    medianValue: true,
                    userTimings: [
                            UserTiming.build(name: "usertiming", startTime: new Double(100), duration: null, type: UserTimingType.MARK),
                            UserTiming.build(name: "usertimingME", duration: new Double(200), type: UserTimingType.MEASURE)
                    ],
                    flush: true
            )
        }

        when: "the builder is trimmed"
        SelectedMeasurand selectedMeasurand = new SelectedMeasurand("_UTMK_usertiming", CachedView.UNCACHED)
        List<EventResultProjection> result = new EventResultQueryBuilder()
                .withSelectedMeasurands([selectedMeasurand])
                .withConnectivity([connectivityProfile.id], null, false)
                .withTrim(250, TrimQualifier.LOWER_THAN, MeasurandGroup.LOAD_TIMES)
                .withTrim(150, TrimQualifier.GREATER_THAN, MeasurandGroup.LOAD_TIMES)
                .getRawData()

        then: "only both matching Eventresults are found"
        result.size() == 2
        result.every {
            it.usertiming == 200
        }
    }

    void "check mixed trims"() {
        given: "two matching and 20 other Eventresults"
        connectivityProfile = ConnectivityProfile.build(name: "my-name")

        10.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 300,
                    firstByteInMillisecs: 100,
                    medianValue: true,
                    userTimings: [
                            UserTiming.build(name: "usertimingME", duration: new Double(200), type: UserTimingType.MEASURE),
                            UserTiming.build(name: "usertimingMK", startTime: new Double(300), duration: null, type: UserTimingType.MARK)
                    ],
                    flush: true
            )
        }
        2.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 200,
                    firstByteInMillisecs: 100,
                    medianValue: true,
                    userTimings: [
                            UserTiming.build(name: "usertimingME", duration: new Double(200), type: UserTimingType.MEASURE),
                            UserTiming.build(name: "usertimingMK", startTime: new Double(300), duration: null, type: UserTimingType.MARK)
                    ],
                    flush: true
            )
        }
        10.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 100,
                    firstByteInMillisecs: 100,
                    medianValue: true,
                    userTimings: [
                            UserTiming.build(name: "usertimingME", duration: new Double(200), type: UserTimingType.MEASURE),
                            UserTiming.build(name: "usertimingMK", startTime: new Double(300), duration: null, type: UserTimingType.MARK)
                    ]
            )
        }

        when: "the builder is trimmed with two selectedMeasurands"
        SelectedMeasurand selectedMeasurandMatching = new SelectedMeasurand(Measurand.FULLY_LOADED_TIME.toString(), CachedView.UNCACHED)
        SelectedMeasurand selectedMeasurandNotMatching = new SelectedMeasurand("_UTMK_usertimingMK", CachedView.UNCACHED)
        List<EventResultProjection> result = new EventResultQueryBuilder()
                .withSelectedMeasurands([selectedMeasurandMatching, selectedMeasurandNotMatching])
                .withConnectivity([connectivityProfile.id], null, false)
                .withTrim(250, TrimQualifier.LOWER_THAN, MeasurandGroup.LOAD_TIMES)
                .withTrim(150, TrimQualifier.GREATER_THAN, MeasurandGroup.LOAD_TIMES)
                .getRawData()

        then: "only both matching Eventresults are found with trimmed data"
        result.size() == 2
        result.every {
            it.fullyLoadedTimeInMillisecs == 200 &&
                    !it.userTimingMK
        }
    }

    void "check trims for UserTiming Measures"() {
        given: "two matching and 20 other Eventresults"
        connectivityProfile = ConnectivityProfile.build(name: "my-name")

        10.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 200,
                    medianValue: true,
                    userTimings: [
                            UserTiming.build(name: "usertiming", duration: new Double(300), type: UserTimingType.MEASURE),
                            UserTiming.build(name: "usertimingMK", startTime: new Double(200), duration: null, type: UserTimingType.MARK)
                    ],
                    flush: true
            )
        }
        2.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 200,
                    medianValue: true,
                    userTimings: [
                            UserTiming.build(name: "usertiming", duration: new Double(200), type: UserTimingType.MEASURE),
                            UserTiming.build(name: "usertimingMK", startTime: new Double(300), duration: null, type: UserTimingType.MARK)
                    ],
                    flush: true
            )
        }
        10.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 200,
                    medianValue: true,
                    userTimings: [
                            UserTiming.build(name: "usertiming", duration: new Double(100), type: UserTimingType.MEASURE),
                            UserTiming.build(name: "usertimingMK", startTime: new Double(200), duration: null, type: UserTimingType.MARK)
                    ],
                    flush: true
            )
        }

        when: "the builder is trimmed"
        SelectedMeasurand selectedMeasurand = new SelectedMeasurand("_UTME_usertiming", CachedView.UNCACHED)
        List<EventResultProjection> result = new EventResultQueryBuilder()
                .withSelectedMeasurands([selectedMeasurand])
                .withConnectivity([connectivityProfile.id], null, false)
                .withTrim(250, TrimQualifier.LOWER_THAN, MeasurandGroup.LOAD_TIMES)
                .withTrim(150, TrimQualifier.GREATER_THAN, MeasurandGroup.LOAD_TIMES)
                .getRawData()

        then: "only both matching Eventresults are found"
        result.size() == 2
        result.every {
            it.usertiming == 200
        }
    }

    void "check if UserTimings Marks are found"() {
        given: "two matching and 10 other Eventresults"
        connectivityProfile = ConnectivityProfile.build(name: "my-name")

        10.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 200,
                    medianValue: true,
                    userTimings: [UserTiming.build(name: "mark1", startTime: new Double(200), type: UserTimingType.MARK)],
                    flush: true
            )
        }
        2.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 200,
                    medianValue: true,
                    userTimings: [UserTiming.build(name: "mark2", startTime: new Double(100), type: UserTimingType.MARK)],
                    flush: true
            )
        }

        when: "the builder is configured for marks"
        SelectedMeasurand selectedMeasurand = new SelectedMeasurand("_UTMK_mark2", CachedView.UNCACHED)
        List<EventResultProjection> result = new EventResultQueryBuilder()
                .withSelectedMeasurands([selectedMeasurand])
                .withConnectivity([connectivityProfile.id], null, false)
                .getRawData()

        then: "only both matching Eventresults are found"
        result.size() == 2
        result.every {
            it.mark2 == 100 &&
                    !it.name &&
                    !it.startTime &&
                    !it.duration &&
                    !it.type
        }
    }

    void "check if UserTimings Measures are found"() {
        given: "two matching and 10 other Eventresults"
        connectivityProfile = ConnectivityProfile.build(name: "my-name")

        10.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 200,
                    medianValue: true,
                    userTimings: [UserTiming.build(name: "mark1", duration: new Double(200), type: UserTimingType.MEASURE)],
                    flush: true
            )
        }
        2.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 200,
                    medianValue: true,
                    userTimings: [UserTiming.build(name: "mark2", duration: new Double(100), type: UserTimingType.MEASURE)],
                    flush: true
            )
        }


        when: "the builder is configured for measurands"
        SelectedMeasurand selectedMeasurand = new SelectedMeasurand("_UTME_mark2", CachedView.UNCACHED)
        List<EventResultProjection> result = new EventResultQueryBuilder()
                .withSelectedMeasurands([selectedMeasurand])
                .withConnectivity([connectivityProfile.id], null, false)
                .getRawData()

        then: "only both matching Eventresults are found"
        result.size() == 2
        result.every {
            it.mark2 == 100 &&
                    !it.name &&
                    !it.startTime &&
                    !it.duration &&
                    !it.type
        }
    }

    void "check custom connectivity"() {
        given: "two matching and 10 other Eventresults"
        String customConnectivityName = "custom connectivity"
        10.times {
            EventResult.build(fullyLoadedTimeInMillisecs: 500, medianValue: true)
        }
        2.times {
            EventResult.build(
                    connectivityProfile: null,
                    customConnectivityName: customConnectivityName,
                    fullyLoadedTimeInMillisecs: 500,
                    medianValue: true
            )
        }

        when: "the builder just has one measurand and one connectivity profile"
        SelectedMeasurand selectedMeasurand = new SelectedMeasurand("FULLY_LOADED_TIME", CachedView.UNCACHED)
        List<EventResultProjection> result = new EventResultQueryBuilder().withSelectedMeasurands([selectedMeasurand]).withConnectivity(null, [customConnectivityName], false).getRawData()

        then: "only both matching event results are found"
        result.size() == 2
        result.every {
            it.connectivityProfile == null &&
                    it.customConnectivityName == customConnectivityName
        }
    }

    void "check custom and non custom connectivity"() {
        given: "two matching and 10 other Eventresults"
        String customConnectivityName = "custom connectivity"
        connectivityProfile = ConnectivityProfile.build(name: "my-name")

        10.times {
            EventResult.build(fullyLoadedTimeInMillisecs: 500, medianValue: true)
        }
        2.times {
            EventResult.build(
                    connectivityProfile: null,
                    customConnectivityName: customConnectivityName,
                    fullyLoadedTimeInMillisecs: 500,
                    medianValue: true
            )
        }
        2.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 500,
                    medianValue: true
            )
        }

        when: "the builder just has one measurand and one connectivity profile"
        SelectedMeasurand selectedMeasurand = new SelectedMeasurand("FULLY_LOADED_TIME", CachedView.UNCACHED)
        List<EventResultProjection> result = new EventResultQueryBuilder().withSelectedMeasurands([selectedMeasurand]).withConnectivity([connectivityProfile.id], [customConnectivityName], false).getRawData()

        then: "only both matching event results are found"
        result.size() == 4
        result.every {
            it.customConnectivityName == customConnectivityName ||
                    it.connectivityProfile == connectivityProfile.name
        }
    }

    void "check custom, native and non custom connectivity"() {
        given: "two matching and 10 other Eventresults"
        String customConnectivityName = "custom connectivity"
        connectivityProfile = ConnectivityProfile.build(name: "my-name")

        10.times {
            EventResult.build(fullyLoadedTimeInMillisecs: 500, medianValue: true)
        }
        2.times {
            EventResult.build(
                    connectivityProfile: null,
                    customConnectivityName: customConnectivityName,
                    fullyLoadedTimeInMillisecs: 500,
                    medianValue: true
            )
        }
        2.times {
            EventResult.build(
                    connectivityProfile: connectivityProfile,
                    fullyLoadedTimeInMillisecs: 500,
                    medianValue: true
            )
        }
        2.times {
            EventResult.build(
                    connectivityProfile: null,
                    customConnectivityName: null,
                    fullyLoadedTimeInMillisecs: 500,
                    medianValue: true,
                    noTrafficShapingAtAll: true
            )
        }

        when: "the builder just has one measurand and one connectivity profile"
        SelectedMeasurand selectedMeasurand = new SelectedMeasurand("FULLY_LOADED_TIME", CachedView.UNCACHED)
        List<EventResultProjection> result = new EventResultQueryBuilder()
                .withSelectedMeasurands([selectedMeasurand])
                .withConnectivity([connectivityProfile.id], [customConnectivityName], true)
                .getRawData()

        then: "only both matching event results are found"
        result.size() == 6
        result.findAll { it.customConnectivityName == customConnectivityName }.size() == 2
        result.findAll { it.connectivityProfile == connectivityProfile.name }.size() == 2
        result.findAll { it.noTrafficShapingAtAll }.size() == 2
    }
}


