<script setup lang="ts">
import { PhPlus as Plus, PhTrash as Trash, PhArrowClockwise as RefreshCw } from '@phosphor-icons/vue'
import { computed, reactive, ref, watch } from 'vue'
import {
  type ChannelView,
  type ChannelRequest,
  createChannel,
  updateChannel,
  fetchProviderPresets,
  fetchModels,
} from '@/network/channel'
import { toast } from '@/lib/toast'
import UiModal from '@/components/ui/UiModal.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'

// ---- props & emits ----

interface Props {
  open: boolean
  channel?: ChannelView | null
}
const props = withDefaults(defineProps<Props>(), { channel: null })
const emit = defineEmits<{ close: []; saved: [] }>()

const isEdit = computed(() => !!props.channel)
const title = computed(() => (isEdit.value ? `编辑「${props.channel!.name}」` : '新建通道'))

// ---- state ----

const saving = ref(false)
const fetchingModels = ref(false)
const presets = ref<Awaited<ReturnType<typeof fetchProviderPresets>>>([])
const selectedPreset = ref('')

interface EndpointEntry {
  protocol: string
  url: string
}

const form = reactive({
  name: '',
  type: '',
  apiKeys: [''] as string[],
  models: [''] as string[],
  priority: 0,
  weight: 0,
  status: 1,
})

interface MappingEntry {
  external: string
  upstream: string
}

const endpoints = reactive<EndpointEntry[]>([])
const mappings = reactive<MappingEntry[]>([])

// ---- helpers ----

function setEndpoints(entries: EndpointEntry[]) {
  endpoints.splice(0, endpoints.length, ...entries)
}

/** 第一个非空端点 URL，用于拉取模型等操作 */
const firstEndpointUrl = computed(() => {
  for (const e of endpoints) {
    if (e.url.trim()) return e.url.trim()
  }
  return ''
})

/** 构建 protocolEndpoints 字典，过滤空值 */
function buildProtocolEndpoints(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const e of endpoints) {
    const proto = e.protocol.trim()
    const url = e.url.trim()
    if (proto && url) map[proto] = url
  }
  return map
}

/** 构建 modelMapping 字典（对外名→上游名），过滤空值 */
function buildModelMapping(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const m of mappings) {
    const ext = m.external.trim()
    const up = m.upstream.trim()
    if (ext && up) map[ext] = up
  }
  return map
}

// ---- init / reset ----

function initForm() {
  selectedPreset.value = ''
  if (props.channel) {
    const c = props.channel
    form.name = c.name
    form.type = c.type
    form.apiKeys = c.keyCount > 0 ? [''] : ['']
    form.models = c.models?.length ? [...c.models] : ['']
    form.priority = c.priority
    form.weight = c.weight
    form.status = c.status
    // protocolEndpoints → endpoint entries
    if (c.protocolEndpoints && Object.keys(c.protocolEndpoints).length) {
      setEndpoints(Object.entries(c.protocolEndpoints).map(([p, u]) => ({ protocol: p, url: u })))
    } else {
      // fallback: use baseUrl as a single endpoint
      setEndpoints([{ protocol: c.type || '', url: c.baseUrl || '' }])
    }
    // modelMapping → mapping entries
    if (c.modelMapping && Object.keys(c.modelMapping).length) {
      setMappings(Object.entries(c.modelMapping).map(([ext, up]) => ({ external: ext, upstream: up })))
    } else {
      setMappings([])
    }
  } else {
    form.name = ''
    form.type = ''
    form.apiKeys = ['']
    form.models = ['']
    form.priority = 0
    form.weight = 0
    form.status = 1
    setEndpoints([{ protocol: '', url: '' }])
    setMappings([])
  }
}

watch(() => props.open, (v) => {
  if (v) {
    initForm()
    if (!presets.value.length) loadPresets()
  }
})

async function loadPresets() {
  try {
    presets.value = await fetchProviderPresets()
  } catch { /* non-critical */ }
}

// ---- preset → auto-fill type / endpoints ----

function onPresetChange(key: string) {
  selectedPreset.value = key
  if (!key) return
  const p = presets.value.find((p) => p.key === key)
  if (p) {
    form.type = p.type
    const entries = Object.entries(p.protocolEndpoints).map(([proto, url]) => ({ protocol: proto, url }))
    setEndpoints(entries)
  }
}

// ---- dynamic list helpers ----

function addApiKey() { form.apiKeys.push('') }
function removeApiKey(i: number) { if (form.apiKeys.length > 1) form.apiKeys.splice(i, 1) }

function addModel() { form.models.push('') }
function removeModel(i: number) { if (form.models.length > 1) form.models.splice(i, 1) }

function addEndpoint() { endpoints.push({ protocol: '', url: '' }) }
function removeEndpoint(i: number) { if (endpoints.length > 1) endpoints.splice(i, 1) }

