<template>
  <section class="dashboard-card account-usage-card" :aria-busy="loading">
    <div class="dashboard-card-heading">
      <div>
        <h2>{{ $t('modern.dashboard.yourPlan') }}</h2>
        <p>{{ $t('modern.dashboard.planDescription') }}</p>
      </div>
      <span class="dashboard-heading-icon" aria-hidden="true"
        ><i class="el-icon-pie-chart"
      /></span>
    </div>
    <div v-if="loading" class="account-usage-body">
      <div class="dashboard-skeleton plan-skeleton" />
      <div class="dashboard-skeleton plan-skeleton-small" />
    </div>
    <div v-else class="account-usage-body">
      <div class="plan-allowance">
        <strong>{{ remaining }}</strong
        ><span>{{ $t('modern.dashboard.remaining') }}</span>
      </div>
      <p v-if="unlimited" class="plan-summary">
        {{ $t('modern.dashboard.unlimitedDescription') }}
      </p>
      <template v-else-if="usagePercent !== null">
        <div
          class="dashboard-progress plan-progress"
          role="progressbar"
          :aria-label="$t('modern.dashboard.usage')"
          :aria-valuenow="usagePercent"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <span
            :style="{
              width: usagePercent + '%',
              background: usagePercent >= 90 ? '#d97706' : '#3975eb'
            }"
          />
        </div>
        <p class="plan-summary">
          {{ $t('modern.dashboard.usedOf', { used: used, total: quota }) }}
        </p>
        <p v-if="exhausted" class="plan-warning">
          {{ $t('modern.dashboard.allowanceExhausted') }}
        </p>
      </template>
      <p v-else class="plan-summary">
        {{ $t('modern.dashboard.unavailable') }}
      </p>
      <div class="plan-expiry">
        <div>
          <span>{{ $t('modern.dashboard.expiresOn') }}</span
          ><strong>{{ expiry }}</strong>
        </div>
        <span
          v-if="expiresAt"
          class="dashboard-badge"
          :class="expired ? 'badge-warning' : 'badge-success'"
          >{{
            $t(expired ? 'modern.dashboard.expired' : 'modern.dashboard.active')
          }}</span
        >
      </div>
    </div>
    <router-link to="/node-manage/node-list" class="plan-subscription"
      >{{ $t('modern.dashboard.subscription')
      }}<i class="el-icon-arrow-right" aria-hidden="true"
    /></router-link>
  </section>
</template>

<script>
import {
  hasNumber,
  flowLabel,
  quotaLabel,
  remainingLabel,
  dateLabel,
  expiryDate
} from '../formatters'

export default {
  name: 'AccountUsage',
  props: {
    groupData: { type: Object, required: true },
    loading: Boolean
  },
  computed: {
    unlimited() {
      return hasNumber(this.groupData.quota) && Number(this.groupData.quota) < 0
    },
    quota() {
      return quotaLabel(this.groupData, (key) => this.$t(key))
    },
    remaining() {
      return remainingLabel(this.groupData, (key) => this.$t(key))
    },
    used() {
      return flowLabel(
        Math.max(
          0,
          Number(this.groupData.quota) - Number(this.groupData.residualFlow)
        )
      )
    },
    usagePercent() {
      if (
        !hasNumber(this.groupData.quota) ||
        !hasNumber(this.groupData.residualFlow) ||
        this.unlimited
      )
        return null
      const quota = Number(this.groupData.quota)
      return quota > 0
        ? Math.round(
            Math.max(
              0,
              Math.min(
                100,
                ((quota - Number(this.groupData.residualFlow)) / quota) * 100
              )
            )
          )
        : 0
    },
    exhausted() {
      return (
        !this.unlimited &&
        hasNumber(this.groupData.residualFlow) &&
        Number(this.groupData.residualFlow) <= 0
      )
    },
    expiresAt() {
      return expiryDate(this.groupData.expireTime)
    },
    expired() {
      return this.expiresAt && this.expiresAt.getTime() <= Date.now()
    },
    expiry() {
      return dateLabel(this.groupData.expireTime, this.$i18n.locale)
    }
  }
}
</script>
