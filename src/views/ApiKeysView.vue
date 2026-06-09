<script setup lang="ts">
import {
  Copy,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import {
  listTokens,
  createToken,
  deleteToken,
  type TokenView,
  type NewTokenView,
} from '@/network/token'

const tokens = ref<TokenView[]>([])
const loading = ref(true)
const error = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try { tokens.value = await listTokens() }
  catch (e) { error.value = e instanceof Error ? e.message : '加载失败' }
  finally { loading.value = false }
}

onMounted(load)

const showCreate = ref(false)
const newName = ref('')
const creating = ref(false)
const createdKey = ref<NewTokenView | null>(null)
const copied = ref(false)

const doCreate = async () => {
  if (!newName.value.trim()) return
  creating.value = true
  try {
    const r = await createToken({ name: newName.value.trim() })
    createdKey.value = r
    tokens.value.unshift(r)
    newName.value = ''
  } catch (e) { alert(e instanceof Error ? e.message : '创建失败') }
  finally { creating.value = false }
}

const copyKey = async (key: string) => {
  await navigator.clipboard.writeText(key)
  copied.value = true
  setTimeout(() => copied.value = false, 1500)
}

const doDelete = async (id: number, name: string) => {
  if (!confirm(`确认删除令牌「${name}」？`)) return
  try {
    await deleteToken(id)
    tokens.value = tokens.value.filter((t) => t.id !== id)
  } catch (e) { alert(e instanceof Error ? e.message : '删除失败') }
}

const statusText = (s: number) => ({ 1: '启用', 2: '禁用' }[s] ?? '—')
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h1>API Key 管理</h1>
      <div class="header-actions">
        <button class="action-btn" @click="load"><RefreshCw :size="15" :class="{ spin: loading }" /> 刷新</button>
        <button class="btn-primary-sm" @click="showCreate = true"><Plus :size="15" /> 创建令牌</button>
      </div>
    </div>

    <!-- Create modal -->
    <div v-if="showCreate" class="modal-overlay" @click.self="showCreate = false">
      <div class="modal">
        <h3>创建 API Key</h3>
        <template v-if="!createdKey">
          <input v-model="newName" class="modal-input" placeholder="令牌名称，例如：生产环境" @keyup.enter="doCreate" />
          <div class="modal-actions">
            <button class="btn-ghost" @click="showCreate = false">取消</button>
            <button class="btn-primary-sm" :disabled="creating || !newName.trim()" @click="doCreate">
              <Loader2 v-if="creating" :size="15" class="spin" />
              <span v-else>创建</span>
            </button>
          </div>
        </template>
        <template v-else>
          <div class="key-reveal">
            <p>令牌已创建，密钥仅显示一次：</p>
            <code>{{ createdKey.apiKey }}</code>
            <button class="btn-primary-sm" @click="copyKey(createdKey.apiKey)">
              <Copy :size="14" /> {{ copied ? '已复制' : '复制密钥' }}
            </button>
          </div>
          <div class="modal-actions">
            <button class="btn-primary-sm" @click="showCreate = false; createdKey = null">完成</button>
          </div>
        </template>
      </div>
    </div>

    <div v-if="loading && !tokens.length" class="state-box">
      <Loader2 :size="28" class="spin" /><span>正在加载...</span>
    </div>

    <template v-else>
      <div v-if="!tokens.length" class="empty-state">
        <KeyRound :size="40" class="empty-icon" />
        <h3>暂无 API Key</h3>
        <p>创建第一个 API Key 以开始使用 API 中转服务</p>
        <button class="btn-primary-sm" @click="showCreate = true">创建 API Key</button>
      </div>

      <div v-else class="key-grid">
        <div v-for="t in tokens" :key="t.id" class="key-card">
          <div class="key-head">
            <div class="key-icon"><KeyRound :size="18" /></div>
            <div class="key-name">{{ t.name }}</div>
            <div class="key-status" :class="t.status === 1 ? 'on' : 'off'">{{ statusText(t.status) }}</div>
          </div>
          <code class="key-prefix">{{ t.keyPrefix }}</code>
          <div class="key-meta">
            <span>额度: <b>{{ t.unlimitedQuota ? '不限' : t.remainQuota.toLocaleString() }}</b></span>
            <span>已用: <b>{{ t.usedQuota.toLocaleString() }}</b></span>
          </div>
          <div class="key-foot">
            <span class="key-date">{{ new Date(t.createdAt).toLocaleDateString('zh-CN') }}</span>
            <button class="row-btn danger" @click="doDelete(t.id, t.name)"><Trash2 :size="15" /></button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page { padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }
