<template>
  <div class="server-detail-page app-container">
    <section class="resource-section" v-loading="loading" :aria-busy="loading">
      <header class="resource-header">
        <div>
          <h2>{{ copy.title }}</h2>
          <p>{{ copy.description }}</p>
        </div>
        <el-button icon="el-icon-refresh" :loading="loading" @click="loadState">
          {{ $t('tagsView.refresh') }}
        </el-button>
      </header>
      <el-alert
        v-if="failed"
        class="resource-error"
        :title="copy.error"
        type="error"
        show-icon
        :closable="false"
      />
      <NodeServerGroup :node-server-group-data="nodeServerGroupData" />
      <div class="resource-footnote">
        <i class="el-icon-time" aria-hidden="true"></i>
        <span v-if="lastUpdated">{{ copy.updated }} {{ formattedUpdate }}</span>
        <span v-else>{{ copy.snapshot }}</span>
      </div>
    </section>
  </div>
</template>

<script>
import NodeServerGroup from '@/views/node-server/detail/compoments/NodeServerGroup'
import { nodeServerState } from '@/api/node-server'
import Cookies from 'js-cookie'

const messages = {
  en: {
    title: 'Resource overview',
    description: 'Monitor CPU, memory and disk usage for this server.',
    updated: 'Last updated',
    snapshot: 'Resource values appear after the server responds.',
    error:
      'Unable to load server resources. Try refreshing, or select a server from the server list.'
  },
  zh: {
    title: '资源概览',
    description: '查看这台服务器的 CPU、内存与磁盘使用情况。',
    updated: '上次更新',
    snapshot: '服务器响应后显示资源使用情况。',
    error: '暂时无法获取服务器资源。请刷新重试，或从服务器列表中选择服务器。'
  },
  ko: {
    title: '리소스 개요',
    description: '이 서버의 CPU, 메모리 및 디스크 사용량을 확인하세요.',
    updated: '마지막 업데이트',
    snapshot: '서버가 응답하면 리소스 사용량이 표시됩니다.',
    error:
      '서버 리소스를 불러올 수 없습니다. 새로 고치거나 서버 목록에서 서버를 선택하세요.'
  },
  fa: {
    title: 'نمای کلی منابع',
    description:
      'میزان استفاده از پردازنده، حافظه و دیسک این سرور را مشاهده کنید.',
    updated: 'آخرین به‌روزرسانی',
    snapshot: 'مقادیر منابع پس از پاسخ سرور نمایش داده می‌شوند.',
    error:
      'بارگیری منابع سرور ممکن نیست. دوباره تلاش کنید یا سروری را از فهرست انتخاب کنید.'
  }
}

export default {
  name: 'ServerResourceDetail',
  components: { NodeServerGroup },
  data() {
    return {
      nodeServerGroupData: {},
      loading: false,
      failed: false,
      lastUpdated: null
    }
  },
  computed: {
    copy() {
      return messages[this.$i18n.locale] || messages.en
    },
    formattedUpdate() {
      return this.lastUpdated
        ? this.lastUpdated.toLocaleTimeString(this.$i18n.locale, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        : ''
    }
  },
  created() {
    this.loadState()
  },
  methods: {
    loadState() {
      if (this.loading) return
      const id = Cookies.get('nodeServerId')
      this.failed = false
      if (!id) {
        this.failed = true
        return
      }
      this.loading = true
      nodeServerState({ id })
        .then((response) => {
          this.nodeServerGroupData = response.data || {}
          this.lastUpdated = new Date()
        })
        .catch(() => {
          this.failed = true
        })
        .finally(() => {
          this.loading = false
        })
    }
  }
}
</script>

<style lang="scss" scoped>
.resource-section {
  padding: 26px;
  border: 1px solid var(--ui-border, #e6ebf2);
  border-radius: 14px;
  background: var(--ui-surface, #fff);
}
.resource-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 26px;
  h2 {
    margin: 0 0 8px;
    color: var(--ui-ink, #17243d);
    font-size: 17px;
    font-weight: 600;
  }
  p {
    margin: 0;
    color: var(--ui-muted, #718096);
    font-size: 12px;
    line-height: 1.7;
  }
}
.resource-error {
  margin-bottom: 20px;
}
.resource-footnote {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 22px;
  color: #8795a9;
  font-size: 11px;
  line-height: 1.7;
}
@media (max-width: 600px) {
  .resource-section {
    padding: 20px 16px;
  }
  .resource-header {
    align-items: flex-start;
    gap: 12px;
  }
  .resource-header .el-button {
    padding: 9px 10px;
  }
}
</style>
