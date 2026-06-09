<script setup lang="ts">
import {
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  TestTube,
  Trash2,
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import {
  listChannels,
  deleteChannel,
  testChannel,
  type ChannelView,
} from '@/network/channel'

const channels = ref<ChannelView[]>([])
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const typeFilter = ref('all')
const statusFilter = ref('all')
const page = ref(1)
const pageSize = 8

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    channels.value = await listChannels()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)

const filtered = computed(() => {
  return channels.value.filter((c) => {
    if (searchQuery.value && !c.name.toLowerCase().includes(searchQuery.value.toLowerCase())) return false
    if (typeFilter.value !== 'all' && c.type !== typeFilter.value) return false
    if (statusFilter.value !== 'all') {
      const s = statusFilter.value === 'enabled' ? 1 : statusFilter.value === 'disabled' ? 2 : 3
      if (c.status !== s) return false
    }
    return true
  })
})

const totalPages = computed(() => Math.ceil(filtered.value.length / pageSize))
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))

const channelTypes = computed(() => [...new Set(channels.value.map((c) => c.type))])

const statusText = (s: number) => ({ 1: '启用', 2: '禁用', 3: '故障' }[s] ?? '未知')
const statusClass = (s: number) => ({ 1: 'healthy', 2: 'warning', 3: 'fault' }[s] ?? '')

const testingId = ref<number | null>(null)
const testResult = ref<{ id: number; ok: boolean; ms: number; err?: string } | null>(null)

const doTest = async (id: number) => {
  testingId.value = id
  testResult.value = null
  try {
    const r = await testChannel(id)
    testResult.value = { id, ok: r.success, ms: r.responseTime, err: r.error ?? undefined }
  } catch (e) {
    testResult.value = { id, ok: false, ms: 0, err: e instanceof Error ? e.message : '测试失败' }
  } finally {
    testingId.value = null
  }
}

