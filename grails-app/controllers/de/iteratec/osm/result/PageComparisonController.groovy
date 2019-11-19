package de.iteratec.osm.result

import de.iteratec.osm.OsmConfigCacheService
import de.iteratec.osm.annotations.RestAction
import de.iteratec.osm.barchart.BarchartAggregation
import de.iteratec.osm.barchart.BarchartAggregationService
import de.iteratec.osm.barchart.PageComparisonAggregation
import de.iteratec.osm.csi.Page
import de.iteratec.osm.d3Data.GetPageComparisonDataCommand
import de.iteratec.osm.barchart.BarchartDTO
import de.iteratec.osm.barchart.BarchartDatum
import de.iteratec.osm.barchart.BarchartSeries
import de.iteratec.osm.measurement.schedule.JobGroup
import de.iteratec.osm.util.ControllerUtils
import de.iteratec.osm.util.ExceptionHandlerController
import de.iteratec.osm.util.I18nService

class PageComparisonController extends ExceptionHandlerController {

    public final static String DATE_FORMAT_STRING_FOR_HIGH_CHART = 'dd.mm.yyyy'
    public final static int MONDAY_WEEKSTART = 1

    I18nService i18nService
    OsmConfigCacheService osmConfigCacheService
    BarchartAggregationService barchartAggregationService

    def index() { redirect(action: 'show') }

    def show() {
        Map<String, Object> modelToRender = [:]

        modelToRender.put("pages", Page.list().collectEntries { [it.id, it.name] })
        modelToRender.put("jobGroups", JobGroup.list().collectEntries { [it.id, it.name] })

        modelToRender.put("aggrGroupValuesUnCached", SelectedMeasurand.createDataMapForOptGroupSelect())
        modelToRender.put("selectedAggrGroupValuesUnCached", [])

        // JavaScript-Utility-Stuff:
        modelToRender.put("dateFormat", DATE_FORMAT_STRING_FOR_HIGH_CHART)
        modelToRender.put("weekStart", MONDAY_WEEKSTART)

        return modelToRender
    }

    @RestAction
    def getBarchartData(GetPageComparisonDataCommand cmd) {
        ArrayList<PageComparisonAggregation> aggregations = barchartAggregationService.getBarChartAggregationsFor(cmd)

        if (!aggregations || aggregations.every { !it.baseAggregation.value && !it.comperativeAggregation.value}) {
            ControllerUtils.sendObjectAsJSON(response, [:])
        }

        BarchartDTO dto = new BarchartDTO()
        dto.i18nMap.put("measurand", i18nService.msg("de.iteratec.result.measurand.label", "Measurand"))
        dto.i18nMap.put("jobGroup", i18nService.msg("de.iteratec.isr.wptrd.labels.filterFolder", "JobGroup"))
        dto.i18nMap.put("page", i18nService.msg("de.iteratec.isr.wptrd.labels.filterPage", "Page"))
        dto.series = aggregations.collect {createSeriesFor(it)}

        ControllerUtils.sendObjectAsJSON(response, dto)
    }

    private BarchartSeries createSeriesFor(PageComparisonAggregation aggregation) {
        BarchartDatum baseSeries = mapToSeriesFor(aggregation.baseAggregation)
        BarchartDatum comparativeSeries = mapToSeriesFor(aggregation.comperativeAggregation)
        return new BarchartSeries(
                stacked: false,
                dimensionalUnit: aggregation.baseAggregation.unit,
                data: [baseSeries, comparativeSeries]
        )
    }

    private BarchartDatum mapToSeriesFor(BarchartAggregation aggregation) {
        return new BarchartDatum(
                measurand: i18nService.msg("de.iteratec.isr.measurand.${aggregation.measurandName}", aggregation.measurandName),
                value: aggregation.value,
                aggregationValue: aggregation.aggregationValue,
                grouping: "${aggregation.jobGroup.name} | ${aggregation.page.name}")
    }
}
