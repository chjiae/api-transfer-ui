<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import {
  PhRobot as Bot,
  PhPlus as Plus,
  PhSidebarSimple as Sidebar,
  PhPaperPlaneRight as Send,
  PhTrash as Trash,
  PhChatCircleDots as ChatIcon,
} from '@phosphor-icons/vue'
import axios from 'axios'
import { getToken } from '@/network/http'
import { confirm } from '@/lib/confirm'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiSpinner from '@/components/ui/UiSpinner.vue'

interface Message {
  role: 'user' | 'assistant'
  content: string
}
interface Conversation {
  id: string
  title: string
  model: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'chat-conversations'
const ACTIVE_KEY = 'chat-active-id'

const api = axios.create({ baseURL: '/api' })
api.interceptors.request.use((c) => {
  const t = getToken()
  if (t) c.headers.Authorization = `Bearer ${t}`
  return c
})

const conversations = ref<Conversation[]>([])
const activeId = ref('')
const input = ref('')
const sending = ref(false)
const models = ref<string[]>([])
const selectedModel = ref('auto')
const error = ref('')
const sidebarOpen = ref(true)

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    conversations.value = raw ? JSON.parse(raw) : []
    activeId.value = localStorage.getItem(ACTIVE_KEY) || ''
  } catch {
    conversations.value = []
  }
}
const saveToStorage = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.value))
loadFromStorage()

const activeConvo = computed(() => conversations.value.find((c) => c.id === activeId.value) ?? null)
const messages = computed(() => activeConvo.value?.messages ?? [])

onMounted(async () => {
  if (!activeConvo.value && conversations.value.length > 0) activeId.value = conversations.value[0].id
  localStorage.setItem(ACTIVE_KEY, activeId.value)
  try {
    const { data: m } = await axios.get<{ code: number; data: string[] }>('/api/models/available', {
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
    })
    models.value = m.data
  } catch {
    /* ignore */
  }
})
watch(activeId, (v) => localStorage.setItem(ACTIVE_KEY, v))

const newChat = () => {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  conversations.value.unshift({
    id,
    title: '新对话',
    model: selectedModel.value,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })
  activeId.value = id
  error.value = ''
  input.value = ''
  saveToStorage()
}

const deleteChat = async (id: string, title: string) => {
  const ok = await confirm({
    title: '删除对话',
    message: `「${title}」的全部消息将被清除，无法恢复。`,
    confirmText: '删除',
    danger: true,
  })
  if (!ok) return
  conversations.value = conversations.value.filter((c) => c.id !== id)
  if (activeId.value === id) {
    activeId.value = conversations.value[0]?.id ?? ''
    input.value = ''
    error.value = ''
  }
  saveToStorage()
}

const sendMessage = async () => {
  const text = input.value.trim()
  if (!text || sending.value) return
  if (!activeConvo.value) newChat()
  const convo = activeConvo.value!
  input.value = ''
  sending.value = true
  error.value = ''
  if (convo.messages.length === 0) convo.title = text.length > 24 ? text.slice(0, 24) + '…' : text
  convo.messages.push({ role: 'user', content: text })
  convo.updatedAt = Date.now()
  saveToStorage()
  await nextTick()
  scrollBottom()
  try {
    const effectiveModel = selectedModel.value === 'auto' && models.value.length > 0
      ? models.value[0]
      : selectedModel.value
    const { data } = await api.post('/chat/completions', {
      model: effectiveModel,
      messages: convo.messages.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
    })
    const reply = data?.choices?.[0]?.message?.content ?? JSON.stringify(data)
    convo.messages.push({ role: 'assistant', content: reply })
    convo.updatedAt = Date.now()
    saveToStorage()
  } catch (e) {
    const err = e as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string }
    error.value =
      err?.response?.data?.error?.message || err?.response?.data?.message || err.message || '请求失败'
  } finally {
    sending.value = false
    await nextTick()
    scrollBottom()
  }
}

const scrollBottom = () => {
  const el = document.getElementById('chat-scroll')
  if (el) el.scrollTop = el.scrollHeight
}

