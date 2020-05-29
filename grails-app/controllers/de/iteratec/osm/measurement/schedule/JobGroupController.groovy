package de.iteratec.osm.measurement.schedule

import de.iteratec.osm.annotations.RestAction
import de.iteratec.osm.csi.CsiConfiguration
import de.iteratec.osm.csi.Page
import de.iteratec.osm.csi.transformation.DefaultTimeToCsMappingService
import de.iteratec.osm.csi.transformation.TimeToCsMappingService
import de.iteratec.osm.d3Data.*
import de.iteratec.osm.measurement.environment.Browser
import de.iteratec.osm.report.external.GraphiteServer
import de.iteratec.osm.result.ResultSelectionCommand
import de.iteratec.osm.result.ResultSelectionService
import de.iteratec.osm.util.ControllerUtils
import de.iteratec.osm.util.I18nService
import de.iteratec.osm.util.PerformanceLoggingService
import de.iteratec.osm.util.PerformanceLoggingService.IndentationDepth
import grails.converters.JSON
import org.hibernate.sql.JoinType
import org.joda.time.DateTime
import org.springframework.http.HttpStatus

import static de.iteratec.osm.util.PerformanceLoggingService.LogLevel.DEBUG
import static org.springframework.http.HttpStatus.NOT_FOUND

//TODO: This controller was generated due to a scaffolding bug (https://github.com/grails3-plugins/scaffolding/issues/24). The dynamically scaffolded controllers cannot handle database exceptions
//TODO: save, show, update and tags were NOT generated
class JobGroupController {

    static scaffold = JobGroup
    static allowedMethods = [save: "POST", update: "PUT", delete: "DELETE", createAsync: "POST"]

    I18nService i18nService
    DefaultTimeToCsMappingService defaultTimeToCsMappingService
    TimeToCsMappingService timeToCsMappingService
    PerformanceLoggingService performanceLoggingService
    ResultSelectionService resultSelectionService
    JobGroupService jobGroupService

    def save() {
        String configurationLabel = params.remove("csiConfiguration")
        def tagParam = params.remove('tags')
        String name = params['name']
        List<GraphiteServer> resultGraphiteServers = params["resultGraphiteServers"] != "null" ? GraphiteServer.getAll(params["resultGraphiteServers"]) : []
        List<GraphiteServer> jobHealthGraphiteServers = params["jobHealthGraphiteServers"] != "null" ? GraphiteServer.getAll(params["jobHealthGraphiteServers"]) : []
        CsiConfiguration csiConfiguration = params['csiConfiguration'] ? CsiConfiguration.findByLabel(params['csiConfiguration']) : null
        boolean persistDetailData = params['persistDetailData'] ? params['persistDetailData'].toBoolean() : false

        JobGroup jobGroup = new JobGroup(name: name, resultGraphiteServers: resultGraphiteServers, jobHealthGraphiteServers: jobHealthGraphiteServers, csiConfiguration: csiConfiguration, persistDetailData: persistDetailData)

        CsiConfiguration configuration = CsiConfiguration.findByLabel(configurationLabel)
        if (configuration) {
            jobGroup.csiConfiguration = configuration
        }

        if (!jobGroup.save(flush: true)) {
            render(view: "create", model: [jobGroup: jobGroup])
            return
        } else {
            // Tags can only be set after first successful save.
            // This is why Job needs to be saved again.
            def tags = [tagParam].flatten()
            jobGroup.tags = tags
            jobGroup.save(flush: true)

            flash.message = message(code: 'default.created.message', args: [message(code: 'jobGroup.label', default: 'JobGroup'), jobGroup.id])
            redirect(action: "show", id: jobGroup.id)
        }
    }