function setMappings(entries: MappingEntry[]) {
  mappings.splice(0, mappings.length, ...entries)
}
function addMapping() { mappings.push({ external: '', upstream: '' }) }
function removeMapping(i: number) { mappings.splice(i, 1) }

// ---- auto-sync: model list → model mappings ----

let syncTimer: ReturnType<typeof setTimeout> | null = null

function syncModelMappings() {
  const names = form.models.map((m) => m.trim()).filter(Boolean)
  // Remove mappings whose upstream is no longer in the model list
  for (let i = mappings.length - 1; i >= 0; i--) {
    const up = mappings[i].upstream.trim()
    if (up && !names.includes(up)) {
      mappings.splice(i, 1)
    }
  }
  // Add default mapping (external = upstream) for models without one
  for (const name of names) {
    if (!mappings.some((m) => m.upstream.trim() === name)) {
      mappings.push({ external: name, upstream: name })
    }
  }
}

watch(
  () => form.models.map((m) => m.trim()),
  () => {
    if (syncTimer) clearTimeout(syncTimer)
    syncTimer = setTimeout(() => syncModelMappings(), 400)
  },
)

// ---- fetch models ----

async function doFetchModels() {
  const key = form.apiKeys.find((k) => k.trim()) || ''
  const url = firstEndpointUrl.value
  if (!form.type.trim() || !url || !key) {
    toast.error('请先填写类型、至少一个协议端点 URL 和 API 密钥')
    return
  }
  fetchingModels.value = true
  try {
    const models = await fetchModels({ type: form.type.trim(), baseUrl: url, apiKey: key })
    for (const m of models) {
      if (!form.models.some((x) => x === m)) {
        const empty = form.models.findIndex((x) => !x.trim())
        if (empty >= 0) form.models[empty] = m
        else form.models.push(m)
      }
    }
    toast.success(`拉取了 ${models.length} 个模型`)
  } catch (e) {
    toast.error('拉取模型失败', e instanceof Error ? e.message : undefined)
  } finally {
    fetchingModels.value = false
  }
}

// ---- validation ----

const canSave = computed(() => {
  return form.name.trim() && form.type.trim() && form.models.some((m) => m.trim())
})

// ---- save ----

