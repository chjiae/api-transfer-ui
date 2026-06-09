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
  avgLatency: number
  totalCost: number
  requestTrend: TrendPoint[]
  modelDistribution: ModelSlice[]
  channelHealth: ChannelHealthEntry[]
  rpmUsed: number
  rpmLimit: number
  accountQuota: number
  errorRate: number
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