const switchConvo = (id: string) => {
  activeId.value = id
  input.value = ''
  error.value = ''
  nextTick(scrollBottom)
}

const onInput = (e: Event) => {
  const ta = e.target as HTMLTextAreaElement
  ta.style.height = 'auto'
  ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
}

const fmtDate = (ts: number) => {
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}
</script>

<template>
  <div class="chat-layout">
    <!-- 会话侧栏 -->
    <aside class="cv-sidebar" :class="{ closed: !sidebarOpen }">
      <div class="cv-sidebar-head">
        <button class="new-btn" @click="newChat">
          <Plus :size="16" /> 新建对话
        </button>
      </div>
      <div class="cv-list">
        <button
          v-for="convo in conversations"
          :key="convo.id"
          class="cv-item"
          :class="{ active: convo.id === activeId }"
          @click="switchConvo(convo.id)"
        >
          <span class="cv-item-title">{{ convo.title }}</span>
          <span class="cv-item-date mono">{{ fmtDate(convo.updatedAt) }}</span>
          <span class="cv-item-del" title="删除" @click.stop="deleteChat(convo.id, convo.title)">
            <Trash :size="14" />
          </span>
        </button>
        <p v-if="!conversations.length" class="cv-empty">还没有对话记录</p>
      </div>
    </aside>

    <!-- 主区 -->
    <div class="cv-main">
      <header class="cv-head">
        <div class="cv-head-left">
          <button class="cv-toggle" :title="sidebarOpen ? '收起会话栏' : '展开会话栏'" @click="sidebarOpen = !sidebarOpen">
            <Sidebar :size="18" />
          </button>
          <h2 class="cv-title">{{ activeConvo?.title || '调试对话' }}</h2>
        </div>
        <UiSelect v-model="selectedModel" size="sm">
          <option value="auto">自动选择模型</option>
          <option v-for="m in models" :key="m" :value="m">{{ m }}</option>
        </UiSelect>
      </header>

      <div id="chat-scroll" class="cv-messages">
        <div v-if="!messages.length && !sending" class="cv-welcome">
          <span class="cv-welcome-icon"><ChatIcon :size="26" weight="duotone" /></span>
          <h3>开始一段对话</h3>
          <p>在下方输入消息，用你自己的额度直接试用已接入的模型。无需单独配置密钥。</p>
        </div>

        <div v-for="(msg, i) in messages" :key="i" class="msg" :class="msg.role">
          <span class="msg-avatar" :class="msg.role">
            <Bot v-if="msg.role === 'assistant'" :size="16" />
            <span v-else>你</span>
          </span>
          <div class="msg-bubble">{{ msg.content }}</div>
        </div>

        <div v-if="sending" class="msg assistant">
          <span class="msg-avatar assistant"><Bot :size="16" /></span>
          <div class="msg-bubble thinking">
            <UiSpinner :size="14" /> 正在生成回复
          </div>
        </div>

        <div v-if="error" class="cv-error">{{ error }}</div>
      </div>

      <div class="cv-input">
        <textarea
          v-model="input"
          class="cv-textarea"
          placeholder="输入消息，Enter 发送，Shift+Enter 换行"
          rows="1"
          :disabled="sending"
          @input="onInput"
          @keydown.enter.exact.prevent="sendMessage"
        />
        <button class="cv-send" :disabled="!input.trim() || sending" @click="sendMessage">
          <Send :size="17" weight="fill" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-layout {
  display: flex;
  height: calc(100dvh - 56px);
  background: var(--canvas);
}

