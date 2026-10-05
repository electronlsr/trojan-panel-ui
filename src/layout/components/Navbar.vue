<template>
  <div class="navbar">
    <hamburger
      :is-active="sidebar.opened"
      class="hamburger-container"
      @toggleClick="toggleSideBar"
    />

    <breadcrumb class="breadcrumb-container" />

    <div class="right-menu">
      <template v-if="device !== 'mobile'">
        <screenfull id="screenfull" class="right-menu-item hover-effect" />

        <el-tooltip
          :content="$t('navbar.size')"
          effect="dark"
          placement="bottom"
        >
          <SizeSelect id="size-select" class="right-menu-item hover-effect" />
        </el-tooltip>
      </template>
      <lang-select class="right-menu-item hover-effect" />
      <el-dropdown class="avatar-container" trigger="click">
        <button
          type="button"
          class="avatar-wrapper"
          :aria-label="$t('navbar.profile')"
        >
          <span class="user-avatar">{{ initial }}</span>
          <span class="user-identity"
            ><strong>{{ username }}</strong
            ><small>{{ roleLabel }}</small></span
          >
          <i class="el-icon-arrow-down" />
        </button>
        <el-dropdown-menu slot="dropdown" class="user-dropdown">
          <router-link to="/modify" custom v-slot="{ navigate }">
            <el-dropdown-item>
              <span @click="navigate" role="link">
                {{ $t('navbar.profile') }}
              </span>
            </el-dropdown-item>
          </router-link>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/trojanpanel"
            v-if="checkPermission(['sysadmin', 'admin'])"
          >
            <el-dropdown-item>{{ $t('navbar.github') }}</el-dropdown-item>
          </a>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://trojanpanel.github.io"
            v-if="checkPermission(['sysadmin', 'admin'])"
          >
            <el-dropdown-item>{{ $t('navbar.doc') }}</el-dropdown-item>
          </a>
          <el-dropdown-item divided @click.native="logout">
            <span style="display: block">{{ $t('navbar.logout') }}</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Breadcrumb from '@/components/Breadcrumb'
import Hamburger from '@/components/Hamburger'
import Screenfull from '@/components/Screenfull'
import SizeSelect from '@/components/SizeSelect'
import LangSelect from '@/components/LangSelect'
import checkPermission from '@/utils/permission' // 权限判断指令

export default {
  components: {
    Breadcrumb,
    Hamburger,
    Screenfull,
    SizeSelect,
    LangSelect
  },
  computed: {
    ...mapGetters(['sidebar', 'avatar', 'device', 'username', 'roles']),
    initial() {
      return (this.username || 'T').charAt(0).toUpperCase()
    },
    roleLabel() {
      return this.$t(
        this.roles.some((role) => ['admin', 'sysadmin'].includes(role))
          ? 'shell.administrator'
          : 'shell.member'
      )
    }
  },
  methods: {
    checkPermission,
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar')
    },
    async logout() {
      await this.$store.dispatch('account/logout')
      await this.$router.push(`/login`)
    }
  }
}
</script>

<style lang="scss" scoped>
.navbar {
  height: 72px;
  display: flex;
  align-items: center;
  position: relative;
  background: #fff;
  border-bottom: 1px solid var(--ui-border);
  .hamburger-container {
    height: 72px;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.2s;
    &:hover {
      background: #f5f7fb;
    }
  }
  .breadcrumb-container {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
  }
  .right-menu {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 100%;
    padding-right: 28px;
    flex-shrink: 0;
  }
  .right-menu-item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    min-width: 36px;
    border-radius: 8px;
    font-size: 17px;
    color: #718096;
    &.hover-effect {
      cursor: pointer;
      &:hover {
        background: #f0f5ff;
        color: var(--ui-primary);
      }
    }
  }
  .avatar-container {
    margin-left: 16px;
    padding-left: 20px;
    border-left: 1px solid var(--ui-border);
  }
  .avatar-wrapper {
    display: flex;
    align-items: center;
    gap: 11px;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    text-align: left;
    color: var(--ui-ink);
  }
  .user-avatar {
    display: grid;
    place-items: center;
    height: 36px;
    width: 36px;
    background: #eaf1ff;
    color: #2563eb;
    border: 1px solid #dce7fe;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 700;
  }
  .user-identity {
    display: flex;
    flex-direction: column;
    gap: 5px;
    max-width: 150px;
    strong {
      font-size: 13px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    small {
      font-size: 11px;
      color: var(--ui-muted);
    }
  }
  .el-icon-arrow-down {
    color: #93a1b6;
    margin-left: 8px;
    font-size: 12px;
  }
}
@media (max-width: 767px) {
  .navbar {
    .right-menu {
      padding-right: 16px;
    }
    .avatar-container {
      margin-left: 4px;
      padding-left: 12px;
    }
    .user-identity,
    .el-icon-arrow-down {
      display: none;
    }
    .breadcrumb-container {
      font-size: 12px;
      margin-left: 0;
    }
  }
}
</style>
