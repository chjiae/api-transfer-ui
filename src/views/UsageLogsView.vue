<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Loader2, RefreshCw, Search } from 'lucide-vue-next'
import { listLogs, type LogPage } from '@/network/log'

const page = ref(1)
const size = ref(20)
const modelFilter = ref('')
const logs = ref<LogPage | null>(null)
const loading = ref(true)
const error = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    logs.value = await listLogs({
      page: page.value,
      size: size.value,
      model: modelFilter.value || undefined,
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)

const totalPages = computed(() => Math.ceil((logs.value?.total ?? 0) / size.value))

const typeLabel = (t: number) => ({ 1: 'Chat', 2: 'Embedding' }[t] ?? t)

const fmtTokens = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n)
const fmtCost = (n: number) => (n / 500_000).toFixed(4)
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>用量统计</h1>
      <div class="header-actions">
        <div class="table-search">
          <Search :size="14" />
          <input v-model="modelFilter" type="text" placeholder="按模型筛选..." @keyup.enter="page=1;load()" />
        </div>
        <button class="action-btn" @click="load"><RefreshCw :size="15" :class="{ spin: loading }" /> 刷新</button>
      </div>
    </div>

    <div v-if="loading && !logs" class="state-box"><Loader2 :size="28" class="spin" /><span>加载中...</span></div>

    <template v-else-if="logs">
      <div class="table-card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>模型</th>
                <th>类型</th>
                <th class="num">输入 Token</th>
                <th class="num">输出 Token</th>
                <th class="num">总量</th>
                <th class="num">耗时</th>
                <th class="num">成本</th>
                <th>Request ID</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in logs.list" :key="row.id">
                <td>{{ new Date(row.createdAt).toLocaleString('zh-CN') }}</td>
                <td><code>{{ row.model }}</code></td>
                <td>{{ typeLabel(row.type) }}</td>
                <td class="num">{{ fmtTokens(row.promptTokens) }}</td>
                <td class="num">{{ fmtTokens(row.completionTokens) }}</td>
                <td class="num">{{ fmtTokens(row.totalTokens) }}</td>
                <td class="num">{{ row.latencyMs }}ms</td>
                <td class="num">${{ fmtCost(row.quotaCost) }}</td>
                <td><code class="rid">{{ row.requestId?.substring(0, 12) }}...</code></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="table-foot">
          <span class="table-count">共 {{ logs.total }} 条记录</span>
          <div class="pagination">
            <button :disabled="page <= 1" @click="page--; load()">上一页</button>
            <span v-for="p in totalPages" :key="p" class="page-num" :class="{ active: p === page }" @click="page = p; load()">{{ p }}</span>
            <button :disabled="page >= totalPages" @click="page++; load()">下一页</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page { padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.page-header h1 { margin: 0; font-size: 22px; font-weight: 680; letter-spacing: -0.03em; }
.header-actions { display: flex; align-items: center; gap: 12px; }
.action-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 13px; border-radius: 6px; border: 1px solid var(--line); background: transparent; color: var(--muted); font-size: 13px; cursor: pointer; }
.action-btn:hover { color: var(--foreground); border-color: var(--line-strong); }
.table-search { display: flex; align-items: center; gap: 7px; height: 33px; padding: 0 10px; border-radius: 6px; border: 1px solid var(--line); background: var(--surface-2); color: var(--muted); }
.table-search input { background: transparent; border: none; outline: none; color: var(--foreground); font-size: 12px; width: 140px; }
.table-search input::placeholder { color: var(--muted); }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.state-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 64px 24px; color: var(--muted); font-size: 14px; }
.table-card { border-radius: 9px; border: 1px solid var(--line); background: var(--surface); }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { padding: 11px 16px; text-align: left; color: var(--muted); font-weight: 600; font-size: 12px; border-bottom: 1px solid var(--line); white-space: nowrap; }
th.num { text-align: right; }
td { padding: 11px 16px; border-bottom: 1px solid var(--line); white-space: nowrap; }
td.num { text-align: right; }
code { font-size: 11px; padding: 2px 6px; border-radius: 4px; background: var(--surface-2); color: var(--accent-bright); }
code.rid { font-size: 10px; color: var(--muted); }
.table-foot { display: flex; align-items: center; justify-content: space-between; padding: 14px 22px; border-top: 1px solid var(--line); }
.table-count { font-size: 12px; color: var(--muted); }
.pagination { display: flex; align-items: center; gap: 4px; }
.pagination button { padding: 5px 10px; border-radius: 5px; border: 1px solid var(--line); background: transparent; color: var(--muted); font-size: 12px; cursor: pointer; }
.pagination button:hover:not(:disabled) { color: var(--foreground); border-color: var(--line-strong); }
.pagination button:disabled { opacity: 0.3; cursor: default; }
.page-num { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 5px; font-size: 12px; color: var(--muted); cursor: pointer; }
.page-num:hover { color: var(--foreground); background: rgba(255,255,255,0.04); }
.page-num.active { color: #fff; background: var(--accent); }
</style>
