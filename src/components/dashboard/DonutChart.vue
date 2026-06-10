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

const COLORS = ['#4b45e4', '#3ba7a0', '#d99a3c', '#8b78e6', '#6b8aae', '#cf6b6b', '#9a9a93']

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
  if (!props.slices.length) return { name: '暂无', pct: '0%' }
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
.donut-svg { width: 168px; height: 168px; flex-shrink: 0; }
.donut-center { font-size: 19px; font-weight: 600; fill: var(--text); font-family: var(--font-mono); }
.donut-sub { font-size: 10px; fill: var(--text-3); }
.donut-legend { display: flex; flex-direction: column; gap: 11px; min-width: 0; flex: 1; }
.legend-item { display: flex; align-items: center; gap: 9px; font-size: var(--text-sm); color: var(--text-2); min-width: 0; }
.legend-item span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.legend-item i { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
.legend-item small { margin-left: auto; color: var(--text-3); font-family: var(--font-mono); font-variant-numeric: tabular-nums; padding-left: 8px; }
</style>
