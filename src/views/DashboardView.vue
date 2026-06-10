<script setup lang="ts">
import {
  PhArrowClockwise as RefreshCw,
  PhMagnifyingGlass as Search,
  PhPlus as Plus,
  PhDotsThree as MoreH,
} from '@phosphor-icons/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import StatsCard from '@/components/dashboard/StatsCard.vue'
import RequestChart from '@/components/dashboard/RequestChart.vue'
import DonutChart from '@/components/dashboard/DonutChart.vue'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiSegmented from '@/components/ui/UiSegmented.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiSkeleton from '@/components/ui/UiSkeleton.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import { fetchDashboardOverview, type DashboardOverview } from '@/network/dashboard'

const router = useRouter()

const timeRange = ref('24h')
const hoursMap: Record<string, number> = { '1h': 1, '6h': 6, '24h': 24, '7d': 168, '30d': 720 }
const hours = computed(() => hoursMap[timeRange.value] ?? 24)
const timeOptions = [
  { value: '1h', label: '1 小时' },
  { value: '6h', label: '6 小时' },
  { value: '24h', label: '24 小时' },
  { value: '7d', label: '7 天' },
  { value: '30d', label: '30 天' },
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
    error.value = e instanceof Error ? e.message : '数据加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
watch(hours, loadData)

// —— 统计卡（真实数据 + 真实环比）——
const isAdmin = computed(() => data.value?.revenue != null)
const stats = computed(() => {
  if (!data.value) return []
  const d = data.value
  const ttftTone = d.ttftP50 > 1500 ? 'warning' : 'success'
  const successTone = d.successRate >= 99 ? 'success' : d.successRate >= 95 ? 'warning' : 'danger'
  type Card = {
    label: string; value: string; hint?: string; tone: 'neutral' | 'success' | 'warning' | 'danger'
    changePct?: number | null; changeGood?: 'up' | 'down'; changeUnit?: string; sparkData?: number[]
  }
  const cards: Card[] = [
    {
      label: '请求总数',
      value: d.totalRequests.toLocaleString(),
      hint: '本周期累计调用',
      tone: 'neutral' as const,
      changePct: d.requestsChangePct,
      changeGood: 'up' as const,
      sparkData: d.requestTrend.map((p) => p.requests),
    },
    {
      label: '成功率',
      value: d.successRate.toFixed(2) + '%',
      hint: '已完成 / 总调用',
      tone: successTone as 'success' | 'warning' | 'danger',
      changePct: d.successRateChangePct,
      changeGood: 'up' as const,
      changeUnit: 'pp',
      sparkData: d.requestTrend.map((p) => p.successRate),
    },
    {
      label: '首字延迟 P50',
      value: d.ttftP50.toLocaleString() + ' ms',
      hint: d.genAvgLatency > 0
        ? `等首个字 · 整次耗时 ${d.genAvgLatency.toLocaleString()} ms（含生成）`
        : '从发起到首字到达 · 含模型思考',
      tone: ttftTone as 'success' | 'warning',
      changePct: d.ttftChangePct,
      changeGood: 'down' as const,
    },
  ]
  // 毛利卡仅 ADMIN+ 可见；USER 维持「消费」卡
  if (isAdmin.value) {
    cards.push({
      label: '平台营收',
      value: '$' + (d.revenue ?? 0).toFixed(2),
      hint: '用户消费总额',
      tone: 'neutral' as const,
      changePct: d.costChangePct,
      changeGood: 'up' as const,
      sparkData: d.modelDistribution.map((m) => m.cost),
    })
    cards.push({
      label: '毛利',
      value: '$' + (d.grossMargin ?? 0).toFixed(2),
      hint: d.costCoverage != null
        ? `毛利率 ${(d.marginRate ?? 0).toFixed(1)}% · 成本覆盖率 ${(d.costCoverage ?? 0).toFixed(1)}%`
        : '',
      tone: ((d.grossMargin ?? 0) >= 0 ? 'success' : 'danger') as 'success' | 'danger',
      changePct: d.costCoverage ?? null,
      changeGood: 'up' as const,
      changeUnit: '% 覆盖',
    })
  } else {
    cards.push({
      label: '本周期消费',
      value: '$' + d.totalCost.toFixed(2),
      hint: '按上游计费估算',
      tone: 'neutral' as const,
      changePct: d.costChangePct,
      changeGood: 'up' as const,
      sparkData: d.modelDistribution.map((m) => m.cost),
    })
  }
  return cards
})

const statusMeta: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  healthy: { label: '健康', tone: 'success' },
  warning: { label: '波动', tone: 'warning' },
  fault: { label: '故障', tone: 'danger' },
}

