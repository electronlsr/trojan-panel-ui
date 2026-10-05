<template>
  <header class="dashboard-heading">
    <div>
      <p class="dashboard-eyebrow">{{ $t('modern.dashboard.workspace') }}</p>
      <h1>{{ $t('modern.dashboard.overview') }}</h1>
      <p class="dashboard-subtitle">
        {{
          $t(
            admin
              ? 'modern.dashboard.overviewDescription'
              : 'modern.dashboard.userDescription'
          )
        }}
      </p>
    </div>
    <div class="dashboard-heading-actions">
      <span v-if="updatedAt" class="dashboard-updated">{{
        $t('modern.dashboard.refreshed', { time: updatedTime })
      }}</span>
      <el-button
        icon="el-icon-refresh"
        :loading="loading"
        @click="$emit('refresh')"
        >{{ $t('modern.dashboard.refresh') }}</el-button
      >
    </div>
  </header>
</template>

<script>
export default {
  name: 'DashboardHeader',
  props: {
    admin: Boolean,
    loading: Boolean,
    updatedAt: { type: Date, default: null }
  },
  computed: {
    updatedTime() {
      return this.updatedAt
        ? this.updatedAt.toLocaleTimeString(this.$i18n.locale, {
            hour: '2-digit',
            minute: '2-digit'
          })
        : ''
    }
  }
}
</script>