.page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.page-header h1 { margin: 0; font-size: 22px; font-weight: 680; letter-spacing: -0.03em; }
.header-actions { display: flex; align-items: center; gap: 12px; }
.action-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 13px; border-radius: 6px; border: 1px solid var(--line); background: transparent; color: var(--muted); font-size: 13px; cursor: pointer; }
.action-btn:hover { color: var(--foreground); border-color: var(--line-strong); }
.btn-primary-sm { display: inline-flex; align-items: center; gap: 6px; height: 33px; padding: 0 14px; border-radius: 6px; border: none; font-size: 13px; font-weight: 600; color: #fff; background: var(--accent); cursor: pointer; }
.btn-primary-sm:hover { background: var(--accent-bright); }
.btn-ghost { display: inline-flex; align-items: center; gap: 6px; height: 33px; padding: 0 14px; border-radius: 6px; border: 1px solid var(--line); background: transparent; color: var(--muted); font-size: 13px; cursor: pointer; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.state-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 64px 24px; color: var(--muted); font-size: 14px; }

.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 24px; text-align: center; }
.empty-icon { color: var(--muted); opacity: 0.4; }
.empty-state h3 { margin: 0; color: var(--foreground); font-size: 16px; }
.empty-state p { margin: 0; color: var(--muted); font-size: 14px; }

.key-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.key-card { display: flex; flex-direction: column; gap: 12px; padding: 20px; border-radius: 9px; border: 1px solid var(--line); background: var(--surface); }
.key-head { display: flex; align-items: center; gap: 10px; }
.key-icon { color: var(--accent-bright); }
.key-name { font-weight: 600; font-size: 15px; flex: 1; }
.key-status { font-size: 11px; padding: 2px 8px; border-radius: 4px; }
.key-status.on { color: var(--green); background: rgba(56,217,154,0.1); }
.key-status.off { color: var(--muted); background: rgba(255,255,255,0.04); }
.key-prefix { font-size: 13px; padding: 6px 10px; border-radius: 5px; background: var(--surface-2); color: var(--accent-bright); overflow: hidden; text-overflow: ellipsis; }
.key-meta { display: flex; gap: 16px; font-size: 12px; color: var(--muted); }
.key-meta b { color: var(--foreground); font-weight: 600; }
.key-foot { display: flex; align-items: center; justify-content: space-between; }
.key-date { font-size: 11px; color: var(--muted); }
.row-btn { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 5px; border: none; background: transparent; color: var(--muted); cursor: pointer; }
.row-btn.danger:hover { color: #e5484d; }

.modal-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.55); backdrop-filter: blur(2px); }
.modal { width: min(420px, 90vw); padding: 24px; border-radius: 10px; background: var(--surface); border: 1px solid var(--line-strong); display: flex; flex-direction: column; gap: 16px; }
.modal h3 { margin: 0; font-size: 16px; }
.modal-input { height: 38px; padding: 0 12px; border-radius: 6px; border: 1px solid var(--line); background: var(--surface-2); color: var(--foreground); font-size: 14px; outline: none; }
.modal-input:focus { border-color: var(--accent); }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
.key-reveal { display: flex; flex-direction: column; gap: 12px; align-items: center; padding: 12px; border-radius: 6px; background: var(--surface-2); }
.key-reveal p { margin: 0; font-size: 13px; color: var(--muted); }
.key-reveal code { font-size: 12px; padding: 8px 12px; border-radius: 5px; background: rgba(0,0,0,0.3); color: var(--green); word-break: break-all; text-align: center; }

@media (max-width: 767px) { .page { padding: 16px; } .key-grid { grid-template-columns: 1fr; } }
</style>
