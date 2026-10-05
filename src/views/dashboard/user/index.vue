<template>
  <div class="dashboard-view">
    <dashboard-header
      :loading="overviewLoading || refreshing"
      :updated-at="updatedAt"
      @refresh="refreshDashboard"
    />
    <div v-if="overviewError" class="dashboard-error" role="alert">
      <i class="el-icon-warning-outline" aria-hidden="true" /><span>{{
        $t('modern.dashboard.loadError')
      }}</span
      ><el-button type="text" @click="refreshDashboard">{{
        $t('modern.dashboard.retry')
      }}</el-button>
    </div>
    <div v-if="settingsError" class="dashboard-error" role="alert">
      <i class="el-icon-warning-outline" aria-hidden="true" /><span>{{
        $t('modern.dashboard.settingsError')
      }}</span
      ><el-button type="text" @click="loadSettings">{{
        $t('modern.dashboard.retry')
      }}</el-button>
    </div>
    <panel-group
      :group-data="panelGroupData"
      :loading="overviewLoading && !updatedAt"
    />
    <div class="dashboard-columns dashboard-user-columns">
      <div class="dashboard-main-column">
        <account-usage
          :group-data="panelGroupData"
          :loading="overviewLoading && !updatedAt"
        />
        <traffic-table v-if="trafficRankEnable === 1" ref="traffic" />
      </div>
      <aside class="dashboard-side-column"><quick-links /></aside>
    </div>
  </div>
</template>

<script>
import PanelGroup from './compoments/PanelGroup'
import TrafficTable from '../admin/compoments/TrafficTable'
import DashboardHeader from '../components/DashboardHeader'
import QuickLinks from '../components/QuickLinks'
import AccountUsage from '../components/AccountUsage'
import { setting } from '@/api/system'
import overview from '../mixins/overview'

export default {
  name: 'UserDashboard',
  components: {
    PanelGroup,
    TrafficTable,
    DashboardHeader,
    QuickLinks,
    AccountUsage
  },
  mixins: [overview],
  data() {
    return {
      trafficRankEnable: 0,
      settingsError: false,
      settingsLoading: false
    }
  },
  created() {
    this.loadSettings()
  },
  methods: {
    async loadSettings() {
      if (this.settingsLoading) return
      this.settingsLoading = true
      this.settingsError = false
      try {
        const response = await setting()
        this.trafficRankEnable = response.data.trafficRankEnable
      } catch (error) {
        this.settingsError = true
      } finally {
        this.settingsLoading = false
      }
    }
  }
}
</script>
