import axios from 'axios'

const TOKEN_KEY = 'token'

export type LoginPayload = {
  tenantCode?: string
  username: string
  password: string
}

export type RegisterPayload = {
  tenantCode?: string
  username: string
  password: string
  displayName?: string
  signupKey?: string
  inviteCode?: string
}

type ApiResponse<T> = {
  code: number
  message: string
  data: T | null
}

type LoginData = {
  token: string
  expiresIn: number
}

type UserData = {
  id: number
  username: string
  displayName?: string
}

export class AuthError extends Error {
  code?: number
  status?: number

  constructor(message: string, code?: number, status?: number) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.status = status
  }
}

export async function login(payload: LoginPayload): Promise<LoginData> {
  try {
    const response = await axios.post<ApiResponse<LoginData>>('/api/auth/login', {
      tenantCode: payload.tenantCode?.trim() || undefined,
      username: payload.username.trim(),
      password: payload.password,
    })

    if (response.data.code !== 0 || !response.data.data?.token) {
      throw new AuthError(response.data.message || '登录失败', response.data.code, response.status)
    }

    return response.data.data
  } catch (error) {
    if (error instanceof AuthError) throw error
    if (axios.isAxiosError<ApiResponse<never>>(error)) {
      throw new AuthError(
        error.response?.data?.message || (error.code === 'ERR_NETWORK' ? '无法连接到服务器' : '登录失败'),
        error.response?.data?.code,
        error.response?.status,
      )
    }
    throw new AuthError('登录失败，请稍后重试')
  }
}

export async function register(payload: RegisterPayload): Promise<UserData> {
  try {
    const response = await axios.post<ApiResponse<UserData>>('/api/auth/register', {
      tenantCode: payload.tenantCode?.trim() || undefined,
      username: payload.username.trim(),
      password: payload.password,
      displayName: payload.displayName?.trim() || undefined,
      signupKey: payload.signupKey?.trim() || undefined,
      inviteCode: payload.inviteCode?.trim() || undefined,
    })

    if (response.data.code !== 0 || !response.data.data) {
      throw new AuthError(response.data.message || '注册失败', response.data.code, response.status)
    }

    return response.data.data
  } catch (error) {
    if (error instanceof AuthError) throw error
    if (axios.isAxiosError<ApiResponse<never>>(error)) {
      throw new AuthError(
        error.response?.data?.message || (error.code === 'ERR_NETWORK' ? '无法连接到服务器' : '注册失败'),
        error.response?.data?.code,
        error.response?.status,
      )
    }
    throw new AuthError('注册失败，请稍后重试')
  }
}

export function storeToken(token: string, persistent: boolean) {
  window.localStorage.removeItem(TOKEN_KEY)
  window.sessionStorage.removeItem(TOKEN_KEY)
  const storage = persistent ? window.localStorage : window.sessionStorage
  storage.setItem(TOKEN_KEY, token)
}
