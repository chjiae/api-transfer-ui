<script setup lang="ts">
import {
  PhArrowClockwise as RefreshCw,
  PhPlus as Plus,
  PhKey as KeyIcon,
  PhCopy as Copy,
  PhTrash as Trash,
  PhCheckCircle as Check,
  PhWarningCircle as Warn,
} from '@phosphor-icons/vue'
import { onMounted, ref } from 'vue'
import { listTokens, createToken, deleteToken, type TokenView, type NewTokenView } from '@/network/token'
import { toast } from '@/lib/toast'
import { confirm } from '@/lib/confirm'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiSpinner from '@/components/ui/UiSpinner.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'
import UiModal from '@/components/ui/UiModal.vue'

const tokens = ref<TokenView[]>([])
const loading = ref(true)
const error = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    tokens.value = await listTokens()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}
onMounted(load)

const showCreate = ref(false)
const newName = ref('')
const creating = ref(false)
const createdKey = ref<NewTokenView | null>(null)
const copied = ref(false)

const openCreate = () => {
  newName.value = ''
  createdKey.value = null
  copied.value = false
  showCreate.value = true
}

const doCreate = async () => {
  if (!newName.value.trim()) return
  creating.value = true
  try {
    const r = await createToken({ name: newName.value.trim() })
    createdKey.value = r
    tokens.value.unshift(r)
  } catch (e) {
    toast.error('创建失败', e instanceof Error ? e.message : undefined)
  } finally {
    creating.value = false
  }
}

const copyKey = async (key: string) => {
  await navigator.clipboard.writeText(key)
  copied.value = true
  toast.success('密钥已复制到剪贴板')
  setTimeout(() => (copied.value = false), 2000)
}

const doDelete = async (id: number, name: string) => {
  const ok = await confirm({
    title: '删除密钥',
    message: `删除「${name}」后，使用它的所有调用都将立即被拒绝。此操作不可撤销。`,
    confirmText: '删除',
    danger: true,
  })
  if (!ok) return
  try {
    await deleteToken(id)
    tokens.value = tokens.value.filter((t) => t.id !== id)
    toast.success('密钥已删除')
  } catch (e) {
    toast.error('删除失败', e instanceof Error ? e.message : undefined)
  }
}

const fmtQuota = (t: TokenView) => (t.unlimitedQuota ? '不限' : t.remainQuota.toLocaleString())
const fmtDate = (s: string) => new Date(s).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
</script>

<template>
  <div class="page-wrap">
    <UiPageHeader title="密钥" description="管理访问网关的 API 密钥，控制各密钥的额度与权限">
      <template #actions>
        <UiButton variant="ghost" size="sm" :loading="loading" @click="load">
          <RefreshCw :size="15" /> 刷新
        </UiButton>
        <UiButton variant="primary" size="sm" @click="openCreate">
          <Plus :size="15" /> 创建密钥
        </UiButton>
      </template>
    </UiPageHeader>

    <UiCard v-if="loading && !tokens.length" pad="none">
      <UiSpinner center label="正在加载密钥列表" />
    </UiCard>

    <UiCard v-else-if="error && !tokens.length" pad="lg">
      <UiEmpty title="无法加载密钥" :description="error">
        <template #action><UiButton variant="primary" @click="load">重新加载</UiButton></template>
      </UiEmpty>
    </UiCard>

    <UiCard v-else-if="!tokens.length" pad="lg">
      <UiEmpty title="还没有密钥" description="创建第一个 API 密钥，即可通过它调用统一网关接口">
        <template #icon><KeyIcon :size="24" /></template>
        <template #action><UiButton variant="primary" @click="openCreate"><Plus :size="15" /> 创建密钥</UiButton></template>
      </UiEmpty>
    </UiCard>

    <div v-else class="key-grid">
      <UiCard v-for="t in tokens" :key="t.id" pad="md" class="key-card">
        <div class="key-head">
          <span class="key-name">{{ t.name }}</span>
          <UiBadge :tone="t.status === 1 ? 'success' : 'neutral'" dot>
            {{ t.status === 1 ? '启用' : '停用' }}
          </UiBadge>
        </div>
        <code class="key-prefix">{{ t.keyPrefix }}••••••••</code>
        <div class="key-stats">
          <div class="key-stat">
            <span class="key-stat-label">剩余额度</span>
            <span class="key-stat-val mono">{{ fmtQuota(t) }}</span>
          </div>
          <div class="key-stat">
            <span class="key-stat-label">已使用</span>
            <span class="key-stat-val mono">{{ t.usedQuota.toLocaleString() }}</span>
          </div>
        </div>
        <div class="key-foot">
          <span class="key-date">创建于 {{ fmtDate(t.createdAt) }}</span>
          <button class="row-icon-btn danger" title="删除" @click="doDelete(t.id, t.name)">
            <Trash :size="15" />
          </button>
        </div>
      </UiCard>
    </div>

    <!-- 创建密钥 -->
    <UiModal :open="showCreate" :title="createdKey ? '密钥已创建' : '创建密钥'"
      :description="createdKey ? undefined : '为新密钥起一个便于识别的名称'" @close="showCreate = false">
      <template v-if="!createdKey">
        <label class="field-label">密钥名称</label>
        <UiInput v-model="newName" placeholder="例如：生产环境后端" @keyup.enter="doCreate" />
      </template>
      <template v-else>
        <div class="reveal">
          <div class="reveal-warn">
            <Warn :size="16" />
            <span>请立即复制并妥善保存。出于安全考虑，完整密钥仅显示这一次。</span>
          </div>
          <code class="reveal-key">{{ createdKey.apiKey }}</code>
          <UiButton variant="secondary" block @click="copyKey(createdKey.apiKey)">
            <Check v-if="copied" :size="15" /><Copy v-else :size="15" />
            {{ copied ? '已复制' : '复制密钥' }}
          </UiButton>
        </div>
      </template>

      <template #footer>
        <template v-if="!createdKey">
          <UiButton variant="ghost" @click="showCreate = false">取消</UiButton>
          <UiButton variant="primary" :loading="creating" :disabled="!newName.trim()" @click="doCreate">
            创建
          </UiButton>
        </template>
        <UiButton v-else variant="primary" @click="showCreate = false">完成</UiButton>
      </template>
    </UiModal>
  </div>
</template>

<style scoped>
.key-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}
.key-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.key-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.key-name {
  font-size: var(--text-md);
  font-weight: 560;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.key-prefix {
  display: block;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  padding: 8px 11px;
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--text-2);
  letter-spacing: 0.02em;
}
.key-stats {
  display: flex;
  gap: var(--space-6);
}
.key-stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.key-stat-label {
  font-size: var(--text-xs);
  color: var(--text-3);
}
.key-stat-val {
  font-size: var(--text-base);
  font-weight: 540;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}
.key-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: var(--space-2);
  border-top: 1px solid var(--line);
}
.key-date {
  font-size: var(--text-xs);
  color: var(--text-3);
}

.field-label {
  display: block;
  margin-bottom: 8px;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-2);
}
.reveal {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.reveal-warn {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--warning-soft);
  color: var(--warning);
  font-size: var(--text-sm);
  line-height: 1.5;
}
.reveal-warn svg {
  flex-shrink: 0;
  margin-top: 1px;
}
.reveal-key {
  display: block;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  color: var(--text);
  word-break: break-all;
  line-height: 1.5;
}
@media (max-width: 640px) {
  .key-grid {
    grid-template-columns: 1fr;
  }
}
</style>
