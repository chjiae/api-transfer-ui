<script setup lang="ts">
import { computed } from 'vue'

const W = 220
const H = 220
const CX = W / 2
const CY = H / 2
const R = 72
const INNER = 42

interface Slice {
  label: string
  value: number
  color: string
}

const slices: Slice[] = [
  { label: 'GPT-4o', value: 42.3, color: '#1683ff' },
  { label: 'Claude 3.5', value: 28.7, color: '#f5a94e' },
  { label: 'Gemini 1.5', value: 18.2, color: '#38d99a' },
  { label: 'Llama 3.1', value: 7.5, color: '#8b5cf6' },
  { label: '其他', value: 3.3, color: '#64748b' },
]

const total = computed(() => slices.reduce((s, v) => s + v.value, 0))

function describeArc(slice: Slice, index: number): string {
  const startAngle = slices.slice(0, index).reduce((s, v) => s + (v.value / total.value) * 360, 0) - 90
  const sweep = (slice.value / total.value) * 360
  const endAngle = startAngle + sweep

  const rad = (deg: number) => (deg * Math.PI) / 180
  const sA = rad(startAngle)
  const eA = rad(endAngle)

  const x1 = CX + R * Math.cos(sA)
  const y1 = CY + R * Math.sin(sA)
  const x2 = CX + R * Math.cos(eA)
  const y2 = CY + R * Math.sin(eA)

  const xi1 = CX + INNER * Math.cos(sA)
  const yi1 = CY + INNER * Math.sin(sA)
  const xi2 = CX + INNER * Math.cos(eA)
  const yi2 = CY + INNER * Math.sin(eA)

  const large = sweep > 180 ? 1 : 0

  return [
    `M${x1.toFixed(1)},${y1.toFixed(1)}`,
    `A${R},${R} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)}`,
    `L${xi2.toFixed(1)},${yi2.toFixed(1)}`,
    `A${INNER},${INNER} 0 ${large} 0 ${xi1.toFixed(1)},${yi1.toFixed(1)}`,
    'Z',
  ].join(' ')
}
</script>

<template>
  <div class="donut-wrap">
    <svg :viewBox="`0 0 ${W} ${H}`" class="donut-svg">
      <path
        v-for="(slice, i) in slices"
        :key="slice.label"
        :d="describeArc(slice, i)"
        :fill="slice.color"
        stroke="var(--surface)"
        stroke-width="2"
      />
      <text :x="CX" :y="CY - 4" text-anchor="middle" class="donut-center">{{ total.toFixed(0) }}%</text>
      <text :x="CX" :y="CY + 14" text-anchor="middle" class="donut-sub">GPT-4o</text>
    </svg>

    <div class="donut-legend">
      <div v-for="slice in slices" :key="slice.label" class="legend-item">
        <i :style="{ background: slice.color }"></i>
        <span>{{ slice.label }}</span>
        <small>{{ slice.value }}%</small>
      </div>
    </div>
  </div>
</template>

<style scoped>
.donut-wrap {
  display: flex;
  align-items: center;
  gap: 28px;
}

.donut-svg {
  width: 180px;
  height: 180px;
  flex-shrink: 0;
}

.donut-center {
  font-size: 18px;
  font-weight: 700;
  fill: var(--foreground);
}

.donut-sub {
  font-size: 11px;
  fill: var(--muted);
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--foreground);
}

.legend-item i {
  width: 9px;
  height: 9px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-item small {
  margin-left: auto;
  color: var(--muted);
  font-size: 12px;
}
</style>