    def show() {
        def jobGroup = JobGroup.get(params.id)
        def modelToRender = [:]

        CsiConfiguration config = jobGroup.csiConfiguration

        if (config) {
            //Labels for charts
            String zeroWeightLabel = i18nService.msg("de.iteratec.osm.d3Data.treemap.zeroWeightLabel", "Pages ohne Gewichtung")
            String dataLabel = i18nService.msg("de.iteratec.osm.d3Data.treemap.dataLabel", "Page")
            String weightLabel = i18nService.msg("de.iteratec.osm.d3Data.treemap.weightLabel", "Gewichtung")
            String xAxisLabel = i18nService.msg("de.iteratec.osm.d3Data.barChart.xAxisLabel", "Tageszeit")
            String yAxisLabel = i18nService.msg("de.iteratec.osm.d3Data.barChart.yAxisLabel", "Gewichtung")
            String matrixViewXLabel = i18nService.msg("de.iteratec.osm.d3Data.matrixView.xLabel", "Browser")
            String matrixViewYLabel = i18nService.msg("de.iteratec.osm.d3Data.matrixView.yLabel", "Conn")
            String matrixViewWeightLabel = i18nService.msg("de.iteratec.osm.d3Data.matrixView.weightLabel", "Weight")
            String colorBrightLabel = i18nService.msg("de.iteratec.osm.d3Data.matrixView.colorBrightLabel", "less")
            String colorDarkLabel = i18nService.msg("de.iteratec.osm.d3Data.matrixView.colorDarkLabel", "more")
            String matrixZeroWeightLabel = i18nService.msg("de.iteratec.osm.d3Data.matrixView.zeroWeightLabel", "Im CSI nicht berücksichtigt")

            // arrange matrixViewData
            MatrixViewData matrixViewData = new MatrixViewData(weightLabel: matrixViewWeightLabel, rowLabel: matrixViewYLabel, columnLabel: matrixViewXLabel, colorBrightLabel: colorBrightLabel, colorDarkLabel: colorDarkLabel, zeroWeightLabel: matrixZeroWeightLabel)
            matrixViewData.addColumns(Browser.findAll()*.name as Set)
            matrixViewData.addRows(ConnectivityProfile.findAll()*.name as Set)
            config.browserConnectivityWeights.each {
                matrixViewData.addEntry(new MatrixViewEntry(weight: it.weight, columnName: it.browser.name, rowName: it.connectivity.name))
            }
            def matrixViewDataJSON = matrixViewData as JSON

            // arrange treemap data
            TreemapData treemapData = new TreemapData(zeroWeightLabel: zeroWeightLabel, dataName: dataLabel, weightName: weightLabel);
            config.pageWeights.each { pageWeight -> treemapData.addNode(new ChartEntry(name: pageWeight.page.name, weight: pageWeight.weight)) }
            def treemapDataJSON = treemapData as JSON

            // arrange barchart data
            BarChartData barChartData = new BarChartData(xLabel: xAxisLabel, yLabel: yAxisLabel)
            (0..23).each {
                barChartData.addDatum(new ChartEntry(name: it, weight: config.csiDay.getHourWeight(it)))
            }
            def barChartJSON = barChartData as JSON

            MultiLineChart defaultTimeToCsMappingsChart = defaultTimeToCsMappingService.getDefaultMappingsAsChart(10000)

            // arrange page time to cs mapping chart data
            MultiLineChart pageTimeToCsMappingsChart
            boolean mappingExists = false
            if (config.timeToCsMappings) {
                pageTimeToCsMappingsChart = timeToCsMappingService.getPageMappingsAsChart(10000, config)
                mappingExists = true
            } else {
                pageTimeToCsMappingsChart = [:]
            }
            modelToRender = [matrixViewData          : matrixViewDataJSON,
                             treemapData             : treemapDataJSON,
                             barchartData            : barChartJSON,
                             defaultTimeToCsMappings : defaultTimeToCsMappingsChart as JSON,
                             selectedCsiConfiguration: config,
                             pageTimeToCsMappings    : pageTimeToCsMappingsChart as JSON,
                             pageMappingsExist       : mappingExists]

        }

        modelToRender.put("jobGroup", jobGroup)

        return modelToRender
    }

    def update() {
        def jobGroup = JobGroup.get(params.id)
        if (!jobGroup) {
            flash.message = message(code: 'default.not.found.message', args: [message(code: 'jobGroup.label', default: 'JobGroup'), params.id])
            redirect(action: "list")
            return
        }

        if (params.version) {
            def version = params.version.toLong()
            if (jobGroup.version > version) {
                jobGroup.errors.rejectValue("version", "default.optimistic.locking.failure",
                        [message(code: 'jobGroup.label', default: 'JobGroup')] as Object[],
                        "Another user has updated this JobGroup while you were editing")
                render(view: "edit", model: [jobGroup: jobGroup])
                return
            }
        }
        String csiConfigLabel = params.remove("csiConfiguration")
        if (csiConfigLabel != null) {
            CsiConfiguration config = CsiConfiguration.findByLabel(csiConfigLabel)
            jobGroup.csiConfiguration = config
        } else {
            jobGroup.csiConfiguration = null
        }


        jobGroup.resultGraphiteServers.clear()
        jobGroup.jobHealthGraphiteServers.clear()
        params.list('resultGraphiteServers').each {
            jobGroup.resultGraphiteServers.add(GraphiteServer.findById(it))
        }
        params.list('jobHealthGraphiteServers').each {
            jobGroup.jobHealthGraphiteServers.add(GraphiteServer.findById(it))
        }
        params.remove('resultGraphiteServers')
        params.remove('jobHealthGraphiteServers')
        def tagParam = params.remove('tags')
        def tags = [tagParam].flatten()
        jobGroup.tags = tags
        jobGroup.properties = params
        if (!jobGroup.save(flush: true)) {
            render(view: "edit", model: [jobGroup: jobGroup])
            return
        }

        flash.message = message(code: 'default.updated.message', args: [message(code: 'jobGroup.label', default: 'JobGroup'), jobGroup.id])
        redirect(action: "show", id: jobGroup.id)
    }

