import axios from 'axios'
import { getToken } from './http'

export interface UserView {
  id: number
  tenantId: number | null
  username: string
  displayName: string | null
  role: number
  status: number
  userGroup: string
  quota: number
  usedQuota: number
  requestCount: number
  email: string | null
  createdAt: string
}

const api = axios.create({ baseURL: '/api' })
api.interceptors.request.use((c) => {
  const t = getToken()
  if (t) c.headers.Authorization = `Bearer ${t}`
  return c
})

export async function listUsers(): Promise<UserView[]> {
  const { data } = await api.get<{ code: number; data: UserView[] }>('/users')
  return data.data
}

export async function fetchSelf(): Promise<UserView> {
  const { data } = await api.get<{ code: number; data: UserView }>('/user/self')
  return data.data
}

export async function updateUserQuota(userId: number, quota: number): Promise<void> {
  await api.put(`/users/${userId}/quota`, { quota })
}

export async function updateUserStatus(userId: number, status: number): Promise<void> {
  await api.put(`/users/${userId}/status`, { status })
}

export async function deleteUser(userId: number): Promise<void> {
  await api.delete(`/users/${userId}`)
}
