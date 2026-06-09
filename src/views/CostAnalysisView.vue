<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { DollarSign, Loader2, RefreshCw, TrendingUp } from 'lucide-vue-next'
import axios from 'axios'
import { getToken } from '@/network/http'

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

const data = ref<{
  models: ModelCost[]
  totalCost: number
  totalTokens: number
  totalRequests: number
  avgLatency: number
  trend: TrendPoint[]
} | null>(null)
const loading = ref(true)
const hours = ref(168)

const api = axios.create({ baseURL: '/api' })
api.interceptors.request.use((c) => {
  const t = getToken()
  if (t) c.headers.Authorization = `Bearer ${t}`
  return c
})

const load = async () => {
  loading.value = true
  try {
    const { data: resp } = await api.get<{ code: number; data: any }>('/dashboard/cost-analysis', { params: { hours: hours.value } })
    data.value = resp.data
  } finally { loading.value = false }
}

onMounted(load)

const COLORS = ['#1683ff', '#f5a94e', '#38d99a', '#8b5cf6', '#64748b', '#e5484d', '#ff6b6b']
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>成本分析</h1>
      <div class="header-actions">
        <select v-model="hours" class="filter-select" @change="load">
          <option :value="24">最近 24h</option>
          <option :value="168">最近 7 天</option>
          <option :value="720">最近 30 天</option>
        </select>
        <button class="action-btn" @click="load"><RefreshCw :size="15" :class="{ spin: loading }" /> 刷新</button>
      </div>
    </div>

    <div v-if="loading" class="state-box"><Loader2 :size="28" class="spin" /><span>加载中...</span></div>

    <template v-else-if="data">
      <div class="summary-row">
        <div class="sum-card">
          <DollarSign :size="20" />
          <div><span>总成本</span><b>${{ data.totalCost.toFixed(2) }}</b></div>
        </div>
        <div class="sum-card">
          <TrendingUp :size="20" />
          <div><span>总请求</span><b>{{ data.totalRequests.toLocaleString() }}</b></div>
        </div>
        <div class="sum-card">
          <span class="sum-icon">T</span>
          <div><span>总 Token</span><b>{{ (data.totalTokens / 1e6).toFixed(1) }}M</b></div>
        </div>
        <div class="sum-card">
          <span class="sum-icon">ms</span>
          <div><span>平均延迟</span><b>{{ data.avgLatency }}ms</b></div>
        </div>
      </div>

      <div class="chart-row">
        <div class="card">
          <h3>按模型成本分布</h3>
          <div class="model-bars">
            <div v-for="(m, i) in data.models" :key="m.model" class="bar-row">
              <span class="bar-label">{{ m.model }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: m.percentage + '%', background: COLORS[i % COLORS.length] }"></div>
              </div>
              <span class="bar-val">${{ m.cost.toFixed(2) }} ({{ m.percentage.toFixed(1) }}%)</span>
            </div>
          </div>
        </div>

        <div class="card">
          <h3>每日成本趋势</h3>
          <div v-if="data.trend.length" class="trend-list">
            <div v-for="p in data.trend.slice(-14)" :key="p.date" class="trend-row">
              <span>{{ p.date }}</span>
              <span class="trend-cost">${{ p.cost.toFixed(2) }}</span>
            </div>
          </div>
          <div v-else class="empty-note">暂无数据</div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page { padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
h1 { margin: 0; font-size: 22px; font-weight: 680; }
.header-actions { display: flex; align-items: center; gap: 12px; }
.filter-select { height: 33px; padding: 0 10px; border-radius: 6px; border: 1px solid var(--line); background: var(--surface-2); color: var(--foreground); font-size: 13px; cursor: pointer; }
.action-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 13px; border-radius: 6px; border: 1px solid var(--line); background: transparent; color: var(--muted); font-size: 13px; cursor: pointer; }
.action-btn:hover { color: var(--foreground); border-color: var(--line-strong); }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.state-box { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 64px; color: var(--muted); }

.summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.sum-card { display: flex; align-items: center; gap: 14px; padding: 18px 22px; border-radius: 9px; border: 1px solid var(--line); background: var(--surface); color: var(--accent-bright); }
.sum-card div { display: flex; flex-direction: column; gap: 2px; }
.sum-card span { font-size: 12px; color: var(--muted); }
.sum-card b { font-size: 18px; color: var(--foreground); font-weight: 700; }
.sum-icon { font-size: 16px; font-weight: 800; width: 32px; text-align: center; }

.chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.card { padding: 20px 22px; border-radius: 9px; border: 1px solid var(--line); background: var(--surface); }
.card h3 { margin: 0 0 16px; font-size: 15px; font-weight: 600; }

.model-bars { display: flex; flex-direction: column; gap: 14px; }
.bar-row { display: flex; align-items: center; gap: 12px; }
.bar-label { width: 100px; font-size: 13px; color: var(--foreground); flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar-track { flex: 1; height: 8px; border-radius: 4px; background: var(--surface-2); overflow: hidden; }
.bar-fill { height: 100%; border-radius: 4px; min-width: 2px; }
.bar-val { width: 150px; font-size: 12px; color: var(--muted); text-align: right; flex-shrink: 0; }

.trend-list { display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; }
.trend-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--muted); padding: 4px 0; border-bottom: 1px solid var(--line); }
.trend-cost { color: var(--foreground); font-weight: 600; }
.empty-note { padding: 40px 0; text-align: center; color: var(--muted); font-size: 14px; }

@media (max-width: 1200px) { .summary-row { grid-template-columns: repeat(2, 1fr); } .chart-row { grid-template-columns: 1fr; } }
@media (max-width: 767px) { .page { padding: 16px; } .summary-row { grid-template-columns: 1fr; } }
</style>
