<script setup lang="ts">
import { watch, onUnmounted } from 'vue'
import { PhX as X } from '@phosphor-icons/vue'

interface Props {
  open: boolean
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
}
const props = withDefaults(defineProps<Props>(), { size: 'md' })
const emit = defineEmits<{ close: [] }>()

// 打开时锁滚动
watch(
  () => props.open,
  (v) => {
    document.body.style.overflow = v ? 'hidden' : ''
  },
)
onUnmounted(() => {
  document.body.style.overflow = ''
})

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="ui-modal-root"
        @keydown="onKeydown"
        tabindex="-1"
      >
        <div class="ui-modal-backdrop" @click="emit('close')" />
        <div class="ui-modal" :class="`s-${size}`" role="dialog" aria-modal="true">
          <header v-if="title || $slots.header" class="ui-modal-head">
            <slot name="header">
              <div>
                <h2 class="ui-modal-title">{{ title }}</h2>
                <p v-if="description" class="ui-modal-desc">{{ description }}</p>
              </div>
            </slot>
            <button class="ui-modal-close" aria-label="关闭" @click="emit('close')">
              <X :size="18" />
            </button>
          </header>

          <div class="ui-modal-body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="ui-modal-foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ui-modal-root {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}
.ui-modal-backdrop {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--canvas) 55%, rgba(0, 0, 0, 0.45));
  backdrop-filter: blur(3px);
}
.ui-modal {
  position: relative;
  width: 100%;
  max-height: calc(100dvh - 32px);
  display: flex;
  flex-direction: column;
  background: var(--overlay);
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.s-sm {
  max-width: 400px;
}
.s-md {
  max-width: 520px;
}
.s-lg {
  max-width: 720px;
}
.ui-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6) var(--space-4);
}
.ui-modal-title {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 580;
  letter-spacing: -0.01em;
}
.ui-modal-desc {
  margin: 5px 0 0;
  font-size: var(--text-sm);
  color: var(--text-3);
}
.ui-modal-close {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  margin: -4px -8px 0 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-3);
  cursor: pointer;
  transition: background var(--dur-fast), color var(--dur-fast);
}
.ui-modal-close:hover {
  background: var(--surface-2);
  color: var(--text);
}
.ui-modal-body {
  padding: 0 var(--space-6) var(--space-5);
  overflow-y: auto;
}
.ui-modal-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--line);
  background: var(--surface);
}

/* 动效 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--dur) var(--ease);
}
.modal-enter-active .ui-modal,
.modal-leave-active .ui-modal {
  transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .ui-modal,
.modal-leave-to .ui-modal {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
</style>
