<script setup lang="ts">
import { computed, ref } from 'vue'

const W = 760
const H = 260
const PAD = { top: 16, right: 24, bottom: 32, left: 48 }
const plotW = W - PAD.left - PAD.right
const plotH = H - PAD.top - PAD.bottom

// Mock time points
const timeLabels = ['00:00','01:00','02:00','03:00','04:00','05:00','06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00']

const requestData = [420,380,350,300,280,250,320,580,890,1100,1250,1380,1420,1350,1280,1400,1520,1480,1300,1050,820,650,520,480]
const successData = [99.2,99.3,99.1,99.4,99.2,99.5,99.3,99.1,98.9,99.0,99.2,99.1,99.3,99.2,99.4,99.1,99.3,99.2,99.4,99.1,99.3,99.2,99.4,99.3]

const maxReq = Math.ceil(Math.max(...requestData) / 200) * 200

const barWidth = computed(() => Math.max(6, (plotW / requestData.length) * 0.6))
const barGap = computed(() => plotW / requestData.length)


const linePath = computed(() => {
  const stepX = plotW / (successData.length - 1)
  const yMin = 96
  const yMax = 100
  return successData.map((v, i) => {
    const x = PAD.left + i * stepX
    const y = PAD.top + plotH * (1 - (v - yMin) / (yMax - yMin))
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
})

const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((maxReq / 4) * i))

const hoverIndex = ref<number | null>(null)
</script>

<template>
  <div class="chart-wrapper">
    <svg :viewBox="`0 0 ${W} ${H}`" class="chart-svg">
      <!-- Grid lines -->
      <line
        v-for="tick in yTicks"
        :key="tick"
        :x1="PAD.left" :x2="W - PAD.right"
        :y1="PAD.top + plotH - (tick / maxReq) * plotH"
        :y2="PAD.top + plotH - (tick / maxReq) * plotH"
        stroke="var(--line)" stroke-dasharray="3,3"
      />
      <!-- Y labels -->
      <text
        v-for="tick in yTicks"
        :key="'y-' + tick"
        :x="PAD.left - 10"
        :y="PAD.top + plotH - (tick / maxReq) * plotH + 4"
        text-anchor="end" class="tick-label"
      >{{ tick >= 1000 ? (tick / 1000) + 'K' : tick }}</text>

      <!-- Bars -->
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

      <!-- Success rate line -->
      <path :d="linePath" fill="none" stroke="#38d99a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      <circle
        v-for="(v, i) in successData"
        :key="'dot-'+i"
        :cx="PAD.left + i * (plotW / (successData.length - 1))"
        :cy="PAD.top + plotH * (1 - (v - 96) / 4)"
        r="3.5"
        :fill="hoverIndex === i ? '#38d99a' : 'var(--surface)'"
        :stroke="hoverIndex === i ? '#38d99a' : '#38d99a'"
        stroke-width="1.5"
        :opacity="hoverIndex === i ? 1 : 0"
        style="transition: opacity 140ms"
      />

      <!-- X labels -->
      <text
        v-for="(l, i) in timeLabels"
        :key="'x-'+i"
        :x="PAD.left + i * (plotW / (timeLabels.length - 1))"
        :y="H - 6"
        text-anchor="middle" class="tick-label"
        v-show="i % 3 === 0"
      >{{ l }}</text>
    </svg>

    <!-- Hover tooltip -->
    <div v-if="hoverIndex !== null" class="chart-tooltip" :style="{ left: (PAD.left + hoverIndex * barGap) + 'px' }">
      <div>{{ timeLabels[hoverIndex] }}</div>
      <div>请求: {{ requestData[hoverIndex].toLocaleString() }}</div>
      <div>成功率: {{ successData[hoverIndex] }}%</div>
    </div>
  </div>
</template>

<style scoped>
.chart-wrapper {
  position: relative;
  width: 100%;
}

.chart-svg {
  width: 100%;
  height: auto;
}

.tick-label {
  font-size: 10px;
  fill: var(--muted);
}

.chart-tooltip {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  padding: 6px 10px;
  border-radius: 5px;
  background: var(--surface-2);
  border: 1px solid var(--line-strong);
  font-size: 11px;
  color: var(--foreground);
  pointer-events: none;
  white-space: nowrap;
  z-index: 5;
}

.chart-tooltip div + div { margin-top: 2px; }
</style>
