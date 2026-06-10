<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import {
  Bot,
  Loader2,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  Trash2,
  User,
} from 'lucide-vue-next'
import axios from 'axios'
import { getToken } from '@/network/http'

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

// -- State --
const conversations = ref<Conversation[]>([])
const activeId = ref<string>('')
const input = ref('')
const sending = ref(false)
const models = ref<string[]>([])
const selectedModel = ref('auto')
const error = ref('')
const sidebarOpen = ref(true)

// -- Load from localStorage --
const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    conversations.value = raw ? JSON.parse(raw) : []
    activeId.value = localStorage.getItem(ACTIVE_KEY) || ''
  } catch { conversations.value = [] }
}

const saveToStorage = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.value))
}

loadFromStorage()

// -- Active conversation --
const activeConvo = computed(() =>
  conversations.value.find((c) => c.id === activeId.value) ?? null,
)
const messages = computed(() => activeConvo.value?.messages ?? [])

const ensureActiveConvo = () => {
  if (!activeConvo.value && conversations.value.length > 0) {
    activeId.value = conversations.value[0].id
  }
}

onMounted(async () => {
  ensureActiveConvo()
  localStorage.setItem(ACTIVE_KEY, activeId.value)
  // load available models
  try {
    const { data: m } = await axios.get<{ code: number; data: string[] }>('/api/models/available', {
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
    })
    models.value = m.data
  } catch {}
})

// -- Persist activeId --
watch(activeId, (v) => localStorage.setItem(ACTIVE_KEY, v))

// -- New chat --
const newChat = () => {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  const convo: Conversation = {
    id,
    title: '新对话',
    model: selectedModel.value,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  conversations.value.unshift(convo)
  activeId.value = id
  error.value = ''
  input.value = ''
  saveToStorage()
}

// -- Delete chat --
const deleteChat = (id: string) => {
  conversations.value = conversations.value.filter((c) => c.id !== id)
  if (activeId.value === id) {
    activeId.value = conversations.value[0]?.id ?? ''
    input.value = ''
    error.value = ''
  }
  saveToStorage()
}

// -- Send message --
const sendMessage = async () => {
  const text = input.value.trim()
  if (!text || sending.value || !activeConvo.value) return

  const convo = activeConvo.value
  input.value = ''
  sending.value = true
  error.value = ''

  // Auto-title from first user message
  if (convo.messages.length === 0) {
    convo.title = text.length > 30 ? text.slice(0, 30) + '...' : text
  }

  convo.messages.push({ role: 'user', content: text })
  convo.updatedAt = Date.now()
  saveToStorage()

  await nextTick()
  scrollBottom()

  try {
    const { data } = await api.post('/chat/completions', {
      model: selectedModel.value,
      messages: convo.messages.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
    })
    const reply = data?.choices?.[0]?.message?.content ?? JSON.stringify(data)
    convo.messages.push({ role: 'assistant', content: reply })
    convo.updatedAt = Date.now()
    saveToStorage()
  } catch (e: any) {
    error.value = e?.response?.data?.error?.message || e?.response?.data?.message || e.message || '请求失败'
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

// -- Switch conversation --
const switchConvo = (id: string) => {
  activeId.value = id
  input.value = ''
  error.value = ''
  nextTick(scrollBottom)
}

// -- Format date --
const fmtDate = (ts: number) => {
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="chat-layout">
    <!-- Sidebar -->
    <aside class="chat-sidebar" :class="{ closed: !sidebarOpen }">
      <div class="sidebar-head">
        <button class="sidebar-new-btn" @click="newChat">
          <MessageSquarePlus :size="17" />
          <span v-show="sidebarOpen">新建对话</span>
        </button>
      </div>
      <div class="sidebar-list">
        <div
          v-for="convo in conversations"
          :key="convo.id"
          class="sidebar-item"
          :class="{ active: convo.id === activeId }"
          @click="switchConvo(convo.id)"
        >
          <span class="item-text">{{ convo.title }}</span>
          <span class="item-date">{{ fmtDate(convo.updatedAt) }}</span>
          <button
            class="item-delete"
            title="删除"
            @click.stop="deleteChat(convo.id)"
          >
            <Trash2 :size="14" />
          </button>
        </div>
        <div v-if="!conversations.length && sidebarOpen" class="sidebar-empty">
          暂无对话记录
        </div>
      </div>
    </aside>

    <!-- Main chat area -->
    <div class="chat-main">
      <div class="chat-header">
        <div class="chat-header-left">
          <button class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen">
            <PanelLeftOpen v-if="!sidebarOpen" :size="19" />
            <PanelLeftClose v-else :size="19" />
          </button>
          <h1><Bot :size="20" /> {{ activeConvo?.title || 'AI 对话' }}</h1>
        </div>
        <div class="chat-header-right">
          <select v-model="selectedModel" class="model-select">
            <option value="auto">自动选择模型</option>
            <option v-for="m in models" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
      </div>

      <div id="chat-scroll" class="chat-messages">
        <!-- Empty -->
        <div v-if="!activeConvo && !sending" class="chat-empty">
          <Bot :size="48" class="empty-icon" />
          <h3>开始对话</h3>
          <p>点击左侧「新建对话」或选择历史会话</p>
        </div>
        <div v-else-if="activeConvo && !messages.length && !sending" class="chat-empty">
          <Bot :size="48" class="empty-icon" />
          <h3>{{ activeConvo.title }}</h3>
          <p>发送消息开始对话</p>
        </div>

        <!-- Messages -->
        <template v-for="(msg, i) in messages" :key="i">
          <div class="chat-msg" :class="msg.role">
            <div class="msg-avatar">
              <User v-if="msg.role === 'user'" :size="17" />
              <Bot v-else :size="17" />
            </div>
            <div class="msg-bubble">
              <div class="msg-role">{{ msg.role === 'user' ? '你' : 'AI' }}</div>
              <div class="msg-text">{{ msg.content }}</div>
            </div>
          </div>
        </template>

        <!-- Sending indicator -->
        <div v-if="sending" class="chat-msg assistant">
          <div class="msg-avatar"><Bot :size="17" /></div>
          <div class="msg-bubble">
            <Loader2 :size="16" class="spin" />
            <span class="thinking">思考中...</span>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="chat-error">{{ error }}</div>
      </div>

      <!-- Input -->
      <div class="chat-input-area">
        <textarea
          v-model="input"
          class="chat-input"
          :placeholder="activeConvo ? '输入消息... (Enter 发送)' : '请先创建或选择一个对话'"
          rows="1"
          :disabled="sending || !activeConvo"
          @keydown.enter.exact.prevent="sendMessage"
        ></textarea>
        <button class="send-btn" :disabled="!input.trim() || sending || !activeConvo" @click="sendMessage">
          <Send :size="18" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-layout {
  display: flex;
  height: calc(100dvh - 56px);
  background: var(--background);
}

/* ---- Sidebar ---- */
.chat-sidebar {
  width: 260px;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-right: 1px solid var(--line);
  transition: width 180ms ease, min-width 180ms ease;
  overflow: hidden;
}

.chat-sidebar.closed {
  width: 0;
  min-width: 0;
  border-right: none;
}

.sidebar-head {
  padding: 14px;
  border-bottom: 1px solid var(--line);
}

.sidebar-new-btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 14px;
  border-radius: 7px;
  border: 1px solid var(--line-strong);
  background: transparent;
  color: var(--foreground);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 140ms;
  white-space: nowrap;
}

.sidebar-new-btn:hover { background: rgba(255,255,255,0.04); }

.sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 120ms;
  position: relative;
}

.sidebar-item:hover { background: rgba(255,255,255,0.03); }
.sidebar-item.active { background: rgba(22, 131, 255, 0.14); }

.item-text {
  flex: 1;
  font-size: 13px;
  color: var(--foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.item-date {
  font-size: 10px;
  color: var(--muted);
  flex-shrink: 0;
}

.item-delete {
  display: none;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 5px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  flex-shrink: 0;
}

.item-delete:hover { color: #e5484d; background: rgba(229,72,77,0.1); }
.sidebar-item:hover .item-delete { display: flex; }

.sidebar-empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--muted);
}

/* ---- Main ---- */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid var(--line);
  min-height: 52px;
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.chat-header h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  flex-shrink: 0;
}

.sidebar-toggle:hover { color: var(--foreground); background: rgba(255,255,255,0.04); }

.model-select {
  height: 33px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: var(--surface-2);
  color: var(--foreground);
  font-size: 13px;
  cursor: pointer;
}

.model-select option { background: var(--surface); }

/* ---- Messages ---- */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1;
  color: var(--muted);
  text-align: center;
}

.empty-icon { opacity: 0.3; }
.chat-empty h3 { margin: 0; font-size: 18px; color: var(--foreground); }
.chat-empty p { margin: 0; font-size: 14px; }

.chat-msg {
  display: flex;
  gap: 12px;
  max-width: 85%;
}

.chat-msg.user { align-self: flex-end; flex-direction: row-reverse; }
.chat-msg.assistant { align-self: flex-start; }

.msg-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--accent-bright);
  flex-shrink: 0;
}

