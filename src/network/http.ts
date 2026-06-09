export function getToken(): string | null {
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

export function clearToken() {
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
}
