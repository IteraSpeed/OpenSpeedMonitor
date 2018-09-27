/* 
* OpenSpeedMonitor (OSM)
* Copyright 2014 iteratec GmbH
* 
* Licensed under the Apache License, Version 2.0 (the "License"); 
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* 
* 	http://www.apache.org/licenses/LICENSE-2.0
* 
* Unless required by applicable law or agreed to in writing, software 
* distributed under the License is distributed on an "AS IS" BASIS, 
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
* See the License for the specific language governing permissions and 
* limitations under the License.
*/

package de.iteratec.osm

/**
 * ConfigService
 * Delivers application-wide configurations from backend.
 * @see OsmConfiguration
 */
class ConfigService {

	def grailsApplication
	InMemoryConfigService inMemoryConfigService


	/**
	 * Gets detail-data storage time in weeks from osm-configuration.
	 * @return Time in weeks to store detail-data of the application.
	 * @see OsmConfiguration
	 * @throws IllegalStateException if single {@link OsmConfiguration} can't be read from db or {@link OsmConfiguration#detailDataStorageTimeInWeeks} isn't set.
	 */
    Integer getDetailDataStorageTimeInWeeks() {
        return getConfig().detailDataStorageTimeInWeeks
    }
	
    /**
     * Gets detail-data storage time in weeks from osm-configuration.
     * @return Time in weeks to store detail-data of the application.
     * @see OsmConfiguration
     * @throws IllegalStateException if single {@link OsmConfiguration} can't be read from db or {@link OsmConfiguration#detailDataStorageTimeInWeeks} isn't set.
     */
    Integer getDefaultMaxDownloadTimeInMinutes() {
        return getConfig().defaultMaxDownloadTimeInMinutes
    }
	
	/** 
	 * Gets minValidLoadtime from osm-configuration.
	 * {@link EventResult}s with a load time lower than this won't be factored in csi-{@link CsiAggregation}s.
	 * @return The minimum valid load time in millisecs. EventResults with load times below will be considered as measurement error.
     * @see OsmConfiguration
     * @throws IllegalStateException if single {@link OsmConfiguration} can't be read from db or {@link OsmConfiguration#minValidLoadtime} isn't set.
	 */
	Integer getMinValidLoadtime(){
        return getConfig().minValidLoadtime
	}
	
	/**
	 * Gets maxValidLoadtime from osm-configuration.
	 * {@link EventResult}s with a loadtime lower than this won't be factored in csi-{@link CsiAggregation}s.
	 * @return The maximum valid load time in millisecs. EventResults with load times above will be considered as measurement error.
     * @see OsmConfiguration
     * @throws IllegalStateException if single {@link OsmConfiguration} can't be read from db or {@link OsmConfiguration#maxValidLoadtime} isn't set.
	 */
	Integer getMaxValidLoadtime(){
        return getConfig().maxValidLoadtime
	}
	
	/**
	 * Gets initial height of charts when opening dashboards from osm-configuration.
	 * @see OsmConfiguration
	 * @throws IllegalStateException if single {@link OsmConfiguration} can't be read from db or {@link OsmConfiguration#measurementsGenerallyEnabled} isn't set.
	 */
	Integer getInitialChartHeightInPixels(){
        return getConfig().initialChartHeightInPixels
	}

    /**
     * Gets max result-data storage time in months from osm-configuration.
     * @return Time in months to store results of the application.
     * @see OsmConfiguration
     * @throws IllegalStateException if single {@link OsmConfiguration} can't be read from db or {@link OsmConfiguration#measurementsGenerallyEnabled} isn't set.
     */
    Integer getMaxDataStorageTimeInMonths(){
        return getConfig().maxDataStorageTimeInMonths
    }

	/**
	 * Gets max BatchActivity storage time in days from osm-configuration.
	 * @return Time in days to store BatchActivites of the application.
	 * @see OsmConfiguration
	 * @throws IllegalStateException if single {@link OsmConfiguration} can't be read from db or {@link OsmConfiguration#measurementsGenerallyEnabled} isn't set.
	 */
	Integer getMaxBatchActivityStorageTimeInDays(){
        return getConfig().maxBatchActivityStorageTimeInDays
	}

	String getGlobalUserAgentSuffix(){
		return getConfig().globalUserAgentSuffix
	}

	/**
	 * Get status of databaseCleanupEnabled
	 * If false no nightly database cleanup get started. If true the nightly database cleanup jobs are active ({@link DailyOldJobResultsWithDependenciesCleanup} and {@link DbCleanupOldCsiAggregationsWithDependenciesJob})
	 * @return Whether the nightly database cleanup is enabled or not
	 */
	Boolean isDatabaseCleanupEnabled(){
		return inMemoryConfigService.isDatabaseCleanupEnabled()
	}

    /**
     * The time in days internal monitoring data like health checks are stored.
     */
    Integer getInternalMonitoringStorageTimeInDays(){
        return getConfig().internalMonitoringStorageTimeInDays
    }

	/**
	 * Whether initial setup of Webpagetest server already ran.
	 */
	OsmConfiguration.InfrastructureSetupStatus getInfrastructureSetupRan(){
		return getConfig().infrastructureSetupRan
	}

	void setInfrastructureSetupRan(OsmConfiguration.InfrastructureSetupStatus state){
		OsmConfiguration config = getConfig()
		config.infrastructureSetupRan = state;
		config.save(flush: true)
	}

    /**
     * Gets the name of the used database driver of running environment
     * @return {@link String} of the used database driver name
     */
    String getDatabaseDriverClassName() {
        return grailsApplication.config.dataSource.driverClassName
    }

    /**
     * Gets the API Key for the DetailAnalysis service
     * @return The API Key for the DetailAnalysis Service
     */
    String getDetailAnalysisApiKey() {
        return grailsApplication.config.grails.de.iteratec.osm.detailAnalysis.apiKey
    }

    /**
     * Gets the URL for the DetailAnalysis service
     * @return The URL for the DetailAnalysis Service
     */
    String getDetailAnalysisUrl() {
        String url = grailsApplication.config.grails.de.iteratec.osm.detailAnalysis.microserviceUrl
        if (url && !url.endsWith("/")) {
            url += "/"
        }
        return url
    }

	Integer getMaxAgeForMetricsInHours() {
		return grailsApplication.config.getProperty("de.iteratec.osm.application-dashboard.metrics-max-age-in-h", Integer, 6)
	}

    private OsmConfiguration getConfig(){
        List<OsmConfiguration> osmConfigs = OsmConfiguration.list()
        int confCount = osmConfigs.size()
        if (confCount != 1) {
            throw new IllegalStateException("It must exist exactly one Configuration in database. Found ${confCount}!")
        }else{
            return osmConfigs[0]
        }
    }
	
}
