<template>
  <metric-grid :metrics="metrics" :loading="loading" />
</template>

<script>
import MetricGrid from '../../components/MetricGrid'
import {
  hasNumber,
  quotaLabel,
  remainingLabel,
  dateLabel,
  expiryDate
} from '../../formatters'

export default {
  name: 'UserPanelGroup',
  components: { MetricGrid },
  props: {
    groupData: { type: Object, required: true },
    loading: Boolean
  },
  computed: {
    metrics() {
      const t = (key) => this.$t(key)
      const data = this.groupData
      const expires = expiryDate(data.expireTime)
      return [
        {
          key: 'quota',
          label: t('modern.dashboard.quota'),
          value: quotaLabel(data, t),
          hint: t('modern.dashboard.quotaHint'),
          icon: 'el-icon-data-analysis',
          tone: 'blue'
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
        },
        {
          key: 'nodes',
          label: t('modern.dashboard.nodes'),
          value: hasNumber(data.nodeCount) ? data.nodeCount : '—',
          hint: t('modern.dashboard.nodesHint'),
          icon: 'el-icon-connection',
          tone: 'violet'
        },
        {
          key: 'expiry',
          label: t('modern.dashboard.expiry'),
          value: dateLabel(data.expireTime, this.$i18n.locale),
          hint: t('modern.dashboard.expiryHint'),
          icon: 'el-icon-date',
          tone: 'amber',
          date: true,
          warning: expires && expires.getTime() <= Date.now()
        }
      ]
    }
  }
}
</script>
