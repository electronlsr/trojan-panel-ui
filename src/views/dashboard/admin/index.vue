<template>
  <div class="dashboard-view">
    <dashboard-header
      admin
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
    <panel-group
      :group-data="panelGroupData"
      :loading="overviewLoading && !updatedAt"
    />
    <div class="dashboard-columns">
      <div class="dashboard-main-column">
        <traffic-table ref="traffic" />
        <account-usage
          :group-data="panelGroupData"
          :loading="overviewLoading && !updatedAt"
        />
      </div>
      <aside class="dashboard-side-column">
        <system-resources
          :group-data="panelGroupData"
          :loading="overviewLoading && !updatedAt"
        />
        <quick-links />
      </aside>
    </div>
  </div>
</template>

<script>
import PanelGroup from './compoments/PanelGroup'
import TrafficTable from './compoments/TrafficTable'
import DashboardHeader from '../components/DashboardHeader'
import SystemResources from '../components/SystemResources'
import QuickLinks from '../components/QuickLinks'
import AccountUsage from '../components/AccountUsage'
import overview from '../mixins/overview'

export default {
  name: 'AdminDashboard',
  components: {
    PanelGroup,
    TrafficTable,
    DashboardHeader,
    SystemResources,
    QuickLinks,
    AccountUsage
  },
  mixins: [overview]
}
</script>
