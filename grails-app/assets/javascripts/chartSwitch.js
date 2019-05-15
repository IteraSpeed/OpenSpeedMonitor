//= require /urlHandling/urlHelper.js

"use strict";

var OpenSpeedMonitor = OpenSpeedMonitor || {};
OpenSpeedMonitor.ChartModules = OpenSpeedMonitor.ChartModules || {};
OpenSpeedMonitor.ChartModules.UrlHandling = OpenSpeedMonitor.ChartModules.UrlHandling || {};

OpenSpeedMonitor.ChartModules.UrlHandling.ChartSwitch = (function () {

    var oldParameter = {};

    var getJobGroup = function (map) {
        var folder = null;
        if ($("#pageComparisonSelectionCard").length) {
            folder = window.pageComparisonComponent.getSelectedJobGroupIds();
        } else {
            folder = $("#folderSelectHtmlId").val();
        }
        if (folder != null) map["selectedFolder"] = folder
    };

    var getBrowser = function (map) {
        var browserSelect = $("#selectedBrowsersHtmlId");
        if (browserSelect != null) {
            var selectedBrowser = browserSelect.val();
            if (selectedBrowser != null) map["selectedBrowsers"] = selectedBrowser;
            var selectedAllBrosers = $("#selectedAllBrowsers").prop("checked");
            if (selectedAllBrosers != null) map["selectedAllBrowsers"] = selectedAllBrosers;
        }
    };

    var getLocation = function (map) {
        var selectedLocations = $("#selectedLocationsHtmlId_chosen");
        if (selectedLocations != null) {
            var selectedAllLocations = $("#selectedAllLocations").prop("checked");
            if (selectedAllLocations) map["selectedAllLocations"] = selectedAllLocations;
        }
    };

    var getConnectivity = function (map) {
        var selectedConnectivities = $("#selectedConnectivityProfilesHtmlId");
        if (selectedConnectivities != null) {
            var connectivities = selectedConnectivities.val();
            if (connectivities != null) map["selectedConnectivities"] = connectivities;
            var allConnectivies = $("#selectedAllConnectivityProfiles").prop("checked");
            if (allConnectivies) map["selectedAllConnectivityProfiles"] = allConnectivies;
        }
    };

    var getPage = function (map) {
        var pages = null;
        if($("#pageComparisonSelectionCard").length) {
            pages = window.pageComparisonComponent.getSelectedPageIds();
        }else {
         pages = $("#pageSelectHtmlId").val();
        }
        if (pages) map["selectedPages"] = pages;
    };

    var getStep = function (map) {
        var selectedSteps = $("#selectedMeasuredEventsHtmlId");
        if (selectedSteps != null) {
            var values = selectedSteps.val();
            if (values) map["selectedMeasuredEventIds"] = values
        }
    };

    var getTimeFrame = function (map) {
        map["from"] = $("#fromDatepicker").val();
        map["to"] = $("#toDatepicker").val();
    };


    var updateUrls = function (withCurrentSelection) {
        var updatedMap = $.extend({}, oldParameter);
        if (withCurrentSelection) {
            getTimeFrame(updatedMap);
            getJobGroup(updatedMap);
            getPage(updatedMap);
            getBrowser(updatedMap);
            getLocation(updatedMap);
            getConnectivity(updatedMap);
            getStep(updatedMap);
        }
        if (updatedMap["selectedFolder"] == null) {
            updatedMap = {};
        } else {
            if (updatedMap["selectedInterval"] == null) updatedMap["selectedInterval"] = -1;
            if (updatedMap["selectedTimeFrameInterval"] == null) updatedMap["selectedTimeFrameInterval"] = 0;
            var measurand = "DOC_COMPLETE_TIME";
            if ($("#selectedAggrGroupValuesUnCached").val()) {
                measurand = $("#selectedAggrGroupValuesUnCached").val();
            }
            if ($("#measurand").val()) {
                measurand = $("#measurand").val();
            }
            if ($("#selectAggregatorUncachedHtmlId").val()) {
                measurand = $("#selectAggregatorUncachedHtmlId").val();
            }
            if (updatedMap["selectedAggrGroupValuesUnCached"] == null) updatedMap["selectedAggrGroupValuesUnCached"] = measurand;
            if (updatedMap["measurand"] == null) updatedMap["measurand"] = "{\"values\":[\"" + measurand + "\"]}";
        }
        var params = $.param(updatedMap, true);
        var showLinks = true;
        updateUrl("#timeSeriesWithDataLink", OpenSpeedMonitor.urls.eventResultDashboardShowAll + "?" + params, showLinks);
        updateUrl("#aggregationWithDataLink", OpenSpeedMonitor.urls.aggregationShow + "?" + params, showLinks);
        updateUrl("#distributionWithDataLink", OpenSpeedMonitor.urls.distributionChartShow + "?" + params, showLinks);
        updateUrl("#detailAnalysisWithDataLink", OpenSpeedMonitor.urls.detailAnalysisShow + "?" + params, showLinks);
        updateUrl("#resultListWithDataLink", OpenSpeedMonitor.urls.tabularResultPresentation + "?" + params, showLinks);
        updateUrl("#pageComparisonWithDataLink", OpenSpeedMonitor.urls.pageComparisonShow + "?" + params, showLinks)
    };


    var updateUrl = function (selector, newUrl, showLink) {
        if (!showLink) {
            $(selector).addClass("hidden");
        } else {
            $(selector).attr("href", newUrl);
            $(selector).removeClass("hidden");
        }
    };

    var init = function () {
        var oldParameter = getOldParameter();

        if (oldParameter["selectedPages"] == null && oldParameter["selectedMeasuredEventIds"] != null) {
            fetchPages(oldParameter["selectedMeasuredEventIds"]);
        } else {
            updateUrls(false);
        }
        $(window).on("historyStateChanged", function () {
            updateUrls(true);
        });
        // $('#graphButtonHtmlId').on('click', function(){updateUrls(true)});
        // $('#show-button').on('click', function(){updateUrls(true)});
    };

    var getOldParameter = function () {
        var urlParameter = OpenSpeedMonitor.ChartModules.UrlHandling.UrlHelper.getUrlParameter();
        oldParameter["selectedFolder"] = urlParameter["selectedFolder"];
        oldParameter["selectedBrowsers"] = urlParameter["selectedBrowsers"];
        oldParameter["selectedAllBrowsers"] = urlParameter["selectedAllBrowsers"];
        oldParameter["selectedAllLocations"] = urlParameter["selectedAllLocations"];
        oldParameter["selectedConnectivities"] = urlParameter["selectedConnectivities"];
        oldParameter["selectedAllConnectivityProfiles"] = urlParameter["selectedAllConnectivityProfiles"];
        oldParameter["selectedPages"] = urlParameter["selectedPages"];
        oldParameter["selectedMeasuredEventIds"] = urlParameter["selectedMeasuredEventIds"];
        oldParameter["selectedInterval"] = urlParameter["selectedInterval"];
        oldParameter["selectedTimeFrameInterval"] = urlParameter["selectedTimeFrameInterval"];
        oldParameter["from"] = urlParameter["from"];
        oldParameter["to"] = urlParameter["to"];
        return oldParameter;
    };

    var fetchPages = function (measuredEvents) {
        $.ajax({
            url: OpenSpeedMonitor.urls.getPagesForMeasuredEvents,
            data: {"measuredEventList": measuredEvents},
            success: function (data) {
                oldParameter["selectedPages"] = JSON.parse(data);
                $("#pageSelectHtmlId").val(oldParameter["selectedPages"]);
                updateUrls(false);
            },
            traditional: true
        });
    };

    init();

    return {
        getJobGroup: getJobGroup,
        getPage: getPage,
        getTimeFrame: getTimeFrame,
        updateUrls: updateUrls
    };
})();
