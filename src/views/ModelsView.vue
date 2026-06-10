<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { PhArrowClockwise as RefreshCw, PhMagnifyingGlass as Search, PhCube as Cube } from '@phosphor-icons/vue'
import axios from 'axios'
import { getToken } from '@/network/http'
import { listChannels, type ChannelView } from '@/network/channel'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiSpinner from '@/components/ui/UiSpinner.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'

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
          headers: t ? { Authorization: `Bearer ${t}` } : {},
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
const modelList = computed(() => [...new Set([...availableModels.value, ...modelMap.value.keys()])].sort())
const searchQuery = ref('')
const filtered = computed(() => {
  if (!searchQuery.value) return modelList.value
  const q = searchQuery.value.toLowerCase()
  return modelList.value.filter((m) => m.toLowerCase().includes(q))
})
const modelChannels = (model: string) => modelMap.value.get(model) ?? []
const healthyCount = (model: string) => modelChannels(model).filter((c) => c.status === 1).length

const statusTone: Record<number, 'success' | 'warning' | 'danger'> = { 1: 'success', 2: 'warning', 3: 'danger' }
const statusTag = (s: number) => ({ 1: '在线', 2: '停用', 3: '故障' } as Record<number, string>)[s] ?? '未知'
</script>

<template>
  <div class="page-wrap">
    <UiPageHeader title="模型目录" description="查看可调用的模型，以及每个模型背后承载它的上游通道">
      <template #actions>
        <UiInput v-model="searchQuery" placeholder="搜索模型" size="sm" style="width: 180px">
          <template #prefix><Search :size="14" /></template>
        </UiInput>
        <UiButton variant="ghost" size="sm" :loading="loading" @click="load">
          <RefreshCw :size="15" /> 刷新
        </UiButton>
      </template>
    </UiPageHeader>

    <UiCard v-if="loading" pad="none">
      <UiSpinner center label="正在加载模型目录" />
    </UiCard>

    <UiCard v-else-if="!filtered.length" pad="lg">
      <UiEmpty title="还没有可用模型" description="新建通道并配置其支持的模型后，模型会自动出现在这里">
        <template #icon><Cube :size="24" /></template>
      </UiEmpty>
    </UiCard>

    <div v-else class="model-grid">
      <UiCard v-for="model in filtered" :key="model" pad="md" class="model-card">
        <div class="model-head">
          <span class="model-icon"><Cube :size="18" weight="duotone" /></span>
          <span class="model-name">{{ model }}</span>
        </div>
        <div class="model-meta">
          <span>{{ modelChannels(model).length }} 个通道</span>
          <span class="sep" />
          <span :class="{ ok: healthyCount(model) > 0 }">{{ healthyCount(model) }} 在线</span>
        </div>
        <div v-if="modelChannels(model).length" class="chips">
          <span v-for="c in modelChannels(model)" :key="c.id" class="chan-chip">
            {{ c.name }}
            <UiBadge :tone="statusTone[c.status] || 'neutral'" size="sm">{{ statusTag(c.status) }}</UiBadge>
          </span>
        </div>
        <p v-else class="no-chan">暂无关联通道</p>
      </UiCard>
    </div>
  </div>
</template>

<style scoped>
.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}
.model-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.model-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.model-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--accent-soft);
  color: var(--accent-text);
}
.model-name {
  font-family: var(--font-mono);
  font-size: var(--text-md);
  font-weight: 540;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.model-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--text-sm);
  color: var(--text-3);
}
.model-meta .ok {
  color: var(--success);
}
.model-meta .sep {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--line-strong);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.chan-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 8px 5px 10px;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  font-size: var(--text-xs);
  color: var(--text-2);
}
.no-chan {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--text-3);
}
@media (max-width: 640px) {
  .model-grid {
    grid-template-columns: 1fr;
  }
}
</style>
