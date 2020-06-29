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
import de.iteratec.osm.util.ControllerUtils
import org.springframework.http.HttpStatus
import org.springframework.web.servlet.support.RequestContextUtils

/**
 * EventController
 * A controller class handles incoming web requests and performs actions such as redirects, rendering views and so on.
 */
class EventController {

    static allowedMethods = [save: "POST", update: "PUT", delete: "DELETE"]

    EventService eventService

    def index() {
    }

    def list() {
        redirect(action: "index", params: params)
    }

    def create() {
        [eventInstance: new Event(params)]
    }

    def save() {
        combineDateAndTime(params)
        eventService.saveEvent(params) {
            action.success = { Event eventInstance ->
                flash.message = message(code: 'default.created.message', args: [message(code: 'event.label', default: 'Event'), eventInstance.id])
                redirect(action: "show", id: eventInstance.id)
            }
            action.failure = { Event eventInstance ->
                render(view: "create", model: [eventInstance: eventInstance])
            }
        }

    }

    def show() {
        def eventInstance = Event.get(params.id)
        if (!eventInstance) {
            flash.message = message(code: 'default.not.found.message', args: [message(code: 'event.label', default: 'Event'), params.id])
            redirect(action: "list")
            return
        }
        [eventInstance: eventInstance]
    }

    def edit() {
        def eventInstance = Event.get(params.id)
        if (!eventInstance) {
            flash.message = message(code: 'default.not.found.message', args: [message(code: 'event.label', default: 'Event'), params.id])
            redirect(action: "list")
            return
        }

        [eventInstance: eventInstance]
    }

    def update() {
        println("Update")
        def eventInstance = Event.get(params.id)
        if (!eventInstance) {
            flash.message = message(code: 'default.not.found.message', args: [message(code: 'event.label', default: 'Event'), params.id])
            redirect(action: "list")
            return
        }

        eventInstance.jobGroups.clear()
        combineDateAndTime(params)

        eventService.updateEvent(eventInstance, params.clone()) {
            action.success = {
                flash.message = message(code: 'default.updated.message', args: [message(code: 'event.label', default: 'Event'), eventInstance.id])
                redirect(action: "show", id: eventInstance.id)
            }
            action.failure = {
                render(view: "edit", model: [eventInstance: eventInstance])
            }
        }
    }

    def delete() {
        def eventInstance = Event.get(params.id)
        if (!eventInstance) {
            flash.message = message(code: 'default.not.found.message', args: [message(code: 'event.label', default: 'Event'), params.id])
            redirect(action: "list")
            return
        }

        eventService.deleteEvent(eventInstance) {
            action.success = {
                flash.message = message(code: 'default.deleted.message', args: [message(code: 'event.label', default: 'Event'), params.id])
                redirect(action: "list")
            }
            action.failure = { exception ->
                flash.message = message(code: 'default.not.deleted.message', args: [message(code: 'event.label', default: 'Event'), params.id])
                redirect(action: "show", id: params.id)
            }
        }
    }

    def getEvents(GetEventsCommand cmd) {
        if (cmd.hasErrors()) {
            ControllerUtils.sendSimpleResponseAsStream(response, HttpStatus.BAD_REQUEST,
                "Invalid parameters: " + cmd.getErrors().fieldErrors.collect { it.field }.join(", "))

            return
        }

        List<EventDTO> eventList = eventService.getEventsByDateRangeAndJobGroups(cmd)
        ControllerUtils.sendObjectAsJSON(response, eventList)
    }

    /**
     * Combines time and date within the param list, where time ist 'time' and date is 'eventDate'
     * @param params
     */
    private def combineDateAndTime(def params) {
        //Convert english date format to german, for passing validation
        //The gsp passes the time and the date separately so we need to combine these two
        if(params['eventDate'] && params['time']) {
            params['eventDate'] = params['eventDate'] + " " + params['time']
            def formatter
            params.remove('time')
            def locale = RequestContextUtils.getLocale(request)
            switch (locale) {
                case Locale.GERMANY:
                case Locale.GERMAN:
                    formatter = "dd.MM.yyyy HH:mm"
                    break;
                default:
                    formatter = "yyyy-MM-dd HH:mm"
            }
            return params['eventDate'] = Date.parse(formatter, params['eventDate'] as String)
        } else {
            return false
        }
    }

    def updateTable(){
        params.order = params.order ? params.order : "asc"
        params.sort = params.sort ? params.sort : "eventDate"
        params.max = params.max as Integer
        params.offset = params.offset as Integer
        List<Event> result = Event.createCriteria().list(params) {
            if(params.filter)
                or{
                    ilike("shortName","%"+params.filter+"%")
                    ilike("description","%"+params.filter+"%")
                }
        }
        String templateAsPlainText = g.render(
                template: 'eventTable',
                model: [events: result]
        )
        ControllerUtils.sendObjectAsJSON(response, [
                table: templateAsPlainText,
                count: result.totalCount
        ])
    }
}
