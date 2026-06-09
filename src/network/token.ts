import axios from 'axios'
import { getToken } from './http'

export interface TokenView {
  id: number
  name: string
  keyPrefix: string
  status: number
  unlimitedQuota: boolean
  remainQuota: number
  usedQuota: number
  expiredAt: string | null
  tokenGroup: string | null
  allowedModels: string[] | null
  createdAt: string
}

export interface NewTokenView extends TokenView {
  apiKey: string
}

const api = axios.create({ baseURL: '/api' })
api.interceptors.request.use((c) => {
  const t = getToken()
  if (t) c.headers.Authorization = `Bearer ${t}`
  return c
})

export async function listTokens(): Promise<TokenView[]> {
  const { data } = await api.get<{ code: number; data: TokenView[] }>('/tokens')
  return data.data
}

export async function createToken(req: {
  name: string
  unlimitedQuota?: boolean
  remainQuota?: number
}): Promise<NewTokenView> {
  const { data } = await api.post<{ code: number; data: NewTokenView }>('/tokens', req)
  return data.data
}

export async function deleteToken(id: number): Promise<void> {
  await api.delete(`/tokens/${id}`)
}
