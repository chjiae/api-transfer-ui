interface ConfirmOptions {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

/**
 * 命令式确认对话框，替代原生 window.confirm。
 * 用法：if (await confirm({ message: '确认删除？', danger: true })) { ... }
 */
export function confirm(opts: ConfirmOptions): Promise<boolean> {
  const fn = (window as unknown as { __relayConfirm?: ConfirmFn }).__relayConfirm
  if (!fn) return Promise.resolve(window.confirm(opts.message || '确认操作？'))
  return fn(opts)
}
