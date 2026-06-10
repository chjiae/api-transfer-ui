<script setup lang="ts">
interface Props {
  title: string
  description?: string
}
defineProps<Props>()
</script>

<template>
  <header class="page-header">
    <div class="ph-text">
      <h1 class="ph-title">{{ title }}</h1>
      <p v-if="description" class="ph-desc">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="ph-actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}
.ph-title {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text);
}
.ph-desc {
  margin: 5px 0 0;
  font-size: var(--text-sm);
  color: var(--text-3);
  max-width: 60ch;
}
.ph-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}
@media (max-width: 640px) {
  .ph-actions {
    width: 100%;
  }
}
</style>
