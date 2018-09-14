package de.iteratec.osm.result.dao

import de.iteratec.osm.csi.NonTransactionalIntegrationSpec
import de.iteratec.osm.csi.Page
import de.iteratec.osm.measurement.schedule.JobGroup
import de.iteratec.osm.result.*
import de.iteratec.osm.result.dao.query.TrimQualifier
import grails.gorm.transactions.Rollback
import grails.testing.mixin.integration.Integration

@Integration(applicationClass = openspeedmonitor.Application.class)
@Rollback
class EventResultQueryBuilderAverageIntegrationSpec extends NonTransactionalIntegrationSpec {

    JobGroup jobGroup1, jobGroup2, jobGroup3
    Page page1, page2, page3

    void "check average for measurands with page"() {
        given: "three matching and two other Eventresults"
        page1 = Page.build()
        jobGroup1 = JobGroup.build()
        jobGroup2 = JobGroup.build()
        jobGroup3 = JobGroup.build()

        EventResult.build(
                page: page1,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 100,
                medianValue: true,
        )
        EventResult.build(
                page: page1,
                jobGroup: jobGroup2,
                fullyLoadedTimeInMillisecs: 200,
                medianValue: true,
        )
        EventResult.build(
                page: page1,
                jobGroup: jobGroup3,
                fullyLoadedTimeInMillisecs: 600,
                medianValue: true,
        )

        2.times {
            EventResult.build(
                    fullyLoadedTimeInMillisecs: 500,
                    medianValue: true,
            )
        }

        when: "the builder is configured for measurand and page"
        SelectedMeasurand selectedMeasurand = new SelectedMeasurand("FULLY_LOADED_TIME", CachedView.UNCACHED)
        def result = new EventResultQueryBuilder(0, 1000)
                .withPageIdsIn([page1.id])
                .withSelectedMeasurands([selectedMeasurand])
                .getAverageData()

        then: "only one aggregation is returned"
        result.size() == 1
        result.every {
            it.fullyLoadedTimeInMillisecs == 300 &&
                    it.pageId == page1.id
        }
    }

