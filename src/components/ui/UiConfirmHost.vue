<script setup lang="ts">
import { ref } from 'vue'
import UiModal from './UiModal.vue'
import UiButton from './UiButton.vue'

interface ConfirmState {
  open: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  danger: boolean
  resolve?: (v: boolean) => void
}

const state = ref<ConfirmState>({
  open: false,
  title: '',
  message: '',
  confirmText: '确认',
  cancelText: '取消',
  danger: false,
})

// 全局单例：通过 window 暴露给 confirm helper
function show(opts: Partial<ConfirmState>): Promise<boolean> {
  return new Promise((resolve) => {
    state.value = {
      open: true,
      title: opts.title ?? '确认操作',
      message: opts.message ?? '',
      confirmText: opts.confirmText ?? '确认',
      cancelText: opts.cancelText ?? '取消',
      danger: opts.danger ?? false,
      resolve,
    }
  })
}

function settle(v: boolean) {
  state.value.resolve?.(v)
  state.value.open = false
}

// 注册到全局
;(window as unknown as { __relayConfirm?: typeof show }).__relayConfirm = show
</script>

<template>
  <UiModal :open="state.open" size="sm" :title="state.title" @close="settle(false)">
    <p class="confirm-msg">{{ state.message }}</p>
    <template #footer>
      <UiButton variant="ghost" @click="settle(false)">{{ state.cancelText }}</UiButton>
      <UiButton :variant="state.danger ? 'danger' : 'primary'" @click="settle(true)">
        {{ state.confirmText }}
      </UiButton>
    </template>
  </UiModal>
</template>

<style scoped>
.confirm-msg {
  margin: 0;
  font-size: var(--text-base);
  line-height: 1.6;
  color: var(--text-2);
}
</style>
