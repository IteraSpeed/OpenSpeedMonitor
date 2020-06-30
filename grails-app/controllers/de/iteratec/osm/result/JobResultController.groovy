package de.iteratec.osm.result

import de.iteratec.osm.annotations.RestAction
import de.iteratec.osm.measurement.schedule.JobResultDTO
import de.iteratec.osm.measurement.schedule.Job
import de.iteratec.osm.measurement.schedule.JobDaoService
import de.iteratec.osm.measurement.schedule.JobStatisticService
import de.iteratec.osm.util.ControllerUtils
import de.iteratec.osm.util.I18nService

import java.text.SimpleDateFormat

class JobResultController {

    JobStatisticService jobStatisticService
    JobDaoService jobDaoService
    I18nService i18nService

    def listFailed(Long jobId) {
        Map<Long, String> allJobs = jobDaoService.getJobLabelsAsMap()

        String selectedJobId = jobId ?: ''

        return ['allJobs': allJobs, 'selectedJobId': selectedJobId]
    }

    @RestAction
    def getAllJobs() {
        List<Job> allJobs = jobDaoService.getJobLabels()

        return ControllerUtils.sendObjectAsJSON(response, allJobs)
    }

    @RestAction
    def getJobResults(Long jobId) {
        List<JobResult> jobResultsForJob
        Job job = Job.get(jobId)
        if (job) {
            jobResultsForJob = jobStatisticService.getLast150JobResultsFor(job)
        }

        List<JobResultDTO> dtos = []
        jobResultsForJob.each {
            JobResultDTO jobResultDTO = new JobResultDTO(it)
            jobResultDTO.date = it.date.toString()
            dtos << jobResultDTO
        }

        ControllerUtils.sendObjectAsJSON(response, dtos)
    }
}
