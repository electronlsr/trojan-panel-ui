<template>
  <div class="sidebar-layout" :class="{ 'has-logo': showLogo }">
    <logo v-if="showLogo" :collapse="isCollapse" />
    <div v-if="!isCollapse" class="sidebar-section-label">
      {{ $t('shell.workspace') }}
    </div>
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :background-color="variables.menuBg"
        :text-color="variables.menuText"
        :unique-opened="false"
        :active-text-color="variables.menuActiveText"
        :collapse-transition="false"
        mode="vertical"
      >
        <sidebar-item
          v-for="route in permission_routes"
          :key="route.path"
          :item="route"
          :base-path="route.path"
        />
      </el-menu>
    </el-scrollbar>
    <div v-if="!isCollapse" class="sidebar-footer">
      <span class="sidebar-footer-mark"><i class="el-icon-connection" /></span>
      <div class="sidebar-footer-content">
        <strong>Trojan Panel</strong><span>{{ $t('shell.console') }}</span>
        <span class="sidebar-version" :title="`UI ${uiVersion}`">
          UI {{ uiVersion }}
        </span>
        <span
          class="sidebar-version"
          :title="`API ${backendVersionLabel}`"
          aria-live="polite"
          :aria-busy="backendVersionLoading ? 'true' : 'false'"
        >
          API {{ backendVersionLabel }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Logo from './Logo'
import SidebarItem from './SidebarItem'
import variables from '@/styles/variables.scss'
import { setting } from '@/api/system'
import { version } from '../../../../package.json'

export default {
  name: 'PanelSidebar',
  components: { SidebarItem, Logo },
  data() {
    return {
      uiVersion: `v${version}`,
      backendVersion: '',
      backendVersionLoading: true
    }
  },
  computed: {
    ...mapGetters(['permission_routes', 'sidebar']),
    activeMenu() {
      const route = this.$route
      const { meta, path } = route
      // if set path, the sidebar will highlight the path you set
      if (meta.activeMenu) {
        return meta.activeMenu
      }
      return path
    },
    showLogo() {
      return this.$store.state.settings.sidebarLogo
    },
    variables() {
      return variables
    },
    isCollapse() {
      return !this.sidebar.opened
    },
    backendVersionLabel() {
      return this.backendVersionLoading ? '…' : this.backendVersion || '—'
    }
  },
  mounted() {
    this.loadBackendVersion()
  },
  methods: {
    async loadBackendVersion() {
      this.backendVersionLoading = true
      this.backendVersion = ''
      try {
        const response = await setting()
        const reportedVersion =
          response && response.data && response.data.version
        if (typeof reportedVersion === 'string' && reportedVersion.trim()) {
          this.backendVersion = reportedVersion.trim()
        }
      } catch (_) {
        // Older or unavailable backends must never inherit the UI's version.
        this.backendVersion = ''
      } finally {
        this.backendVersionLoading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// Reserve the footer's actual height, including long or translated labels.
#app .sidebar-container.sidebar-layout {
  display: flex;
  flex-direction: column;

  .sidebar-logo-container,
  .sidebar-section-label {
    flex-shrink: 0;
  }

  .el-scrollbar {
    flex: 1;
    min-height: 0;
  }

  .sidebar-footer {
    position: static;
    flex-shrink: 0;
    padding: 16px 24px;
  }

  .sidebar-footer-mark {
    flex-shrink: 0;
  }

  .sidebar-footer-content {
    min-width: 0;
  }

  .sidebar-version {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
    color: #a7b5cb;
  }
}
</style>