async function save() {
  if (!canSave.value) return
  const req: ChannelRequest = {
    name: form.name.trim(),
    type: form.type.trim(),
    baseUrl: firstEndpointUrl.value || undefined,
    apiKeys: form.apiKeys.filter((k) => k.trim()),
    models: form.models.filter((m) => m.trim()),
    channelGroups: ['default'],
    modelMapping: buildModelMapping(),
    protocolEndpoints: buildProtocolEndpoints(),
    priority: Number.isFinite(form.priority) ? form.priority : 0,
    weight: Number.isFinite(form.weight) ? form.weight : 0,
    status: form.status,
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await updateChannel(props.channel!.id, req)
      toast.success('通道已更新')
    } else {
      await createChannel(req)
      toast.success('通道已创建')
    }
    emit('saved')
    emit('close')
  } catch (e) {
    toast.error(isEdit.value ? '更新失败' : '创建失败', e instanceof Error ? e.message : undefined)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UiModal
    :open="open"
    :title="title"
    description="配置上游供应商的连接参数与路由策略"
    size="lg"
    @close="emit('close')"
  >
    <!-- ====== 基本信息 ====== -->
    <section class="form-section" style="margin-top:0">
      <h4 class="section-title">基本信息</h4>
      <div class="field">
        <label class="field-label">通道名称</label>
        <UiInput v-model="form.name" placeholder="例如：生产环境 DeepSeek" size="md" style="width:100%" @keyup.enter="save" />
      </div>
      <div class="field">
        <label class="field-label">服务商预设</label>
        <UiSelect :modelValue="selectedPreset" size="md" style="width:100%" @update:modelValue="onPresetChange">
          <option value="">手动配置</option>
          <option v-for="p in presets" :key="p.key" :value="p.key">{{ p.label }}</option>
        </UiSelect>
      </div>
    </section>

    <!-- ====== 连接配置 ====== -->
    <section class="form-section">
      <h4 class="section-title">连接配置</h4>
      <div class="field">
        <label class="field-label">类型</label>
        <UiInput v-model="form.type" placeholder="openai / openai_compatible / anthropic" size="md" style="width:100%" />
      </div>
      <div class="field">
        <label class="field-label">协议端点</label>
        <div v-for="(entry, i) in endpoints" :key="i" class="endpoint-row">
          <UiInput v-model="entry.protocol" placeholder="openai" size="md" style="width:100px;flex-shrink:0" />
          <span class="endpoint-sep">→</span>
          <UiInput v-model="entry.url" placeholder="https://api.openai.com/v1" size="md" style="flex:1" />
          <UiButton variant="ghost" size="icon" title="添加端点" @click="addEndpoint"><Plus :size="15" /></UiButton>
          <UiButton v-if="endpoints.length > 1" variant="ghost" size="icon" title="移除" @click="removeEndpoint(i)"><Trash :size="14" /></UiButton>
        </div>
      </div>
      <div class="field">
        <label class="field-label">
          API 密钥
          <span v-if="isEdit" class="field-hint">（留空=保持原密钥，填入=替换）</span>
        </label>
        <div v-for="(_, i) in form.apiKeys" :key="i" class="list-row">
          <UiInput v-model="form.apiKeys[i]" :placeholder="isEdit ? '留空保持原密钥，或输入新密钥替换' : 'sk-...'" size="md" style="flex:1" />
          <UiButton variant="ghost" size="icon" title="添加密钥" @click="addApiKey"><Plus :size="15" /></UiButton>
          <UiButton v-if="form.apiKeys.length > 1" variant="ghost" size="icon" title="移除" @click="removeApiKey(i)"><Trash :size="14" /></UiButton>
        </div>
      </div>
    </section>

    <!-- ====== 模型配置 ====== -->
    <section class="form-section">
      <h4 class="section-title">模型配置</h4>
      <div class="field">
        <div class="label-row">
          <label class="field-label" style="margin-bottom:0">模型列表</label>
          <UiButton variant="ghost" size="sm" :loading="fetchingModels" :disabled="!form.type.trim() || !firstEndpointUrl" @click="doFetchModels">
            <RefreshCw :size="13" /> 从上游拉取
          </UiButton>
        </div>
        <div v-for="(_, i) in form.models" :key="i" class="list-row">
          <UiInput v-model="form.models[i]" placeholder="gpt-4o" size="md" style="flex:1" />
          <UiButton variant="ghost" size="icon" title="添加模型" @click="addModel"><Plus :size="15" /></UiButton>
          <UiButton v-if="form.models.length > 1" variant="ghost" size="icon" title="移除" @click="removeModel(i)"><Trash :size="14" /></UiButton>
        </div>
      </div>
      <div class="field">
        <div class="label-row">
          <label class="field-label" style="margin-bottom:0">模型映射 <span class="field-hint">（从模型列表自动生成，对外名可修改）</span></label>
          <UiButton variant="ghost" size="sm" @click="addMapping"><Plus :size="13" /> 添加</UiButton>
        </div>
        <div v-for="(m, i) in mappings" :key="i" class="mapping-row">
          <UiInput v-model="m.external" placeholder="对外名称，如 gpt-4o" size="md" style="flex:1" />
          <span class="endpoint-sep">→</span>
          <UiInput v-model="m.upstream" placeholder="上游名称，如 azure-gpt-4o" size="md" style="flex:1" />
          <UiButton variant="ghost" size="icon" title="移除映射" @click="removeMapping(i)"><Trash :size="14" /></UiButton>
        </div>
      </div>
    </section>

    <!-- ====== 路由设置 ====== -->
    <section class="form-section">
      <h4 class="section-title">路由设置</h4>
      <div class="row-3">
        <div>
          <label class="field-label">优先级</label>
          <UiInput v-model.number="form.priority" type="number" size="md" style="width:100%" />
        </div>
        <div>
          <label class="field-label">权重</label>
          <UiInput v-model.number="form.weight" type="number" size="md" style="width:100%" />
        </div>
        <div>
          <label class="field-label">状态</label>
          <UiSelect :modelValue="String(form.status)" size="md" style="width:100%" @update:modelValue="form.status = Number($event)">
            <option value="1">启用</option>
            <option value="2">停用</option>
            <option value="3">故障</option>
          </UiSelect>
        </div>
      </div>
    </section>

    <template #footer>
      <UiButton variant="ghost" @click="emit('close')">取消</UiButton>
      <UiButton variant="primary" :loading="saving" :disabled="!canSave" @click="save">
        {{ isEdit ? '保存' : '创建' }}
      </UiButton>
    </template>
  </UiModal>
</template>

<style scoped>
.form-section {
  margin-top: var(--space-5);
}
.section-title {
  margin: 0 0 var(--space-3);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.field {
  margin-bottom: var(--space-3);
}
.field-label {
  display: block;
  margin-bottom: 6px;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-2);
}
.field-hint {
  font-weight: 400;
  color: var(--text-3);
}
.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.list-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
.endpoint-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
.endpoint-sep {
  color: var(--text-3);
  font-size: var(--text-sm);
  flex-shrink: 0;
}
.mapping-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
.row-3 {
  display: flex;
  gap: var(--space-3);
}
.row-3 > * {
  flex: 1;
  min-width: 0;
}
</style>
