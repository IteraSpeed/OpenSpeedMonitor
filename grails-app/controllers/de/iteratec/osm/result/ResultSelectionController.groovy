package de.iteratec.osm.result

import de.iteratec.osm.annotations.RestAction
import de.iteratec.osm.csi.Page
import de.iteratec.osm.measurement.schedule.ConnectivityProfile
import de.iteratec.osm.measurement.schedule.JobGroup
import de.iteratec.osm.util.ControllerUtils
import de.iteratec.osm.util.ExceptionHandlerController
import de.iteratec.osm.util.PerformanceLoggingService
import grails.converters.JSON
import grails.databinding.BindUsing
import org.hibernate.exception.GenericJDBCException
import org.hibernate.type.StandardBasicTypes
import org.joda.time.DateTime
import org.springframework.http.HttpStatus

import java.util.concurrent.ConcurrentHashMap

import static de.iteratec.osm.util.PerformanceLoggingService.LogLevel.DEBUG

class ResultSelectionController extends ExceptionHandlerController {
    private final static MAX_RESULT_COUNT = 50000
    private final static RESULT_COUNT_MAX_SECONDS = 1
    ResultSelectionService resultSelectionService

    PerformanceLoggingService performanceLoggingService

    enum MetaConnectivityProfileId {
        Custom("custom"), Native("native")

        MetaConnectivityProfileId(String value) {
            this.value = value
        }
        String value
    }

    enum ResultSelectionType {
        JobGroups,
        MeasuredEvents,
        Locations,
        ConnectivityProfiles,
        Results,
        Pages,
        UserTimings
    }

    def getResultCount(ResultSelectionCommand command) {
        if (command.hasErrors()) {
            sendError(command)
            return
        }
        def count = performanceLoggingService.logExecutionTime(DEBUG, "getResultCount for ${command as JSON}", 0, {
            // we select static '1' for up to MAX_RESULT_COUNT records and count them afterwards
            // counting directly is slower, as we can't easily set a limit *before* counting the rows with GORM
            try {
                return EventResult.createCriteria().list {
                    resultSelectionService.applyResultSelectionFilters(delegate, command.from, command.to, command, ResultSelectionType.Results)
                    maxResults MAX_RESULT_COUNT
                    timeout RESULT_COUNT_MAX_SECONDS
                    projections {
                        sqlProjection '1 as c', 'c', StandardBasicTypes.INTEGER
                    }
                }.size()
            } catch (GenericJDBCException ignored) {
                return -1 // on timeout
            }
        })
        def result = count < MAX_RESULT_COUNT ? count : -1
        ControllerUtils.sendResponseAsStreamWithoutModifying(response, HttpStatus.OK, result.toString())
    }

    @RestAction
    def getJobGroups(ResultSelectionCommand command) {
        if (command.hasErrors()) {
            sendError(command)
            return
        }
        def dtos = performanceLoggingService.logExecutionTime(DEBUG, "getJobGroups for ${command as JSON}", 0, {
            def jobGroups = query(command, ResultSelectionType.JobGroups, { existing ->
                if (existing) {
                    not { 'in'('jobGroup', existing) }
                }
                // On CsiAggregationDashboad return only jobGroups containing a csiConfiguration
                if (command.caller == ResultSelectionCommand.Caller.CsiAggregation) {
                    jobGroup {
                        'isNotNull'("csiConfiguration")
                    }
                }
                projections {
                    distinct('jobGroup')
                }
            })
            return jobGroups.collect {
                [
                        id  : it.id,
                        name: it.name
                ]
            }
        })
        ControllerUtils.sendObjectAsJSON(response, dtos)
    }

    @RestAction
    def getMeasuredEvents(ResultSelectionCommand command) {
        if (command.hasErrors()) {
            sendError(command)
            return
        }

        def dtos = performanceLoggingService.logExecutionTime(DEBUG, "getMeasuredEvents for ${command as JSON}", 0, {
            def measuredEvents = query(command, ResultSelectionType.MeasuredEvents, { existing ->
                if (existing) {
                    or {
                        not { 'in'('measuredEvent', existing.collect { it[0] }) }
                        not { 'in'('page', existing.collect { it[1] }) }
                    }
                }
                projections {
                    distinct('measuredEvent')
                    property('page')
                }
            })
            return measuredEvents.collect {
                [
                        id    : it[0].id,
                        name  : it[0].name,
                        parent: [id: it[1].id, name: it[1].name]
                ]
            }
        })
        ControllerUtils.sendObjectAsJSON(response, dtos)
    }

