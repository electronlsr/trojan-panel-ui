<template>
  <metric-grid :metrics="metrics" :loading="loading" />
</template>

<script>
import MetricGrid from '../../components/MetricGrid'
import { hasNumber, quotaLabel, remainingLabel } from '../../formatters'

export default {
  name: 'AdminPanelGroup',
  components: { MetricGrid },
  props: {
    groupData: { type: Object, required: true },
    loading: Boolean
  },
  computed: {
    metrics() {
      const t = (key) => this.$t(key)
      const data = this.groupData
      return [
        {
          key: 'nodes',
          label: t('modern.dashboard.nodes'),
          value: hasNumber(data.nodeCount) ? data.nodeCount : '—',
          hint: t('modern.dashboard.nodesHint'),
          icon: 'el-icon-connection',
          tone: 'blue'
        },
        {
          key: 'accounts',
          label: t('modern.dashboard.accounts'),
          value: hasNumber(data.accountCount) ? data.accountCount : '—',
          hint: t('modern.dashboard.accountsHint'),
          icon: 'el-icon-user',
          tone: 'violet'
        },
        {
          key: 'quota',
          label: t('modern.dashboard.quota'),
          value: quotaLabel(data, t),
          hint: t('modern.dashboard.quotaHint'),
          icon: 'el-icon-data-analysis',
          tone: 'cyan'
        },
        {
          key: 'remaining',
          label: t('modern.dashboard.remaining'),
          value: remainingLabel(data, t),
          hint: t('modern.dashboard.remainingHint'),
          icon: 'el-icon-pie-chart',
          tone: 'green',
          warning:
            hasNumber(data.quota) &&
            Number(data.quota) >= 0 &&
            hasNumber(data.residualFlow) &&
            Number(data.residualFlow) <= 0
        }
      ]
    }
  }
}
</script>
