<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Cpu, Loader2, RefreshCw, Search } from 'lucide-vue-next'
import axios from 'axios'
import { getToken } from '@/network/http'
import { listChannels, type ChannelView } from '@/network/channel'

const channels = ref<ChannelView[]>([])
const availableModels = ref<string[]>([])
const loading = ref(true)

const load = async () => {
  loading.value = true
  try {
    const [c, m] = await Promise.all([
      listChannels(),
      (async () => {
        const t = getToken()
        const { data } = await axios.get<{ code: number; data: string[] }>('/api/models/available', {
          headers: t ? { Authorization: `Bearer ${t}` } : {}
        })
        return data.data
      })(),
    ])
    channels.value = c
    availableModels.value = m
  } finally {
    loading.value = false
  }
}

onMounted(load)

// Group channels by model
const modelMap = computed(() => {
  const map = new Map<string, ChannelView[]>()
  for (const c of channels.value) {
    for (const m of c.models) {
      if (!map.has(m)) map.set(m, [])
      map.get(m)!.push(c)
    }
  }
  return map
})

const modelList = computed(() => {
  return [...new Set([...availableModels.value, ...modelMap.value.keys()])].sort()
})

const searchQuery = ref('')
const filtered = computed(() => {
  if (!searchQuery.value) return modelList.value
  const q = searchQuery.value.toLowerCase()
  return modelList.value.filter(m => m.toLowerCase().includes(q))
})

const modelChannels = (model: string) => modelMap.value.get(model) ?? []
const channelCount = (model: string) => modelChannels(model).length
const healthyCount = (model: string) => modelChannels(model).filter(c => c.status === 1).length

const statusTag = (s: number) => ({ 1: '启用', 2: '禁用', 3: '故障' }[s] ?? '—')
const statusCls = (s: number) => ({ 1: 'on', 2: 'off', 3: 'err' }[s] ?? '')
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>模型管理</h1>
      <div class="header-actions">
        <div class="table-search">
          <Search :size="14" />
          <input v-model="searchQuery" type="text" placeholder="搜索模型..." />
        </div>
        <button class="action-btn" @click="load"><RefreshCw :size="15" :class="{ spin: loading }" /> 刷新</button>
      </div>
    </div>

    <div v-if="loading" class="state-box"><Loader2 :size="28" class="spin" /><span>加载中...</span></div>

    <div v-else-if="!filtered.length" class="empty-state">
      <Cpu :size="40" class="empty-icon" />
      <h3>暂无模型</h3>
      <p>创建通道并配置模型后，模型将自动显示在此处</p>
    </div>

    <div v-else class="model-grid">
      <div v-for="model in filtered" :key="model" class="model-card">
        <div class="model-icon"><Cpu :size="22" /></div>
        <div class="model-name">{{ model }}</div>
        <div class="model-stats">
          <span><b>{{ channelCount(model) }}</b> 个通道</span>
          <span class="dot healthy"></span>
          <span>{{ healthyCount(model) }} 健康</span>
        </div>
        <div v-if="modelChannels(model).length" class="channel-chips">
          <div v-for="c in modelChannels(model)" :key="c.id" class="chip">
            <span>{{ c.name }}</span>
            <small :class="statusCls(c.status)">{{ statusTag(c.status) }}</small>
          </div>
        </div>
        <div v-else class="no-channels">暂无关联网关通道</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.page-header h1 { margin: 0; font-size: 22px; font-weight: 680; }
.header-actions { display: flex; align-items: center; gap: 12px; }
.action-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 13px; border-radius: 6px; border: 1px solid var(--line); background: transparent; color: var(--muted); font-size: 13px; cursor: pointer; }
.action-btn:hover { color: var(--foreground); border-color: var(--line-strong); }
.table-search { display: flex; align-items: center; gap: 7px; height: 33px; padding: 0 10px; border-radius: 6px; border: 1px solid var(--line); background: var(--surface-2); color: var(--muted); }
.table-search input { background: transparent; border: none; outline: none; color: var(--foreground); font-size: 12px; width: 140px; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.state-box { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 64px; color: var(--muted); }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; text-align: center; }
.empty-icon { color: var(--muted); opacity: 0.4; }
.empty-state h3 { margin: 0; font-size: 16px; }
.empty-state p { margin: 0; font-size: 14px; color: var(--muted); }

.model-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.model-card { padding: 20px; border-radius: 9px; border: 1px solid var(--line); background: var(--surface); }
.model-icon { color: var(--accent-bright); margin-bottom: 10px; }
.model-name { font-size: 18px; font-weight: 700; letter-spacing: -0.01em; margin-bottom: 6px; }
.model-stats { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted); margin-bottom: 12px; }
.model-stats b { color: var(--foreground); }
.dot { width: 7px; height: 7px; border-radius: 50%; }
.dot.healthy { background: var(--green); box-shadow: 0 0 5px rgba(56,217,154,0.4); }

.channel-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { display: flex; align-items: center; gap: 8px; padding: 5px 10px; border-radius: 6px; background: var(--surface-2); font-size: 12px; color: var(--foreground); }
.chip small { font-size: 10px; padding: 1px 5px; border-radius: 3px; }
.chip small.on { color: var(--green); background: rgba(56,217,154,0.1); }
.chip small.off { color: var(--muted); background: rgba(255,255,255,0.04); }
.chip small.err { color: #e5484d; background: rgba(229,72,77,0.1); }
.no-channels { font-size: 12px; color: var(--muted); }
</style>
