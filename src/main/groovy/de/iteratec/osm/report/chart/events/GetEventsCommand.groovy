package de.iteratec.osm.report.chart.events

import grails.databinding.BindUsing
import grails.validation.Validateable
import groovy.json.JsonSlurper
import org.joda.time.DateTime

class GetEventsCommand implements Validateable {
    DateTime from
    DateTime to

    @BindUsing({ obj, source ->
        return new JsonSlurper().parseText(source['jobGroups'])
    })
    List<Long> jobGroups = []

    static constraints = {
        from(nullable: false)
        to(nullable: false)
        jobGroups(nullable: false, validator: { List<Long> jobGroups, GetEventsCommand cmd ->
            if (jobGroups.isEmpty()) {
                return false
            }
        })
    }

}
