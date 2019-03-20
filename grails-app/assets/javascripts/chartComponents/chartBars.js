//= require /node_modules/d3/d3.min.js
//= require common.js
//= require_self

"use strict";

var OpenSpeedMonitor = OpenSpeedMonitor || {};
OpenSpeedMonitor.ChartComponents = OpenSpeedMonitor.ChartComponents || {};

OpenSpeedMonitor.ChartComponents.ChartBars = (function () {
    var data = [];
    var minValue = 0;
    var maxValue = 10000;
    var height = 500;
    var width = 1000;
    var barBand = OpenSpeedMonitor.ChartComponents.common.barBand;
    var barColor = "#1660a7";
    var individualColors = false;
    var transitionDuration = OpenSpeedMonitor.ChartComponents.common.transitionDuration;
    var isRestrained = false;
    var forceSignInLabel = false;
    var highlightId;
    var eventHandlers = {};

    var setData = function (componentData) {
        data = componentData.values || data;
        minValue = (componentData.min !== undefined) ? componentData.min : minValue;
        maxValue = (componentData.max !== undefined) ? componentData.max : maxValue;
        height = componentData.height || height;
        width = componentData.width || width;
        barColor = componentData.color || barColor;
        individualColors = componentData.individualColors || individualColors;
        forceSignInLabel = (componentData.forceSignInLabel !== undefined) ? componentData.forceSignInLabel : forceSignInLabel;
        isRestrained = (componentData.isRestrained !== undefined) ? componentData.isRestrained : isRestrained;
        highlightId = highlightId !== componentData.highLightId ? componentData.highLightId || highlightId : undefined;
    };

    var render = function (selection, isAggregationValueChange) {
        var xScale = d3.scale.linear().range([0, width]);
        var yScale = d3.scale.ordinal().rangeBands([0, height]);

        xScale.domain([minValue, maxValue]);
        yScale.domain(data.map(function (d) {
            return d.id;
        }));
        var bars = selection.selectAll(".bar").data(data, function (d) {
            return d.id;
        });
        renderExit(bars.exit());
        renderEnter(bars.enter(), yScale);
        renderUpdate(bars, xScale, yScale, isAggregationValueChange);
    };

    var renderEnter = function (enterSelection) {
        var bars = enterSelection.append("g")
            .attr("class", "bar");
        bars.append("rect")
            .attr("class", "bar-rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", barBand)
            .each(function (d) {
                var color = individualColors ? d.color : barColor;
                d3.select(this).attr("fill", color);
            });
        bars.append("text")
            .attr("class", "bar-value")
            .attr("dominant-baseline", "middle")
            .style("fill", "white")
            .style("font-weight", "bold");
    };

    var renderUpdate = function (updateSelection, xScale, yScale, isAggregationValueChange) {
        var valueLabelOffset = 10;
        updateSelection
            .on("mouseover", function (data) {
                callEventHandler("mouseover", data)
            })
            .on("mouseout", function (data) {
                callEventHandler("mouseout", data)
            })
            .on("click", function (data) {
                callEventHandler("click", data)
            });

        updateSelection.select(".bar-value").text(function (d) {
            if (d.value !== null) {
                var prefix = d.showLabelOnTop ? d.label + ": " : "";
                prefix = prefix + (d.value > 0 && forceSignInLabel ? "+" : "");
                return prefix + formatValue(d.value) + " " + d.unit;
            } else {
                return ''
            }
        });

        var transition;
        var xTransition;
        if (isAggregationValueChange) {
            xTransition = updateSelection.transition().duration(transitionDuration);
            transition = xTransition;
        } else {
            xTransition = updateSelection;
            transition = updateSelection
                .transition()
                .duration(transitionDuration);
        }

        xTransition.select(".bar-rect")
            .attr("x", function (d) {
                return barStart(xScale, d.value)
            })
            .attr("width", function (d) {
                return barWidth(xScale, d.value);
            });
        xTransition.select(".bar-value")
            .attr("x", function (d) {
                return (d.value < 0) ? (barStart(xScale, d.value) + valueLabelOffset) : (barEnd(xScale, d.value) - valueLabelOffset);
            });

        transition.style("opacity", getOpacity);
        transition.select(".bar-rect")
            .style("opacity", function (d) {
                return !(d.id === highlightId || !highlightId) ? 0.2 : 1;
            })
            .attr("y", function (d) {
                return yScale(d.id)
            })
            .each(function (d) {
                var color = individualColors ? d.color : barColor;
                d3.select(this).attr("fill", color);
            });
        transition.select(".bar-value")
            .attr("y", function (d) {
                return yScale(d.id) + barBand / 2;
            })
            .attr("text-anchor", function (d) {
                return (d.value < 0) ? "start" : "end";
            })
            .style("opacity", function (d) {
                return ((this.getComputedTextLength() + 2 * valueLabelOffset) > barWidth(xScale, d.value)) ? 0 : 1;
            });
    };

    var barEnd = function (xScale, value) {
        return (value < 0) ? xScale(0) : xScale(value);
    };

    var barStart = function (xScale, value) {
        return (value < 0) ? xScale(value) : xScale(0);
    };

    var barWidth = function (xScale, value) {
        return value === null ? 0 : (barEnd(xScale, value) - barStart(xScale, value));
    };

    var renderExit = function (exitSelection) {
        var exitTransition = exitSelection
            .transition()
            .duration(transitionDuration);
        exitTransition
            .style("opacity", 0)
            .remove();
    };

    var formatValue = function (value) {
        var precision = (maxValue >= 1000 || minValue <= -1000) ? 0 : 2;
        return parseFloat(value).toFixed(precision).toString();
    };

    var callEventHandler = function (eventType, bar) {
        if (eventHandlers[eventType]) {
            eventHandlers[eventType](bar);
        }
    };

    var registerEventHandler = function (eventType, eventHandler) {
        eventHandlers[eventType] = eventHandler;
    };

    var getOpacity = function () {
        return isRestrained ? 0.2 : 1
    };

    var setOpacityFunction = function (func) {
        getOpacity = func;
    };

    return {
        render: render,
        setData: setData,
        on: registerEventHandler,
        setOpacitiyFunction: setOpacityFunction
    };
});
