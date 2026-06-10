<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { PhArrowClockwise as RefreshCw, PhMagnifyingGlass as Search } from '@phosphor-icons/vue'
import { listLogs, type LogPage } from '@/network/log'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiSpinner from '@/components/ui/UiSpinner.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'

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
    logs.value = await listLogs({ page: page.value, size: size.value, model: modelFilter.value || undefined })
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}
onMounted(load)

const totalPages = computed(() => Math.max(1, Math.ceil((logs.value?.total ?? 0) / size.value)))
const typeLabel = (t: number) => ({ 1: 'Chat', 2: 'Embedding' } as Record<number, string>)[t] ?? String(t)
const fmtTokens = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n))
const fmtCost = (n: number) => '$' + (n / 500_000).toFixed(4)
const fmtTime = (s: string) =>
  new Date(s).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })

const onSearch = () => {
  page.value = 1
  load()
}
const go = (p: number) => {
  page.value = p
  load()
}
</script>

<template>
  <div class="page-wrap">
    <UiPageHeader title="调用明细" description="逐条查看经由网关的模型调用记录，含 Token 用量、耗时与成本">
      <template #actions>
        <UiInput v-model="modelFilter" placeholder="按模型筛选" size="sm" style="width: 180px" @keyup.enter="onSearch">
          <template #prefix><Search :size="14" /></template>
        </UiInput>
        <UiButton variant="ghost" size="sm" :loading="loading" @click="load">
          <RefreshCw :size="15" /> 刷新
        </UiButton>
      </template>
    </UiPageHeader>

    <UiCard v-if="loading && !logs" pad="none">
      <UiSpinner center label="正在加载调用记录" />
    </UiCard>

    <UiCard v-else-if="error && !logs" pad="lg">
      <UiEmpty title="无法加载记录" :description="error">
        <template #action><UiButton variant="primary" @click="load">重新加载</UiButton></template>
      </UiEmpty>
    </UiCard>

    <UiCard v-else-if="logs" pad="none">
      <UiEmpty
        v-if="!logs.list.length"
        title="还没有调用记录"
        description="通过密钥发起第一次模型调用后，明细会实时出现在这里"
      />
      <template v-else>
        <div class="rt-scroll">
          <table class="rt">
            <thead>
              <tr>
                <th>时间</th>
                <th>模型</th>
                <th>类型</th>
                <th class="num">输入</th>
                <th class="num">输出</th>
                <th class="num">总量</th>
                <th class="num">耗时</th>
                <th class="num">成本</th>
                <th>请求 ID</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in logs.list" :key="row.id">
                <td class="dim mono">{{ fmtTime(row.createdAt) }}</td>
                <td><span class="code-chip">{{ row.model }}</span></td>
                <td><UiBadge tone="neutral">{{ typeLabel(row.type) }}</UiBadge></td>
                <td class="num mono">{{ fmtTokens(row.promptTokens) }}</td>
                <td class="num mono">{{ fmtTokens(row.completionTokens) }}</td>
                <td class="num mono strong">{{ fmtTokens(row.totalTokens) }}</td>
                <td class="num mono">{{ row.latencyMs }}ms</td>
                <td class="num mono">{{ fmtCost(row.quotaCost) }}</td>
                <td class="dim mono rid">{{ row.requestId?.substring(0, 12) }}…</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="rt-foot">
          <span class="rt-count">共 {{ logs.total.toLocaleString() }} 条</span>
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
.rid {
  font-size: 11px;
}
</style>
