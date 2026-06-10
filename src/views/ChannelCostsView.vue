<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  PhArrowClockwise as RefreshCw,
  PhPlus as Plus,
  PhTrash as Trash,
  PhFloppyDisk as FloppyDisk,
  PhX as X,
  PhInfo as Info,
} from '@phosphor-icons/vue'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiSpinner from '@/components/ui/UiSpinner.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import { listChannels, type ChannelView } from '@/network/channel'
import {
  listChannelCosts,
  upsertChannelCost,
  deleteChannelCost,
  type ChannelModelCostView,
} from '@/network/cost'

const channels = ref<ChannelView[]>([])
const selectedChannelId = ref<number | undefined>(undefined)
const costs = ref<ChannelModelCostView[]>([])
const availableModels = computed(() =>
  channels.value.find((c) => c.id === selectedChannelId.value)?.models ?? [],
)
const loading = ref(true)
const saving = ref(false)

// — 编辑表单 —
const form = ref<{ model: string; inputCost: string; outputCost: string }>({
  model: '',
  inputCost: '',
  outputCost: '',
})
const editId = ref<number | null>(null) // null=新增，非 null=编辑已有

const loadChannels = async () => {
  try {
    channels.value = await listChannels()
  } catch {
    /* ignore */
  } finally {
    loading.value = false
  }
}

const loadCosts = async () => {
  if (!selectedChannelId.value) return
  try {
    costs.value = await listChannelCosts(selectedChannelId.value)
  } catch {
    costs.value = []
  }
}

const resetForm = () => {
  form.value = { model: '', inputCost: '', outputCost: '' }
  editId.value = null
}

const startEdit = (c: ChannelModelCostView) => {
  form.value = {
    model: c.model,
    inputCost: String(c.inputCost),
    outputCost: String(c.outputCost),
  }
  editId.value = c.id
}

const cancelEdit = () => resetForm()

const submitCost = async () => {
  if (!selectedChannelId.value) return
  saving.value = true
  try {
    await upsertChannelCost({
      channelId: selectedChannelId.value,
      model: form.value.model,
      inputCost: parseFloat(form.value.inputCost) || 0,
      outputCost: parseFloat(form.value.outputCost) || 0,
      enabled: true,
    })
    resetForm()
    await loadCosts()
  } catch {
    /* toast 后续加 */
  } finally {
    saving.value = false
  }
}

const removeCost = async (id: number) => {
  saving.value = true
  try {
    await deleteChannelCost(id)
    await loadCosts()
  } catch {
    /* ignore */
  } finally {
    saving.value = false
  }
}

const onChannelChange = () => {
  resetForm()
  loadCosts()
}

const selectedChannel = computed(() =>
  channels.value.find((c) => c.id === selectedChannelId.value),
)

onMounted(loadChannels)
</script>

