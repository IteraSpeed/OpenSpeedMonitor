package de.iteratec.osm.result.dto

import groovy.transform.EqualsAndHashCode

@EqualsAndHashCode
class PageAggregationChartSeriesDTO {
    String measurand = ""
    String measurandLabel = ""
    String measurandGroup = ""
    Double value = null
    Double valueComparative = null
    String page = ""
    String jobGroup = ""
    String unit = ""
    String browser = ""
    String aggregationValue = ""
}