const fmt = (n: number) => {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(n)
}

// —— 通道表 ——
const searchQuery = ref('')
const statusFilter = ref('all')
const filteredChannels = computed(() => {
  if (!data.value) return []
  return data.value.channelHealth.filter((c) => {
    if (searchQuery.value && !c.name.toLowerCase().includes(searchQuery.value.toLowerCase())) return false
    if (statusFilter.value !== 'all' && c.status !== statusFilter.value) return false
    return true
  })
})
</script>

<template>
  <div class="page">
    <UiPageHeader title="概览" description="实时掌握网关的调用量、成功率、延迟与成本">
      <template #actions>
        <UiSegmented v-model="timeRange" :options="timeOptions" size="sm" />
        <UiButton variant="ghost" size="sm" :loading="loading" @click="loadData">
          <RefreshCw :size="15" /> 刷新
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- 加载骨架 -->
    <template v-if="loading && !data">
      <div class="stat-grid">
        <UiCard v-for="i in 4" :key="i" pad="md">
          <UiSkeleton variant="text" width="40%" />
          <UiSkeleton variant="line" width="60%" height="28px" style="margin-top: 14px" />
        </UiCard>
      </div>
      <div class="chart-row" style="margin-top: 20px">
        <UiCard><UiSkeleton variant="block" height="260px" /></UiCard>
        <UiCard><UiSkeleton variant="block" height="260px" /></UiCard>
      </div>
    </template>

    <!-- 错误 -->
    <UiCard v-else-if="error && !data" pad="lg" class="error-state">
      <UiEmpty title="无法加载概览数据" :description="error">
        <template #action>
          <UiButton variant="primary" @click="loadData">重新加载</UiButton>
        </template>
      </UiEmpty>
    </UiCard>

    <!-- 数据 -->
    <template v-else-if="data">
      <div class="stat-grid">
        <StatsCard v-for="s in stats" :key="s.label" v-bind="s" />
      </div>

      <div class="chart-row">
        <UiCard pad="lg" class="chart-card">
          <div class="card-head">
            <h3 class="card-title">请求量与成功率</h3>
            <div class="legend">
              <span class="legend-item"><i class="sw bar" />请求量</span>
              <span class="legend-item"><i class="sw line" />成功率</span>
            </div>
          </div>
          <RequestChart :points="data.requestTrend" />
        </UiCard>

        <UiCard pad="lg" class="chart-card">
          <div class="card-head">
            <h3 class="card-title">模型成本占比</h3>
          </div>
          <DonutChart v-if="data.modelDistribution.length" :slices="data.modelDistribution" />
          <UiEmpty v-else size="sm" title="暂无成本数据" description="产生调用后这里会显示各模型的成本占比" />
        </UiCard>
      </div>

      <!-- 通道健康 -->
      <UiCard pad="none" class="table-card">
        <div class="table-head">
          <h3 class="card-title">通道健康</h3>
          <div class="table-tools">
            <UiInput v-model="searchQuery" placeholder="搜索通道" size="sm" class="tool-search">
              <template #prefix><Search :size="14" /></template>
            </UiInput>
            <UiSelect v-model="statusFilter" size="sm">
              <option value="all">全部状态</option>
              <option value="healthy">健康</option>
              <option value="warning">波动</option>
              <option value="fault">故障</option>
            </UiSelect>
            <UiButton variant="primary" size="sm" @click="router.push('/dashboard/channels')">
              <Plus :size="15" /> 新建通道
            </UiButton>
          </div>
        </div>

        <UiEmpty
          v-if="filteredChannels.length === 0"
          size="sm"
          title="没有匹配的通道"
          description="调整筛选条件，或前往通道管理添加上游"
        />
        <div v-else class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>通道</th>
                <th>类型</th>
                <th>主力模型</th>
                <th>状态</th>
                <th class="num">成功率</th>
                <th class="num">延迟</th>
                <th class="num">请求量</th>
                <th class="num">成本</th>
                <th class="act"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filteredChannels" :key="row.name">
                <td class="strong">{{ row.name }}</td>
                <td class="muted mono">{{ row.type }}</td>
                <td class="muted">{{ row.model }}</td>
                <td>
                  <UiBadge :tone="statusMeta[row.status]?.tone || 'neutral'" dot>
                    {{ statusMeta[row.status]?.label || row.status }}
                  </UiBadge>
                </td>
                <td class="num mono">{{ row.successRate }}%</td>
                <td class="num mono">{{ row.avgLatency }}ms</td>
                <td class="num mono">{{ fmt(row.requests24h) }}</td>
                <td class="num mono">${{ row.cost24h.toFixed(2) }}</td>
                <td class="act">
                  <button class="row-btn" aria-label="更多操作"><MoreH :size="16" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UiCard>

      <!-- 底部指标 -->
      <div class="info-row">
        <UiCard pad="md">
          <div class="info-head">
            <span class="info-label">速率用量 (RPM)</span>
            <span class="info-val mono">{{ data.rpmUsed.toLocaleString() }}</span>
          </div>
          <span class="info-sub">最近 60 秒请求数</span>
        </UiCard>
        <UiCard pad="md">
          <div class="info-head">
            <span class="info-label">账户可用额度</span>
            <span class="info-val accent mono">{{ data.accountQuota.toLocaleString() }}</span>
          </div>
          <span class="info-sub">内部信用单位，按调用实时扣减</span>
        </UiCard>
        <UiCard pad="md">
          <div class="info-head">
            <span class="info-label">整体错误率</span>
            <span class="info-val mono" :class="data.errorRate > 5 ? 'danger' : ''">{{ data.errorRate.toFixed(2) }}%</span>
          </div>
          <span class="info-sub">{{ data.errorRate > 5 ? '高于阈值，建议排查上游' : '运行平稳' }}</span>
        </UiCard>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page {
  padding: var(--space-6) var(--space-8);
  max-width: 1440px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

.chart-row {
  display: grid;
  grid-template-columns: 1.7fr 1fr;
  gap: var(--space-4);
  margin-top: var(--space-4);
}
.chart-card {
  min-width: 0;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}
.card-title {
  margin: 0;
  font-size: var(--text-md);
  font-weight: 560;
  color: var(--text);
}
.legend {
  display: flex;
  gap: var(--space-4);
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-xs);
  color: var(--text-3);
}
.sw {
  width: 11px;
  height: 3px;
  border-radius: var(--radius-full);
}
.sw.bar {
  background: var(--accent);
}
.sw.line {
  background: var(--success);
}

