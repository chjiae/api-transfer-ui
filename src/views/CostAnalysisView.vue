<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { PhArrowClockwise as RefreshCw } from '@phosphor-icons/vue'
import axios from 'axios'
import { getToken } from '@/network/http'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiSpinner from '@/components/ui/UiSpinner.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'

interface ModelCost {
  model: string
  cost: number
  tokens: number
  requests: number
  percentage: number
}
interface TrendPoint {
  date: string
  cost: number
}
interface CostData {
  models: ModelCost[]
  totalCost: number
  totalTokens: number
  totalRequests: number
  avgLatency: number
  trend: TrendPoint[]
}

const data = ref<CostData | null>(null)
const loading = ref(true)
const hours = ref('168')

const api = axios.create({ baseURL: '/api' })
api.interceptors.request.use((c) => {
  const t = getToken()
  if (t) c.headers.Authorization = `Bearer ${t}`
  return c
})

const load = async () => {
  loading.value = true
  try {
    const { data: resp } = await api.get<{ code: number; data: CostData }>('/dashboard/cost-analysis', {
      params: { hours: Number(hours.value) },
    })
    data.value = resp.data
  } finally {
    loading.value = false
  }
}
onMounted(load)

// 协调的图表色板（与 Donut 一致）
const COLORS = ['#4b45e4', '#3ba7a0', '#d99a3c', '#8b78e6', '#6b8aae', '#cf6b6b', '#9a9a93']

const summaryCards = (d: CostData) => [
  { label: '总成本', value: '$' + d.totalCost.toFixed(2) },
  { label: '总请求', value: d.totalRequests.toLocaleString() },
  { label: '总 Token', value: (d.totalTokens / 1e6).toFixed(2) + 'M' },
  { label: '平均延迟', value: d.avgLatency.toLocaleString() + ' ms' },
]
</script>

<template>
  <div class="page-wrap">
    <UiPageHeader title="成本分析" description="按模型与时间维度拆解网关消费，定位主要成本来源">
      <template #actions>
        <UiSelect v-model="hours" size="sm" @update:modelValue="load">
          <option value="24">最近 24 小时</option>
          <option value="168">最近 7 天</option>
          <option value="720">最近 30 天</option>
        </UiSelect>
        <UiButton variant="ghost" size="sm" :loading="loading" @click="load">
          <RefreshCw :size="15" /> 刷新
        </UiButton>
      </template>
    </UiPageHeader>

    <UiCard v-if="loading && !data" pad="none">
      <UiSpinner center label="正在统计成本" />
    </UiCard>

    <template v-else-if="data">
      <div class="sum-grid">
        <UiCard v-for="c in summaryCards(data)" :key="c.label" pad="md" class="sum-card">
          <span class="sum-label">{{ c.label }}</span>
          <span class="sum-val tnum">{{ c.value }}</span>
        </UiCard>
      </div>

      <div class="cost-row">
        <UiCard pad="lg">
          <h3 class="card-title">按模型成本占比</h3>
          <UiEmpty v-if="!data.models.length" size="sm" title="暂无成本数据" description="产生计费调用后会在此显示" />
          <div v-else class="bars">
            <div v-for="(m, i) in data.models" :key="m.model" class="bar-row">
              <span class="bar-label mono">{{ m.model }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: m.percentage + '%', background: COLORS[i % COLORS.length] }" />
              </div>
              <span class="bar-val mono">${{ m.cost.toFixed(2) }}<span class="bar-pct">{{ m.percentage.toFixed(1) }}%</span></span>
            </div>
          </div>
        </UiCard>

        <UiCard pad="lg">
          <h3 class="card-title">每日成本趋势</h3>
          <UiEmpty v-if="!data.trend.length" size="sm" title="暂无趋势数据" description="累积几天的调用后趋势会更清晰" />
          <div v-else class="trend">
            <div v-for="p in data.trend.slice(-14)" :key="p.date" class="trend-row">
              <span class="trend-date mono">{{ p.date }}</span>
              <span class="trend-cost mono">${{ p.cost.toFixed(2) }}</span>
            </div>
          </div>
        </UiCard>
      </div>
    </template>
  </div>
</template>

<style scoped>
.sum-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}
.sum-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sum-label {
  font-size: var(--text-sm);
  color: var(--text-3);
}
.sum-val {
  font-size: 26px;
  font-weight: 560;
  color: var(--text);
  letter-spacing: -0.02em;
}
.cost-row {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: var(--space-4);
}
.card-title {
  margin: 0 0 var(--space-5);
  font-size: var(--text-md);
  font-weight: 560;
}
.bars {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.bar-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.bar-label {
  width: 130px;
  flex-shrink: 0;
  font-size: var(--text-sm);
  color: var(--text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bar-track {
  flex: 1;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--surface-3);
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  min-width: 3px;
  transition: width var(--dur-slow) var(--ease);
}
.bar-val {
  width: 120px;
  flex-shrink: 0;
  text-align: right;
  font-size: var(--text-sm);
  color: var(--text);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}
.bar-pct {
  font-size: 11px;
  color: var(--text-3);
}
.trend {
  display: flex;
  flex-direction: column;
  max-height: 340px;
  overflow-y: auto;
}
.trend-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  font-size: var(--text-sm);
  border-bottom: 1px solid var(--line);
}
.trend-row:last-child {
  border-bottom: none;
}
.trend-date {
  color: var(--text-3);
}
.trend-cost {
  color: var(--text);
  font-weight: 540;
}
.mono {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
@media (max-width: 1100px) {
  .sum-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .cost-row {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .sum-grid {
    grid-template-columns: 1fr;
  }
}
</style>
