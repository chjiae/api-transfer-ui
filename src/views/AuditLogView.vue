<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { PhArrowClockwise as RefreshCw } from '@phosphor-icons/vue'
import axios from 'axios'
import { getToken } from '@/network/http'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiSpinner from '@/components/ui/UiSpinner.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'

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
  } finally {
    loading.value = false
  }
}
onMounted(load)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / size.value)))
const go = (p: number) => {
  page.value = p
  load()
}

const actionLabel = (a: string) =>
  (({
    TENANT_CREATE: '创建租户',
    TENANT_UPDATE: '更新租户',
    TENANT_DELETE: '删除租户',
    TENANT_STATUS: '状态变更',
    TENANT_EXTEND: '延期',
    ADMIN_RESET: '重置管理员',
  } as Record<string, string>)[a] ?? a)

const fmtTime = (s: string) =>
  new Date(s).toLocaleString('zh-CN', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <div class="page-wrap">
    <UiPageHeader title="审计日志" description="记录平台级管理操作，用于追溯与合规审查">
      <template #actions>
        <UiButton variant="ghost" size="sm" :loading="loading" @click="load">
          <RefreshCw :size="15" /> 刷新
        </UiButton>
      </template>
    </UiPageHeader>

    <UiCard v-if="loading && !logs.length" pad="none">
      <UiSpinner center label="正在加载审计记录" />
    </UiCard>

    <UiCard v-else pad="none">
      <UiEmpty
        v-if="!logs.length"
        title="暂无审计记录"
        description="平台级管理操作发生后，会在此留下不可篡改的记录"
      />
      <template v-else>
        <div class="rt-scroll">
          <table class="rt">
            <thead>
              <tr>
                <th>时间</th>
                <th class="num">操作者</th>
                <th>操作</th>
                <th>目标租户</th>
                <th>详情</th>
                <th>来源 IP</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in logs" :key="row.id">
                <td class="dim mono">{{ fmtTime(row.createdAt) }}</td>
                <td class="num mono">#{{ row.actorUserId }}</td>
                <td><UiBadge tone="neutral">{{ actionLabel(row.action) }}</UiBadge></td>
                <td class="mono">{{ row.targetTenantId }}</td>
                <td class="detail">{{ row.detail }}</td>
                <td class="dim mono">{{ row.clientIp }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="rt-foot">
          <span class="rt-count">共 {{ total.toLocaleString() }} 条</span>
          <div v-if="totalPages > 1" class="pager">
            <button :disabled="page <= 1" @click="go(page - 1)">上一页</button>
            <button v-for="p in Math.min(totalPages, 7)" :key="p" :class="{ active: p === page }" @click="go(p)">{{ p }}</button>
            <button :disabled="page >= totalPages" @click="go(page + 1)">下一页</button>
          </div>
        </div>
      </template>
    </UiCard>
  </div>
</template>

<style scoped>
.detail {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--text-xs);
  color: var(--text-3);
}
</style>
