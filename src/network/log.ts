import axios from 'axios'
import { getToken } from './http'

export interface LogEntry {
  id: number
  tenantId: number
  userId: number
  tokenId: number
  channelId: number
  model: string
  type: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  quotaCost: number
  latencyMs: number
  requestId: string
  clientIp: string | null
  createdAt: string
}

export interface LogPage {
  list: LogEntry[]
  total: number
  page: number
  size: number
}

const api = axios.create({ baseURL: '/api' })
api.interceptors.request.use((c) => {
  const t = getToken()
  if (t) c.headers.Authorization = `Bearer ${t}`
  return c
})

export async function listLogs(params: {
  userId?: number
  model?: string
  from?: string
  to?: string
  page?: number
  size?: number
}): Promise<LogPage> {
  const { data } = await api.get<{ code: number; data: LogPage }>('/logs', { params })
  return data.data
}