    void "check average for userTimings with page"() {
        given: "three matching and two other Eventresults"
        page1 = Page.build()
        jobGroup1 = JobGroup.build()
        jobGroup2 = JobGroup.build()
        jobGroup3 = JobGroup.build()

        EventResult.build(
                page: page1,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 500,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(100), type: UserTimingType.MEASURE)],
                flush: true
        )
        EventResult.build(
                page: page1,
                jobGroup: jobGroup2,
                fullyLoadedTimeInMillisecs: 500,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(200), type: UserTimingType.MEASURE)],
                flush: true
        )
        EventResult.build(
                page: page1,
                jobGroup: jobGroup3,
                fullyLoadedTimeInMillisecs: 500,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(600), type: UserTimingType.MEASURE)],
                flush: true
        )
        2.times {
            EventResult.build(
                    fullyLoadedTimeInMillisecs: 500,
                    medianValue: true,
                    userTimings: [UserTiming.build(name: "mark1", duration: new Double(500), type: UserTimingType.MEASURE)],
                    flush: true
            )
        }

        when: "the builder is configured for usertiming and page"
        SelectedMeasurand selectedMeasurand = new SelectedMeasurand("_UTME_mark1", CachedView.UNCACHED)
        def result = new EventResultQueryBuilder(0, 1000)
                .withPageIdsIn([page1.id])
                .withSelectedMeasurands([selectedMeasurand])
                .getAverageData()

        then: "only one aggregation is returned"
        result.size() == 1
        result.every {
            it.mark1 == 300 &&
                    it.pageId == page1.id
        }
    }

    void "check average for measurands and userTimings with page"() {
        given: "three matching and two other Eventresults"
        page1 = Page.build()
        jobGroup1 = JobGroup.build()
        jobGroup2 = JobGroup.build()
        jobGroup3 = JobGroup.build()

        EventResult.build(
                page: page1,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 100,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(100), type: UserTimingType.MEASURE)],
                flush: true
        )
        EventResult.build(
                page: page1,
                jobGroup: jobGroup2,
                fullyLoadedTimeInMillisecs: 200,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(200), type: UserTimingType.MEASURE)],
                flush: true
        )
        EventResult.build(
                page: page1,
                jobGroup: jobGroup3,
                fullyLoadedTimeInMillisecs: 600,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(600), type: UserTimingType.MEASURE)],
                flush: true
        )
        2.times {
            EventResult.build(
                    fullyLoadedTimeInMillisecs: 500,
                    medianValue: true,
                    userTimings: [UserTiming.build(name: "mark1", duration: new Double(500), type: UserTimingType.MEASURE)],
                    flush: true
            )
        }

        when: "the builder is configured for usertiming and measurand with page"
        SelectedMeasurand selectedMeasurand1 = new SelectedMeasurand("_UTME_mark1", CachedView.UNCACHED)
        SelectedMeasurand selectedMeasurand2 = new SelectedMeasurand("FULLY_LOADED_TIME", CachedView.UNCACHED)
        def result = new EventResultQueryBuilder(0, 1000)
                .withPageIdsIn([page1.id])
                .withSelectedMeasurands([selectedMeasurand1, selectedMeasurand2])
                .getAverageData()

        then: "only one aggregation is returned"
        result.size() == 1
        result.every {
            it.mark1 == 300 &&
                    it.fullyLoadedTimeInMillisecs == 300 &&
                    it.pageId == page1.id
        }
    }

    void "check average for measurands with jobGroup"() {
        given: "three matching and two other Eventresults"
        page1 = Page.build()
        page2 = Page.build()
        page3 = Page.build()
        jobGroup1 = JobGroup.build()

        EventResult.build(
                page: page1,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 100,
                medianValue: true,
        )
        EventResult.build(
                page: page2,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 200,
                medianValue: true,
        )
        EventResult.build(
                page: page3,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 600,
                medianValue: true,
        )
        2.times {
            EventResult.build(
                    fullyLoadedTimeInMillisecs: 500,
                    medianValue: true,
            )
        }

        when: "the builder is configured for measurand and jobGroup"
        SelectedMeasurand selectedMeasurand = new SelectedMeasurand("FULLY_LOADED_TIME", CachedView.UNCACHED)
        def result = new EventResultQueryBuilder(0, 1000)
                .withJobGroupIdsIn([jobGroup1.id])
                .withSelectedMeasurands([selectedMeasurand])
                .getAverageData()

        then: "only one aggregation is returned"
        result.size() == 1
        result.every {
            it.fullyLoadedTimeInMillisecs == 300 &&
                    it.jobGroupId == jobGroup1.id
        }
    }

    void "excluding pages in measurand average calculation for jobGroup"() {
        given: "two EventResults with valid and some with excluded page"
        page1 = Page.build()
        page2 = Page.build()
        page3 = Page.build()
        jobGroup1 = JobGroup.build()

        EventResult.build(
                page: page1,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 100,
                medianValue: true,
        )
        EventResult.build(
                page: page2,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 200,
                medianValue: true,
        )
        2.times {
            EventResult.build(
                    page: page3,
                    jobGroup: jobGroup1,
                    fullyLoadedTimeInMillisecs: 500,
                    medianValue: true,
            )
        }

        when: "the builder is configured for measurand and jobGroup and excludes a page"
        SelectedMeasurand selectedMeasurand = new SelectedMeasurand("FULLY_LOADED_TIME", CachedView.UNCACHED)
        def result = new EventResultQueryBuilder(0, 1000)
                .withJobGroupIdsIn([jobGroup1.id])
                .withSelectedMeasurands([selectedMeasurand])
                .withoutPagesIn([page3])
                .getAverageData()

        then: "the result with excluded page is not included in average"
        result.size() == 1
        result.every {
            it.fullyLoadedTimeInMillisecs == (100+200) / 2 &&
                    it.jobGroupId == jobGroup1.id
        }
    }

    void "check average for userTimings with jobGroup"() {
        given: "three matching and two other Eventresults"
        page1 = Page.build()
        page2 = Page.build()
        page3 = Page.build()
        jobGroup1 = JobGroup.build()

        EventResult.build(
                page: page1,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 500,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(100), type: UserTimingType.MEASURE)],
                flush: true
        )
        EventResult.build(
                page: page2,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 500,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(200), type: UserTimingType.MEASURE)],
                flush: true
        )

        EventResult.build(
                page: page3,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 500,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(600), type: UserTimingType.MEASURE)],
                flush: true
        )
        2.times {
            EventResult.build(
                    fullyLoadedTimeInMillisecs: 500,
                    medianValue: true,
                    userTimings: [UserTiming.build(name: "mark1", duration: new Double(500), type: UserTimingType.MEASURE)],
                    flush: true
            )
        }

        when: "the builder is configured for usertiming and jobGroup"
        SelectedMeasurand selectedMeasurand = new SelectedMeasurand("_UTME_mark1", CachedView.UNCACHED)
        def result = new EventResultQueryBuilder(0, 1000)
                .withJobGroupIdsIn([jobGroup1.id])
                .withPageIdsIn([])
                .withSelectedMeasurands([selectedMeasurand])
                .getAverageData()

        then: "only one aggregation is returned"
        result.size() == 1
        result.every {
            it.mark1 == 300 &&
                    it.jobGroupId == jobGroup1.id
        }
    }

    void "excluding pages in userTiming average calculation for jobGroup"() {
        given: "two EventResults with valid and some with excluded page"
        page1 = Page.build()
        page2 = Page.build()
        page3 = Page.build()
        jobGroup1 = JobGroup.build()

        EventResult.build(
                page: page1,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 500,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(100), type: UserTimingType.MEASURE)],
                flush: true
        )
        EventResult.build(
                page: page2,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 500,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(200), type: UserTimingType.MEASURE)],
                flush: true
        )

        2.times {
            EventResult.build(
                    page: page3,
                    jobGroup: jobGroup1,
                    fullyLoadedTimeInMillisecs: 500,
                    medianValue: true,
                    userTimings: [UserTiming.build(name: "mark1", duration: new Double(800), type: UserTimingType.MEASURE)],
                    flush: true
            )
        }

        when: "the builder is configured for measurand and jobGroup and excludes a page"
        SelectedMeasurand selectedMeasurand = new SelectedMeasurand("_UTME_mark1", CachedView.UNCACHED)
        def result = new EventResultQueryBuilder(0, 1000)
                .withJobGroupIdsIn([jobGroup1.id])
                .withoutPagesIn([page3])
                .withSelectedMeasurands([selectedMeasurand])
                .getAverageData()

        then: "the result with excluded page is not included in average"
        result.size() == 1
        result.every {
            it.mark1 == (100 + 200) / 2 &&
                    it.jobGroupId == jobGroup1.id
        }
    }

    void "check average for measurands and userTimings with jobGroup"() {
        given: "three matching and two other Eventresults"
        page1 = Page.build()
        page2 = Page.build()
        page3 = Page.build()
        jobGroup1 = JobGroup.build()

        EventResult.build(
                page: page1,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 100,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(100), type: UserTimingType.MEASURE)],
                flush: true
        )
        EventResult.build(
                page: page2,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 200,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(200), type: UserTimingType.MEASURE)],
                flush: true
        )
        EventResult.build(
                page: page3,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 600,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(600), type: UserTimingType.MEASURE)],
                flush: true
        )
        2.times {
            EventResult.build(
                    fullyLoadedTimeInMillisecs: 500,
                    medianValue: true,
                    userTimings: [UserTiming.build(name: "mark1", duration: new Double(500), type: UserTimingType.MEASURE)],
                    flush: true
            )
        }

        when: "the builder is configured for usertiming and measurand with jobGroup"
        SelectedMeasurand selectedMeasurand1 = new SelectedMeasurand("_UTME_mark1", CachedView.UNCACHED)
        SelectedMeasurand selectedMeasurand2 = new SelectedMeasurand("FULLY_LOADED_TIME", CachedView.UNCACHED)
        def result = new EventResultQueryBuilder(0, 1000)
                .withJobGroupIdsIn([jobGroup1.id])
                .withSelectedMeasurands([selectedMeasurand1, selectedMeasurand2])
                .getAverageData()

        then: "only one aggregation is returned"
        result.size() == 1
        result.every {
            it.mark1 == 300 &&
                    it.fullyLoadedTimeInMillisecs == 300 &&
                    it.jobGroupId == jobGroup1.id
        }
    }

    void "excluding pages in average calculation for jobGroup"() {
        given: "two EventResults with valid and some with excluded page"
        page1 = Page.build()
        page2 = Page.build()
        page3 = Page.build()
        jobGroup1 = JobGroup.build()

        EventResult.build(
                page: page1,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 100,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(100), type: UserTimingType.MEASURE)],
                flush: true
        )
        EventResult.build(
                page: page2,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 200,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(200), type: UserTimingType.MEASURE)],
                flush: true
        )
        2.times {
            EventResult.build(
                    page: page3,
                    jobGroup: jobGroup1,
                    fullyLoadedTimeInMillisecs: 600,
                    medianValue: true,
                    userTimings: [UserTiming.build(name: "mark1", duration: new Double(600), type: UserTimingType.MEASURE)],
                    flush: true
            )
        }

        when: "the builder is configured for measurand and userTimings and jobGroup and excludes a page"
        SelectedMeasurand selectedMeasurand1 = new SelectedMeasurand("_UTME_mark1", CachedView.UNCACHED)
        SelectedMeasurand selectedMeasurand2 = new SelectedMeasurand("FULLY_LOADED_TIME", CachedView.UNCACHED)
        def result = new EventResultQueryBuilder(0, 1000)
                .withJobGroupIdsIn([jobGroup1.id])
                .withSelectedMeasurands([selectedMeasurand1, selectedMeasurand2])
                .withoutPagesIn([page3])
                .getAverageData()

        then: "the result with excluded page is not included in averages"
        result.size() == 1
        result.every {
            it.mark1 == (100 + 200) / 2 &&
                    it.fullyLoadedTimeInMillisecs == (100 + 200) / 2 &&
                    it.jobGroupId == jobGroup1.id
        }
    }

    void "check average for measurand and usertiming with page and jobGroup"() {
        given: "three matching and two other Eventresults"
        page1 = Page.build()
        jobGroup1 = JobGroup.build()

        EventResult.build(
                page: page1,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 100,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(100), type: UserTimingType.MEASURE)],
                flush: true
        )
        EventResult.build(
                page: page1,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 200,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(200), type: UserTimingType.MEASURE)],
                flush: true
        )
        EventResult.build(
                page: page1,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 600,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(600), type: UserTimingType.MEASURE)],
                flush: true
        )
        2.times {
            EventResult.build(
                    fullyLoadedTimeInMillisecs: 500,
                    medianValue: true,
                    userTimings: [UserTiming.build(name: "mark1", duration: new Double(500), type: UserTimingType.MEASURE)],
                    flush: true
            )
        }

        when: "the builder is configured for usertiming and measurand with page and jobGroup"
        SelectedMeasurand selectedMeasurand1 = new SelectedMeasurand("_UTME_mark1", CachedView.UNCACHED)
        SelectedMeasurand selectedMeasurand2 = new SelectedMeasurand("FULLY_LOADED_TIME", CachedView.UNCACHED)
        def result = new EventResultQueryBuilder(0, 1000)
                .withPageIdsIn([page1.id])
                .withJobGroupIdsIn([jobGroup1.id])
                .withSelectedMeasurands([selectedMeasurand1, selectedMeasurand2])
                .getAverageData()

        then: "only one aggregation is returned"
        result.size() == 1
        result.every {
            it.mark1 == 300 &&
                    it.fullyLoadedTimeInMillisecs == 300 &&
                    it.jobGroupId == jobGroup1.id &&
                    it.pageId == page1.id
        }
    }

    void "check average for measurand and usertiming with page and jobGroup without aggregation"() {
        given: "nine different but matching Eventresults"
        page1 = Page.build()
        page2 = Page.build()
        page3 = Page.build()
        jobGroup1 = JobGroup.build()
        jobGroup2 = JobGroup.build()
        jobGroup3 = JobGroup.build()

        EventResult.build(
                page: page1,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 100,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(100), type: UserTimingType.MEASURE)]
        )
        EventResult.build(
                page: page1,
                jobGroup: jobGroup2,
                fullyLoadedTimeInMillisecs: 200,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(200), type: UserTimingType.MEASURE)]
        )
        EventResult.build(
                page: page1,
                jobGroup: jobGroup3,
                fullyLoadedTimeInMillisecs: 300,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(300), type: UserTimingType.MEASURE)]
        )

        EventResult.build(
                page: page2,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 100,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(100), type: UserTimingType.MEASURE)]
        )
        EventResult.build(
                page: page2,
                jobGroup: jobGroup2,
                fullyLoadedTimeInMillisecs: 200,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(200), type: UserTimingType.MEASURE)]
        )
        EventResult.build(
                page: page2,
                jobGroup: jobGroup3,
                fullyLoadedTimeInMillisecs: 300,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(300), type: UserTimingType.MEASURE)]
        )

        EventResult.build(
                page: page3,
                jobGroup: jobGroup1,
                fullyLoadedTimeInMillisecs: 100,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(100), type: UserTimingType.MEASURE)]
        )
        EventResult.build(
                page: page3,
                jobGroup: jobGroup2,
                fullyLoadedTimeInMillisecs: 200,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(200), type: UserTimingType.MEASURE)]
        )
        EventResult.build(
                page: page3,
                jobGroup: jobGroup3,
                fullyLoadedTimeInMillisecs: 300,
                medianValue: true,
                userTimings: [UserTiming.build(name: "mark1", duration: new Double(300), type: UserTimingType.MEASURE)]
        )

        when: "the builder is configured for usertiming and measurand with all pages and jobGroups"
        SelectedMeasurand selectedMeasurand1 = new SelectedMeasurand("_UTME_mark1", CachedView.UNCACHED)
        SelectedMeasurand selectedMeasurand2 = new SelectedMeasurand("FULLY_LOADED_TIME", CachedView.UNCACHED)
        def result = new EventResultQueryBuilder(0, 1000)
                .withPageIdsIn([page1.id, page2.id, page3.id])
                .withJobGroupIdsIn([jobGroup1.id, jobGroup2.id, jobGroup3.id])
                .withSelectedMeasurands([selectedMeasurand1, selectedMeasurand2])
                .getAverageData()

        then: "nine aggregations are returned"
        result.size() == 9
    }

    void "check impossible trims"() {
        given: "one Eventresult"
        EventResult.build(
                fullyLoadedTimeInMillisecs: 600,
                firstByteInMillisecs: 600,
                medianValue: true,
                userTimings: [
                        UserTiming.build(name: "usertimingME", duration: new Double(600), type: UserTimingType.MEASURE),
                        UserTiming.build(name: "usertimingMK", startTime: new Double(600), duration: null, type: UserTimingType.MARK)
                ]
        )

        when: "the builder is trimmed with two selectedMeasurands"
        SelectedMeasurand selectedMeasurand1 = new SelectedMeasurand(Measurand.FULLY_LOADED_TIME.toString(), CachedView.UNCACHED)
        SelectedMeasurand selectedMeasurand2 = new SelectedMeasurand("_UTMK_usertimingMK", CachedView.UNCACHED)
        List<EventResultProjection> result = new EventResultQueryBuilder(0, 500)
                .withSelectedMeasurands([selectedMeasurand1, selectedMeasurand2])
                .withTrim(700, TrimQualifier.LOWER_THAN, MeasurandGroup.LOAD_TIMES)
                .withTrim(500, TrimQualifier.GREATER_THAN, MeasurandGroup.LOAD_TIMES)
                .getAverageData()

        then: "nothing is found"
        result.size() == 0
    }
}