.chat-msg.user .msg-avatar { color: var(--muted); }

.msg-bubble {
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.65;
  min-width: 0;
  word-break: break-word;
}

.chat-msg.user .msg-bubble {
  background: var(--accent);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.chat-msg.assistant .msg-bubble {
  background: var(--surface-2);
  color: var(--foreground);
  border-bottom-left-radius: 4px;
  border: 1px solid var(--line);
}

.msg-role { font-size: 11px; font-weight: 600; margin-bottom: 4px; opacity: 0.6; }

.thinking { font-size: 13px; color: var(--muted); }

.spin { animation: spin 1s linear infinite; margin-right: 6px; }
@keyframes spin { to { transform: rotate(360deg); } }

.chat-error {
  align-self: center;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  color: #e5484d;
  background: rgba(229,72,77,0.08);
}

/* ---- Input ---- */
.chat-input-area {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--line);
}

.chat-input {
  flex: 1;
  min-height: 42px;
  max-height: 160px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--surface-2);
  color: var(--foreground);
  font-size: 14px;
  font-family: inherit;
  resize: none;
  outline: none;
  line-height: 1.5;
}

.chat-input:focus { border-color: var(--accent); }

.send-btn {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
}

.send-btn:hover { background: var(--accent-bright); }
.send-btn:disabled { opacity: 0.4; cursor: default; }

/* ---- Responsive ---- */
@media (max-width: 767px) {
  .chat-sidebar {
    position: fixed;
    left: 0;
    top: 56px;
    bottom: 0;
    z-index: 25;
    box-shadow: 4px 0 20px rgba(0,0,0,0.4);
  }

  .chat-sidebar.closed {
    width: 0;
    min-width: 0;
    box-shadow: none;
  }

  .chat-messages { padding: 16px; }
  .chat-input-area { padding: 12px 16px; }
  .chat-header { padding: 10px 16px; }
}
</style>
