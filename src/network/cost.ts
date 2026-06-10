import axios from 'axios'
import { getToken } from './http'

export interface ChannelModelCostView {
  id: number
  channelId: number
  model: string
  inputCost: number
  outputCost: number
  enabled: boolean
}

export interface ChannelCostRequest {
  channelId: number
  model: string
  inputCost: number
  outputCost: number
  enabled: boolean
}

const api = axios.create({ baseURL: '/api' })
api.interceptors.request.use((c) => {
  const t = getToken()
  if (t) c.headers.Authorization = `Bearer ${t}`
  return c
})

export async function listChannelCosts(channelId: number): Promise<ChannelModelCostView[]> {
  const { data } = await api.get<{ code: number; data: ChannelModelCostView[] }>('/channel-costs', {
    params: { channelId },
  })
  return data.data
}

export async function upsertChannelCost(req: ChannelCostRequest): Promise<ChannelModelCostView> {
  const { data } = await api.post<{ code: number; data: ChannelModelCostView }>('/channel-costs', req)
  return data.data
}

export async function deleteChannelCost(id: number): Promise<void> {
  await api.delete(`/channel-costs/${id}`)
}
