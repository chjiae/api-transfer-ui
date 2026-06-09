<script setup lang="ts">
import {
  Download,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import StatsCard from '@/components/dashboard/StatsCard.vue'
import RequestChart from '@/components/dashboard/RequestChart.vue'
import DonutChart from '@/components/dashboard/DonutChart.vue'
import {
  fetchDashboardOverview,
  type DashboardOverview,
} from '@/network/dashboard'

const timeRange = ref<'realtime' | '1h' | '6h' | '24h' | '7d' | '30d' | 'custom'>('24h')

const hoursMap: Record<string, number> = {
  realtime: 0,
  '1h': 1,
  '6h': 6,
  '24h': 24,
  '7d': 168,
  '30d': 720,
  custom: 24,
}

const hours = computed(() => hoursMap[timeRange.value] ?? 24)

const timeOptions = [
  { value: 'realtime' as const, label: '实时' },
  { value: '1h' as const, label: '1小时' },
  { value: '6h' as const, label: '6小时' },
  { value: '24h' as const, label: '24小时' },
  { value: '7d' as const, label: '7天' },
  { value: '30d' as const, label: '30天' },
  { value: 'custom' as const, label: '自定义' },
]

const data = ref<DashboardOverview | null>(null)
const loading = ref(true)
const error = ref('')

const loadData = async () => {
  loading.value = true
  error.value = ''
  try {
    data.value = await fetchDashboardOverview(hours.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
watch(hours, loadData)

// Computed stat cards
const stats = computed(() => {
  if (!data.value) return []
  const d = data.value
  return [
    { label: '请求总数', value: d.totalRequests.toLocaleString(), change: 0, changeLabel: '当前周期', sparkData: d.requestTrend.map(p => p.requests), trend: 'up' as const },
    { label: '成功率', value: d.successRate.toFixed(2) + '%', change: 0, changeLabel: '当前周期', sparkData: d.requestTrend.map(p => p.successRate), trend: 'up' as const },
    { label: '平均延迟', value: d.avgLatency + 'ms', change: 0, changeLabel: '当前周期', sparkData: d.requestTrend.map(p => p.requests > 0 ? Math.max(1, d.avgLatency - p.requests * 0.01 + Math.random() * 20) : d.avgLatency), trend: 'down' as const },
    { label: '总消费', value: '$' + d.totalCost.toFixed(2), change: 0, changeLabel: '当前周期', sparkData: d.modelDistribution.map(m => m.cost * 100), trend: 'up' as const },
  ]
})

const quotaPct = computed(() => {
  if (!data.value) return 0
  return Math.min(100, (data.value.rpmUsed / data.value.rpmLimit) * 100)
})

const statusLabel = (s: string) => ({ healthy: '健康', warning: '风险', fault: '故障' }[s] ?? s)

const fmt = (n: number) => {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return String(n)
}

// Channel table
const searchQuery = ref('')
const statusFilter = ref<'all' | string>('all')
const typeFilter = ref('all')
const page = ref(1)
const pageSize = 5

const filteredChannels = computed(() => {
  if (!data.value) return []
  return data.value.channelHealth.filter((c) => {
    if (searchQuery.value && !c.name.toLowerCase().includes(searchQuery.value.toLowerCase())) return false
    if (statusFilter.value !== 'all' && c.status !== statusFilter.value) return false
    if (typeFilter.value !== 'all' && c.type !== typeFilter.value) return false
    return true
  })
})

const totalPages = computed(() => Math.ceil(filteredChannels.value.length / pageSize))
const pagedChannels = computed(() => filteredChannels.value.slice((page.value - 1) * pageSize, page.value * pageSize))
</script>

<template>
  <div class="overview">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">概览</h1>
      <div class="header-actions">
        <div class="time-pills">
          <button
            v-for="opt in timeOptions"
            :key="opt.value"
            class="time-pill"
            :class="{ active: timeRange === opt.value }"
            @click="timeRange = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
        <button class="action-btn" @click="loadData"><RefreshCw :size="15" :class="{ spin: loading }" /> 刷新</button>
        <button class="action-btn"><Download :size="15" /> 导出</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && !data" class="state-box">
      <Loader2 :size="28" class="spin" />
      <span>正在加载概览数据...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error && !data" class="state-box error-box">
      <span>{{ error }}</span>
      <button class="btn-primary-sm" @click="loadData">重试</button>
    </div>

    <!-- Data -->
    <template v-else-if="data">
      <!-- Stat cards -->
      <div class="stat-grid">
        <StatsCard v-for="s in stats" :key="s.label" v-bind="s" />
      </div>

      <!-- Chart row -->
      <div class="chart-row">
        <div class="chart-card chart-wide">
          <div class="chart-header">
            <h3>请求量趋势</h3>
            <div class="chart-legend">
              <span><i style="background:#1683ff"></i>请求量</span>
              <span><i style="background:#38d99a"></i>成功率</span>
            </div>
          </div>
          <RequestChart :points="data.requestTrend" />
        </div>

        <div class="chart-card chart-narrow">
          <div class="chart-header">
            <h3>模型成本分布</h3>
          </div>
          <DonutChart :slices="data.modelDistribution" />
        </div>
      </div>

      <!-- Channels table -->
      <div class="table-card">
        <div class="table-header">
          <h3>通道健康状态</h3>
          <div class="table-actions">
            <div class="table-search">
              <Search :size="14" />
              <input v-model="searchQuery" type="text" placeholder="搜索通道..." />
            </div>
            <select v-model="statusFilter" class="table-filter">
              <option value="all">全部状态</option>
              <option value="healthy">健康</option>
              <option value="warning">风险</option>
              <option value="fault">故障</option>
            </select>
            <select v-model="typeFilter" class="table-filter">
              <option value="all">全部类型</option>
            </select>
            <button class="btn-primary-sm"><Plus :size="15" /> 新建通道</button>
          </div>
        </div>

        <div v-if="filteredChannels.length === 0" class="table-empty">
          暂无通道数据
        </div>

        <template v-else>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>通道名称</th>
                  <th>类型</th>
                  <th>所属模型</th>
                  <th>状态</th>
                  <th class="num">成功率</th>
                  <th class="num">平均延迟</th>
                  <th class="num">24h 请求量</th>
                  <th class="num">24h 成本</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in pagedChannels" :key="row.name">
                  <td class="fw6">{{ row.name }}</td>
                  <td>{{ row.type }}</td>
                  <td>{{ row.model }}</td>
                  <td>
                    <span class="status-dot" :class="row.status"></span>
                    {{ statusLabel(row.status) }}
                  </td>
                  <td class="num">{{ row.successRate }}%</td>
                  <td class="num">{{ row.avgLatency }}ms</td>
                  <td class="num">{{ fmt(row.requests24h) }}</td>
                  <td class="num">${{ row.cost24h.toFixed(0) }}</td>
                  <td>
                    <button class="row-action"><MoreHorizontal :size="16" /></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="table-foot">
            <span class="table-count">{{ filteredChannels.length }} 个通道</span>
            <div class="pagination">
              <button :disabled="page <= 1" @click="page--">上一页</button>
              <span v-for="p in totalPages" :key="p" class="page-num" :class="{ active: p === page }" @click="page = p">{{ p }}</span>
              <button :disabled="page >= totalPages" @click="page++">下一页</button>
            </div>
          </div>
        </template>
      </div>

      <!-- Bottom info cards -->
      <div class="info-row">
        <div class="info-card">
          <div class="info-head">
            <span>速率限制 RPM</span>
            <span class="info-val">{{ data.rpmUsed.toLocaleString() }} / {{ data.rpmLimit.toLocaleString() }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: quotaPct + '%' }"></div>
          </div>
        </div>

        <div class="info-card">
          <div class="info-head">
            <span>账户额度</span>
            <span class="info-val balance">{{ data.accountQuota.toLocaleString() }}</span>
          </div>
          <div class="info-sub">剩余可用额度（内部信用单位）</div>
        </div>

        <div class="info-card">
          <div class="info-head">
            <span>通道错误率</span>
            <span class="info-val" :class="data.errorRate > 5 ? 'error' : ''">{{ data.errorRate.toFixed(2) }}%</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.overview {
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ---------- Header ---------- */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 680;
  letter-spacing: -0.03em;
}

.header-actions { display: flex; align-items: center; gap: 12px; }

.time-pills { display: flex; gap: 4px; padding: 3px; border-radius: 7px; background: var(--surface); border: 1px solid var(--line); }
.time-pill { padding: 5px 12px; font-size: 12px; font-weight: 500; border-radius: 5px; border: none; background: transparent; color: var(--muted); cursor: pointer; transition: all 140ms; white-space: nowrap; }
.time-pill:hover { color: var(--foreground); }
.time-pill.active { color: #fff; background: var(--accent); }

.action-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 13px; border-radius: 6px;
  border: 1px solid var(--line); background: transparent; color: var(--muted);
  font-size: 13px; cursor: pointer; transition: all 140ms;
}
.action-btn:hover { color: var(--foreground); border-color: var(--line-strong); }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ---------- States ---------- */
.state-box {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 64px 24px; color: var(--muted); font-size: 14px;
}
.error-box { color: #e5484d; }

/* ---------- Stat grid ---------- */
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }

/* ---------- Chart row ---------- */
.chart-row { display: grid; grid-template-columns: 1.75fr 1fr; gap: 16px; }
.chart-card { padding: 20px 22px; border-radius: 9px; border: 1px solid var(--line); background: var(--surface); }
.chart-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.chart-header h3 { margin: 0; font-size: 15px; font-weight: 600; }
.chart-legend { display: flex; gap: 16px; font-size: 12px; color: var(--muted); }
.chart-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 5px; vertical-align: -1px; }

/* ---------- Table ---------- */
.table-card { border-radius: 9px; border: 1px solid var(--line); background: var(--surface); }
.table-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 18px 22px; border-bottom: 1px solid var(--line); }
.table-header h3 { margin: 0; font-size: 15px; font-weight: 600; }
.table-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.table-search { display: flex; align-items: center; gap: 7px; height: 33px; padding: 0 10px; border-radius: 6px; border: 1px solid var(--line); background: var(--surface-2); color: var(--muted); }
.table-search input { background: transparent; border: none; outline: none; color: var(--foreground); font-size: 12px; width: 140px; }
.table-search input::placeholder { color: var(--muted); }
.table-filter { height: 33px; padding: 0 10px; border-radius: 6px; border: 1px solid var(--line); background: var(--surface-2); color: var(--foreground); font-size: 12px; cursor: pointer; }
.table-filter option { background: var(--surface); }
.btn-primary-sm { display: inline-flex; align-items: center; gap: 6px; height: 33px; padding: 0 14px; border-radius: 6px; border: none; font-size: 13px; font-weight: 600; color: #fff; background: var(--accent); cursor: pointer; transition: background 160ms; }
.btn-primary-sm:hover { background: var(--accent-bright); }
.table-empty { padding: 48px 24px; text-align: center; color: var(--muted); font-size: 14px; }
.table-wrap { overflow-x: auto; }

table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { padding: 11px 16px; text-align: left; color: var(--muted); font-weight: 600; font-size: 12px; border-bottom: 1px solid var(--line); white-space: nowrap; }
th.num { text-align: right; }
td { padding: 13px 16px; border-bottom: 1px solid var(--line); white-space: nowrap; }
td.num { text-align: right; }
td.fw6 { font-weight: 600; }

.status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; vertical-align: -1px; }
.status-dot.healthy { background: var(--green); box-shadow: 0 0 5px rgba(56, 217, 154, 0.5); }
.status-dot.warning { background: #f5a94e; box-shadow: 0 0 5px rgba(245, 169, 78, 0.5); }
.status-dot.fault { background: #e5484d; box-shadow: 0 0 5px rgba(229, 72, 77, 0.5); }

.row-action { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 5px; border: none; background: transparent; color: var(--muted); cursor: pointer; }
.row-action:hover { background: rgba(255,255,255,0.04); }

.table-foot { display: flex; align-items: center; justify-content: space-between; padding: 14px 22px; border-top: 1px solid var(--line); }
.table-count { font-size: 12px; color: var(--muted); }
.pagination { display: flex; align-items: center; gap: 4px; }
.pagination button { padding: 5px 10px; border-radius: 5px; border: 1px solid var(--line); background: transparent; color: var(--muted); font-size: 12px; cursor: pointer; }
.pagination button:hover:not(:disabled) { color: var(--foreground); border-color: var(--line-strong); }
.pagination button:disabled { opacity: 0.3; cursor: default; }
.page-num { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 5px; font-size: 12px; color: var(--muted); cursor: pointer; }
.page-num:hover { color: var(--foreground); background: rgba(255,255,255,0.04); }
.page-num.active { color: #fff; background: var(--accent); }

/* ---------- Bottom info row ---------- */
.info-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.info-card { padding: 18px 22px; border-radius: 9px; border: 1px solid var(--line); background: var(--surface); }
.info-head { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--muted); }
.info-val { font-weight: 700; font-size: 15px; color: var(--foreground); }
.info-val.balance { color: var(--accent-bright); }
.info-val.error { color: #e5484d; }
.progress-bar { height: 6px; margin-top: 10px; border-radius: 3px; background: var(--surface-2); overflow: hidden; }
.progress-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--accent), var(--accent-bright)); transition: width 400ms ease; }
.info-sub { margin-top: 6px; font-size: 12px; color: var(--muted); }

/* ====== Responsive ====== */
@media (max-width: 1200px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
  .chart-row { grid-template-columns: 1fr; }
  .info-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 767px) {
  .overview { padding: 16px; }
  .stat-grid { grid-template-columns: 1fr; }
  .info-row { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; align-items: flex-start; }
  .time-pills { overflow-x: auto; width: 100%; }
  .table-header { flex-direction: column; align-items: flex-start; }
  .table-actions { width: 100%; }
}
</style>
