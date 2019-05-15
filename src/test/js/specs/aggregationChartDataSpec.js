describe("aggregationChartData data transformation", function () {
    var aggregationData = null;
    var width = 1000;

    class SeriesBuilder {
        constructor() {
            this._hasComparativeData = false;
            this._series = {
                aggregationValue: "avg",
                measurandGroup: "UNKNOWN",
                unit: "?",
                measurand: "DOC_COMPLETE_TIME",
                measurandLabel: "DOC_COMPLETE_TIME_label",
                jobGroup: "TestJobGroup",
                page: "TestPage",
                value: 1.0,
                valueComparative: null
            };
        }

        makeDocComplete() {
            return this.makeLoadTime().measurand("DOC_COMPLETE_TIME");
        };

        makeSpeedIndex() {
            return this.makeLoadTime().measurand("SPEED_INDEX");
        };

        makeTTFB() {
            return this.makeLoadTime().measurand("FIRST_BYTE");
        }

        makeIncomingBytesFullyLoaded() {
            return this.makeRequestSize().measurand("FULLY_LOADED_INCOMING_BYTES");
        };

        makeRequestsDocComplete() {
            return this.makeRequestCounts().measurand("DOC_COMPLETE_REQUESTS");
        }

        makeCustomerSatisfaction() {
            return this.makePercentages().measurand("CS_BY_WPT_DOC_COMPLETE");
        }

        makeRequestSize() {
            this._series.measurandGroup = "REQUEST_SIZES";
            this._series.unit = "MB";
            return this;
        };

        makeRequestCounts() {
            this._series.measurandGroup = "REQUEST_COUNTS";
            this._series.unit = "#";
            return this;
        };

        makePercentages() {
            this._series.measurandGroup = "PERCENTAGES";
            this._series.unit = "%";
            return this;
        };

        makeLoadTime() {
            this._series.measurandGroup = "LOAD_TIMES";
            this._series.unit = "ms";
            return this;
        };

        measurand(measurand) {
            this._series.measurand = measurand;
            this._series.measurandLabel = measurand + "_label";
            return this;
        };

        jobGroup(jobGroup) {
            this._series.jobGroup = jobGroup;
            return this;
        };

        page(page) {
            this._series.page = page;
            return this;
        };

        value(value) {
            this._series.value = value;
            return this;
        };

        valueComparative(valueComparative) {
            this._series.valueComparative = valueComparative;
            return this;
        };

        build() {
            return Object.assign({}, this._series);
        };

        transformBarDataToRawData(listWithValues) {
            listWithValues.forEach(function (it) {
                it['avg'] = it.value;
                it['aggregationValue'] = 'avg';
                it['valueComparative'] = null;
                delete it.value;
            })
        };
    }

    beforeEach(function () {
        $(document.body).append($("<svg width='" + width + "' />"));
        aggregationData = OpenSpeedMonitor.ChartModules.AggregationData(d3.select("svg"));
    });

    it("getDataForHeader should return a label with job group and page for one if equal for all series", function () {
        aggregationData.setData({
            series: [
                new SeriesBuilder().makeDocComplete().jobGroup("TestGroup").page("TestPage").build(),
                new SeriesBuilder().makeSpeedIndex().jobGroup("TestGroup").page("TestPage").build()
            ]
        });
        expect(aggregationData.getDataForHeader().text).toEqual("TestGroup, TestPage - Average");
    });

    it("getDataForHeader should return a label with job group if jobGroup is equal for all series", function () {
        aggregationData.setData({
            series: [
                new SeriesBuilder().makeDocComplete().jobGroup("TestGroup").page("TestPage").build(),
                new SeriesBuilder().makeSpeedIndex().jobGroup("TestGroup").page("TestPage").build(),
                new SeriesBuilder().makeDocComplete().jobGroup("TestGroup").page("TestPage2").build()
            ]
        });
        expect(aggregationData.getDataForHeader().text).toEqual("TestGroup - Average");
    });

    it("getDataForHeader should return a label with page if page is equal for all series", function () {
        aggregationData.setData({
            series: [
                new SeriesBuilder().makeDocComplete().jobGroup("TestGroup1").page("TestPage").build(),
                new SeriesBuilder().makeDocComplete().jobGroup("TestGroup2").page("TestPage").build()
            ]
        });
        expect(aggregationData.getDataForHeader().text).toEqual("TestPage - Average");
    });

    it("hasStackedBars simply returns the internal boolean value", function () {
        expect(aggregationData.hasStackedBars()).toBe(true);
        aggregationData.setData({stackBars: false});
        expect(aggregationData.hasStackedBars()).toBe(false);
        aggregationData.setData({});
        expect(aggregationData.hasStackedBars()).toBe(false);
        aggregationData.setData({stackBars: true});
        expect(aggregationData.hasStackedBars()).toBe(true);
    });

    it("can determine if we have load times", function () {
        var incomingBytes = new SeriesBuilder().makeIncomingBytesFullyLoaded().build();
        var customerSatisfaction = new SeriesBuilder().makeCustomerSatisfaction().build();
        var requestCounts = new SeriesBuilder().makeRequestsDocComplete().build();
        var speedIndex = new SeriesBuilder().makeSpeedIndex().build();

        aggregationData.setData({
            series: [incomingBytes, customerSatisfaction, requestCounts]
        });
        expect(aggregationData.hasLoadTimes()).toBe(false);

        aggregationData.setData({
            series: [incomingBytes, customerSatisfaction, requestCounts, speedIndex]
        });
        expect(aggregationData.hasLoadTimes()).toBe(true);
    });

    it("can return all measurands", function () {
        aggregationData.setData({
            series: [
                new SeriesBuilder().makeIncomingBytesFullyLoaded().build(),
                new SeriesBuilder().makeCustomerSatisfaction().build(),
                new SeriesBuilder().makeRequestsDocComplete().build(),
                new SeriesBuilder().makeSpeedIndex().build(),
                new SeriesBuilder().makeSpeedIndex().jobGroup("group2").build() // twice to check for deduplication
            ]
        });
        var expectedMeasurands = ['CS_BY_WPT_DOC_COMPLETE', 'DOC_COMPLETE_REQUESTS', 'FULLY_LOADED_INCOMING_BYTES', 'SPEED_INDEX'];
        expect(aggregationData.getAllMeasurands().sort()).toEqual(expectedMeasurands.sort());
    });

    it("getAllMeasurands contains deterioration and improvement if comparative values are given", function () {
        aggregationData.setData(
            {
                hasComparativeData: true, series: [
                    new SeriesBuilder().makeSpeedIndex().page("page1").value(800).valueComparative(2000).build(),
                    new SeriesBuilder().makeSpeedIndex().page("page2").value(900).valueComparative(500).build()
                ]
            });
        var expectedMeasurands = ['SPEED_INDEX', 'SPEED_INDEX_improvement', 'SPEED_INDEX_deterioration'];
        expect(aggregationData.getAllMeasurands().sort()).toEqual(expectedMeasurands.sort());
    });

    it("getDataForBarScore determines correct min and max load_time values, starting from 0", function () {
        aggregationData.setData({
            series: [
                new SeriesBuilder().makeIncomingBytesFullyLoaded().value(5000).build(),
                new SeriesBuilder().makeTTFB().value(2000).build(),
                new SeriesBuilder().makeSpeedIndex().value(1500).build()
            ]
        });
        expect(aggregationData.getDataForBarScore().min).toBe(0);
        expect(aggregationData.getDataForBarScore().max).toBe(2000);
    });

    it("getDataForBarScore determines correct min and max load_time values, starting from negative min", function () {
        aggregationData.setData({
            series: [
                new SeriesBuilder().makeTTFB().value(2000).build(),
                new SeriesBuilder().makeSpeedIndex().value(-10).build()
            ]
        });
        expect(aggregationData.getDataForBarScore().min).toBe(-10);
        expect(aggregationData.getDataForBarScore().max).toBe(2000);
    });

    it("getDataForBarScore determines correct min and max load_time values, ending at 0", function () {
        aggregationData.setData({
            series: [
                new SeriesBuilder().makeIncomingBytesFullyLoaded().value(-5000).build(),
                new SeriesBuilder().makeTTFB().value(-2000).build(),
                new SeriesBuilder().makeSpeedIndex().value(-10).build()
            ]
        });
        expect(aggregationData.getDataForBarScore().min).toBe(-2000);
        expect(aggregationData.getDataForBarScore().max).toBe(0);
    });

    it("sortByMeasurandOrder sorts a list of measurands by a fixed order, unknowns being last", function () {
        var sorted = aggregationData.sortByMeasurandOrder([
            'CS_BY_WPT_DOC_COMPLETE',
            'DOC_COMPLETE_REQUESTS',
            'FULLY_LOADED_INCOMING_BYTES',
            'foo_bar',
            'FIRST_BYTE',
            'VISUALLY_COMPLETE'
        ]);
        expect(sorted).toEqual([
            'CS_BY_WPT_DOC_COMPLETE',
            'VISUALLY_COMPLETE',
            'FIRST_BYTE',
            'FULLY_LOADED_INCOMING_BYTES',
            'DOC_COMPLETE_REQUESTS',
            'foo_bar'
        ]);
    });

    it("getDataForLegend returns an object containing the sorted entries with measurand labels", function () {
        aggregationData.setData({
            series: [
                new SeriesBuilder().makeIncomingBytesFullyLoaded().page("page1").build(),
                new SeriesBuilder().makeTTFB().page("page1").build(),
                new SeriesBuilder().makeTTFB().page("page2").build(),
                new SeriesBuilder().makeSpeedIndex().page("page1").build(),
                new SeriesBuilder().makeSpeedIndex().page("page2").build()
            ]
        });
        var legendData = aggregationData.getDataForLegend();
        expect(legendData.entries.length).toBe(3);
        expect(legendData.entries[0].id).toBe("SPEED_INDEX");
        expect(legendData.entries[0].label).toBe("SPEED_INDEX_label");
        expect(legendData.entries[0].color).toBeDefined();
        expect(legendData.entries[1].id).toBe("FIRST_BYTE");
        expect(legendData.entries[1].label).toBe("FIRST_BYTE_label");
        expect(legendData.entries[1].color).toBeDefined();
        expect(legendData.entries[2].id).toBe("FULLY_LOADED_INCOMING_BYTES");
        expect(legendData.entries[2].label).toBe("FULLY_LOADED_INCOMING_BYTES_label");
        expect(legendData.entries[2].color).toBeDefined();
    });

    it("getDataForLegend contains deterioration and improvement if defined", function () {
        aggregationData.setData({
            hasComparativeData: true, series: [
                new SeriesBuilder().makeTTFB().page("page1").value(1000).valueComparative(2000).build(),
                new SeriesBuilder().makeTTFB().page("page2").value(1000).valueComparative(500).build()
            ], i18nMap: {
                "comparativeImprovement": "improvementLabel",
                "comparativeDeterioration": "deteriorationLabel"
            }
        });
        var colorScale = OpenSpeedMonitor.ChartColorProvider().getColorscaleForTrafficlight();
        var legendData = aggregationData.getDataForLegend();
        expect(legendData.entries.length).toBe(3);
        expect(legendData.entries[0].id).toBe("FIRST_BYTE");
        expect(legendData.entries[0].label).toBe("FIRST_BYTE_label");
        expect(legendData.entries[0].color).toBeDefined();
        expect(legendData.entries[1].id).toBe("FIRST_BYTE_improvement");
        expect(legendData.entries[1].label).toBe("improvementLabel");
        expect(legendData.entries[1].color).toEqual(colorScale("good"));
        expect(legendData.entries[2].id).toBe("FIRST_BYTE_deterioration");
        expect(legendData.entries[2].label).toBe("deteriorationLabel");
        expect(legendData.entries[2].color).toEqual(colorScale("bad"));
    });

    it("getDataForLegend contains only deterioration if values are only higher", function () {
        aggregationData.setData({
            hasComparativeData: true, series: [
                new SeriesBuilder().makeTTFB().page("page2").value(1000).valueComparative(500).build()
            ], i18nMap: {
                "comparativeDeterioration": "deteriorationLabel"
            }
        });
        var colorScale = OpenSpeedMonitor.ChartColorProvider().getColorscaleForTrafficlight();
        var legendData = aggregationData.getDataForLegend();
        expect(legendData.entries.length).toBe(2);
        expect(legendData.entries[0].id).toBe("FIRST_BYTE");
        expect(legendData.entries[0].label).toBe("FIRST_BYTE_label");
        expect(legendData.entries[0].color).toBeDefined();
        expect(legendData.entries[1].id).toBe("FIRST_BYTE_deterioration");
        expect(legendData.entries[1].label).toBe("deteriorationLabel");
        expect(legendData.entries[1].color).toEqual(colorScale("bad"));
    });

    it("getDataForLegend higher value in cs is improvement", function () {
        aggregationData.setData({
            hasComparativeData: true, series: [
                new SeriesBuilder().makeCustomerSatisfaction().page("page1").value(50).valueComparative(10).build()
            ], i18nMap: {
                "comparativeImprovement": "improvementLabel"
            }
        });
        var colorScale = OpenSpeedMonitor.ChartColorProvider().getColorscaleForTrafficlight();
        var legendData = aggregationData.getDataForLegend();
        expect(legendData.entries.length).toBe(2);
        expect(legendData.entries[0].id).toBe("CS_BY_WPT_DOC_COMPLETE");
        expect(legendData.entries[0].label).toBe("CS_BY_WPT_DOC_COMPLETE_label");
        expect(legendData.entries[0].color).toBeDefined();
        expect(legendData.entries[1].id).toBe("CS_BY_WPT_DOC_COMPLETE_improvement");
        expect(legendData.entries[1].label).toBe("improvementLabel");
        expect(legendData.entries[1].color).toEqual(colorScale("good"));
    });

    it("getDataForSideLabels has empty texts for same pages and same job groups", function () {
        aggregationData.setData({
            series: [
                new SeriesBuilder().makeDocComplete().jobGroup("TestGroup").page("TestPage").build(),
                new SeriesBuilder().makeSpeedIndex().jobGroup("TestGroup").page("TestPage").build()
            ]
        });
        expect(aggregationData.getDataForSideLabels().labels).toEqual([""]);
    });

    it("getDataForSideLabels contains pages names for same job groups", function () {
        aggregationData.setData({
            series: [
                new SeriesBuilder().makeDocComplete().jobGroup("TestGroup").page("page1").build(),
                new SeriesBuilder().makeDocComplete().jobGroup("TestGroup").page("page2").build()
            ]
        });
        expect(aggregationData.getDataForSideLabels().labels).toEqual(["page1", "page2"]);
    });

    it("getDataForSideLabels contains job group names for same pages", function () {
        aggregationData.setData({
            series: [
                new SeriesBuilder().makeDocComplete().jobGroup("group1").page("page").build(),
                new SeriesBuilder().makeDocComplete().jobGroup("group2").page("page").build()
            ]
        });
        expect(aggregationData.getDataForSideLabels().labels).toEqual(["group1", "group2"]);
    });

    it("getDataForSideLabels contains job group and page names for different values", function () {
        aggregationData.setData({
            series: [
                new SeriesBuilder().makeDocComplete().jobGroup("group1").page("page1").build(),
                new SeriesBuilder().makeDocComplete().jobGroup("group2").page("page2").build()
            ]
        });
        expect(aggregationData.getDataForSideLabels().labels).toEqual(["page1, group1", "page2, group2"]);
    });

    it("getDataForBars returns data for the selected measurand, including value for missing series", function () {
        var page1DocComplete = new SeriesBuilder().makeDocComplete().page("page1").value(2000).build();
        var page1TTFB = new SeriesBuilder().makeTTFB().page("page1").value(5000).build();
        var page1Requests = new SeriesBuilder().makeRequestsDocComplete().page("page1").value(10).build();
        var page2DocComplete = new SeriesBuilder().makeDocComplete().page("page2").value(1000).build();
        var page2Requests = new SeriesBuilder().makeRequestsDocComplete().page("page2").value(9).build();
        aggregationData.setData({
            series: [page1DocComplete, page2DocComplete, page1TTFB, page1Requests, page2Requests]
        });
        var docCompleteData = aggregationData.getDataForBars("DOC_COMPLETE_TIME");
        var ttfbData = aggregationData.getDataForBars("FIRST_BYTE");
        var requestsData = aggregationData.getDataForBars("DOC_COMPLETE_REQUESTS");

        expect(docCompleteData.max).toBe(5000);
        expect(docCompleteData.min).toBe(0);
        new SeriesBuilder().transformBarDataToRawData(docCompleteData.values);
        expect(docCompleteData.values).toEqual([page1DocComplete, page2DocComplete]);

        expect(requestsData.max).toBe(10);
        expect(requestsData.min).toBe(0);
        new SeriesBuilder().transformBarDataToRawData(requestsData.values);
        expect(requestsData.values).toEqual([page1Requests, page2Requests]);

        expect(ttfbData.max).toBe(5000);
        expect(ttfbData.min).toBe(0);
        new SeriesBuilder().transformBarDataToRawData(ttfbData.values);
        expect(ttfbData.values).toEqual([page1TTFB,
            {
                page: 'page2',
                jobGroup: 'TestJobGroup',
                id: 'TestJobGroup;page2',
                avg: null,
                valueComparative: null,
                aggregationValue: 'avg'
            }]);
    });

    it("getDataForBars contains data for improvement and deterioration if defined", function () {
        aggregationData.setData({
            hasComparativeData: true, series: [
                new SeriesBuilder().makeTTFB().page("page1").value(1000).valueComparative(2500).build(),
                new SeriesBuilder().makeTTFB().page("page2").value(1200).valueComparative(500).build()
            ]
        });
        var ttfbData = aggregationData.getDataForBars("FIRST_BYTE");
        var ttfbImprovementData = aggregationData.getDataForBars("FIRST_BYTE_improvement");
        var ttfbDeteriorationData = aggregationData.getDataForBars("FIRST_BYTE_deterioration");
        expect(ttfbData.min).toBe(-1500);
        expect(ttfbData.max).toBe(1200);
        expect(ttfbData.values[0].value).toBe(1200);
        expect(ttfbData.values[1].value).toBe(1000);

        expect(ttfbImprovementData.min).toBe(-1500);
        expect(ttfbImprovementData.max).toBe(1200);
        expect(ttfbImprovementData.values[0].value).toBeNull();
        expect(ttfbImprovementData.values[1].value).toBe(-1500);

        expect(ttfbDeteriorationData.min).toBe(-1500);
        expect(ttfbDeteriorationData.max).toBe(1200);
        expect(ttfbDeteriorationData.values[0].value).toBe(700);
        expect(ttfbDeteriorationData.values[1].value).toBeNull();
    });

    it("data is sorted ascending by highest order measurand", function() {
        aggregationData.setData({
            series: [
                new SeriesBuilder().makeDocComplete().page("page1").value(2000).build(),
                new SeriesBuilder().makeTTFB().page("page1").value(5000).build(),
                new SeriesBuilder().makeRequestsDocComplete().page("page1").value(9000).build(),
                new SeriesBuilder().makeDocComplete().page("page2").value(1000).build(),
                new SeriesBuilder().makeTTFB().page("page1").value(7000).build(),
                new SeriesBuilder().makeRequestsDocComplete().page("page2").value(9900).build()
            ],
            selectedFilter: "asc"
        });
        expect(aggregationData.getDataForSideLabels().labels).toEqual(["page2", "page1"]);
        expect(aggregationData.getDataForBars("FIRST_BYTE").values.map(v => v.page)).toEqual(["page2", "page1"]);
        expect(aggregationData.getDataForBars("DOC_COMPLETE_TIME").values.map(v => v.page)).toEqual(["page2", "page1"]);
        expect(aggregationData.getDataForBars("DOC_COMPLETE_REQUESTS").values.map(v => v.page)).toEqual(["page2", "page1"]);
    });

    it("data is sorted descending by highest order measurand", function() {
        aggregationData.setData({
            series: [
                new SeriesBuilder().makeDocComplete().page("page1").value(2000).build(),
                new SeriesBuilder().makeTTFB().page("page1").value(5000).build(),
                new SeriesBuilder().makeRequestsDocComplete().page("page1").value(9000).build(),
                new SeriesBuilder().makeDocComplete().page("page2").value(1000).build(),
                new SeriesBuilder().makeTTFB().page("page1").value(7000).build(),
                new SeriesBuilder().makeRequestsDocComplete().page("page2").value(9900).build()
            ],
            selectedFilter: "desc"
        });
        expect(aggregationData.getDataForSideLabels().labels).toEqual(["page1", "page2"]);
        expect(aggregationData.getDataForBars("FIRST_BYTE").values.map(v => v.page)).toEqual(["page1", "page2"]);
        expect(aggregationData.getDataForBars("DOC_COMPLETE_TIME").values.map(v => v.page)).toEqual(["page1", "page2"]);
        expect(aggregationData.getDataForBars("DOC_COMPLETE_REQUESTS").values.map(v => v.page)).toEqual(["page1", "page2"]);
    });

    it("data is can be filtered and sorted be predefined filterRule; adding missing series", function() {
        aggregationData.setData({
            series: [
                new SeriesBuilder().makeDocComplete().page("page1").jobGroup("group").value(10).build(),
                new SeriesBuilder().makeSpeedIndex().page("page1").jobGroup("group").value(20).build(),
                new SeriesBuilder().makeSpeedIndex().page("page2").jobGroup("group").value(200).build(),
                new SeriesBuilder().makeDocComplete().page("page3").jobGroup("group").value(1000).build(),
                new SeriesBuilder().makeSpeedIndex().page("page3").jobGroup("group").value(2000).build(),
                new SeriesBuilder().makeDocComplete().page("page4").jobGroup("group").value(10000).build(),
                new SeriesBuilder().makeSpeedIndex().page("page4").jobGroup("group").value(20000).build(),
                new SeriesBuilder().makeDocComplete().page("page4").jobGroup("different").value(15000).build(),
                new SeriesBuilder().makeSpeedIndex().page("page4").jobGroup("different").value(25000).build()
            ],
            filterRules: {
                "customFilter": [
                    {page: "page3", jobGroup: "group"},
                    {page: "page2", jobGroup: "group"},
                    {page: "page4", jobGroup: "different"}
                ]
            },
            selectedFilter: "customFilter"
        });

        expect(aggregationData.getDataForSideLabels().labels).toEqual(["page3, group", "page2, group", "page4, different"]);

        var docCompleteValues = aggregationData.getDataForBars("DOC_COMPLETE_TIME").values.map(v => [v.page, v.jobGroup, v.value]);
        expect(docCompleteValues).toEqual([["page3", "group", 1000], ["page2", "group", null], ["page4", "different", 15000]]);

        var speedIndexDataValues = aggregationData.getDataForBars("SPEED_INDEX").values.map(v => [v.page, v.jobGroup, v.value]);
        expect(speedIndexDataValues).toEqual([["page3", "group", 2000], ["page2", "group", 200], ["page4", "different", 25000]]);
    });
});
