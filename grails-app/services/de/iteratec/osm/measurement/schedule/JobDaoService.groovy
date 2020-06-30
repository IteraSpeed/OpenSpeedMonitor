package de.iteratec.osm.measurement.schedule

import de.iteratec.osm.measurement.environment.Location
import de.iteratec.osm.measurement.environment.wptserver.OsmResultPersistanceException

/**
 * A DaoService for Jobs.
 * Should be used due to jobs not being deleted just marked as such
 */
class JobDaoService {
    public List<Job> getAllJobs() {
        return Job.findAllByDeleted(false)
    }

    public List<Job> getJobsByIds(List<Long> jobIds) {
        return Job.findAllByDeletedAndIdInList(false, jobIds)
    }

    public Job getJob(Long jobId) {
        Job job = Job.get(jobId)
        if(!job) {
            throw new OsmResultPersistanceException("No measurement job could be found for id ${jobId} from result xml")
        } else if (job.deleted) {
            return null
        }
        return job
    }

    public List<Job> getJobs(boolean active) {
        return Job.findAllByDeletedAndActive(false, active)
    }

    public List<Job> getJobs(Location location) {
        return Job.findAllByDeletedAndLocation(false, location)
    }

    public List<Job> getJobs(ConnectivityProfile connectivityProfile) {
        return Job.findAllByDeletedAndConnectivityProfile(false, connectivityProfile)
    }

    public List<Job> getJobs(Map listParams) {
        return Job.list(listParams).findAll { (!it.deleted) }
    }

    public List<Job> getJobs(JobGroup jobGroup) {
        return Job.findAllByDeletedAndJobGroup(false, jobGroup)
    }

    public List<Job> getJobs(List<JobGroup> jobGroups) {
        return Job.findAllByDeletedAndJobGroupInList(false, jobGroups)
    }

    public List<Job> getJobs(boolean active, Location location) {
        return Job.findAllByDeletedAndActiveAndLocation(false, active, location)
    }

    public List<String> getTags(String term, int max) {
        return Job.findAllTagsWithCriteria([max: max]) { ilike('name', "${term}%") }
    }

    /**
     * Returns a map <JobID, JobLabel>
     */
    List<Job> getJobLabels() {
        Job.createCriteria().list {
            eq('deleted', false)
            order('label')
            projections {
                property('id')
                property('label')
            }
        } as List<Job>
    }

    /**
     * Returns a map <JobID, JobLabel>
     */
    Map<Long, String> getJobLabelsAsMap() {
        Job.createCriteria().list {
            eq('deleted', false)
            order('label')
            projections {
                property('id')
                property('label')
            }
        }.collectEntries {
            b -> [b[0] as long, b[1]]
        }
    }
}
