package de.iteratec.osm.measurement.schedule

import de.iteratec.osm.result.JobResult
import de.iteratec.osm.result.JobResultStatus
import grails.gorm.transactions.Transactional
import org.grails.orm.hibernate.cfg.GrailsHibernateUtil

@Transactional
class JobStatisticService {

    /**
     * A {@link JobStatistic} is created and associated to given job if no one already exists.
     * The statistic is updated.
     * @param job
     */
    @Transactional
    void updateStatsFor(Job job) {

        List<JobResult> results = getLast150CompletedJobResultsFor(job)

        JobStatistic stat = getStatOf(job)
        stat.percentageSuccessfulTestsOfLast150 = results.size() == 150 ?
                (results.count { it.jobResultStatus == JobResultStatus.SUCCESS } / 150) * 100 :
                null
        stat.percentageSuccessfulTestsOfLast25 = results.size() >= 25 ?
                (results.take(25).count { it.jobResultStatus == JobResultStatus.SUCCESS } / 25) * 100 :
                null
        stat.percentageSuccessfulTestsOfLast5 = results.size() >= 5 ?
                (results.take(5).count { it.jobResultStatus == JobResultStatus.SUCCESS } / 5) * 100 :
                null
        try {
            stat.save(failOnError: true)
        } catch (e) {
            System.out.println(e.toString())
        }
    }

    private JobStatistic getStatOf(Job job){
        JobStatistic jobStatistic = job.jobStatistic
        jobStatistic = GrailsHibernateUtil.unwrapIfProxy(jobStatistic)
        if (jobStatistic == null){
            jobStatistic = new JobStatistic()
            job.jobStatistic = jobStatistic
            job.save(failOnError: true)
        }
        return jobStatistic
    }

    List<JobResult> getLast150CompletedJobResultsFor(Job job) {
        return  JobResult.createCriteria().list{
            eq("job", job)
            order("date", "desc")
            ne("jobResultStatus", JobResultStatus.WAITING)
            ne("jobResultStatus", JobResultStatus.RUNNING)
            maxResults(150)
        }
    }

    List<JobResult> getLast150JobResultsFor(Job job) {
        return  JobResult.createCriteria().list{
            eq("job", job)
            order("date", "desc")
            maxResults(150)
        }
    }
}
