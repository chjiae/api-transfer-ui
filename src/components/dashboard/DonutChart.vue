<script setup lang="ts">
import { computed } from 'vue'
import { type ModelSlice } from '@/network/dashboard'

const props = defineProps<{
  slices: ModelSlice[]
}>()

const W = 220
const H = 220
const CX = W / 2
const CY = H / 2
const R = 72
const INNER = 42

const COLORS = ['#1683ff', '#f5a94e', '#38d99a', '#8b5cf6', '#64748b', '#e5484d', '#ff6b6b']

const total = computed(() => props.slices.reduce((s, v) => s + v.percentage, 0))

function describeArc(index: number): string {
  const startAngle = props.slices.slice(0, index).reduce((s, v) => s + (v.percentage / (total.value || 1)) * 360, 0) - 90
  const sweep = (props.slices[index].percentage / (total.value || 1)) * 360
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

const topModel = computed(() => {
  if (!props.slices.length) return { name: '—', pct: '0%' }
  return { name: props.slices[0].model, pct: props.slices[0].percentage.toFixed(0) + '%' }
})
</script>

<template>
  <div class="donut-wrap">
    <svg :viewBox="`0 0 ${W} ${H}`" class="donut-svg">
      <path
        v-for="(slice, i) in slices"
        :key="slice.model"
        :d="describeArc(i)"
        :fill="COLORS[i % COLORS.length]"
        stroke="var(--surface)"
        stroke-width="2"
      />
      <text :x="CX" :y="CY - 4" text-anchor="middle" class="donut-center">{{ topModel.pct }}</text>
      <text :x="CX" :y="CY + 14" text-anchor="middle" class="donut-sub">{{ topModel.name }}</text>
    </svg>

    <div class="donut-legend">
      <div v-for="(slice, i) in slices" :key="slice.model" class="legend-item">
        <i :style="{ background: COLORS[i % COLORS.length] }"></i>
        <span>{{ slice.model }}</span>
        <small>{{ slice.percentage.toFixed(1) }}%</small>
      </div>
    </div>
  </div>
</template>

<style scoped>
.donut-wrap { display: flex; align-items: center; gap: 28px; }
.donut-svg { width: 180px; height: 180px; flex-shrink: 0; }
.donut-center { font-size: 18px; font-weight: 700; fill: var(--foreground); }
.donut-sub { font-size: 11px; fill: var(--muted); }
.donut-legend { display: flex; flex-direction: column; gap: 10px; }
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--foreground); }
.legend-item i { width: 9px; height: 9px; border-radius: 2px; flex-shrink: 0; }
.legend-item small { margin-left: auto; color: var(--muted); font-size: 12px; }
</style>
