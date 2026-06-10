<script setup lang="ts">
import {
  PhCheckCircle as CheckCircle,
  PhXCircle as XCircle,
  PhInfo as Info,
  PhWarning as Warning,
} from '@phosphor-icons/vue'
import { useToasts, type ToastTone } from '@/lib/toast'

const { toasts, dismiss } = useToasts()

const icons: Record<ToastTone, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: Warning,
}
</script>

<template>
  <Teleport to="body">
    <div class="ui-toaster" role="status" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="ui-toast"
          :class="`t-${t.tone}`"
          @click="dismiss(t.id)"
        >
          <component :is="icons[t.tone]" :size="18" weight="fill" class="ui-toast-icon" />
          <div class="ui-toast-body">
            <p class="ui-toast-msg">{{ t.message }}</p>
            <p v-if="t.description" class="ui-toast-desc">{{ t.description }}</p>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.ui-toaster {
  position: fixed;
  z-index: 200;
  bottom: var(--space-6);
  right: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  pointer-events: none;
}
.ui-toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: min(360px, calc(100vw - 32px));
  padding: 12px 14px;
  background: var(--overlay);
  border: 1px solid var(--line-2);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  pointer-events: auto;
}
.ui-toast-icon {
  flex-shrink: 0;
  margin-top: 1px;
}
.t-success .ui-toast-icon {
  color: var(--success);
}
.t-error .ui-toast-icon {
  color: var(--danger);
}
.t-info .ui-toast-icon {
  color: var(--info);
}
.t-warning .ui-toast-icon {
  color: var(--warning);
}
.ui-toast-body {
  min-width: 0;
}
.ui-toast-msg {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 540;
  color: var(--text);
}
.ui-toast-desc {
  margin: 3px 0 0;
  font-size: var(--text-xs);
  color: var(--text-3);
  line-height: 1.5;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(16px) scale(0.96);
}
.toast-leave-active {
  position: absolute;
}
</style>
