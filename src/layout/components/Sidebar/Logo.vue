<template>
  <div class="sidebar-logo-container" :class="{ collapse: collapse }">
    <transition name="sidebarLogoFade">
      <router-link
        v-if="collapse"
        key="collapse"
        class="sidebar-logo-link"
        to="/"
      >
        <img
          v-if="logo"
          :src="logo"
          class="sidebar-logo"
          alt=""
          @error="logo = ''"
        /><span v-else class="sidebar-brand-mark">T</span>
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="/">
        <img
          v-if="logo"
          :src="logo"
          class="sidebar-logo"
          alt=""
          @error="logo = ''"
        /><span v-else class="sidebar-brand-mark">T</span>
        <h1 class="sidebar-title">{{ title }}</h1>
      </router-link>
    </transition>
  </div>
</template>

<script>
import { setting } from '@/api/system'

export default {
  name: 'SidebarLogo',
  props: {
    collapse: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      title: 'Trojan Panel',
      logo: '/api/image/logo'
    }
  },
  created() {
    this.setting()
  },
  methods: {
    setting() {
      setting().then((response) => {
        this.title = response.data.systemName
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: opacity 0.2s;
}
.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}
.sidebar-logo-container {
  height: 84px;
  padding: 0 24px;
  overflow: hidden;
  .sidebar-logo-link {
    display: flex !important;
    align-items: center;
    height: 100%;
    gap: 12px;
  }
  .sidebar-logo {
    width: 36px;
    height: 36px;
    object-fit: contain;
    border-radius: 10px;
    flex-shrink: 0;
  }
  .sidebar-brand-mark {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    background: #3274ee;
    color: #fff;
    font-size: 22px;
    font-weight: 700;
    border-radius: 10px;
  }
  .sidebar-title {
    margin: 0;
    color: #fff;
    font-size: 17px;
    font-weight: 650;
    line-height: 1.35;
    letter-spacing: -0.4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &.collapse {
    padding: 0 9px;
  }
}
</style>
