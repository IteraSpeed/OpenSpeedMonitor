//= require _selectWithSelectAllCheckBox.js
//= require _connectedSelects.js
//= require_self

"use strict";

var OpenSpeedMonitor = OpenSpeedMonitor || {};

OpenSpeedMonitor.selectPageLocationConnectivityCard = (function() {
    var cardElement = $('#select-page-location-connectivity');
    var resetButtonElement = $('.reset-result-selection');
    var pageSelectElement = $("#pageSelectHtmlId");
    var measuredEventsSelectElement = $("#selectedMeasuredEventsHtmlId");
    var browserSelectElement = $("#selectedBrowsersHtmlId");
    var locationsSelectElement =  $("#selectedLocationsHtmlId");
    var connectivitySelectElement = $("#selectedConnectivityProfilesHtmlId");
    var pageEventsConnectedSelects;
    var browserLocationConnectedSelects;

    var init = function() {
        pageEventsConnectedSelects = OpenSpeedMonitor.ConnectedSelects(pageSelectElement, $(),
            measuredEventsSelectElement, $("#selectedAllMeasuredEvents"));
        browserLocationConnectedSelects = OpenSpeedMonitor.ConnectedSelects(browserSelectElement,
            $("#selectedAllBrowsers"), locationsSelectElement, $("#selectedAllLocations"));
        OpenSpeedMonitor.SelectWithSelectAllCheckBox(connectivitySelectElement, "#selectedAllConnectivityProfiles");
        fixChosen();
        registerEvents();
    };

    var registerEvents = function() {
        pageSelectElement.on("change", function () {
            triggerChangeEvent("pageSelectionChanged", getPageSelection());
        });
        measuredEventsSelectElement.on("change", function () {
            triggerChangeEvent("measuredEventSelectionChanged", getMeasuredEventSelection());
        });
        browserSelectElement.on("change", function () {
            triggerChangeEvent("browserSelectionChanged", getBrowserSelection());
        });
        locationsSelectElement.on("change", function () {
            triggerChangeEvent("locationSelectionChanged", getLocationSelection());
        });
        connectivitySelectElement.on("change", function () {
            triggerChangeEvent("connectivitySelectionChanged", getConnectivitySelection());
        });
        resetButtonElement.on("click", function() {
            OpenSpeedMonitor.domUtils.deselectAllOptions(pageSelectElement);
            OpenSpeedMonitor.domUtils.deselectAllOptions(measuredEventsSelectElement);
            OpenSpeedMonitor.domUtils.deselectAllOptions(browserSelectElement);
            OpenSpeedMonitor.domUtils.deselectAllOptions(locationsSelectElement);
            OpenSpeedMonitor.domUtils.deselectAllOptions(connectivitySelectElement);
        });
    };

    var triggerChangeEvent = function (eventType, values) {
        cardElement.trigger(eventType, values);
    };

    var updateMeasuredEvents = function (measuredEventsWithPages) {
        pageEventsConnectedSelects.updateOptions(measuredEventsWithPages);
    };

    var updateLocations = function (locationsWithBrowsers) {
        browserLocationConnectedSelects.updateOptions(locationsWithBrowsers);
    };

    var updateConnectivityProfiles = function (connectivityProfiles) {
        OpenSpeedMonitor.domUtils.updateSelectOptions(connectivitySelectElement, connectivityProfiles, OpenSpeedMonitor.i18n.noResultsMsg);
    };

    var getMeasuredEventSelection = function () {
        return {
            ids: measuredEventsSelectElement.val()
        };
    };

    var getPageSelection = function () {
        return {
            ids: pageSelectElement.val()
        };
    };

    var getLocationSelection = function() {
        return {
            ids: locationsSelectElement.val()
        };
    };

    var getBrowserSelection = function() {
        return {
            ids: browserSelectElement.val()
        };
    };

    var getConnectivitySelection = function () {
        return {
            selectedConnectivities: connectivitySelectElement.val()
        }
    };

    init();
    return {
        updateMeasuredEvents: updateMeasuredEvents,
        updateLocations: updateLocations,
        updateConnectivityProfiles: updateConnectivityProfiles,
        getMeasuredEventSelection: getMeasuredEventSelection,
        getPageSelection: getPageSelection,
        getLocationSelection: getLocationSelection,
        getBrowserSelection: getBrowserSelection,
        getConnectivitySelection: getConnectivitySelection
    };
})();