/* 会话侧栏 */
.cv-sidebar {
  width: 256px;
  min-width: 256px;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-right: 1px solid var(--line);
  transition: width var(--dur) var(--ease), min-width var(--dur) var(--ease);
  overflow: hidden;
}
.cv-sidebar.closed {
  width: 0;
  min-width: 0;
  border-right: none;
}
.cv-sidebar-head {
  padding: var(--space-3);
}
.new-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 38px;
  border: 1px solid var(--line-2);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  font-size: var(--text-sm);
  font-weight: 520;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--dur-fast), border-color var(--dur-fast);
}
.new-btn:hover {
  background: var(--surface-2);
  border-color: var(--line-strong);
}
.cv-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--space-2) var(--space-2);
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.cv-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background var(--dur-fast);
}
.cv-item:hover {
  background: var(--surface-2);
}
.cv-item.active {
  background: var(--accent-soft);
}
.cv-item-title {
  flex: 1;
  min-width: 0;
  font-size: var(--text-sm);
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cv-item.active .cv-item-title {
  color: var(--accent-text);
  font-weight: 520;
}
.cv-item-date {
  font-size: 11px;
  color: var(--text-3);
  flex-shrink: 0;
}
.cv-item-del {
  display: none;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  color: var(--text-3);
  flex-shrink: 0;
}
.cv-item:hover .cv-item-del {
  display: grid;
}
.cv-item-del:hover {
  background: var(--danger-soft);
  color: var(--danger);
}
.cv-empty {
  padding: var(--space-6) var(--space-4);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--text-3);
}

/* 主区 */
.cv-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.cv-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  height: 52px;
  padding: 0 var(--space-5);
  border-bottom: 1px solid var(--line);
}
.cv-head-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}
.cv-toggle {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-3);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--dur-fast), color var(--dur-fast);
}
.cv-toggle:hover {
  background: var(--surface-2);
  color: var(--text);
}
.cv-title {
  margin: 0;
  font-size: var(--text-md);
  font-weight: 560;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 消息流 */
.cv-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
.cv-welcome {
  margin: auto;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: var(--text-3);
}
.cv-welcome-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin-bottom: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--accent-soft);
  color: var(--accent-text);
}
.cv-welcome h3 {
  margin: 0 0 6px;
  font-size: var(--text-lg);
  font-weight: 560;
  color: var(--text);
}
.cv-welcome p {
  margin: 0;
  font-size: var(--text-sm);
  line-height: 1.6;
}

.msg {
  display: flex;
  gap: 12px;
  max-width: 760px;
  width: 100%;
  margin: 0 auto;
}
.msg-avatar {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 600;
}
.msg-avatar.assistant {
  background: var(--accent-soft);
  color: var(--accent-text);
}
.msg-avatar.user {
  background: var(--surface-3);
  color: var(--text-2);
}
.msg.user {
  flex-direction: row-reverse;
}
.msg-bubble {
  padding: 11px 15px;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
  max-width: calc(100% - 42px);
}
.msg.assistant .msg-bubble {
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--text);
  border-top-left-radius: var(--radius-xs);
}
.msg.user .msg-bubble {
  background: var(--accent);
  color: var(--text-on-brand);
  border-top-right-radius: var(--radius-xs);
}
.thinking {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-3);
}
.cv-error {
  max-width: 760px;
  width: 100%;
  margin: 0 auto;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: var(--text-sm);
}

/* 输入区 */
.cv-input {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--line);
}
.cv-textarea {
  flex: 1;
  min-height: 44px;
  max-height: 160px;
  padding: 11px 14px;
  border: 1px solid var(--line-2);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--text);
  font-size: var(--text-base);
  font-family: inherit;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: border-color var(--dur-fast), box-shadow var(--dur-fast);
}
.cv-textarea:focus {
  border-color: var(--accent);
  box-shadow: var(--shadow-focus);
}
.cv-textarea::placeholder {
  color: var(--text-3);
}
.cv-send {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--radius-lg);
  background: var(--accent);
  color: var(--text-on-brand);
  cursor: pointer;
  transition: background var(--dur-fast), transform var(--dur-fast);
}
.cv-send:hover:not(:disabled) {
  background: var(--accent-hover);
}
.cv-send:active:not(:disabled) {
  transform: scale(0.94);
}
.cv-send:disabled {
  opacity: 0.4;
  cursor: default;
}

@media (max-width: 767px) {
  .cv-sidebar {
    position: fixed;
    left: 0;
    top: 56px;
    bottom: 0;
    z-index: 25;
    box-shadow: var(--shadow-lg);
  }
  .cv-sidebar.closed {
    box-shadow: none;
  }
  .cv-messages {
    padding: var(--space-4);
  }
}
</style>
