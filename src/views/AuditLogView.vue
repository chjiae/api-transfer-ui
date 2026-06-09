<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Loader2, RefreshCw, ShieldAlert } from 'lucide-vue-next'
import axios from 'axios'
import { getToken } from '@/network/http'

interface AuditEntry {
  id: number
  actorUserId: number
  action: string
  targetTenantId: number | string
  detail: string
  clientIp: string
  createdAt: string
}

const logs = ref<AuditEntry[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const loading = ref(true)

const api = axios.create({ baseURL: '/api' })
api.interceptors.request.use((c) => {
  const t = getToken()
  if (t) c.headers.Authorization = `Bearer ${t}`
  return c
})

const load = async () => {
  loading.value = true
  try {
    const { data } = await api.get<{ code: number; data: { list: AuditEntry[]; total: number } }>('/dashboard/audit-logs', {
      params: { page: page.value, size: size.value },
    })
    logs.value = data.data.list
    total.value = data.data.total
  } finally { loading.value = false }
}

onMounted(load)

const totalPages = computed(() => Math.ceil(total.value / size.value))

const actionLabel = (a: string) => {
  const map: Record<string, string> = { TENANT_CREATE: '创建租户', TENANT_UPDATE: '更新租户', TENANT_DELETE: '删除租户', TENANT_STATUS: '状态变更', TENANT_EXTEND: '延期', ADMIN_RESET: '重置管理员' }
  return map[a] ?? a
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>审计日志</h1>
      <button class="action-btn" @click="load"><RefreshCw :size="15" :class="{ spin: loading }" /> 刷新</button>
    </div>

    <div v-if="loading" class="state-box"><Loader2 :size="28" class="spin" /><span>加载中...</span></div>

    <div v-else-if="!logs.length" class="empty-state">
      <ShieldAlert :size="40" class="empty-icon" />
      <h3>暂无审计记录</h3>
    </div>

    <div v-else class="table-card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>操作者 ID</th>
              <th>操作类型</th>
              <th>目标租户</th>
              <th>详情</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in logs" :key="row.id">
              <td>{{ new Date(row.createdAt).toLocaleString('zh-CN') }}</td>
              <td>{{ row.actorUserId }}</td>
              <td><code>{{ actionLabel(row.action) }}</code></td>
              <td>{{ row.targetTenantId }}</td>
              <td class="detail">{{ row.detail?.substring(0, 80) }}{{ row.detail?.length > 80 ? '...' : '' }}</td>
              <td>{{ row.clientIp }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="table-foot">
        <span class="table-count">共 {{ total }} 条</span>
        <div class="pagination">
          <button :disabled="page <= 1" @click="page--; load()">上一页</button>
          <span v-for="p in totalPages" :key="p" class="page-num" :class="{ active: p === page }" @click="page = p; load()">{{ p }}</span>
          <button :disabled="page >= totalPages" @click="page++; load()">下一页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; align-items: center; justify-content: space-between; }
h1 { margin: 0; font-size: 22px; font-weight: 680; }
.action-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 13px; border-radius: 6px; border: 1px solid var(--line); background: transparent; color: var(--muted); font-size: 13px; cursor: pointer; }
.action-btn:hover { color: var(--foreground); border-color: var(--line-strong); }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.state-box { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 64px; color: var(--muted); }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; text-align: center; }
.empty-icon { color: var(--muted); opacity: 0.4; }
.empty-state h3 { margin: 0; font-size: 16px; }
.table-card { border-radius: 9px; border: 1px solid var(--line); background: var(--surface); }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { padding: 11px 16px; text-align: left; color: var(--muted); font-weight: 600; font-size: 12px; border-bottom: 1px solid var(--line); white-space: nowrap; }
td { padding: 11px 16px; border-bottom: 1px solid var(--line); white-space: nowrap; }
td.detail { max-width: 200px; overflow: hidden; text-overflow: ellipsis; color: var(--muted); font-size: 12px; }
code { font-size: 11px; padding: 2px 6px; border-radius: 4px; background: var(--surface-2); color: var(--accent-bright); }
.table-foot { display: flex; align-items: center; justify-content: space-between; padding: 14px 22px; border-top: 1px solid var(--line); }
.table-count { font-size: 12px; color: var(--muted); }
.pagination { display: flex; gap: 4px; }
.pagination button { padding: 5px 10px; border-radius: 5px; border: 1px solid var(--line); background: transparent; color: var(--muted); font-size: 12px; cursor: pointer; }
.pagination button:hover:not(:disabled) { color: var(--foreground); border-color: var(--line-strong); }
.pagination button:disabled { opacity: 0.3; cursor: default; }
.page-num { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 5px; font-size: 12px; color: var(--muted); cursor: pointer; }
.page-num:hover { color: var(--foreground); background: rgba(255,255,255,0.04); }
.page-num.active { color: #fff; background: var(--accent); }
</style>
