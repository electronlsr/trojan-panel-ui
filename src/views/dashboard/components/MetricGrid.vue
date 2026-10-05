<template>
  <section
    class="dashboard-metrics"
    :aria-label="$t('modern.dashboard.overview')"
    :aria-busy="loading"
  >
    <article
      v-for="metric in metrics"
      :key="metric.key"
      class="dashboard-metric"
      :class="'metric-' + metric.tone"
    >
      <div class="metric-topline">
        <span class="metric-label">{{ metric.label }}</span>
        <span class="metric-icon" aria-hidden="true"
          ><i :class="metric.icon"
        /></span>
      </div>
      <span v-if="loading" class="dashboard-skeleton metric-skeleton" />
      <p
        v-else
        class="metric-value"
        :class="{
          'metric-value-warning': metric.warning,
          'metric-value-date': metric.date
        }"
      >
        {{ metric.value }}
      </p>
      <p class="metric-caption">{{ metric.hint }}</p>
    </article>
  </section>
</template>

<script>
export default {
  name: 'MetricGrid',
  props: {
    metrics: { type: Array, required: true },
    loading: Boolean
  }
}
</script>
