<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  PhArrowClockwise as RefreshCw,
  PhCheck as Check,
  PhX as X,
  PhPencilSimple as Pencil,
} from '@phosphor-icons/vue'
import { listUsers, updateUserQuota, updateUserStatus, type UserView } from '@/network/user'
import { toast } from '@/lib/toast'
import { confirm } from '@/lib/confirm'
import UiPageHeader from '@/components/ui/UiPageHeader.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiSpinner from '@/components/ui/UiSpinner.vue'
import UiEmpty from '@/components/ui/UiEmpty.vue'

const users = ref<UserView[]>([])
const loading = ref(true)
const error = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    users.value = await listUsers()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}
onMounted(load)

const editing = ref<number | null>(null)
const editQuota = ref(0)
const saving = ref(false)

const startEdit = (u: UserView) => {
  editing.value = u.id
  editQuota.value = u.quota
}
const cancelEdit = () => {
  editing.value = null
}
const saveQuota = async (u: UserView) => {
  saving.value = true
  try {
    await updateUserQuota(u.id, editQuota.value)
    u.quota = editQuota.value
    editing.value = null
    toast.success('额度已更新')
  } catch (e) {
    toast.error('更新失败', e instanceof Error ? e.message : undefined)
  } finally {
    saving.value = false
  }
}

const toggleStatus = async (u: UserView) => {
  const disabling = u.status === 1
  if (disabling) {
    const ok = await confirm({
      title: '停用成员',
      message: `停用「${u.displayName || u.username}」后，该成员将无法登录或调用接口。`,
      confirmText: '停用',
      danger: true,
    })
    if (!ok) return
  }
  const newStatus = disabling ? 2 : 1
  try {
    await updateUserStatus(u.id, newStatus)
    u.status = newStatus
    toast.success(disabling ? '成员已停用' : '成员已启用')
  } catch (e) {
    toast.error('操作失败', e instanceof Error ? e.message : undefined)
  }
}

const roleMeta: Record<number, { label: string; tone: 'brand' | 'warning' | 'neutral' }> = {
  1: { label: '用户', tone: 'neutral' },
  10: { label: '管理员', tone: 'brand' },
  100: { label: '超级管理员', tone: 'warning' },
}
const roleOf = (r: number) => roleMeta[r] || { label: String(r), tone: 'neutral' as const }
const initial = (u: UserView) => (u.displayName || u.username).charAt(0).toUpperCase()
const num = (v: number | null | undefined) => (v ?? 0).toLocaleString()
</script>

<template>
  <div class="page-wrap">
    <UiPageHeader title="成员与权限" description="管理租户内的成员账号、角色与调用额度">
      <template #actions>
        <UiButton variant="ghost" size="sm" :loading="loading" @click="load">
          <RefreshCw :size="15" /> 刷新
        </UiButton>
      </template>
    </UiPageHeader>

    <UiCard v-if="loading && !users.length" pad="none">
      <UiSpinner center label="正在加载成员列表" />
    </UiCard>

    <UiCard v-else-if="error && !users.length" pad="lg">
      <UiEmpty title="无法加载成员" :description="error">
        <template #action><UiButton variant="primary" @click="load">重新加载</UiButton></template>
      </UiEmpty>
    </UiCard>

    <UiCard v-else pad="none">
      <UiEmpty v-if="!users.length" title="还没有成员" description="该租户下暂无其他成员账号" />
      <div v-else class="rt-scroll">
        <table class="rt">
          <thead>
            <tr>
              <th>成员</th>
              <th>角色</th>
              <th class="num">额度</th>
              <th class="num">已用</th>
              <th class="num">请求数</th>
              <th>状态</th>
              <th class="num">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td>
                <div class="member">
                  <span class="m-avatar">{{ initial(u) }}</span>
                  <div class="m-text">
                    <span class="m-name">{{ u.displayName || u.username }}</span>
                    <span class="m-sub mono">@{{ u.username }}</span>
                  </div>
                </div>
              </td>
              <td><UiBadge :tone="roleOf(u.role).tone">{{ roleOf(u.role).label }}</UiBadge></td>
              <td class="num mono">
                <input
                  v-if="editing === u.id"
                  v-model.number="editQuota"
                  type="number"
                  class="quota-input"
                  @keyup.enter="saveQuota(u)"
                />
                <span v-else>{{ num(u.quota) }}</span>
              </td>
              <td class="num mono dim">{{ num(u.usedQuota) }}</td>
              <td class="num mono dim">{{ num(u.requestCount) }}</td>
              <td>
                <UiBadge :tone="u.status === 1 ? 'success' : 'neutral'" dot>
                  {{ u.status === 1 ? '启用' : '停用' }}
                </UiBadge>
              </td>
              <td class="num">
                <div class="row-acts">
                  <template v-if="editing === u.id">
                    <button class="row-icon-btn" title="保存" :disabled="saving" @click="saveQuota(u)">
                      <UiSpinner v-if="saving" :size="14" /><Check v-else :size="16" />
                    </button>
                    <button class="row-icon-btn" title="取消" @click="cancelEdit"><X :size="16" /></button>
                  </template>
                  <template v-else>
                    <button class="row-icon-btn" title="设置额度" @click="startEdit(u)"><Pencil :size="15" /></button>
                    <UiButton
                      :variant="u.status === 1 ? 'danger' : 'subtle'"
                      size="sm"
                      @click="toggleStatus(u)"
                    >
                      {{ u.status === 1 ? '停用' : '启用' }}
                    </UiButton>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>
  </div>
</template>

<style scoped>
.member {
  display: flex;
  align-items: center;
  gap: 10px;
}
.m-avatar {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-on-brand);
  background: var(--accent);
  border-radius: var(--radius-sm);
}
.m-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.m-name {
  font-size: var(--text-sm);
  font-weight: 540;
  color: var(--text);
}
.m-sub {
  font-size: 11px;
  color: var(--text-3);
}
.quota-input {
  width: 110px;
  height: 30px;
  padding: 0 9px;
  text-align: right;
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: var(--text-sm);
  outline: none;
  box-shadow: var(--shadow-focus);
}
.row-acts {
  align-items: center;
}
</style>