const doDelete = async (id: number, name: string) => {
  if (!confirm(`确认删除通道「${name}」？`)) return
  try {
    await deleteChannel(id)
    channels.value = channels.value.filter((c) => c.id !== id)
  } catch (e) {
    alert(e instanceof Error ? e.message : '删除失败')
  }
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>通道管理</h1>
      <div class="header-actions">
        <button class="action-btn" @click="load"><RefreshCw :size="15" :class="{ spin: loading }" /> 刷新</button>
        <button class="btn-primary-sm"><Plus :size="15" /> 新建通道</button>
      </div>
    </div>

    <div v-if="loading && !channels.length" class="state-box">
      <Loader2 :size="28" class="spin" />
      <span>正在加载通道列表...</span>
    </div>

    <div v-else-if="error && !channels.length" class="state-box error-box">
      <span>{{ error }}</span>
      <button class="btn-primary-sm" @click="load">重试</button>
    </div>

    <template v-else>
      <div class="table-card">
        <div class="table-header">
          <div class="table-actions">
            <div class="table-search">
              <Search :size="14" />
              <input v-model="searchQuery" type="text" placeholder="搜索通道..." />
            </div>
            <select v-model="typeFilter" class="table-filter">
              <option value="all">全部类型</option>
              <option v-for="t in channelTypes" :key="t" :value="t">{{ t }}</option>
            </select>
            <select v-model="statusFilter" class="table-filter">
              <option value="all">全部状态</option>
              <option value="enabled">启用</option>
              <option value="disabled">禁用</option>
              <option value="fault">故障</option>
            </select>
          </div>
          <span class="table-count">{{ filtered.length }} 个通道</span>
        </div>

        <div v-if="!filtered.length" class="table-empty">暂无通道</div>

        <template v-else>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>通道名称</th>
                  <th>类型</th>
                  <th>模型数</th>
                  <th>优先级</th>
                  <th>权重</th>
                  <th>状态</th>
                  <th class="num">延迟</th>
                  <th class="num">失败次数</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in paged" :key="row.id">
                  <td class="fw6">{{ row.name }}</td>
                  <td><code>{{ row.type }}</code></td>
                  <td>{{ row.models.length }}</td>
                  <td>{{ row.priority }}</td>
                  <td>{{ row.weight }}</td>
                  <td>
                    <span class="status-dot" :class="statusClass(row.status)"></span>
                    {{ statusText(row.status) }}
                  </td>
                  <td class="num">{{ row.responseTime ?? '—' }}{{ row.responseTime ? 'ms' : '' }}</td>
                  <td class="num">{{ row.failureCount }}</td>
                  <td>
                    <div class="row-actions">
                      <button class="row-btn" title="测试" :disabled="testingId === row.id" @click="doTest(row.id)">
                        <Loader2 v-if="testingId === row.id" :size="15" class="spin" />
                        <TestTube v-else :size="15" />
                      </button>
                      <button class="row-btn" title="配置"><Settings2 :size="15" /></button>
                      <button class="row-btn danger" title="删除" @click="doDelete(row.id, row.name)"><Trash2 :size="15" /></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="table-foot">
            <div v-if="testResult" class="test-banner" :class="testResult.ok ? 'test-ok' : 'test-fail'">
              {{ testResult.ok ? `✅ 通道测试通过 (${testResult.ms}ms)` : `❌ 测试失败: ${testResult.err}` }}
            </div>
            <div class="pagination">
              <button :disabled="page <= 1" @click="page--">上一页</button>
              <span v-for="p in totalPages" :key="p" class="page-num" :class="{ active: p === page }" @click="page = p">{{ p }}</span>
              <button :disabled="page >= totalPages" @click="page++">下一页</button>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page { padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.page-header h1 { margin: 0; font-size: 22px; font-weight: 680; letter-spacing: -0.03em; }
.header-actions { display: flex; align-items: center; gap: 12px; }
.action-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 13px; border-radius: 6px; border: 1px solid var(--line); background: transparent; color: var(--muted); font-size: 13px; cursor: pointer; transition: all 140ms; }
.action-btn:hover { color: var(--foreground); border-color: var(--line-strong); }
.btn-primary-sm { display: inline-flex; align-items: center; gap: 6px; height: 33px; padding: 0 14px; border-radius: 6px; border: none; font-size: 13px; font-weight: 600; color: #fff; background: var(--accent); cursor: pointer; }
.btn-primary-sm:hover { background: var(--accent-bright); }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.state-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 64px 24px; color: var(--muted); font-size: 14px; }
.error-box { color: #e5484d; }

.table-card { border-radius: 9px; border: 1px solid var(--line); background: var(--surface); }
.table-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 18px 22px; border-bottom: 1px solid var(--line); }
.table-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.table-search { display: flex; align-items: center; gap: 7px; height: 33px; padding: 0 10px; border-radius: 6px; border: 1px solid var(--line); background: var(--surface-2); color: var(--muted); }
.table-search input { background: transparent; border: none; outline: none; color: var(--foreground); font-size: 12px; width: 140px; }
.table-search input::placeholder { color: var(--muted); }
.table-filter { height: 33px; padding: 0 10px; border-radius: 6px; border: 1px solid var(--line); background: var(--surface-2); color: var(--foreground); font-size: 12px; cursor: pointer; }
.table-filter option { background: var(--surface); }
.table-count { font-size: 12px; color: var(--muted); }
.table-empty { padding: 48px 24px; text-align: center; color: var(--muted); font-size: 14px; }
.table-wrap { overflow-x: auto; }

table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { padding: 11px 16px; text-align: left; color: var(--muted); font-weight: 600; font-size: 12px; border-bottom: 1px solid var(--line); white-space: nowrap; }
th.num { text-align: right; }
td { padding: 13px 16px; border-bottom: 1px solid var(--line); white-space: nowrap; }
td.num { text-align: right; }
td.fw6 { font-weight: 600; }
code { font-size: 11px; padding: 2px 6px; border-radius: 4px; background: var(--surface-2); color: var(--accent-bright); }

.status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; vertical-align: -1px; }
.status-dot.healthy { background: var(--green); box-shadow: 0 0 5px rgba(56, 217, 154, 0.5); }
.status-dot.warning { background: #f5a94e; box-shadow: 0 0 5px rgba(245, 169, 78, 0.5); }
.status-dot.fault { background: #e5484d; box-shadow: 0 0 5px rgba(229, 72, 77, 0.5); }

.row-actions { display: flex; gap: 4px; }
.row-btn { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 5px; border: none; background: transparent; color: var(--muted); cursor: pointer; }
.row-btn:hover { background: rgba(255,255,255,0.04); }
.row-btn.danger:hover { color: #e5484d; }
.row-btn:disabled { opacity: 0.4; cursor: default; }

.table-foot { display: flex; align-items: center; justify-content: flex-end; gap: 16px; padding: 14px 22px; border-top: 1px solid var(--line); flex-wrap: wrap; }
.pagination { display: flex; align-items: center; gap: 4px; }
.pagination button { padding: 5px 10px; border-radius: 5px; border: 1px solid var(--line); background: transparent; color: var(--muted); font-size: 12px; cursor: pointer; }
.pagination button:hover:not(:disabled) { color: var(--foreground); border-color: var(--line-strong); }
.pagination button:disabled { opacity: 0.3; cursor: default; }
.page-num { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 5px; font-size: 12px; color: var(--muted); cursor: pointer; }
.page-num:hover { color: var(--foreground); background: rgba(255,255,255,0.04); }
.page-num.active { color: #fff; background: var(--accent); }

.test-banner { padding: 6px 14px; border-radius: 6px; font-size: 12px; }
.test-ok { color: var(--green); background: rgba(56, 217, 154, 0.08); }
.test-fail { color: #e5484d; background: rgba(229, 72, 77, 0.08); }

@media (max-width: 767px) { .page { padding: 16px; } }
</style>
