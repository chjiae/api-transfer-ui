<script setup lang="ts">
import { PhCaretDown as CaretDown } from '@phosphor-icons/vue'

interface Props {
  modelValue?: string | number
  disabled?: boolean
  size?: 'sm' | 'md'
}
withDefaults(defineProps<Props>(), { size: 'md' })
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="ui-select" :class="[`s-${size}`, { disabled }]">
    <select
      :value="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <slot />
    </select>
    <CaretDown :size="14" weight="bold" class="ui-select-caret" />
  </div>
</template>

<style scoped>
.ui-select {
  position: relative;
  display: inline-flex;
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--line-2);
  border-radius: var(--radius-md);
  transition: border-color var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease);
}
.ui-select:focus-within {
  border-color: var(--accent);
  box-shadow: var(--shadow-focus);
}
.ui-select.s-sm {
  height: 32px;
}
.ui-select.s-md {
  height: 38px;
}
.ui-select.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.ui-select select {
  appearance: none;
  height: 100%;
  padding: 0 32px 0 12px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text);
  font-size: var(--text-sm);
  cursor: pointer;
}
.s-sm select {
  font-size: var(--text-xs);
  padding-left: 10px;
}
.ui-select select option {
  background: var(--overlay);
  color: var(--text);
}
.ui-select-caret {
  position: absolute;
  right: 11px;
  color: var(--text-3);
  pointer-events: none;
}
</style>
