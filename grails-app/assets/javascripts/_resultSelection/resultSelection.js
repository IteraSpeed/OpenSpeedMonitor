"use strict";

var OpenSpeedMonitor = OpenSpeedMonitor || {};

/**
 * Requires OpenSpeedMonitor.urls.resultSelection.getJobGroups to be defined
 */
OpenSpeedMonitor.resultSelection = (function () {
    var selectIntervalTimeframeCard = $("#select-interval-timeframe-card");
    var selectJobGroupCard = $("#select-jobgroup-card");
    var selectPageLocationConnectivityCard = $('#select-page-location-connectivity');
    var pageTabElement = $('#page-tab');
    var browserTabElement = $('#browser-tab');
    var connectivityTabElement = $('#connectivity-tab');
    var warningNoData = $('#warning-no-data');
    var showButtons = $('.show-button');
    var warningLongProcessing = $('#warning-long-processing');
    var warningNoJobGroupSelected = $('#warning-no-job-group');
    var warningNoPageSelected = $('#warning-no-page');
    var currentQueryArgs = {
        from: null,
        to: null,
        jobGroupIds: null,
        pageIds: null,
        measuredEventIds: null,
        browserIds: null,
        locationIds: null,
        connectivityIds: null,
        nativeConnectivity: null,
        customConnectivities: null
    };
    var lastUpdateJSON = JSON.stringify(currentQueryArgs);
    var updatesEnabled = false;
    var ajaxRequests = {};
    var spinnerJobGroup = new OpenSpeedMonitor.Spinner(selectJobGroupCard, "small");
    var spinnerPageLocationConnectivity = new OpenSpeedMonitor.Spinner(selectPageLocationConnectivityCard, "small");
    var hasJobGroupSelection = selectJobGroupCard.length == 0 || !!$("#folderSelectHtmlId").val();
    var hasPageSelection = pageTabElement.length == 0 || !!$("#pageSelectHtmlId").val();
    var hasMeasuredEventSelection = pageTabElement.length == 0 || !!$("#selectedMeasuredEventsHtmlId").val();
    var lastResultCount = 1;

    var init = function () {
        registerEvents();

        // add caller to QueryArgs if caller is set. If not, set a default value
        currentQueryArgs['caller'] = $("#dashBoardParamsForm").data("caller") ? $("#dashBoardParamsForm").data("caller") : "EventResult";

        // if the cards are already initialized, we directly update job groups and jobs
        if (OpenSpeedMonitor.selectIntervalTimeframeCard) {
            setQueryArgsFromTimeFrame(null, OpenSpeedMonitor.selectIntervalTimeframeCard.getTimeFrame());
        }
        if (OpenSpeedMonitor.selectJobGroupCard) {
            setQueryArgsFromJobGroupSelection(null, OpenSpeedMonitor.selectJobGroupCard.getJobGroupSelection());
        }
        if (OpenSpeedMonitor.selectPageLocationConnectivityCard) {
            setQueryArgsFromPageSelection(null, OpenSpeedMonitor.selectPageLocationConnectivityCard.getPageSelection());
            setQueryArgsFromMeasuredEventSelection(null, OpenSpeedMonitor.selectPageLocationConnectivityCard.getMeasuredEventSelection());
            setQueryArgsFromBrowserSelection(null, OpenSpeedMonitor.selectPageLocationConnectivityCard.getBrowserSelection());
            setQueryArgsFromLocationSelection(null, OpenSpeedMonitor.selectPageLocationConnectivityCard.getLocationSelection());
            setQueryArgsFromConnectivitySelection(null, OpenSpeedMonitor.selectPageLocationConnectivityCard.getConnectivitySelection());
        }
        enableUpdates(!selectJobGroupCard.data("noAutoUpdate") || !selectPageLocationConnectivityCard.data("noAutoUpdate"));
        updateCards();
    };

    var registerEvents = function () {
        selectIntervalTimeframeCard.on("timeFrameChanged", setQueryArgsFromTimeFrame);
        selectJobGroupCard.on("jobGroupSelectionChanged", setQueryArgsFromJobGroupSelection);
        selectPageLocationConnectivityCard.on("pageSelectionChanged", setQueryArgsFromPageSelection);
        selectPageLocationConnectivityCard.on("measuredEventSelectionChanged", setQueryArgsFromMeasuredEventSelection);
        selectPageLocationConnectivityCard.on("browserSelectionChanged", setQueryArgsFromBrowserSelection);
        selectPageLocationConnectivityCard.on("locationSelectionChanged", setQueryArgsFromLocationSelection);
        selectPageLocationConnectivityCard.on("connectivitySelectionChanged", setQueryArgsFromConnectivitySelection);
    };

    var setQueryArgsFromTimeFrame = function (event, timeFrameSelection) {
        currentQueryArgs.from = timeFrameSelection[0].toISOString();
        currentQueryArgs.to = timeFrameSelection[1].toISOString();
        updateCards("timeFrame");
    };

    var setQueryArgsFromJobGroupSelection = function (event, jobGroupSelection) {
        hasJobGroupSelection = !!(jobGroupSelection && jobGroupSelection.ids && jobGroupSelection.ids.length > 0);
        currentQueryArgs.jobGroupIds = jobGroupSelection.ids;
        updateCards("jobGroups");
    };

    var setQueryArgsFromPageSelection = function (event, pageSelection) {
        hasPageSelection = !!(pageSelection && pageSelection.ids && pageSelection.ids.length > 0);
        currentQueryArgs.pageIds = pageSelection.ids;
        updateCards("pages");
    };

    var setQueryArgsFromBrowserSelection = function (event, browserSelection) {
        currentQueryArgs.browserIds = browserSelection.ids;
        updateCards("browsers");
    };

    var setQueryArgsFromLocationSelection = function (ev, locationSelection) {
        currentQueryArgs.locationIds = locationSelection.ids;
        updateCards("browsers");
    };

    var setQueryArgsFromConnectivitySelection = function (event, connectivitySelection) {
        currentQueryArgs.connectivityIds = connectivitySelection.ids;
        currentQueryArgs.nativeConnectivity = connectivitySelection.native;
        currentQueryArgs.customConnectivities = connectivitySelection.customNames;
        updateCards("connectivity");
    };

    var setQueryArgsFromMeasuredEventSelection = function (event, measuredEventSelection) {
        hasMeasuredEventSelection = !!(measuredEventSelection && measuredEventSelection.ids && measuredEventSelection.ids.length > 0);
        currentQueryArgs.measuredEventIds = measuredEventSelection.ids;
        updateCards("pages");
    };

    var updateCards = function (initiator) {
        validateForm();
        var currentUpdateJSON = JSON.stringify(currentQueryArgs);
        if (!updatesEnabled || !currentQueryArgs.from || !currentQueryArgs.to || lastUpdateJSON == currentUpdateJSON) {
            return;
        }
        lastUpdateJSON = currentUpdateJSON;
        var resultSelectionUrls = OpenSpeedMonitor.urls.resultSelection;
        var updateStarted = false;
        if (OpenSpeedMonitor.selectJobGroupCard && !selectJobGroupCard.data("noAutoUpdate") && initiator != "jobGroups") {
            spinnerJobGroup.start();
            updateCard(resultSelectionUrls["jobGroups"], OpenSpeedMonitor.selectJobGroupCard.updateJobGroups, spinnerJobGroup);
            updateStarted = true;
        }

        if (OpenSpeedMonitor.selectPageLocationConnectivityCard && !selectPageLocationConnectivityCard.data("noAutoUpdate")) {
            if (initiator != "pages" && initiator != "browsers" && initiator != "connectivity") {
                spinnerPageLocationConnectivity.start();
            }
            var spinner = null;
            if (pageTabElement.length > 0 && initiator != "pages") {
                spinner = pageTabElement.hasClass("active") ? spinnerPageLocationConnectivity : null;
                updateCard(resultSelectionUrls["pages"], OpenSpeedMonitor.selectPageLocationConnectivityCard.updateMeasuredEvents, spinner);
                updateStarted = true;
            }
            if (browserTabElement.length > 0 && initiator != "browsers") {
                spinner = browserTabElement.hasClass("active") ? spinnerPageLocationConnectivity : null;
                updateCard(resultSelectionUrls["browsers"], OpenSpeedMonitor.selectPageLocationConnectivityCard.updateLocations, spinner);
                updateStarted = true;
            }
            if (connectivityTabElement.length > 0 && initiator != "connectivity") {
                spinner = connectivityTabElement.hasClass("active") ? spinnerPageLocationConnectivity : null;
                updateCard(resultSelectionUrls["connectivity"], OpenSpeedMonitor.selectPageLocationConnectivityCard.updateConnectivityProfiles, spinner);
                updateStarted = true;
            }
        }
        if (updateStarted && currentQueryArgs.caller === "EventResult") {
            updateCard(resultSelectionUrls["resultCount"], updateResultCount, spinner);
        }
    };

    var validateForm = function () {
        warningNoPageSelected.toggle(!(hasPageSelection || hasMeasuredEventSelection) && lastResultCount != 0);
        warningNoJobGroupSelected.toggle(!hasJobGroupSelection && lastResultCount != 0);
        var doDisable = lastResultCount == 0 || !hasJobGroupSelection || !(hasPageSelection || hasMeasuredEventSelection);
        showButtons.prop("disabled", doDisable);
        showButtons.toggleClass("disabled", doDisable)
    };

    var updateResultCount = function (resultCount) {
        lastResultCount = resultCount;
        warningLongProcessing.toggle(resultCount < 0 && (hasPageSelection || hasMeasuredEventSelection) && hasJobGroupSelection);
        warningNoData.toggle(resultCount == 0);
        validateForm();
    };

    var updateCard = function (url, handler, spinner) {
        if (ajaxRequests[url]) {
            ajaxRequests[url].abort();
        }
        ajaxRequests[url] = $.ajax({
            url: url,
            type: 'GET',
            data: currentQueryArgs,
            dataType: "json",
            success: function (data) {
                var updateWasEnabled = enableUpdates(false);
                handler(data);
                enableUpdates(updateWasEnabled);
                if (spinner) {
                    spinner.stop();
                }
            },
            error: function (e, statusText) {
                if (statusText != "abort") {
                    if (spinner) {
                        spinner.stop();
                    }
                    throw e;
                }
            },
            traditional: true // grails compatible parameter array encoding
        });
    };

    var enableUpdates = function (enable) {
        var oldValue = updatesEnabled;
        updatesEnabled = enable;
        return oldValue;
    };

    init();
    return {};
})();
