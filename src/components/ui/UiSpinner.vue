<script setup lang="ts">
interface Props {
  size?: number
  /** 居中铺满容器 */
  center?: boolean
  label?: string
}
withDefaults(defineProps<Props>(), { size: 18 })
</script>

<template>
  <div class="ui-spinner-wrap" :class="{ center }">
    <span
      class="ui-spinner"
      :style="{ width: `${size}px`, height: `${size}px`, borderWidth: `${Math.max(2, size / 10)}px` }"
      aria-hidden="true"
    />
    <span v-if="label" class="ui-spinner-label">{{ label }}</span>
  </div>
</template>

<style scoped>
.ui-spinner-wrap {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text-3);
}
.ui-spinner-wrap.center {
  width: 100%;
  flex-direction: column;
  justify-content: center;
  padding: var(--space-12) var(--space-4);
  font-size: var(--text-sm);
}
.ui-spinner {
  display: block;
  border: 2px solid var(--line-2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 650ms linear infinite;
}
.ui-spinner-label {
  font-size: var(--text-sm);
}
</style>
