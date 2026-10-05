<template>
  <main class="not-found">
    <div class="not-found-card">
      <span class="not-found-icon" aria-hidden="true"
        ><i class="el-icon-guide"
      /></span>
      <p class="not-found-code">404</p>
      <h1>{{ $t('shell.notFound') }}</h1>
      <p>{{ $t('shell.notFoundDescription') }}</p>
      <router-link to="/" class="not-found-home">{{
        $t('shell.returnHome')
      }}</router-link>
    </div>
  </main>
</template>
<script>
export default { name: 'PageNotFound' }
</script>
<style lang="scss" scoped>
.not-found {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}
.not-found-card {
  width: 100%;
  max-width: 480px;
  text-align: center;
  padding: 48px 32px;
  border: 1px solid var(--ui-border);
  border-radius: 20px;
  background: #fff;
}
.not-found-icon {
  display: inline-grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  color: var(--ui-primary);
  background: #edf3ff;
  font-size: 26px;
}
.not-found-code {
  font-size: 64px !important;
  font-weight: 750;
  letter-spacing: -3px;
  line-height: 1.2;
  color: var(--ui-ink) !important;
  margin: 24px 0 12px !important;
}
.not-found h1 {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 12px;
}
.not-found p {
  color: var(--ui-muted);
  font-size: 14px;
  line-height: 1.8;
  margin: 0;
}
.not-found-home {
  display: inline-block;
  margin-top: 28px;
  padding: 12px 24px;
  border-radius: 9px;
  background: var(--ui-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}
</style>
