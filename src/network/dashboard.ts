import axios from 'axios'

export interface TrendPoint {
  time: string
  requests: number
  successRate: number
}

export interface ModelSlice {
  model: string
  percentage: number
  cost: number
}

export interface ChannelHealthEntry {
  name: string
  type: string
  model: string
  status: 'healthy' | 'warning' | 'fault'
  successRate: number
  avgLatency: number
  requests24h: number
  cost24h: number
}

export interface DashboardOverview {
  totalRequests: number
  successRate: number
  /** 首字延迟 P50 ms（响应延迟，反映服务速度，不含生成时长） */
  ttftP50: number
  /** 首字延迟 P95 ms */
  ttftP95: number
  /** 平均生成耗时 ms（整次调用墙钟均值，含模型生成时间） */
  genAvgLatency: number
  totalCost: number
  /** 环比（vs 上一等长周期，百分比；null=无上期基准） */
  requestsChangePct: number | null
  /** 成功率环比（百分点差） */
  successRateChangePct: number | null
  /** 响应延迟环比 */
  ttftChangePct: number | null
  /** 消费环比 */
  costChangePct: number | null
  requestTrend: TrendPoint[]
  modelDistribution: ModelSlice[]
  channelHealth: ChannelHealthEntry[]
  rpmUsed: number
  rpmLimit: number
  accountQuota: number
  errorRate: number
  /** 平台营收 USD（=Σ 售价；仅 ADMIN+ 有值，USER 为 null） */
  revenue: number | null
  /** 上游成本 USD（=Σ upstream_cost；仅 ADMIN+ 有值） */
  upstreamCost: number | null
  /** 毛利 USD（= revenue - upstreamCost；仅 ADMIN+ 有值） */
  grossMargin: number | null
  /** 毛利率 %（仅 ADMIN+ 有值） */
  marginRate: number | null
  /** 成本覆盖率 %（仅 ADMIN+ 有值） */
  costCoverage: number | null
}

const api = axios.create({ baseURL: '/api' })

// Attach JWT token from storage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 by redirecting to login
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export async function fetchDashboardOverview(hours = 24): Promise<DashboardOverview> {
  const { data } = await api.get<{ code: number; message?: string; data: DashboardOverview }>('/dashboard/overview', {
    params: { hours },
  })
  if (data.code !== 0) throw new Error(data.message || '获取概览数据失败')
  return data.data
}
