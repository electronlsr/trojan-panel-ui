<template>
  <section class="dashboard-card quick-links-card">
    <div class="dashboard-card-heading">
      <div>
        <h2>{{ $t('modern.dashboard.quickLinks') }}</h2>
        <p>{{ $t('modern.dashboard.quickLinksDescription') }}</p>
      </div>
    </div>
    <nav
      class="dashboard-quick-links"
      :aria-label="$t('modern.dashboard.quickLinks')"
    >
      <router-link
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="dashboard-quick-link"
      >
        <span
          class="quick-link-icon"
          :class="'quick-link-' + link.tone"
          aria-hidden="true"
          ><i :class="link.icon"
        /></span>
        <span class="quick-link-copy"
          ><strong>{{ $t(link.title) }}</strong
          ><span>{{ $t(link.description) }}</span></span
        >
        <i class="el-icon-arrow-right quick-link-arrow" aria-hidden="true" />
      </router-link>
    </nav>
  </section>
</template>

<script>
import checkPermission from '@/utils/permission'

export default {
  name: 'QuickLinks',
  computed: {
    links() {
      const links = [
        {
          to: '/node-manage/node-list',
          title: 'modern.dashboard.browseNodes',
          description: 'modern.dashboard.browseNodesDescription',
          icon: 'el-icon-connection',
          tone: 'blue'
        }
      ]
      if (checkPermission(['sysadmin', 'admin'])) {
        links.push(
          {
            to: '/account-manage/account-list',
            title: 'modern.dashboard.manageAccounts',
            description: 'modern.dashboard.manageAccountsDescription',
            icon: 'el-icon-user',
            tone: 'violet'
          },
          {
            to: '/server-manage/server-list',
            title: 'modern.dashboard.manageServers',
            description: 'modern.dashboard.manageServersDescription',
            icon: 'el-icon-monitor',
            tone: 'cyan'
          }
        )
      } else {
        links.push({
          to: '/modify/index',
          title: 'modern.dashboard.profile',
          description: 'modern.dashboard.profileDescription',
          icon: 'el-icon-setting',
          tone: 'violet'
        })
      }
      return links
    }
  }
}
</script>
