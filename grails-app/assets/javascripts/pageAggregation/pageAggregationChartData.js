//= require /node_modules/d3/d3.min.js
"use strict";

var OpenSpeedMonitor = OpenSpeedMonitor || {};
OpenSpeedMonitor.ChartModules = OpenSpeedMonitor.ChartModules || {};

OpenSpeedMonitor.ChartModules.PageAggregationData = (function (svgSelection) {
    var svg = svgSelection;
    var chartSideLabelsWidth = 200;
    var chartBarsWidth = 700;
    var fullWidth = chartSideLabelsWidth + chartBarsWidth;
    var chartBarsHeight = 400;
    var allMeasurandDataMap = {};
    var measurandGroupDataMap = {};
    var sideLabelData = [];
    var dataOrder = [];
    var filterRules = [];
    var rawSeries = [];
    var selectedFilter = "desc";
    var headerText = "";
    var stackBars = true;
    var aggregationValue = "avg";
    var comparitiveValue = "";
    var dataAvailalbe = false;
    var i18n = {};
    var dataLength = 0;

    var setData = function (data) {
        transformAndMergeData(data);
        aggregationValue = data.aggregationValue !== undefined ? data.aggregationValue : aggregationValue;
        comparitiveValue = aggregationValue + "Comparative";
        filterRules = data.filterRules || filterRules;
        selectedFilter = data.selectedFilter || validateSelectedFilter(selectedFilter);
        i18n = data.i18nMap || i18n;
        if (data.series || data.filterRules || data.selectedFilter || data.aggregationValue) {
            var filteredSeries = filterSeries(rawSeries);
            if (filteredSeries.length === dataLength * 2) filteredSeries.splice(dataLength);
            Array.prototype.push.apply(filteredSeries, extractComparativeValuesAsSeries(filteredSeries));
            measurandGroupDataMap = extractMeasurandGroupData(filteredSeries);
            allMeasurandDataMap = extractMeasurandData(filteredSeries);
            dataOrder = createDataOrder();
            var chartLabelUtils = OpenSpeedMonitor.ChartModules.ChartLabelUtil(dataOrder, data.i18nMap);
            headerText = chartLabelUtils.getCommonLabelParts(true);
            headerText += headerText ? " - " + getAggregationValueLabel() : getAggregationValueLabel();
            sideLabelData = chartLabelUtils.getSeriesWithShortestUniqueLabels(true).map(function (s) {
                return s.label;
            });
        }
        stackBars = data.stackBars !== undefined ? data.stackBars : stackBars;
        fullWidth = getActualSvgWidth();
        chartSideLabelsWidth = d3.max(OpenSpeedMonitor.ChartComponents.utility.getTextWidths(svg, sideLabelData));
        chartBarsWidth = fullWidth - 2 * OpenSpeedMonitor.ChartComponents.common.ComponentMargin - chartSideLabelsWidth;
        chartBarsHeight = calculateChartBarsHeight();
        dataAvailalbe = data.series ? true : dataAvailalbe;
    };

    var validateSelectedFilter = function (selectedFilter) {
        return (selectedFilter === "asc" || selectedFilter === "desc" || filterRules[selectedFilter]) ? selectedFilter : "desc";
    };

    var resetData = function () {
        rawSeries = []
    };

    var addAggregationToSeriesEntry = function (jobGroup, page, browser, measurand, aggregationValue, value, valueComparative) {
        rawSeries.forEach(function (it) {
            if (it.jobGroup === jobGroup && it.page === page && it.measurand === measurand && it.browser === browser) {
                it[aggregationValue] = value;
                if (valueComparative) {
                    it[aggregationValue + 'Comparative'] = valueComparative
                }
            }
        })
    };

    var transformAndMergeData = function (data) {
        if (data.series && (rawSeries.length === 0 || (rawSeries && rawSeries[0].hasOwnProperty(data.series[0].aggregationValue)))) {
            if (rawSeries.length === 0 || (data.series[0].aggregationValue === 'avg' && !rawSeries[0].hasOwnProperty('50'))) {
                rawSeries = data.series;
                dataLength = rawSeries.length;
            }
            rawSeries.forEach(function (it) {
                data.series.forEach(function (newdata) {
                    if (it.jobGroup === newdata.jobGroup && it.page === newdata.page && it.measurand === newdata.measurand && it.browser === newdata.browser) {
                        it[newdata.aggregationValue] = newdata.value;
                        delete it.value;
                    }
                });
                if (data.hasComparativeData) {
                    it[data.series[0].aggregationValue + 'Comparative'] = it.valueComparative;
                    delete it.valueComparative;
                }
            });
        }
        if (data.series && rawSeries && !rawSeries[0].hasOwnProperty(data.series[0].aggregationValue)) {
            data.series.forEach(function (it) {
                if (data.hasComparativeData) {
                    addAggregationToSeriesEntry(it.jobGroup, it.page, it.browser, it.measurand, data.series[0].aggregationValue, it.value, it.valueComparative);
                } else {
                    addAggregationToSeriesEntry(it.jobGroup, it.page, it.browser, it.measurand, data.series[0].aggregationValue, it.value);
                }
            })
        }
    };

    var getAggregationValueLabel = function () {
        if (aggregationValue === 'avg') {
            return 'Average'
        } else {
            return "Percentile: " + aggregationValue + "%"
        }
    };

    var extractComparativeValuesAsSeries = function (series) {
        var comparativeSeries = [];
        series.forEach(function (datum) {
            if (!datum[comparitiveValue]) {
                return;
            }
            var difference = datum[aggregationValue] - datum[comparitiveValue];
            var isImprovement = (datum.measurandGroup === "PERCENTAGES") ? difference > 0 : difference < 0;
            var measurandSuffix = isImprovement ? "improvement" : "deterioration";
            var label = isImprovement ? (i18n.comparativeImprovement || "improvement") : (i18n.comparativeDeterioration || "deterioration");
            comparativeSeries.push({
                jobGroup: datum.jobGroup,
                page: datum.page,
                unit: datum.unit,
                measurandGroup: datum.measurandGroup,
                measurand: datum.measurand + "_" + measurandSuffix,
                measurandLabel: label,
                value: difference,
                isImprovement: isImprovement,
                isDeterioration: !isImprovement
            });
        });
        return comparativeSeries;
    };

    var extractMeasurandData = function (series) {
        var measurandDataMap = d3.nest()
            .key(function (d) {
                return d.measurand;
            })
            .rollup(function (seriesOfMeasurand) {
                var firstValue = seriesOfMeasurand[0];
                var unit = firstValue.unit;
                seriesOfMeasurand.forEach(function (value) {
                    value.id = createSeriesValueId(value);
                });
                return {
                    id: firstValue.measurand,
                    label: firstValue.measurandLabel,
                    measurandGroup: firstValue.measurandGroup,
                    isImprovement: firstValue.isImprovement,
                    isDeterioration: firstValue.isDeterioration,
                    unit: unit,
                    series: seriesOfMeasurand
                };
            }).map(series);
        return applyColorsToMeasurandData(measurandDataMap);
    };

    var applyColorsToMeasurandData = function (measurandDataMap) {
        var colorProvider = OpenSpeedMonitor.ChartColorProvider();
        var colorScales = {};
        var measurands = sortByMeasurandOrder(Object.keys(measurandDataMap));
        measurands.forEach(function (measurand) {
            var measurandData = measurandDataMap[measurand];
            if (measurandData.isImprovement || measurandData.isDeterioration) {
                measurandData.color = colorProvider.getColorscaleForTrafficlight()(measurandData.isImprovement ? "good" : "bad");
            } else {
                var unit = measurandData.unit;
                var hasComparative = measurandGroupDataMap[measurandData.measurandGroup].hasComparative;
                colorScales[unit] = colorScales[unit] || colorProvider.getColorscaleForMeasurandGroup(unit, hasComparative);
                measurandData.color = colorScales[unit](measurand)
            }
        });
        return measurandDataMap;
    };

    var sortByMeasurandOrder = function (measurandList) {
        var measurandOrder = OpenSpeedMonitor.ChartModules.PageAggregationData.MeasurandOrder;
        measurandList.sort(function (a, b) {
            var idxA = measurandOrder.indexOf(a);
            var idxB = measurandOrder.indexOf(b);
            if (idxA < 0) {
                return (idxB < 0) ? 0 : 1;
            }
            return (idxB < 0) ? -1 : (idxA - idxB);
        });
        return measurandList;
    };

    var extractMeasurandGroupData = function (series) {
        return d3.nest()
            .key(function (d) {
                return d.measurandGroup;
            })
            .rollup(function (seriesOfMeasurandGroup) {
                var extent = d3.extent(seriesOfMeasurandGroup, function (entry) {
                    return entry[aggregationValue] || entry.value;
                });
                var hasComparative = seriesOfMeasurandGroup.some(function (value) {
                    return (value.isImprovement || value.isDeterioration);
                });
                return {
                    min: extent[0],
                    max: extent[1],
                    hasComparative: hasComparative
                };
            }).map(series);
    };

    var createDataOrder = function () {
        var filter = (selectedFilter === "asc" || selectedFilter === "desc") ? createSortFilter(selectedFilter) : filterRules[selectedFilter];
        return filter.map(function (datum) {
            return {
                page: datum.page,
                browser: datum.browser,
                jobGroup: datum.jobGroup,
                id: createSeriesValueId(datum)
            };
        });
    };

    var filterSeries = function (series) {
        var filteredSeries = [];
        if (selectedFilter === "asc" || selectedFilter === "desc") {
            Array.prototype.push.apply(filteredSeries, series);
        } else {
            filterRules[selectedFilter].forEach(function (filterEntry) {
                Array.prototype.push.apply(filteredSeries, series.filter(function (datum) {
                    return datum.page === filterEntry.page && datum.jobGroup === filterEntry.jobGroup;
                }));
            });
        }
        return filteredSeries;
    };

    var createSortFilter = function (ascOrdDesc) {
        var seriesForSorting = getMeasurandDataForSorting().series.slice();
        var compareFunction = (ascOrdDesc === "asc") ? d3.ascending : d3.descending;
        seriesForSorting.sort(function (a, b) {
            return compareFunction(a[aggregationValue] ? a[aggregationValue] : -1, b[aggregationValue] ? b[aggregationValue] : -1);
        });
        var longestExistingSeries = Object.values(allMeasurandDataMap).reduce(function (curFilter, measurandData) {
            return (measurandData.series.length > curFilter.length) ? measurandData.series : curFilter;
        }, []);
        if (seriesForSorting.length < longestExistingSeries.length) {
            addMissingValuesToSeries(seriesForSorting, longestExistingSeries);
        }
        return seriesForSorting.map(function (value) {
            return {
                page: value.page,
                jobGroup: value.jobGroup,
                browser: value.browser,
                id: value.id
            }
        });
    };

    var addMissingValuesToSeries = function (series, allValues) {
        var existingIds = {};
        series.forEach(function (value) {
            existingIds[value.id] = true;
        });
        Array.prototype.push.apply(series, allValues.filter(function (value) {
            return !existingIds[value.id];
        }));
        return series;
    };

    var getMeasurandDataForSorting = function () {
        var measurandOrder = OpenSpeedMonitor.ChartModules.PageAggregationData.MeasurandOrder;
        for (var i = 0; i < measurandOrder.length; i++) {
            var curMeasurandData = allMeasurandDataMap[measurandOrder[i]];
            if (curMeasurandData) {
                return curMeasurandData;
            }
        }
        return Object.values(allMeasurandDataMap)[0];
    };

    var getActualSvgWidth = function () {
        return svg.node().getBoundingClientRect().width;
    };

    var calculateChartBarsHeight = function () {
        var barBand = OpenSpeedMonitor.ChartComponents.common.barBand;
        var barGap = OpenSpeedMonitor.ChartComponents.common.barGap;
        var numberOfMeasurands = Object.keys(allMeasurandDataMap).length;
        var numberOfBars = dataOrder.length * (stackBars ? 1 : numberOfMeasurands);
        var gapSize = barGap * ((stackBars || numberOfMeasurands < 2) ? 1 : 2);
        return ((dataOrder.length - 1) * gapSize) + numberOfBars * barBand;
    };

    var getDataForHeader = function () {
        return {
            width: fullWidth,
            text: headerText
        };
    };

    var getDataForBarScore = function () {
        return {
            width: chartBarsWidth,
            min: measurandGroupDataMap["LOAD_TIMES"] ? Math.min(measurandGroupDataMap["LOAD_TIMES"].min, 0) : 0,
            max: measurandGroupDataMap["LOAD_TIMES"] ? Math.max(measurandGroupDataMap["LOAD_TIMES"].max, 0) : 0
        };
    };

    var getDataForLegend = function () {
        return {
            entries: sortByMeasurandOrder(Object.keys(allMeasurandDataMap)).map(function (measurand) {
                var measurandData = allMeasurandDataMap[measurand];
                return {
                    id: measurandData.id,
                    color: measurandData.color,
                    label: measurandData.label
                };
            }),
            width: chartBarsWidth
        };
    };

    var getDataForSideLabels = function () {
        return {
            height: chartBarsHeight,
            labels: sideLabelData
        };
    };

    var getAllMeasurands = function () {
        return Object.keys(allMeasurandDataMap);
    };

    var getDataForBars = function (measurand) {
        var measurandData = allMeasurandDataMap[measurand];
        return {
            id: measurandData.id,
            values: getSortedValuesForBars(measurandData.series),
            color: measurandData.color,
            min: Math.min(measurandGroupDataMap[measurandData.measurandGroup].min, 0),
            max: Math.max(measurandGroupDataMap[measurandData.measurandGroup].max, 0),
            height: chartBarsHeight,
            width: chartBarsWidth,
            forceSignInLabel: measurandData.isDeterioration || measurandData.isImprovement
        }
    };

    var getSortedValuesForBars = function (series) {
        var seriesMap = {};
        series.forEach(function (value) {
            var seriesValue = value[aggregationValue] ? value[aggregationValue] : value.value;
            seriesMap[value.id] = {
                page: value.page,
                jobGroup: value.jobGroup,
                id: value.id,
                value: seriesValue ? seriesValue : 0,
                unit: value.unit,
                measurand: value.measurand,
                measurandGroup: value.measurandGroup,
                measurandLabel: value.measurandLabel
            }
        });
        return dataOrder.map(function (filterEntry) {
            return seriesMap[filterEntry.id] || {
                page: filterEntry.page,
                jobGroup: filterEntry.jobGroup,
                id: filterEntry.id,
                value: null
            }
        });
    };

    var createSeriesValueId = function (value) {
        return value.browser ? value.page + ";" + value.jobGroup + ";" + value.browser : value.page + ";" + value.jobGroup;
    };

    var hasLoadTimes = function () {
        return !!measurandGroupDataMap["LOAD_TIMES"];
    };

    var getChartBarsHeight = function () {
        return chartBarsHeight;
    };

    var getChartSideLabelsWidth = function () {
        return chartSideLabelsWidth;
    };

    var hasStackedBars = function () {
        return stackBars;
    };

    var isDataAvailable = function () {
        return dataAvailalbe;
    };

    return {
        setData: setData,
        resetData: resetData,
        getDataForHeader: getDataForHeader,
        getDataForBarScore: getDataForBarScore,
        getDataForLegend: getDataForLegend,
        getDataForSideLabels: getDataForSideLabels,
        getAllMeasurands: getAllMeasurands,
        isDataAvailable: isDataAvailable,
        getDataForBars: getDataForBars,
        hasLoadTimes: hasLoadTimes,
        getChartBarsHeight: getChartBarsHeight,
        getChartSideLabelsWidth: getChartSideLabelsWidth,
        hasStackedBars: hasStackedBars,
        sortByMeasurandOrder: sortByMeasurandOrder
    }
});
OpenSpeedMonitor.ChartModules.PageAggregationData.MeasurandOrder = [
    "CS_BY_WPT_VISUALLY_COMPLETE",
    "CS_BY_WPT_DOC_COMPLETE",
    "FULLY_LOADED_TIME",
    "VISUALLY_COMPLETE",
    "VISUALLY_COMPLETE_99",
    "VISUALLY_COMPLETE_95",
    "VISUALLY_COMPLETE_90",
    "VISUALLY_COMPLETE_85",
    "CONSISTENTLY_INTERACTIVE",
    "FIRST_INTERACTIVE",
    "SPEED_INDEX",
    "DOC_COMPLETE_TIME",
    "LOAD_TIME",
    "START_RENDER",
    "DOM_TIME",
    "FIRST_BYTE",
    "FULLY_LOADED_INCOMING_BYTES",
    "DOC_COMPLETE_INCOMING_BYTES",
    "FULLY_LOADED_REQUEST_COUNT",
    "DOC_COMPLETE_REQUESTS"
];