<template>
  <div class="page-wrap">
    <UiPageHeader title="成本价管理" description="按通道×模型配置上游进货价，用于计算毛利与成本覆盖率">
      <template #actions>
        <UiButton variant="ghost" size="sm" :loading="loading" @click="loadChannels()">
          <RefreshCw :size="15" /> 刷新
        </UiButton>
      </template>
    </UiPageHeader>

    <UiCard v-if="loading" pad="none">
      <UiSpinner center label="正在加载通道列表" />
    </UiCard>

    <UiCard v-else-if="!channels.length" pad="lg">
      <UiEmpty title="还没有上游通道" description="先创建通道，再为它的模型配置进货价">
        <template #icon><Info :size="24" /></template>
      </UiEmpty>
    </UiCard>

    <template v-else>
      <!-- 通道选择 -->
      <UiCard pad="md" style="margin-bottom: var(--space-4)">
        <div style="display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap">
          <span style="font-size: var(--text-sm); font-weight: 540; color: var(--text-2); white-space: nowrap">
            选择通道
          </span>
          <UiSelect v-model="selectedChannelId" @change="onChannelChange" size="md" style="min-width: 220px">
            <option value="" disabled>— 请选择 —</option>
            <option v-for="c in channels" :key="c.id" :value="c.id">
              {{ c.name }} ({{ c.models.length }} 个模型)
            </option>
          </UiSelect>
        </div>
      </UiCard>

      <!-- 成本价表 -->
      <UiCard v-if="selectedChannelId" pad="none">
        <div class="table-head">
          <h3 class="card-title">{{ selectedChannel?.name }} · 进货价</h3>
          <span class="caption">{{ costs.length }} 条配置</span>
        </div>

        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>模型</th>
                <th class="num">输入价 / 百万 token</th>
                <th class="num">输出价 / 百万 token</th>
                <th class="num">状态</th>
                <th class="act"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in costs" :key="c.id" :class="{ editing: editId === c.id }">
                <td class="strong mono">{{ c.model }}</td>
                <td class="num mono">${{ c.inputCost.toFixed(4) }}</td>
                <td class="num mono">${{ c.outputCost.toFixed(4) }}</td>
                <td class="num">
                  <UiBadge :tone="c.enabled ? 'success' : 'neutral'" dot>
                    {{ c.enabled ? '启用' : '停用' }}
                  </UiBadge>
                </td>
                <td class="act">
                  <button class="row-btn" aria-label="编辑" @click="startEdit(c)">
                    <Plus :size="16" />
                  </button>
                  <button class="row-btn danger" aria-label="删除" @click="removeCost(c.id)">
                    <Trash :size="14" />
                  </button>
                </td>
              </tr>
              <!-- 新增/编辑行 -->
              <tr v-if="selectedChannelId" class="form-row">
                <td>
                  <UiSelect v-if="editId === null" v-model="form.model" size="sm" style="width: 100%">
                    <option value="" disabled>— 模型 —</option>
                    <option v-for="m in availableModels" :key="m" :value="m">{{ m }}</option>
                  </UiSelect>
                  <span v-else class="strong mono">{{ form.model }}</span>
                </td>
                <td class="num">
                  <UiInput v-model="form.inputCost" size="sm" placeholder="0" />
                </td>
                <td class="num">
                  <UiInput v-model="form.outputCost" size="sm" placeholder="0" />
                </td>
                <td class="num">
                  <UiBadge :tone="editId === null ? 'neutral' : 'warning'" dot>
                    {{ editId === null ? '新增' : '编辑' }}
                  </UiBadge>
                </td>
                <td class="act form-acts">
                  <UiButton variant="primary" size="sm" :loading="saving" @click="submitCost">
                    <FloppyDisk :size="13" /> {{ editId === null ? '保存' : '更新' }}
                  </UiButton>
                  <button class="row-btn" aria-label="取消" @click="cancelEdit"><X :size="14" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!costs.length && !availableModels.length" class="empty-state">
          <UiEmpty size="sm" title="该通道没有模型" description="编辑通道配置添加模型后，即可在此定价" />
        </div>
      </UiCard>
    </template>
  </div>
</template>

<style scoped>
.page-wrap { padding: var(--space-6) var(--space-8); max-width: 1280px; }
.card-title { margin: 0; font-size: var(--text-md); font-weight: 560; color: var(--text); }
.caption { font-size: var(--text-xs); color: var(--text-3); }

.table-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--line);
}
.table-scroll { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
.data-table th {
  padding: 10px var(--space-5); text-align: left; font-size: var(--text-xs);
  font-weight: 540; color: var(--text-3); border-bottom: 1px solid var(--line);
  white-space: nowrap; background: var(--surface);
}
.data-table th.num, .data-table td.num { text-align: right; }
.data-table td {
  padding: 10px var(--space-5); border-bottom: 1px solid var(--line);
  white-space: nowrap; color: var(--text-2);
}
.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover, .data-table tbody tr.form-row { background: var(--surface-2); }
.data-table tbody tr.editing { background: var(--warning-soft); }
.data-table td.strong { color: var(--text); font-weight: 540; }
.data-table td.mono, .mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.data-table th.act, .data-table td.act { text-align: right; width: 90px; }
.data-table td.act.form-acts { display: flex; gap: 6px; align-items: center; justify-content: flex-end; }
.row-btn {
  display: inline-grid; place-items: center; width: 28px; height: 28px;
  border: none; border-radius: var(--radius-sm); background: transparent;
  color: var(--text-3); cursor: pointer;
  transition: background var(--dur-fast), color var(--dur-fast);
}
.row-btn:hover { background: var(--surface-3); color: var(--text); }
.row-btn.danger:hover { background: var(--danger-soft); color: var(--danger); }
.empty-state { padding: var(--space-8) var(--space-5); }

@media (max-width: 640px) { .page-wrap { padding: var(--space-4); } }
</style>