    @RestAction
    def getLocations(ResultSelectionCommand command) {
        if (command.hasErrors()) {
            sendError(command)
            return
        }

        def dtos = performanceLoggingService.logExecutionTime(DEBUG, "getLocations for ${command as JSON}", 0, {
            def locations = query(command, ResultSelectionType.Locations, { existing ->
                if (existing) {
                    or {
                        not { 'in'('location', existing.collect { it[0] }) }
                        not { 'in'('browser', existing.collect { it[1] }) }
                    }
                }
                projections {
                    distinct('location')
                    property('browser')
                }
            })
            return locations.collect {
                [
                        id    : it[0].id,
                        name  : it[0].toString(),
                        parent: [id: it[1].id, name: it[1].name]
                ]
            }
        })
        ControllerUtils.sendObjectAsJSON(response, dtos)
    }

    @RestAction
    def getUserTimings(ResultSelectionCommand command) {
        getUserOrHeroTiming(command, [UserTimingType.MARK, UserTimingType.MEASURE])
    }

    @RestAction
    def getHeroTimings(ResultSelectionCommand command) {
        getUserOrHeroTiming(command, [UserTimingType.HERO_MARK])
    }

    private def getUserOrHeroTiming(ResultSelectionCommand command, List<UserTimingType> selection) {
        if (command.hasErrors()) {
            sendError(command)
            return
        }
        def dtos = performanceLoggingService.logExecutionTime(DEBUG, "getUserOrHeroTimings for ${command as JSON}", 0, {
            def userTimings = query(command, ResultSelectionType.UserTimings, { existing ->
                projections {
                    userTimings {
                        'in'('type', selection)
                        groupProperty('name')
                        groupProperty('type')
                    }
                }
            })
            return userTimings.collect {
                SelectedMeasurand.createUserTimingOptionFor(it[0], it[1])
            }.unique { a, b -> a.id <=> b.id }
        })
        ControllerUtils.sendObjectAsJSON(response, dtos)
    }

    @RestAction
    def getConnectivityProfiles(ResultSelectionCommand command) {
        if (command.hasErrors()) {
            sendError(command)
            return
        }

        def dtos = performanceLoggingService.logExecutionTime(DEBUG, "getConnectivityProfiles all for ${command as JSON}", 0, {
            def dtos = getPredefinedConnectivityProfiles(command)
            if (command.caller == ResultSelectionCommand.Caller.EventResult) {
                dtos += getCustomConnectivity(command)
                dtos += getNativeConnectivity(command)
            }
            return dtos
        })
        ControllerUtils.sendObjectAsJSON(response, dtos)
    }

    @RestAction
    def getPages(ResultSelectionCommand command) {
        if (command.hasErrors()) {
            sendError(command)
            return
        }

        def dtos = performanceLoggingService.logExecutionTime(DEBUG, "getPages for ${command as JSON}", 0, {
            def pages = query(command, ResultSelectionType.Pages, { existing ->
                if (existing) {
                    not { 'in'('page', existing) }
                }
                projections {
                    distinct('page')
                }
            })
            return pages.collect {
                [
                        id  : it.id,
                        name: it.name
                ]
            }.sort { it.name }
        })
        ControllerUtils.sendObjectAsJSON(response, dtos)
    }

    @RestAction
    def getJobGroupToPagesMap(ResultSelectionCommand command) {
        if (command.hasErrors()) {
            println 'send error'
            sendError(command)
            return
        }
        def dtos = performanceLoggingService.logExecutionTime(DEBUG, "getJobGroupToPagesMap for ${command as JSON}", 0, {
            def jobGroupAndPages = query(command, null, { existing ->
                projections {
                    distinct(['jobGroup', 'page'])
                }
            })
            Map<Long, Map> map = [:].withDefault { [name: "", pages: [] as Set] }
            jobGroupAndPages.each {
                JobGroup jobGroup = it[0] as JobGroup
                Page page = it[1] as Page
                Map jobGroupMap = map[jobGroup.id]
                jobGroupMap.name = jobGroup.name
                jobGroupMap.pages << page
            }
            def nMap = [:].withDefault { [:] }
            map.each { k, v ->
                nMap[k].name = v.name
                nMap[k].pages = v.pages.collect { [name: it.name, id: it.id] }.sort { it.name }
            }
            return nMap as ConcurrentHashMap
        })
        ControllerUtils.sendObjectAsJSON(response, dtos)
    }

