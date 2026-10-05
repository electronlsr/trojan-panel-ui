<template>
  <div class="resource-grid">
    <article
      v-for="metric in metrics"
      :key="metric.key"
      class="resource-card"
      :class="{ 'resource-card-warning': isHigh(metric.key) }"
    >
      <div class="resource-card-top">
        <span class="resource-label">{{ $t(metric.label) }}</span>
        <span class="resource-icon" :class="metric.tone"
          ><i :class="metric.icon" aria-hidden="true"></i
        ></span>
      </div>
      <div class="resource-value">
        {{ displayValue(metric.key) }}<span v-if="hasValue(metric.key)">%</span>
      </div>
      <div class="resource-status" :class="{ 'is-high': isHigh(metric.key) }">
        <i
          :class="
            isHigh(metric.key) ? 'el-icon-warning-outline' : 'el-icon-data-line'
          "
          aria-hidden="true"
        ></i>
        {{
          hasValue(metric.key)
            ? isHigh(metric.key)
              ? copy.high
              : copy.current
            : copy.unavailable
        }}
      </div>
      <div
        class="resource-meter"
        role="progressbar"
        :aria-label="$t(metric.label)"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="
          hasValue(metric.key) ? percentage(metric.key) : undefined
        "
        :aria-valuetext="
          hasValue(metric.key)
            ? `${displayValue(metric.key)}%`
            : copy.unavailable
        "
      >
        <span
          :class="metric.tone"
          :style="{ width: percentage(metric.key) + '%' }"
        ></span>
      </div>
      <div class="resource-scale" aria-hidden="true">
        <span>0%</span><span>100%</span>
      </div>
    </article>
  </div>
</template>

<script>
const messages = {
  en: {
    current: 'Current usage',
    high: 'High usage',
    unavailable: 'No data available'
  },
  zh: { current: '当前使用率', high: '使用率较高', unavailable: '暂无数据' },
  ko: {
    current: '현재 사용량',
    high: '높은 사용량',
    unavailable: '데이터 없음'
  },
  fa: {
    current: 'مصرف فعلی',
    high: 'مصرف بالا',
    unavailable: 'داده‌ای موجود نیست'
  }
}

export default {
  name: 'NodeServerGroup',
  props: {
    nodeServerGroupData: { type: Object, required: true }
  },
  computed: {
    copy() {
      return messages[this.$i18n.locale] || messages.en
    },
    metrics() {
      return [
        {
          key: 'cpuUsed',
          label: 'dashboard.cpuUsed',
          icon: 'el-icon-cpu',
          tone: 'resource-blue'
        },
        {
          key: 'memUsed',
          label: 'dashboard.memUsed',
          icon: 'el-icon-data-board',
          tone: 'resource-purple'
        },
        {
          key: 'diskUsed',
          label: 'dashboard.diskUsed',
          icon: 'el-icon-coin',
          tone: 'resource-teal'
        }
      ]
    }
  },
  methods: {
    hasValue(key) {
      const value = this.nodeServerGroupData[key]
      return (
        value !== null &&
        value !== undefined &&
        value !== '' &&
        Number.isFinite(Number(value))
      )
    },
    percentage(key) {
      return this.hasValue(key)
        ? Math.min(100, Math.max(0, Number(this.nodeServerGroupData[key])))
        : 0
    },
    displayValue(key) {
      return this.hasValue(key)
        ? Number(Number(this.nodeServerGroupData[key]).toFixed(1))
        : '—'
    },
    isHigh(key) {
      return this.hasValue(key) && Number(this.nodeServerGroupData[key]) >= 80
    }
  }
}
</script>

<style lang="scss" scoped>
.resource-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}
.resource-card {
  min-width: 0;
  padding: 22px;
  border: 1px solid #e7ecf4;
  border-radius: 12px;
  background: #fcfdff;
}
.resource-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.resource-label {
  color: #697990;
  font-size: 13px;
  line-height: 1.5;
}
.resource-icon {
  display: grid;
  place-items: center;
  flex: 0 0 36px;
  height: 36px;
  border-radius: 10px;
  font-size: 19px;
}
.resource-icon.resource-blue {
  color: #3c78e6;
  background: #edf3ff;
}
.resource-icon.resource-purple {
  color: #8a6dd9;
  background: #f2edff;
}
.resource-icon.resource-teal {
  color: #279c98;
  background: #e9f7f5;
}
.resource-value {
  margin-top: 17px;
  color: var(--ui-ink, #17243d);
  font-size: 36px;
  line-height: 1.2;
  font-weight: 650;
  letter-spacing: -1.2px;
  font-variant-numeric: tabular-nums;
}
.resource-value > span {
  margin-left: 4px;
  color: #8795aa;
  font-size: 18px;
  font-weight: 400;
  letter-spacing: 0;
}
.resource-status {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 9px;
  color: #8795aa;
  font-size: 11px;
}
.resource-status.is-high {
  color: #cb8230;
}
.resource-meter {
  height: 6px;
  margin-top: 26px;
  overflow: hidden;
  border-radius: 4px;
  background: #eaf0f7;
}
.resource-meter > span {
  display: block;
  height: 100%;
  border-radius: 4px;
  transition: width 0.35s ease;
}
.resource-meter .resource-blue {
  background: #5a8ce9;
}
.resource-meter .resource-purple {
  background: #a18add;
}
.resource-meter .resource-teal {
  background: #54b4aa;
}
.resource-card-warning .resource-meter > span {
  background: #e6a34d;
}
.resource-scale {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: #9aa6b7;
  font-size: 10px;
}
@media (max-width: 1100px) {
  .resource-grid {
    gap: 12px;
  }
  .resource-card {
    padding: 18px;
  }
}
@media (max-width: 680px) {
  .resource-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  .resource-card {
    padding: 20px;
  }
  .resource-meter {
    margin-top: 20px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .resource-meter > span {
    transition: none;
  }
}
</style>
