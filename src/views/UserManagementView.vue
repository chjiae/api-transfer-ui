<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Loader2, RefreshCw, Shield, UserRound, Users } from 'lucide-vue-next'
import { listUsers, updateUserQuota, updateUserStatus, type UserView } from '@/network/user'

const users = ref<UserView[]>([])
const loading = ref(true)
const error = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try { users.value = await listUsers() }
  catch (e) { error.value = e instanceof Error ? e.message : '加载失败' }
  finally { loading.value = false }
}

onMounted(load)

const editing = ref<number | null>(null)
const editQuota = ref(0)

const startEditQuota = (u: UserView) => {
  editing.value = u.id
  editQuota.value = u.quota
}

const saveQuota = async (u: UserView) => {
  try {
    await updateUserQuota(u.id, editQuota.value)
    u.quota = editQuota.value
    editing.value = null
  } catch (e) { alert(e instanceof Error ? e.message : '更新失败') }
}

const toggleStatus = async (u: UserView) => {
  const newStatus = u.status === 1 ? 2 : 1
  try {
    await updateUserStatus(u.id, newStatus)
    u.status = newStatus
  } catch (e) { alert(e instanceof Error ? e.message : '操作失败') }
}

const roleLabel = (r: number) => ({ 1: '用户', 10: '管理员', 100: '超级管理员' }[r] ?? r.toString())
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>权限管理</h1>
      <button class="action-btn" @click="load"><RefreshCw :size="15" :class="{ spin: loading }" /> 刷新</button>
    </div>

    <div v-if="loading" class="state-box"><Loader2 :size="28" class="spin" /><span>加载中...</span></div>

    <div v-else class="user-grid">
      <div v-for="u in users" :key="u.id" class="user-card">
        <div class="user-avatar">
          <Shield v-if="u.role >= 100" :size="28" />
          <Users v-else-if="u.role >= 10" :size="28" />
          <UserRound v-else :size="28" />
        </div>
        <div class="user-info">
          <div class="user-name">{{ u.displayName || u.username }}</div>
          <div class="user-role">{{ roleLabel(u.role) }}</div>
          <div class="user-meta">
            <span>额度: <b>{{ u.quota.toLocaleString() }}</b></span>
            <span>请求: <b>{{ u.requestCount.toLocaleString() }}</b></span>
          </div>
          <div class="user-actions">
            <template v-if="editing === u.id">
              <input v-model.number="editQuota" type="number" class="quota-input" />
              <button class="btn-sm" @click="saveQuota(u)">保存</button>
              <button class="btn-sm btn-ghost" @click="editing = null">取消</button>
            </template>
            <template v-else>
              <button class="btn-sm" @click="startEditQuota(u)">设额度</button>
              <button class="btn-sm" :class="u.status === 1 ? 'btn-warn' : 'btn-ok'" @click="toggleStatus(u)">
                {{ u.status === 1 ? '禁用' : '启用' }}
              </button>
            </template>
          </div>
        </div>
        <div class="user-status" :class="u.status === 1 ? 'on' : 'off'">
          {{ u.status === 1 ? '启用' : '禁用' }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; align-items: center; justify-content: space-between; }
.page-header h1 { margin: 0; font-size: 22px; font-weight: 680; letter-spacing: -0.03em; }
.action-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 13px; border-radius: 6px; border: 1px solid var(--line); background: transparent; color: var(--muted); font-size: 13px; cursor: pointer; }
.action-btn:hover { color: var(--foreground); border-color: var(--line-strong); }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.state-box { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 64px 24px; color: var(--muted); }

.user-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
.user-card { display: flex; gap: 16px; padding: 20px; border-radius: 9px; border: 1px solid var(--line); background: var(--surface); }
.user-avatar { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--surface-2); color: var(--accent-bright); flex-shrink: 0; }
.user-info { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.user-name { font-weight: 650; font-size: 15px; }
.user-role { font-size: 12px; color: var(--accent-bright); }
.user-meta { display: flex; gap: 16px; font-size: 12px; color: var(--muted); }
.user-meta b { color: var(--foreground); }
.user-actions { display: flex; gap: 6px; margin-top: 4px; }
.user-status { font-size: 11px; padding: 2px 8px; border-radius: 4px; height: fit-content; white-space: nowrap; }
.user-status.on { color: var(--green); background: rgba(56,217,154,0.1); }
.user-status.off { color: var(--muted); background: rgba(255,255,255,0.04); }
.btn-sm { height: 28px; padding: 0 10px; border-radius: 5px; border: 1px solid var(--line); background: transparent; color: var(--muted); font-size: 12px; cursor: pointer; }
.btn-sm:hover { color: var(--foreground); border-color: var(--line-strong); }
.btn-ghost { border: none; }
.btn-warn { color: #f5a94e !important; border-color: rgba(245,169,78,0.4); }
.btn-ok { color: var(--green) !important; border-color: rgba(56,217,154,0.4); }
.quota-input { width: 100px; height: 28px; padding: 0 8px; border-radius: 5px; border: 1px solid var(--line-strong); background: var(--surface-2); color: var(--foreground); font-size: 13px; outline: none; }
</style>
