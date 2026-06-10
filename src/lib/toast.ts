import { ref } from 'vue'

export type ToastTone = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  tone: ToastTone
  message: string
  description?: string
}

const toasts = ref<Toast[]>([])
let seq = 0

function push(tone: ToastTone, message: string, description?: string) {
  const id = ++seq
  toasts.value.push({ id, tone, message, description })
  setTimeout(() => dismiss(id), 4200)
  return id
}

function dismiss(id: number) {
  const i = toasts.value.findIndex((t) => t.id === id)
  if (i !== -1) toasts.value.splice(i, 1)
}

export const toast = {
  success: (msg: string, desc?: string) => push('success', msg, desc),
  error: (msg: string, desc?: string) => push('error', msg, desc),
  info: (msg: string, desc?: string) => push('info', msg, desc),
  warning: (msg: string, desc?: string) => push('warning', msg, desc),
}

export function useToasts() {
  return { toasts, dismiss }
}
