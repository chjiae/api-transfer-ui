<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  data: number[]
  width?: number
  height?: number
  color?: string
}>(), {
  width: 72,
  height: 28,
  color: 'var(--accent)',
})

const path = computed(() => {
  const { data, width, height } = props
  if (!data.length) return ''
  const max = Math.max(...data) || 1
  const min = Math.min(...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1)
  const padY = 4
  const h = height - padY * 2

  return data
    .map((v, i) => {
      const x = i * stepX
      const y = padY + h * (1 - (v - min) / range)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
})

const areaPath = computed(() => {
  if (!path.value) return ''
  const w = props.width
  return `${path.value} L${w},${props.height} L0,${props.height} Z`
})
</script>

<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" class="sparkline">
    <path :d="areaPath" :fill="color" fill-opacity="0.09" />
    <path :d="path" :stroke="color" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>

<style scoped>
.sparkline {
  display: block;
  flex-shrink: 0;
}
</style>
