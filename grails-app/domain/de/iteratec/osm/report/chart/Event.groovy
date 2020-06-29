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

package de.iteratec.osm.report.chart

import de.iteratec.osm.measurement.schedule.JobGroup
import grails.gorm.annotation.Entity

/**
 * Represents an arbitrary event to be shown in dashboard diagrams as vertical lines with info text as hover info.
 * Could be deployments of measured web application for example.
 */
@Entity
class Event {

    Long id
    Date eventDate
    String shortName
    String description
    /**
     * If true this event is shown in all diagrams in dashboards of osm.
     * If false this event is just shown in diagrams which contain data of associated {@link JobGroup}s.
     */
    Boolean globallyVisible = false

    /**
     * The {@link JobGroup} this event is assigned to
     */
    Collection<JobGroup> jobGroups = []
    static hasMany = [jobGroups: JobGroup]

    static mapping = {
        globallyVisible(defaultValue: false)
        description(type: 'text')
    }

    def beforeValidate() {
        shortName = removeCharacter(shortName)
        description = removeCharacter(description)
    }
    /**
     * Remove all html tags, because we don't want arbitrary links to get injected into the gui of osm.
     * Additionally we remove all paragraphs and single quotes, to prevent failures
     * @param str
     * @return clean String
     */
    def removeCharacter(String str){
        if(str != null){
            str = str.replaceAll(/<!--.*?-->/, '')
                    .replaceAll(/<.*?>/, '')
        }
        return str
    }

	static constraints = {
        eventDate(nullable: false)
        shortName(maxSize: 255)
        description(nullable: true, widget: 'textarea')
        globallyVisible(nullable: false)
        jobGroups(nullable: true, validator: {val, obj->
            if (!obj.globallyVisible && !(val && val.size() > 0)) {
                return 'event.jobGroup.notValid'
            }
        })
    }
}
