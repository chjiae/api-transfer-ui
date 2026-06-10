<script setup lang="ts">
import { PhSun as Sun, PhMoon as Moon } from '@phosphor-icons/vue'
import { useTheme } from '@/lib/theme'

const { theme, toggle } = useTheme()
</script>

<template>
  <button
    class="theme-toggle"
    :aria-label="theme === 'dark' ? '切换到亮色' : '切换到暗色'"
    :title="theme === 'dark' ? '切换到亮色' : '切换到暗色'"
    @click="toggle"
  >
    <Transition name="theme-icon" mode="out-in">
      <Moon v-if="theme === 'dark'" :size="18" key="moon" />
      <Sun v-else :size="18" key="sun" />
    </Transition>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-2);
  cursor: pointer;
  transition: background var(--dur-fast), color var(--dur-fast);
}
.theme-toggle:hover {
  background: var(--surface-2);
  color: var(--text);
}
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: opacity var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
}
.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-45deg) scale(0.7);
}
.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(45deg) scale(0.7);
}
</style>
