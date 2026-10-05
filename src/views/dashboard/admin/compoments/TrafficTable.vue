<template>
  <section class="dashboard-card traffic-card" :aria-busy="loading">
    <div class="dashboard-card-heading traffic-heading">
      <div>
        <h2>{{ $t('modern.dashboard.traffic') }}</h2>
        <p>{{ $t('modern.dashboard.trafficDescription') }}</p>
      </div>
      <span class="dashboard-badge badge-neutral"
        ><i class="el-icon-time" aria-hidden="true" />{{
          $t('modern.dashboard.hourly')
        }}</span
      >
    </div>
    <div v-if="error" class="dashboard-empty" role="alert">
      <span class="dashboard-empty-icon"
        ><i class="el-icon-warning-outline" aria-hidden="true"
      /></span>
      <strong>{{ $t('modern.dashboard.trafficError') }}</strong>
      <el-button size="small" @click="fetchData">{{
        $t('modern.dashboard.retry')
      }}</el-button>
    </div>
    <div
      v-else-if="loading"
      class="traffic-loading"
      role="status"
      :aria-label="$t('modern.dashboard.loading')"
    >
      <div v-for="row in 5" :key="row" class="traffic-loading-row">
        <span class="dashboard-skeleton traffic-skeleton-avatar" /><span
          class="dashboard-skeleton traffic-skeleton-name"
        /><span class="dashboard-skeleton traffic-skeleton-flow" />
      </div>
    </div>
    <div v-else-if="!list.length" class="dashboard-empty">
      <span class="dashboard-empty-icon"
        ><i class="el-icon-data-analysis" aria-hidden="true"
      /></span>
      <strong>{{ $t('modern.dashboard.trafficEmpty') }}</strong>
      <p>{{ $t('modern.dashboard.trafficEmptyDescription') }}</p>
    </div>
    <div v-else class="traffic-table-wrap">
      <table class="dashboard-traffic-table">
        <thead>
          <tr>
            <th class="traffic-rank-column" scope="col">#</th>
            <th scope="col">{{ $t('modern.dashboard.account') }}</th>
            <th class="traffic-usage-column" scope="col">
              {{ $t('modern.dashboard.usage') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(account, index) in list" :key="account.id || index">
            <td>
              <span
                class="traffic-rank"
                :class="{ 'traffic-rank-top': index < 3 }"
                >{{ String(index + 1).padStart(2, '0') }}</span
              >
            </td>
            <td>
              <div class="traffic-account">
                <span
                  class="traffic-avatar"
                  :class="'avatar-tone-' + (index % 4)"
                  aria-hidden="true"
                  >{{ initial(account.username) }}</span
                ><span class="traffic-username" :title="account.username">{{
                  account.username || '—'
                }}</span>
              </div>
            </td>
            <td>
              <div class="traffic-amount">
                {{ flowLabel(account.trafficUsed) }}
              </div>
              <div class="traffic-bar" aria-hidden="true">
                <span
                  :style="{ width: relativeUsage(account.trafficUsed) + '%' }"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script>
import { trafficRank } from '@/api/dashboard'
import { flowLabel, hasNumber } from '../../formatters'

export default {
  name: 'TrafficTable',
  data() {
    return { list: [], loading: false, error: false }
  },
  computed: {
    maxUsage() {
      return Math.max(
        0,
        ...this.list.map((item) =>
          hasNumber(item.trafficUsed) ? Number(item.trafficUsed) : 0
        )
      )
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    flowLabel,
    initial(name) {
      return name ? String(name).slice(0, 1).toUpperCase() : '?'
    },
    relativeUsage(value) {
      return this.maxUsage > 0 && hasNumber(value)
        ? Math.max(0, Math.min(100, (Number(value) / this.maxUsage) * 100))
        : 0
    },
    async fetchData() {
      if (this.loading) return
      this.loading = true
      this.error = false
      try {
        const response = await trafficRank()
        if (response.data != null && !Array.isArray(response.data)) {
          throw new Error('Invalid traffic ranking')
        }
        this.list = (response.data || [])
          .filter((item) => item && typeof item === 'object')
          .slice(0, 15)
      } catch (error) {
        this.error = true
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
