<script setup lang="ts">
import {
  PhArrowClockwise as RefreshCw,
  PhMagnifyingGlass as Search,
  PhPlus as Plus,
  PhGearSix as Settings,
  PhPlugsConnected as TestTube,
  PhTrash as Trash,
} from '@phosphor-icons/vue'
import { computed, onMounted, ref } from 'vue'
import { listChannels, deleteChannel, testChannel, type ChannelView } from '@/network/channel'
import { toast } from '@/lib/toast'
import { confirm } from '@/lib/confirm'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiSpinner from '@/components/ui/UiSpinner.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'

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

const filtered = computed(() =>
  channels.value.filter((c) => {
    if (searchQuery.value && !c.name.toLowerCase().includes(searchQuery.value.toLowerCase())) return false
    if (typeFilter.value !== 'all' && c.type !== typeFilter.value) return false
    if (statusFilter.value !== 'all') {
      const s = statusFilter.value === 'enabled' ? 1 : statusFilter.value === 'disabled' ? 2 : 3
      if (c.status !== s) return false
    }
    return true
  }),
)
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const channelTypes = computed(() => [...new Set(channels.value.map((c) => c.type))])

const statusMeta: Record<number, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  1: { label: '启用', tone: 'success' },
  2: { label: '停用', tone: 'warning' },
  3: { label: '故障', tone: 'danger' },
}

const testingId = ref<number | null>(null)
const doTest = async (id: number, name: string) => {
  testingId.value = id
  try {
    const r = await testChannel(id)
    if (r.success) toast.success(`${name} 连通正常`, `往返耗时 ${r.responseTime}ms`)
    else toast.error(`${name} 连通失败`, r.error ?? undefined)
  } catch (e) {
    toast.error('测试失败', e instanceof Error ? e.message : undefined)
  } finally {
    testingId.value = null
  }
}

const doDelete = async (id: number, name: string) => {
  const ok = await confirm({
    title: '删除通道',
    message: `删除「${name}」后，经由它路由的请求将立即失败。此操作不可撤销。`,
    confirmText: '删除',
    danger: true,
  })
  if (!ok) return
  try {
    await deleteChannel(id)
    channels.value = channels.value.filter((c) => c.id !== id)
    toast.success('通道已删除')
  } catch (e) {
    toast.error('删除失败', e instanceof Error ? e.message : undefined)
  }
}
</script>

<template>
  <div class="page-wrap">
    <UiPageHeader title="上游通道" description="管理接入的模型供应商通道，配置优先级、权重与健康检查">
      <template #actions>
        <UiButton variant="ghost" size="sm" :loading="loading" @click="load">
          <RefreshCw :size="15" /> 刷新
        </UiButton>
        <UiButton variant="primary" size="sm">
          <Plus :size="15" /> 新建通道
        </UiButton>
      </template>
    </UiPageHeader>

    <UiCard v-if="loading && !channels.length" pad="none">
      <UiSpinner center label="正在加载通道列表" />
    </UiCard>

    <UiCard v-else-if="error && !channels.length" pad="lg">
      <UiEmpty title="无法加载通道" :description="error">
        <template #action><UiButton variant="primary" @click="load">重新加载</UiButton></template>
      </UiEmpty>
    </UiCard>

    <UiCard v-else pad="none">
      <div class="rt-toolbar">
        <div class="rt-tools">
          <UiInput v-model="searchQuery" placeholder="搜索通道" size="sm" style="width: 180px">
            <template #prefix><Search :size="14" /></template>
          </UiInput>
          <UiSelect v-model="typeFilter" size="sm">
            <option value="all">全部类型</option>
            <option v-for="t in channelTypes" :key="t" :value="t">{{ t }}</option>
          </UiSelect>
          <UiSelect v-model="statusFilter" size="sm">
            <option value="all">全部状态</option>
            <option value="enabled">启用</option>
            <option value="disabled">停用</option>
            <option value="fault">故障</option>
          </UiSelect>
        </div>
        <span class="rt-count">{{ filtered.length }} 个通道</span>
      </div>

      <UiEmpty
        v-if="!filtered.length"
        title="还没有通道"
        description="添加第一个上游通道，开始把请求路由到模型供应商"
      >
        <template #action><UiButton variant="primary"><Plus :size="15" /> 新建通道</UiButton></template>
      </UiEmpty>

      <template v-else>
        <div class="rt-scroll">
          <table class="rt">
            <thead>
              <tr>
                <th>通道</th>
                <th>类型</th>
                <th class="num">模型数</th>
                <th class="num">优先级</th>
                <th class="num">权重</th>
                <th>状态</th>
                <th class="num">延迟</th>
                <th class="num">失败次数</th>
                <th class="num"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in paged" :key="row.id">
                <td class="strong">{{ row.name }}</td>
                <td><span class="code-chip">{{ row.type }}</span></td>
                <td class="num mono">{{ row.models.length }}</td>
                <td class="num mono">{{ row.priority }}</td>
                <td class="num mono">{{ row.weight }}</td>
                <td>
                  <UiBadge :tone="statusMeta[row.status]?.tone || 'neutral'" dot>
                    {{ statusMeta[row.status]?.label || '未知' }}
                  </UiBadge>
                </td>
                <td class="num mono">{{ row.responseTime != null ? row.responseTime + 'ms' : '·' }}</td>
                <td class="num mono">{{ row.failureCount }}</td>
                <td class="num">
                  <div class="row-acts">
                    <button class="row-icon-btn" title="连通测试" :disabled="testingId === row.id" @click="doTest(row.id, row.name)">
                      <UiSpinner v-if="testingId === row.id" :size="14" />
                      <TestTube v-else :size="15" />
                    </button>
                    <button class="row-icon-btn" title="配置"><Settings :size="15" /></button>
                    <button class="row-icon-btn danger" title="删除" @click="doDelete(row.id, row.name)">
                      <Trash :size="15" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="totalPages > 1" class="rt-foot">
          <div class="pager">
            <button :disabled="page <= 1" @click="page--">上一页</button>
            <button v-for="p in totalPages" :key="p" :class="{ active: p === page }" @click="page = p">{{ p }}</button>
            <button :disabled="page >= totalPages" @click="page++">下一页</button>
          </div>
        </div>
      </template>
    </UiCard>
  </div>
</template>
