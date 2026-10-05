<template>
  <section class="app-main">
    <header v-if="showHeading" class="page-heading">
      <div>
        <p class="page-eyebrow">{{ $t('shell.console') }}</p>
        <h1>{{ pageTitle }}</h1>
        <p v-if="description" class="page-description">{{ description }}</p>
      </div>
    </header>
    <transition name="fade-transform" mode="out-in">
      <keep-alive :include="cachedViews">
        <router-view :key="key" />
      </keep-alive>
    </transition>
  </section>
</template>

<script>
export default {
  name: 'AppMain',
  computed: {
    showHeading() {
      return (
        !this.$route.path.startsWith('/dashboard') &&
        !this.$route.path.startsWith('/redirect')
      )
    },
    pageTitle() {
      return this.$t('route.' + this.$route.meta.title)
    },
    description() {
      const key = 'shell.pageDescription.' + this.$route.meta.title
      return this.$te(key) ? this.$t(key) : ''
    },
    cachedViews() {
      return this.$store.state.tagsView.cachedViews
    },
    key() {
      return this.$route.path
    }
  }
}
</script>

<style lang="scss" scoped>
.app-main {
  /* 50= navbar  50  */
  min-height: calc(100vh - 72px);
  width: 100%;
  position: relative;
  overflow: hidden;
}

.fixed-header + .app-main {
  padding-top: 72px;
}

.hasTagsView {
  .app-main {
    /* 84 = navbar + tags-view = 50 + 34 */
    min-height: calc(100vh - 116px);
  }

  .fixed-header + .app-main {
    padding-top: 116px;
  }
}
</style>

<style lang="scss">
// fix css style bug in open el-dialog
.el-popup-parent--hidden {
  .fixed-header {
    padding-right: 15px;
  }
}
</style>