    /**
     * List tags starting with term.
     */
    def tags(String term) {
        render JobGroup.findAllTagsWithCriteria([max: 5]) { ilike('name', "${term}%") } as JSON
    }


    def index() {
    }


    def create() {
        respond new JobGroup(params)
    }


    def edit(JobGroup jobGroup) {
        respond jobGroup
    }

    def updateTable() {
        params.order = params.order ? params.order : "asc"
        params.sort = params.sort ? params.sort : "name"
        params.max = params.max as Integer
        params.offset = params.offset as Integer
        List<JobGroup> result = JobGroup.createCriteria().list(params) {
            createAlias('csiConfiguration', 'csiConfigurationAlias', JoinType.LEFT_OUTER_JOIN)
            if (params.filter)
                or {
                    ilike("name", "%" + params.filter + "%")
                    ilike("csiConfigurationAlias.label", "%" + params.filter + "%")
                }
        }
        String templateAsPlainText = g.render(
                template: 'jobGroupTable',
                model: [jobGroups: result]
        )
        ControllerUtils.sendObjectAsJSON(response, [
                table: templateAsPlainText,
                count: result.totalCount
        ])
    }

    protected void notFound() {
        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.not.found.message', args: [message(code: 'jobGroup.label', default: 'JobGroup'), params.id])
                redirect action: "index", method: "GET"
            }
            '*' { render status: NOT_FOUND }
        }
    }

    def createAsync() {
        String name = params['name']
        List<GraphiteServer> resultGraphiteServers = params["resultGraphiteServers"] != "null" ? GraphiteServer.getAll(params["resultGraphiteServers"].tokenize(',[]\"')*.toLong()) : []
        List<GraphiteServer> jobHealthGraphiteServers = params["jobHealthGraphiteServers"] != "null" ? GraphiteServer.getAll(params["jobHealthGraphiteServers"].tokenize(',[]\"')*.toLong()) : []
        CsiConfiguration csiConfiguration = params['csiConfiguration'] ? CsiConfiguration.findByLabel(params['csiConfiguration']) : null
        boolean persistDetailData = params['persistDetailData'] ? params['persistDetailData'].toBoolean() : false
        List<String> tags = params['tags'] != "null" ? params['tags'].tokenize(',[]\"') : []

        JobGroup jobGroup = new JobGroup(name: name, resultGraphiteServers: resultGraphiteServers, jobHealthGraphiteServers: jobHealthGraphiteServers, csiConfiguration: csiConfiguration, persistDetailData: persistDetailData)
        if (!jobGroup.save(flush: true)) {
            ControllerUtils.sendSimpleResponseAsStream(response, HttpStatus.BAD_REQUEST, jobGroup.errors.allErrors*.toString().toString())
        } else {
            jobGroup.tags = tags
            jobGroup.save(flush: true)
            ControllerUtils.sendObjectAsJSON(response, ['jobGroupName': jobGroup.name, 'jobGroupId': jobGroup.id])
        }
    }

    def getAllActive() {
        def activeJobGroups = jobGroupService.getAllActiveJobGroups()

        return ControllerUtils.sendObjectAsJSON(response, activeJobGroups)
    }

    @RestAction()
    def getJobGroupsWithPages(JobGroupWithPagesCommand command) {
        if (command.hasErrors()) {
            println 'send error'
            sendError(command)
            return
        }
        def dtos = performanceLoggingService.logExecutionTime(DEBUG, "getJobGroupToPagesMap for ${command as JSON}", IndentationDepth.ZERO, {
            def jobGroupAndPages = resultSelectionService.query(command.toResultSelectionCommand(), null, { existing ->
                projections {
                    distinct(['jobGroup','page'])
                }
            })
            Map<Long, Map> map = [:].withDefault {[name:"", pages:[] as Set]}
            jobGroupAndPages.each {
                JobGroup jobGroup = it[0] as JobGroup
                Page page = it[1] as Page
                Map jobGroupMap = map[jobGroup.id]
                jobGroupMap.name = jobGroup.name
                jobGroupMap.id = jobGroup.id
                jobGroupMap.pages << page
            }
            return map.collect{k, v ->
                [name:v.name, id: v.id, pages: v.pages.collect {[name: it.name, id: it.id]}.sort{it.name}                ]
            }
        })
        ControllerUtils.sendObjectAsJSON(response, dtos)
    }
}

class JobGroupWithPagesCommand{
    DateTime from
    DateTime to

    ResultSelectionCommand toResultSelectionCommand(){
        return new ResultSelectionCommand(from: from, to: to)
    }
}
