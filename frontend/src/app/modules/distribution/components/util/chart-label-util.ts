export default class ChartLabelUtil {
  static groupingDelimiter = ' | ';
  static delimiter = ', ';

  static processWith(series): ChartLabelProcessing {
    return new ChartLabelProcessing(series);
  }
}

class ChartLabelProcessing {
  seriesData = null;
  uniquePages = [];
  uniqueJobGroups = [];
  uniqueMeasurands = [];
  uniqueBrowsers = [];

  constructor(series) {
    this.seriesData = series;
    this.deduceUniqueEntries();
  }

  deduceUniqueEntries(): void {
    this.seriesData.forEach(series => {
      if (series.grouping && !series.page && !series.jobGroup && !series.browser) {
        const splittedIdentifier = series.grouping.split(ChartLabelUtil.groupingDelimiter);
        series.page = splittedIdentifier[0];
        series.jobGroup = splittedIdentifier[1];
        series.browser = splittedIdentifier[2];
      }

      if (series.page && this.uniquePages.indexOf(series.page) === -1) {
        this.uniquePages.push(series.page);
      }
      if (series.jobGroup && this.uniqueJobGroups.indexOf(series.jobGroup) === -1) {
        this.uniqueJobGroups.push(series.jobGroup);
      }
      if (series.measurand && this.uniqueMeasurands.indexOf(series.measurand) === -1) {
        this.uniqueMeasurands.push(series.measurand);
      }
      if (series.browser && this.uniqueBrowsers.indexOf(series.browser) === -1) {
        this.uniqueBrowsers.push(series.browser);
      }
    });
  }

  setLabelInSeriesData(omitMeasurands): void {
    this.seriesData.forEach(series => {
      const labelParts = [];
      if (this.uniquePages.length > 1) {
        labelParts.push(series.page);
      }
      if (this.uniqueJobGroups.length > 1) {
        labelParts.push(series.jobGroup);
      }
      if (!omitMeasurands && this.uniqueMeasurands.length > 1) {
        labelParts.push(series.measurand);
      }
      if (this.uniqueBrowsers.length > 1) {
        labelParts.push(series.browser);
      }
      series.label = labelParts.join(ChartLabelUtil.delimiter);
    });
  }

  getCommonLabelParts(omitMeasurands = null): string {
    const commonPartsHeader = [];
    if (this.uniqueJobGroups.length === 1) {
      commonPartsHeader.push(this.uniqueJobGroups[0]);
    }
    if (this.uniquePages.length === 1) {
      commonPartsHeader.push(this.uniquePages[0]);
    }
    if (this.uniqueMeasurands.length === 1 && !omitMeasurands) {
      commonPartsHeader.push(this.uniqueMeasurands[0]);
    }
    return commonPartsHeader.join(ChartLabelUtil.delimiter);
  }

  getSeriesWithShortestUniqueLabels(): void {
    this.setLabelInSeriesData(this.seriesData);
  }
}
