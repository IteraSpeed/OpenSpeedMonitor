/*
* OpenSpeedMonitor (OSM)
* Copyright 2014 iteratec GmbH
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* 	http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

package de.iteratec.osm.report.chart

import de.iteratec.osm.report.chart.events.EventDTO

import de.iteratec.osm.report.chart.events.GetEventsCommand
import grails.gorm.transactions.Transactional
import org.hibernate.sql.JoinType
import org.springframework.dao.DataIntegrityViolationException

/**
 * EventService
 * A service class encapsulates the core business logic of a Grails application
 */
@Transactional
class EventService {


    /**
     * Deletes an Event, if this action will be successful action.success will be called,
     * if something went wrong action.failure will be called
     * @param event Event to delete
     * @param closure Closure which can redefine action.success and action.failure(Exception)
     */
    def deleteEvent(Event event, Closure closure) {
        def delegateMap = createAndApplyDelegateMap(closure)
        try {
            event.delete(flush: true)
            delegateMap.action.success.call()
        } catch (DataIntegrityViolationException e) {
            delegateMap.action.failure.call(e)
        }
    }

    /**
     * Updates an Event with the parameter map. All values within the map without a relation to the Event class will be ignored.
     * If this action will be successful action.success will be called,
     * if something went wrong action.failure will be called
     *
     * @param eventInstance Event to update
     * @param params Whole parameter map to update the Event
     * @param closure Closure which can redefine action.success() and action.failure()
     */
    def updateEvent(Event eventInstance, def params, Closure closure) {
        def delegateMap = createAndApplyDelegateMap(closure)
        if (params.version) {
            def version = params.version.toLong()
            if (eventInstance.version > version) {
                eventInstance.errors.rejectValue("version", "default.optimistic.locking.failure",
                        [message(code: 'event.label', default: 'Event')],
                        "Another user has updated this Event while you were editing")
                delegateMap.action.failure.call()
                return
            }
        }
        eventInstance.properties = params

        if (!eventInstance.save(flush: true)) {
            delegateMap.action.failure.call()
            return
        }
        delegateMap.action.success.call()
    }

    /**
     * Creates and saves an Event.
     * If this action will be successful action.success will be called,
     * if something went wrong action.failure will be called.
     * Both methods will receive the created Event as parameter
     *
     * @param params Whole parameter map to describe the Event
     * @param closure Closure which can redefine action.success(Event) and action.failure(Event)
     */
    def saveEvent(def params, Closure closure) {
        def delegateMap = createAndApplyDelegateMap(closure)
        def eventInstance = new Event(params)
        if (!eventInstance.save(flush: true)) {
            delegateMap.action.failure.call(eventInstance)
            return
        }
        delegateMap.action.success.call(eventInstance)
    }

    List<EventDTO> getEventsByDateRangeAndJobGroups(GetEventsCommand cmd) {
        Date from = cmd.from.toDate()
        Date to = cmd.to.toDate()
        List<Long> jobGroupIds = cmd.jobGroups.collect { it.toLong() }
        def allEvents = retrieveEventsByDateRangeAndVisibilityAndJobGroup(from, to, jobGroupIds)

        List<EventDTO> eventList = new ArrayList<>()
        allEvents.forEach { event ->
            EventDTO eventDTO = new EventDTO()
            eventDTO.id = event.id
            eventDTO.eventDate = event.eventDate
            eventDTO.shortName = event.shortName
            eventDTO.description = event.description

            eventList.add(eventDTO)
        }

        return eventList
    }

    List findAllEventsBetweenDate(Date resetFromDate, Date resetToDate){
        Event.findAllByEventDateBetween(resetFromDate, resetToDate)
    }

    List retrieveEventsByDateRangeAndVisibilityAndJobGroup(Date resetFromDate, Date resetToDate, Collection<Long> selectedFolder){
        List result = Event.createCriteria().list {
            createAlias('jobGroups', 'jobGroupsAlias', JoinType.LEFT_OUTER_JOIN)
            and {
                between('eventDate', resetFromDate, resetToDate)
                or {
                    eq('globallyVisible', true)
                    inList('jobGroupsAlias.id', selectedFolder)
                }
            }
        }
        return result;
    }

    /**
     * Creates a delegate object and applies it to the given closure. The map only contains a 'action' list
     *
     * @param closure Closure to receive the delegate object
     * @return Delegate Map
     */
    private static Object createAndApplyDelegateMap(Closure closure) {
        def delegateMap = [action: [:]]
        closure.delegate = delegateMap
        closure.call()
    }

}
