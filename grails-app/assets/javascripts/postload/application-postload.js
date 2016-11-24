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
/**
 * This class contains all global js functionality of osm, that is not necessary for above-the-fold content.
 * This script is loaded after window.load event.
 *
 * This script Calls custom Event PostLoadedScriptArrived. An event handler is registered in _common/_postloadInitializedJS.gsp
 * which publishes PostLoaded functionality under namespace POSTLOADED by instantiate an instance of class PostLoaded.
 *
 * @param dataFromGsp This contains all init data and is filled in _common/_postloadInitializedJS.gsp
 * @constructor
 */
//= require bower_components/spin.js/spin.js
//= require_self
function PostLoaded(dataFromGsp){

    this.i18n_duplicatePrompt = dataFromGsp.i18n_duplicatePrompt;
    this.i18n_duplicateSuffix = dataFromGsp.i18n_duplicateSuffix;
    this.i18n_deletionConfirmMessage = dataFromGsp.i18n_deletionConfirmMessage;
    this.i18n_updateConfirmMessage = dataFromGsp.i18n_updateConfirmMessage;
    this.i18n_loadTimeIntegerError = dataFromGsp.i18n_loadTimeIntegerError;
    this.i18n_customerFrustrationDoubleError = dataFromGsp.i18n_customerFrustrationDoubleError;
    this.i18n_defaultMappingFormatError = dataFromGsp.i18n_defaultMappingFormatError;
    this.i18n_defaultMappingNotAllvaluesError = dataFromGsp.i18n_defaultMappingNotAllvaluesError;
    this.i18n_customerSatisfactionNotInPercentError = dataFromGsp.i18n_customerSatisfactionNotInPercentError;
    this.i18n_percentagesBetween0And1Error = dataFromGsp.i18n_percentagesBetween0And1Error;
    this.i18n_deletePageMappingConfirmation = dataFromGsp.i18n_deletePageMappingConfirmation;
    this.i18n_deletePageMappingProcessing = dataFromGsp.i18n_deletePageMappingProcessing;
    this.i18n_nameAlreadyExistMsg = dataFromGsp.i18n_nameAlreadyExistMsg;
    this.i18n_overwritingWarning = dataFromGsp.i18n_overwritingWarning;
    this.i18n_deleteCsiConfigurationConfirmation = dataFromGsp.i18n_deleteCsiConfigurationConfirmation;
    this.i18n_deleteCsiConfigurationWarning = dataFromGsp.i18n_deleteCsiConfigurationWarning;
    this.i18n_showMsg = dataFromGsp.i18n_showMsg;
    this.link_getNamesOfDefaultMappings = dataFromGsp.link_getNamesOfDefaultMappings;
    this.link_validateDeletionOfCsiConfiguration = dataFromGsp.link_validateDeletionOfCsiConfiguration;
    this.link_getJobGroupsUsingCsiConfiguration = dataFromGsp.link_getJobGroupsUsingCsiConfiguration;
    this.link_CsiConfigurationSaveCopy = dataFromGsp.link_CsiConfigurationSaveCopy;
    this.link_CsiConfigurationConfigurations = dataFromGsp.link_CsiConfigurationConfigurations;
    this.link_CsiConfigurationDeletion = dataFromGsp.link_CsiConfigurationDeletion;
    this.idOfItemToDelete = dataFromGsp.idOfItemToDelete;
    this.idOfItemToUpdate = dataFromGsp.idOfItemToUpdate;

    this.setDeleteConfirmationInformations = function(link){
        setTimeout (function () {
            //TODO find out why this. doesn't work
            var text = domainDeleteConfirmation(dataFromGsp.i18n_deletionConfirmMessage, dataFromGsp.idOfItemToDelete, link);
            $('#DeleteModal').find('p').html(text);
            },
            10
        );
    };
}

$('.dropdown-toggle').dropdown();
fireWindowEvent('PostLoadedScriptArrived');