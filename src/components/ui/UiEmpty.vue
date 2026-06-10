<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  size?: 'sm' | 'md'
}
withDefaults(defineProps<Props>(), { size: 'md' })
</script>

<template>
  <div class="ui-empty" :class="`s-${size}`">
    <div v-if="$slots.icon" class="ui-empty-icon">
      <slot name="icon" />
    </div>
    <p v-if="title" class="ui-empty-title">{{ title }}</p>
    <p v-if="description" class="ui-empty-desc">{{ description }}</p>
    <div v-if="$slots.action" class="ui-empty-action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.ui-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-3);
}
.s-md {
  padding: var(--space-12) var(--space-6);
}
.s-sm {
  padding: var(--space-8) var(--space-4);
}
.ui-empty-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin-bottom: var(--space-4);
  color: var(--text-3);
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
}
.s-sm .ui-empty-icon {
  width: 42px;
  height: 42px;
}
.ui-empty-title {
  margin: 0;
  font-size: var(--text-md);
  font-weight: 560;
  color: var(--text);
}
.ui-empty-desc {
  margin: 6px 0 0;
  max-width: 38ch;
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--text-3);
}
.ui-empty-action {
  margin-top: var(--space-5);
}
</style>
