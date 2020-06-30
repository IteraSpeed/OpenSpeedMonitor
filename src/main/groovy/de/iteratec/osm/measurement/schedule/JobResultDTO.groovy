package de.iteratec.osm.measurement.schedule

import de.iteratec.osm.result.JobResult

import java.text.SimpleDateFormat

class JobResultDTO {
    String testId
    String testAgent
    String date
    String jobResultStatus
    String wptStatus
    String description
    URL testUrl

    JobResultDTO(JobResult jobResult) {
        testId = jobResult.testId
        testAgent = jobResult.testAgent
        date = new SimpleDateFormat().format(jobResult.date)
        jobResultStatus = jobResult.jobResultStatus.getMessage()
        wptStatus = jobResult.wptStatus.getMessage()
        description = jobResult.description
        testUrl = jobResult.tryToGetTestsDetailsURL()
    }
}
