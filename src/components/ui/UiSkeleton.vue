<script setup lang="ts">
interface Props {
  /** 预设形状 */
  variant?: 'text' | 'line' | 'block' | 'circle'
  width?: string
  height?: string
  radius?: string
}
withDefaults(defineProps<Props>(), { variant: 'line' })
</script>

<template>
  <span
    class="ui-skeleton"
    :class="`v-${variant}`"
    :style="{ width, height, borderRadius: radius }"
    aria-hidden="true"
  />
</template>

<style scoped>
.ui-skeleton {
  display: block;
  background: linear-gradient(
    100deg,
    var(--surface-2) 30%,
    var(--surface-3) 50%,
    var(--surface-2) 70%
  );
  background-size: 200% 100%;
  animation: ui-skeleton 1.4s ease-in-out infinite;
  border-radius: var(--radius-sm);
}
.v-text {
  height: 0.9em;
  border-radius: var(--radius-xs);
}
.v-line {
  height: 14px;
}
.v-block {
  height: 100%;
  border-radius: var(--radius-md);
}
.v-circle {
  border-radius: 50%;
}
</style>
