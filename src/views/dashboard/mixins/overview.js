import { panelGroup } from '@/api/dashboard'

export default {
  data() {
    return {
      panelGroupData: {},
      overviewLoading: false,
      overviewError: false,
      updatedAt: null,
      refreshing: false
    }
  },
  created() {
    this.loadOverview()
  },
  methods: {
    async loadOverview() {
      if (this.overviewLoading) return
      this.overviewLoading = true
      this.overviewError = false
      try {
        const response = await panelGroup()
        if (
          !response.data ||
          typeof response.data !== 'object' ||
          Array.isArray(response.data)
        )
          throw new Error('Invalid overview')
        this.panelGroupData = response.data
        this.updatedAt = new Date()
      } catch (error) {
        this.overviewError = true
      } finally {
        this.overviewLoading = false
      }
    },
    async refreshDashboard() {
      if (this.refreshing || this.overviewLoading) return
      this.refreshing = true
      const requests = [this.loadOverview()]
      if (this.$refs.traffic) requests.push(this.$refs.traffic.fetchData())
      if (this.loadSettings) requests.push(this.loadSettings())
      try {
        await Promise.all(requests)
      } finally {
        this.refreshing = false
      }
    }
  }
}
