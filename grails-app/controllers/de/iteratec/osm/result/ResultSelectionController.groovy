package de.iteratec.osm.result

import de.iteratec.osm.api.dto.JobGroupDto
import de.iteratec.osm.api.dto.PageDto
import de.iteratec.osm.measurement.schedule.dao.JobGroupDaoService
import de.iteratec.osm.util.ControllerUtils
import org.hibernate.FetchMode
import org.joda.time.DateTime
import org.springframework.http.HttpStatus

class ResultSelectionController {
    JobGroupDaoService jobGroupDaoService;

    def getJobGroupsInTimeFrame(ResultSelectionTimeFrameCommand command) {
        if (command.hasErrors()) {
            ControllerUtils.sendSimpleResponseAsStream(response, HttpStatus.BAD_REQUEST,
                    "Invalid parameters: " + command.getErrors().fieldErrors.each{it.field}.join(", "))
            return
        }
        if (!command.from.isBefore(command.to)) {
            ControllerUtils.sendSimpleResponseAsStream(response, HttpStatus.BAD_REQUEST,
                    "Invalid time frame: 'from' value needs to be before 'to'")
            return
        }

        def availableJobGroups = jobGroupDaoService.findByJobResultsInTimeFrame(command.from.toDate(), command.to.toDate())
        ControllerUtils.sendObjectAsJSON(response, JobGroupDto.create(availableJobGroups))
    }

    def getPagesInTimeFrame(ResultSelectionGetPagesCommand command) {
        // need to explicitly select id an name, since gorm/hibernate takes 10x as long for fetching the page
        def pages = EventResult.createCriteria().list {
            fetchMode('page', FetchMode.JOIN)
            and {
                between("jobResultDate", command.from.toDate(), command.to.toDate())
                if (command.jobGroupIds) {
                    jobGroup {
                        'in'("id", command.jobGroupIds)
                    }
                }
            }

            projections {
                page {
                    distinct('id')
                    property('name')
                }
            }
        }
        ControllerUtils.sendObjectAsJSON(response, pages.collect { [id: it[0], name: it[1]] as PageDto })
    }
}

class ResultSelectionTimeFrameCommand {
    DateTime from;
    DateTime to;
}

class ResultSelectionGetPagesCommand {
    DateTime from;
    DateTime to;
    List<Long> jobGroupIds;
}