    private getPredefinedConnectivityProfiles(ResultSelectionCommand command) {
        return performanceLoggingService.logExecutionTime(DEBUG, "getConnectivityProfiles predefined for ${command as JSON}", 1, {
            def connectivityProfiles = query(command, ResultSelectionType.ConnectivityProfiles, { existing ->
                isNotNull('connectivityProfile')
                if (existing) {
                    not { 'in'('connectivityProfile', existing) }
                }
                projections {
                    distinct('connectivityProfile')
                }
            })
            return connectivityProfiles.collect {
                [
                        id  : it.id,
                        name: it.toString()
                ]
            }
        })
    }

    private getCustomConnectivity(ResultSelectionCommand command) {
        return performanceLoggingService.logExecutionTime(DEBUG, "getConnectivityProfiles custom for ${command as JSON}", 1, {
            def customProfiles = query(command, ResultSelectionType.ConnectivityProfiles, { existing ->
                isNotNull('customConnectivityName')

                if (existing) {
                    not { 'in'('customConnectivityName', existing) }
                }

                projections {
                    distinct('customConnectivityName')
                }
            })
            return customProfiles.collect {
                [
                        id  : it,
                        name: it
                ]
            }
        })
    }

    private getNativeConnectivity(ResultSelectionCommand command) {
        return performanceLoggingService.logExecutionTime(DEBUG, "getConnectivityProfiles native for ${command as JSON}", 1, {
            def nativeConnectivity = query(command, ResultSelectionType.ConnectivityProfiles, {
                eq('noTrafficShapingAtAll', true)
                maxResults 1
                projections {
                    distinct('noTrafficShapingAtAll')
                }
            })
            return nativeConnectivity ? [[id: MetaConnectivityProfileId.Native.value, name: MetaConnectivityProfileId.Native.value]] : []
        })
    }

    private def sendError(ResultSelectionCommand command) {
        ControllerUtils.sendSimpleResponseAsStream(response, HttpStatus.BAD_REQUEST,
                "Invalid parameters: " + command.getErrors().fieldErrors.collect { it.field }.join(", "))
    }

    private def query(ResultSelectionCommand command, ResultSelectionType type, Closure projection) {
        return resultSelectionService.query(command, type, projection)
    }

}

class ResultSelectionCommand {
    enum Caller {
        CsiAggregation,
        EventResult
    }

    DateTime from
    DateTime to
    List<Long> jobGroupIds = []
    List<Long> pageIds = []
    List<Long> measuredEventIds = []
    List<Long> browserIds = []
    List<Long> locationIds = []
    List<String> selectedConnectivities = []
    @BindUsing({ object, source ->
        // set default to EventResult
        source['caller'] ?: Caller.EventResult
    })
    Caller caller

    static constraints = {
        from(blank: false, nullable: false)
        to(blank: false, nullable: false, validator: { val, obj ->
            if (!val.isAfter(obj.from)) {
                return ['datePriorTo', val.toString(), obj.from.toString()]
            }
        })
        caller(nullable: true)
        nativeConnectivity(blank: true, nullable: true)
    }

    /**
     * Whether or not EventResults measured with native connectivity should get included.
     */
    boolean getNativeConnectivity() {
        return selectedConnectivities?.contains(ResultSelectionController.MetaConnectivityProfileId.Native.value)
    }

    /**
     * returns the selected customConnectivityNames by filtering all selected connectivities.
     */
    Collection<String> getCustomConnectivities() {
        return selectedConnectivities ? selectedConnectivities.findAll {
            (!it.isLong() && it != ResultSelectionController.MetaConnectivityProfileId.Native.value) || (it.isLong() && !ConnectivityProfile.exists(it as Long))
        } : []
    }

    /**
     * returns the selected connectivityProfiles by filtering all selected connectivities.
     */
    Collection<Long> getConnectivityIds() {
        return selectedConnectivities ? selectedConnectivities.findAll {
            it.isLong() && ConnectivityProfile.exists(it as Long)
        }.collect {
            Long.parseLong(it)
        } : []
    }
}
