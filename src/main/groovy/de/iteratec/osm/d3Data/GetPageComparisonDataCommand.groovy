package de.iteratec.osm.d3Data

import grails.converters.JSON
import grails.databinding.BindUsing
import grails.validation.Validateable
import org.joda.time.DateTime

class GetPageComparisonDataCommand implements Validateable {
    DateTime from
    DateTime to
    @BindUsing({ obj, source ->
        return JSON.parse(source['selectedPageComparisons']) as List
    })
    List selectedPageComparisons
    @BindUsing({ obj, source ->
        return JSON.parse(source['measurand']).measurands[0][0].replace("Uncached", "")
    })
    String measurand

    List selectedDeviceTypes
    List selectedOperatingSystems

    String selectedAggregationValue
}