/* 表格 */
.table-card {
  margin-top: var(--space-4);
  overflow: hidden;
}
.table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--line);
}
.table-tools {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.tool-search {
  width: 180px;
}
.table-scroll {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.data-table th {
  padding: 10px var(--space-5);
  text-align: left;
  font-size: var(--text-xs);
  font-weight: 540;
  color: var(--text-3);
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
  background: var(--surface);
}
.data-table th.num {
  text-align: right;
}
.data-table td {
  padding: 13px var(--space-5);
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
  color: var(--text-2);
}
.data-table tbody tr:last-child td {
  border-bottom: none;
}
.data-table tbody tr {
  transition: background var(--dur-fast);
}
.data-table tbody tr:hover {
  background: var(--surface-2);
}
.data-table td.strong {
  color: var(--text);
  font-weight: 540;
}
.data-table td.muted {
  color: var(--text-3);
}
.data-table .mono {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
.data-table td.num {
  text-align: right;
}
.data-table th.act,
.data-table td.act {
  text-align: right;
  width: 40px;
}
.row-btn {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-3);
  cursor: pointer;
  transition: background var(--dur-fast), color var(--dur-fast);
}
.row-btn:hover {
  background: var(--surface-3);
  color: var(--text);
}

/* 底部指标 */
.info-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  margin-top: var(--space-4);
}
.info-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}
.info-label {
  font-size: var(--text-sm);
  color: var(--text-3);
}
.info-val {
  font-size: var(--text-md);
  font-weight: 560;
  color: var(--text);
}
.info-val.accent {
  color: var(--accent-text);
}
.info-val.danger {
  color: var(--danger);
}
.mono {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
.info-sub {
  display: block;
  margin-top: var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-3);
}

/* 响应式 */
@media (max-width: 1180px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .chart-row {
    grid-template-columns: 1fr;
  }
  .info-row {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .page {
    padding: var(--space-4);
  }
  .stat-grid {
    grid-template-columns: 1fr;
  }
  .table-tools {
    width: 100%;
  }
  .tool-search {
    flex: 1;
  }
}
</style>
