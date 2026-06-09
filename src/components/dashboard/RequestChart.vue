<script setup lang="ts">
import { computed, ref } from 'vue'
import { type TrendPoint } from '@/network/dashboard'

const props = defineProps<{
  points: TrendPoint[]
}>()

const W = 760
const H = 260
const PAD = { top: 16, right: 24, bottom: 32, left: 48 }
const plotW = W - PAD.left - PAD.right
const plotH = H - PAD.top - PAD.bottom

const requestData = computed(() => props.points.map((p) => p.requests))
const successData = computed(() => props.points.map((p) => p.successRate))
const timeLabels = computed(() => props.points.map((p) => p.time))

const maxReq = computed(() => {
  const m = Math.max(...requestData.value, 1)
  return Math.ceil(m / 200) * 200 || 200
})

const barWidth = computed(() => Math.max(6, (plotW / Math.max(requestData.value.length, 1)) * 0.6))
const barGap = computed(() => plotW / Math.max(requestData.value.length, 1))

const linePath = computed(() => {
  if (!successData.value.length) return ''
  const stepX = plotW / (successData.value.length - 1)
  const yMin = Math.max(0, Math.floor(Math.min(...successData.value) - 2))
  const yMax = 100
  return successData.value.length > 1
    ? successData.value.map((v, i) => {
        const x = PAD.left + i * stepX
        const y = PAD.top + plotH * (1 - (v - yMin) / (yMax - yMin))
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      }).join(' ')
    : ''
})

const yTicks = computed(() => Array.from({ length: 5 }, (_, i) => Math.round((maxReq.value / 4) * i)))

const hoverIndex = ref<number | null>(null)
</script>

<template>
  <div class="chart-wrapper">
    <svg :viewBox="`0 0 ${W} ${H}`" class="chart-svg">
      <line
        v-for="tick in yTicks"
        :key="tick"
        :x1="PAD.left" :x2="W - PAD.right"
        :y1="PAD.top + plotH - (tick / maxReq) * plotH"
        :y2="PAD.top + plotH - (tick / maxReq) * plotH"
        stroke="var(--line)" stroke-dasharray="3,3"
      />
      <text
        v-for="tick in yTicks"
        :key="'y-' + tick"
        :x="PAD.left - 10"
        :y="PAD.top + plotH - (tick / maxReq) * plotH + 4"
        text-anchor="end" class="tick-label"
      >{{ tick >= 1000 ? (tick / 1000) + 'K' : tick }}</text>

      <g v-for="(v, i) in requestData" :key="'bar-'+i">
        <rect
          :x="PAD.left + i * barGap + (barGap - barWidth) / 2"
          :y="PAD.top + plotH - (v / maxReq) * plotH"
          :width="barWidth"
          :height="(v / maxReq) * plotH"
          :fill="hoverIndex === i ? '#43a4ff' : '#1683ff'"
          :opacity="hoverIndex === i ? 1 : 0.8"
          rx="1.5"
          @mouseenter="hoverIndex = i"
          @mouseleave="hoverIndex = null"
          style="cursor: pointer"
        />
      </g>

      <path v-if="linePath" :d="linePath" fill="none" stroke="#38d99a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <circle
        v-for="(v, i) in successData"
        :key="'dot-'+i"
        :cx="PAD.left + i * (plotW / Math.max(successData.length - 1, 1))"
        :cy="PAD.top + plotH * (1 - (v - Math.max(0, Math.floor(Math.min(...successData) - 2))) / (100 - Math.max(0, Math.floor(Math.min(...successData) - 2))))"
        r="3.5"
        :fill="hoverIndex === i ? '#38d99a' : 'var(--surface)'"
        stroke="#38d99a"
        stroke-width="1.5"
        :opacity="hoverIndex === i ? 1 : 0"
        style="transition: opacity 140ms"
      />

      <text
        v-for="(l, i) in timeLabels"
        :key="'x-'+i"
        :x="PAD.left + i * (plotW / Math.max(timeLabels.length - 1, 1))"
        :y="H - 6"
        text-anchor="middle" class="tick-label"
        v-show="timeLabels.length <= 12 || i % 3 === 0"
      >{{ l }}</text>
    </svg>

    <div v-if="hoverIndex !== null" class="chart-tooltip" :style="{ left: (PAD.left + hoverIndex * barGap) + 'px' }">
      <div>{{ timeLabels[hoverIndex] }}</div>
      <div>请求: {{ requestData[hoverIndex]?.toLocaleString() }}</div>
      <div>成功率: {{ successData[hoverIndex] }}%</div>
    </div>
  </div>
</template>

<style scoped>
.chart-wrapper { position: relative; width: 100%; }
.chart-svg { width: 100%; height: auto; }
.tick-label { font-size: 10px; fill: var(--muted); }
.chart-tooltip { position: absolute; top: 0; transform: translateX(-50%); padding: 6px 10px; border-radius: 5px; background: var(--surface-2); border: 1px solid var(--line-strong); font-size: 11px; color: var(--foreground); pointer-events: none; white-space: nowrap; z-index: 5; }
.chart-tooltip div + div { margin-top: 2px; }
</style>
