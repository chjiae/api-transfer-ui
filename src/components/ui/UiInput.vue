<script setup lang="ts">
interface Props {
  modelValue?: string | number
  type?: string
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  size?: 'sm' | 'md' | 'lg'
}
withDefaults(defineProps<Props>(), { type: 'text', size: 'md' })
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="ui-input" :class="[`s-${size}`, { invalid, disabled }]">
    <span v-if="$slots.prefix" class="ui-input-affix">
      <slot name="prefix" />
    </span>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span v-if="$slots.suffix" class="ui-input-affix">
      <slot name="suffix" />
    </span>
  </div>
</template>

<style scoped>
.ui-input {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface);
  border: 1px solid var(--line-2);
  border-radius: var(--radius-md);
  color: var(--text-3);
  transition: border-color var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease),
    background var(--dur-fast) var(--ease);
}
.ui-input.s-sm {
  height: 32px;
  padding: 0 10px;
}
.ui-input.s-md {
  height: 38px;
  padding: 0 12px;
}
.ui-input.s-lg {
  height: 46px;
  padding: 0 14px;
}
.ui-input:focus-within {
  border-color: var(--accent);
  box-shadow: var(--shadow-focus);
  color: var(--accent);
}
.ui-input.invalid {
  border-color: var(--danger);
}
.ui-input.invalid:focus-within {
  box-shadow: 0 0 0 3px var(--danger-soft);
}
.ui-input.disabled {
  background: var(--surface-2);
  opacity: 0.7;
  cursor: not-allowed;
}
.ui-input input {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text);
  font-size: var(--text-base);
}
.ui-input input::placeholder {
  color: var(--text-3);
}
.ui-input-affix {
  display: inline-flex;
  align-items: center;
  color: var(--text-3);
  flex-shrink: 0;
}
</style>
