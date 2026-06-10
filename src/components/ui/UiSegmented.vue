<script setup lang="ts">
interface Option {
  value: string
  label: string
}
interface Props {
  modelValue: string
  options: Option[]
  size?: 'sm' | 'md'
}
withDefaults(defineProps<Props>(), { size: 'md' })
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="ui-segmented" :class="`s-${size}`" role="tablist">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="tab"
      :aria-selected="modelValue === opt.value"
      class="seg-item"
      :class="{ active: modelValue === opt.value }"
      @click="$emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.ui-segmented {
  display: inline-flex;
  padding: 3px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  gap: 2px;
}
.seg-item {
  border: none;
  background: transparent;
  color: var(--text-3);
  border-radius: var(--radius-sm);
  font-weight: 520;
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease),
    box-shadow var(--dur-fast) var(--ease);
}
.s-md .seg-item {
  padding: 5px 12px;
  font-size: var(--text-sm);
}
.s-sm .seg-item {
  padding: 4px 10px;
  font-size: var(--text-xs);
}
.seg-item:hover:not(.active) {
  color: var(--text);
}
.seg-item.active {
  color: var(--text);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}
</style>
