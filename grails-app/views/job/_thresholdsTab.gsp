<g:if test="${job.id != null}">
    <div class="thresholdContent">
        <osm-job-threshold data-job-id="${job?.id}"
                           data-job-scriptId="${job?.script?.id}"
                           data-module-path="src/app/modules/job-threshold/job-threshold.module#ThresholdModule"></osm-job-threshold>
    </div>
</g:if>

