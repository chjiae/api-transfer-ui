<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  disabled?: boolean
  block?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  size: 'md',
  type: 'button',
})

const isDisabled = computed(() => props.disabled || props.loading)
</script>

<template>
  <button
    :type="type"
    class="ui-btn"
    :class="[`v-${variant}`, `s-${size}`, { block, loading }]"
    :disabled="isDisabled"
  >
    <span v-if="loading" class="ui-btn-spinner" aria-hidden="true" />
    <span class="ui-btn-content" :class="{ hidden: loading }">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.ui-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-weight: 540;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: background var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease),
    transform var(--dur-fast) var(--ease);
}
.ui-btn:active:not(:disabled) {
  transform: translateY(0.5px) scale(0.992);
}
.ui-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.ui-btn.loading {
  cursor: wait;
  opacity: 1;
}
.ui-btn.block {
  width: 100%;
}

/* —— 尺寸 —— */
.s-sm {
  height: 30px;
  padding: 0 11px;
  font-size: var(--text-sm);
}
.s-md {
  height: 36px;
  padding: 0 14px;
  font-size: var(--text-base);
}
.s-lg {
  height: 44px;
  padding: 0 20px;
  font-size: var(--text-md);
}
.s-icon {
  width: 36px;
  height: 36px;
  padding: 0;
}
.s-icon.s-sm {
  width: 30px;
  height: 30px;
}

/* —— 主操作 —— */
.v-primary {
  background: var(--accent);
  color: var(--text-on-brand);
  border-color: var(--accent);
}
.v-primary:hover:not(:disabled) {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

/* —— 次操作（描边）—— */
.v-secondary {
  background: var(--surface);
  color: var(--text);
  border-color: var(--line-2);
}
.v-secondary:hover:not(:disabled) {
  background: var(--surface-2);
  border-color: var(--line-strong);
}

/* —— 幽灵（无边框）—— */
.v-ghost {
  background: transparent;
  color: var(--text-2);
}
.v-ghost:hover:not(:disabled) {
  background: var(--surface-2);
  color: var(--text);
}

/* —— 弱化（次级填充）—— */
.v-subtle {
  background: var(--surface-2);
  color: var(--text);
}
.v-subtle:hover:not(:disabled) {
  background: var(--surface-3);
}

/* —— 危险 —— */
.v-danger {
  background: transparent;
  color: var(--danger);
  border-color: color-mix(in srgb, var(--danger) 36%, transparent);
}
.v-danger:hover:not(:disabled) {
  background: var(--danger-soft);
  border-color: color-mix(in srgb, var(--danger) 50%, transparent);
}

/* —— loading 旋转 —— */
.ui-btn-spinner {
  position: absolute;
  width: 15px;
  height: 15px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  opacity: 0.85;
  animation: spin 600ms linear infinite;
}
.ui-btn-content {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.ui-btn-content.hidden {
  opacity: 0;
}
</style>
