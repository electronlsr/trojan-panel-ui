<template>
  <section class="dashboard-card resource-card" :aria-busy="loading">
    <div class="dashboard-card-heading">
      <div>
        <h2>{{ $t('modern.dashboard.resources') }}</h2>
        <p>{{ $t('modern.dashboard.resourcesDescription') }}</p>
      </div>
      <span class="dashboard-heading-icon" aria-hidden="true"
        ><i class="el-icon-cpu"
      /></span>
    </div>
    <div class="resource-list">
      <div
        v-for="resource in resources"
        :key="resource.key"
        class="resource-row"
      >
        <div class="resource-label">
          <span>{{ resource.label }}</span>
          <span v-if="loading" class="dashboard-skeleton resource-skeleton" />
          <strong
            v-else
            :class="{ 'resource-warning': resource.value >= 80 }"
            >{{ resource.formatted }}</strong
          >
        </div>
        <div
          class="dashboard-progress"
          :class="{ 'is-loading': loading }"
          role="progressbar"
          :aria-label="resource.label"
          :aria-valuenow="resource.value"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <span
            v-if="!loading && resource.value !== null"
            :style="{
              width: resource.value + '%',
              background: resource.value >= 80 ? '#d97706' : resource.color
            }"
          />
        </div>
      </div>
    </div>
    <p class="resource-note">
      <i class="el-icon-time" aria-hidden="true" />{{
        $t('modern.dashboard.resourceNote')
      }}
    </p>
  </section>
</template>

<script>
import { hasNumber } from '../formatters'

export default {
  name: 'SystemResources',
  props: {
    groupData: { type: Object, required: true },
    loading: Boolean
  },
  computed: {
    resources() {
      return [
        { key: 'cpuUsed', color: '#3975eb' },
        { key: 'memUsed', color: '#8b72df' },
        { key: 'diskUsed', color: '#23a89e' }
      ].map((resource) => {
        const value = hasNumber(this.groupData[resource.key])
          ? Number(this.groupData[resource.key])
          : null
        return {
          ...resource,
          label: this.$t('dashboard.' + resource.key),
          value: value === null ? null : Math.max(0, Math.min(100, value)),
          formatted:
            value === null ? '—' : value.toFixed(1).replace(/\.0$/, '') + '%'
        }
      })
    }
  }
}
</script>
