import axios from 'axios'
import { getToken } from './http'

export interface ChannelView {
  id: number
  name: string
  type: string
  baseUrl: string | null
  apiKeys: string[]
  keyCount: number
  models: string[]
  modelMapping: Record<string, string>
  channelGroups: string[]
  protocolEndpoints: Record<string, string>
  priority: number
  weight: number
  status: number
  responseTime: number | null
  testedAt: string | null
  failureCount: number
  lastTestError: string | null
}

export interface ChannelTestView {
  success: boolean
  statusCode: number
  responseTime: number
  error: string | null
}

export interface ChannelRequest {
  name: string
  type: string
  baseUrl?: string
  apiKeys: string[]
  models: string[]
  modelMapping?: Record<string, string>
  channelGroups?: string[]
  protocolEndpoints?: Record<string, string>
  priority?: number
  weight?: number
  status?: number
}

const api = axios.create({ baseURL: '/api' })
api.interceptors.request.use((c) => {
  const t = getToken()
  if (t) c.headers.Authorization = `Bearer ${t}`
  return c
})

export async function listChannels(): Promise<ChannelView[]> {
  const { data } = await api.get<{ code: number; data: ChannelView[] }>('/channels')
  return data.data
}

export async function getChannel(id: number): Promise<ChannelView> {
  const { data } = await api.get<{ code: number; data: ChannelView }>(`/channels/${id}`)
  return data.data
}

export async function createChannel(req: ChannelRequest): Promise<ChannelView> {
  const { data } = await api.post<{ code: number; data: ChannelView }>('/channels', req)
  return data.data
}

export async function updateChannel(id: number, req: ChannelRequest): Promise<ChannelView> {
  const { data } = await api.put<{ code: number; data: ChannelView }>(`/channels/${id}`, req)
  return data.data
}

export async function deleteChannel(id: number): Promise<void> {
  await api.delete(`/channels/${id}`)
}

export async function testChannel(id: number): Promise<ChannelTestView> {
  const { data } = await api.post<{ code: number; data: ChannelTestView }>(`/channels/${id}/test`)
  return data.data
}

export interface ChannelProviderPreset {
  key: string
  label: string
  type: string
  protocolEndpoints: Record<string, string>
}

export async function fetchProviderPresets(): Promise<ChannelProviderPreset[]> {
  const { data } = await api.get<{ code: number; data: ChannelProviderPreset[] }>('/channels/provider-presets')
  return data.data
}

export interface FetchModelsRequest {
  type?: string
  baseUrl?: string
  apiKey?: string
  channelId?: number
}

export async function fetchModels(req: FetchModelsRequest): Promise<string[]> {
  const { data } = await api.post<{ code: number; data: string[] }>('/channels/fetch-models', req)
  return data.data
}
