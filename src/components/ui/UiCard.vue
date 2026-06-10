<script setup lang="ts">
interface Props {
  /** padding 大小 */
  pad?: 'none' | 'sm' | 'md' | 'lg'
  /** 是否可悬浮高亮（用于可点击卡片）*/
  interactive?: boolean
  /** 是否抬升阴影 */
  raised?: boolean
}
withDefaults(defineProps<Props>(), { pad: 'md' })
</script>

<template>
  <div class="ui-card" :class="[`pad-${pad}`, { interactive, raised }]">
    <slot />
  </div>
</template>

<style scoped>
.ui-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease),
    transform var(--dur) var(--ease);
}
.ui-card.raised {
  box-shadow: var(--shadow);
}
.ui-card.interactive {
  cursor: pointer;
}
.ui-card.interactive:hover {
  border-color: var(--line-strong);
  box-shadow: var(--shadow-md);
}
.pad-none {
  padding: 0;
}
.pad-sm {
  padding: var(--space-4);
}
.pad-md {
  padding: var(--space-5);
}
.pad-lg {
  padding: var(--space-6);
}
</style>
