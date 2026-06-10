<script setup lang="ts">
interface Props {
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger'
  /** 带前置状态圆点 */
  dot?: boolean
  size?: 'sm' | 'md'
}
withDefaults(defineProps<Props>(), { tone: 'neutral', size: 'md' })
</script>

<template>
  <span class="ui-badge" :class="[`t-${tone}`, `s-${size}`]">
    <span v-if="dot" class="ui-badge-dot" aria-hidden="true" />
    <slot />
  </span>
</template>

<style scoped>
.ui-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--radius-sm);
  font-weight: 520;
  line-height: 1;
  white-space: nowrap;
}
.s-sm {
  padding: 3px 7px;
  font-size: 11px;
}
.s-md {
  padding: 4px 9px;
  font-size: var(--text-xs);
}
.ui-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.t-neutral {
  background: var(--surface-2);
  color: var(--text-2);
}
.t-brand {
  background: var(--accent-soft);
  color: var(--accent-text);
}
.t-success {
  background: var(--success-soft);
  color: var(--success);
}
.t-warning {
  background: var(--warning-soft);
  color: var(--warning);
}
.t-danger {
  background: var(--danger-soft);
  color: var(--danger);
}
</style>
