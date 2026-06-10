<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { Bot, Loader2, MessageSquarePlus, Send, User } from 'lucide-vue-next'
import axios from 'axios'
import { getToken } from '@/network/http'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const messages = ref<Message[]>([])
const input = ref('')
const sending = ref(false)
const models = ref<string[]>([])
const selectedModel = ref('auto')
const error = ref('')

const api = axios.create({ baseURL: '/api' })
api.interceptors.request.use((c) => {
  const t = getToken()
  if (t) c.headers.Authorization = `Bearer ${t}`
  return c
})

onMounted(async () => {
  const t = getToken()
  try {
    const { data: m } = await axios.get<{ code: number; data: string[] }>('/api/models/available', {
      headers: t ? { Authorization: `Bearer ${t}` } : {},
    })
    models.value = m.data
  } catch {}
})

const sendMessage = async () => {
  const text = input.value.trim()
  if (!text || sending.value) return
  messages.value.push({ role: 'user', content: text })
  input.value = ''
  sending.value = true
  error.value = ''

  await nextTick()
  scrollBottom()

  try {
    const { data } = await api.post('/chat/completions', {
      model: selectedModel.value,
      messages: messages.value.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
    })
    // ChatProxyController 直接透传 OpenAI 格式，无 ApiResponse 包络
    const reply = data?.choices?.[0]?.message?.content
      ?? JSON.stringify(data)
    messages.value.push({ role: 'assistant', content: reply })
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

const newChat = () => {
  messages.value = []
  error.value = ''
  input.value = ''
}
</script>

<template>
  <div class="chat-page">
    <div class="chat-main">
      <div class="chat-header">
        <h1><Bot :size="22" /> AI 对话</h1>
        <div class="chat-header-right">
          <button v-if="messages.length" class="new-chat-btn" @click="newChat">
            <MessageSquarePlus :size="16" /> 新建对话
          </button>
          <select v-model="selectedModel" class="model-select">
            <option value="auto">自动选择模型</option>
            <option v-for="m in models" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
      </div>

      <div id="chat-scroll" class="chat-messages">
        <div v-if="!messages.length && !sending" class="chat-empty">
          <Bot :size="48" class="empty-icon" />
          <h3>开始对话</h3>
          <p>选择一个模型，输入消息开始与 AI 对话</p>
        </div>

        <div v-for="(msg, i) in messages" :key="i" class="chat-msg" :class="msg.role">
          <div class="msg-avatar">
            <User v-if="msg.role === 'user'" :size="18" />
            <Bot v-else :size="18" />
          </div>
          <div class="msg-bubble">
            <div class="msg-role">{{ msg.role === 'user' ? '你' : 'AI' }}</div>
            <div class="msg-text">{{ msg.content }}</div>
          </div>
        </div>

        <div v-if="sending" class="chat-msg assistant">
          <div class="msg-avatar"><Bot :size="18" /></div>
          <div class="msg-bubble">
            <Loader2 :size="16" class="spin" />
            <span class="thinking">思考中...</span>
          </div>
        </div>

        <div v-if="error" class="chat-error">{{ error }}</div>
      </div>

      <div class="chat-input-area">
        <textarea
          v-model="input"
          class="chat-input"
          placeholder="输入消息... (Enter 发送)"
          rows="1"
          :disabled="sending"
          @keydown.enter.exact.prevent="sendMessage"
        ></textarea>
        <button class="send-btn" :disabled="!input.trim() || sending" @click="sendMessage">
          <Send :size="18" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-page { height: calc(100dvh - 56px); display: flex; }
.chat-main { flex: 1; display: flex; flex-direction: column; max-width: 900px; margin: 0 auto; width: 100%; }

.chat-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid var(--line); }
.chat-header h1 { margin: 0; font-size: 18px; font-weight: 650; display: flex; align-items: center; gap: 10px; }
.chat-header-right { display: flex; align-items: center; gap: 10px; }
.new-chat-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 13px; border-radius: 6px; border: 1px solid var(--line); background: transparent; color: var(--muted); font-size: 13px; cursor: pointer; font-family: inherit; white-space: nowrap; }
.new-chat-btn:hover { color: var(--foreground); border-color: var(--line-strong); }
.model-select { height: 34px; padding: 0 12px; border-radius: 6px; border: 1px solid var(--line); background: var(--surface-2); color: var(--foreground); font-size: 13px; cursor: pointer; min-width: 180px; }
.model-select option { background: var(--surface); }

.chat-messages { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.chat-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; flex: 1; color: var(--muted); }
.empty-icon { opacity: 0.3; }
.chat-empty h3 { margin: 0; font-size: 18px; color: var(--foreground); }
.chat-empty p { margin: 0; font-size: 14px; }

.chat-msg { display: flex; gap: 12px; max-width: 85%; }
.chat-msg.user { align-self: flex-end; flex-direction: row-reverse; }
.chat-msg.assistant { align-self: flex-start; }

.msg-avatar { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--surface-2); color: var(--accent-bright); flex-shrink: 0; }
.chat-msg.user .msg-avatar { color: var(--muted); }

.msg-bubble { padding: 12px 16px; border-radius: 10px; font-size: 14px; line-height: 1.65; min-width: 0; }
.chat-msg.user .msg-bubble { background: var(--accent); color: #fff; border-bottom-right-radius: 4px; }
.chat-msg.assistant .msg-bubble { background: var(--surface-2); color: var(--foreground); border-bottom-left-radius: 4px; border: 1px solid var(--line); }
.msg-role { font-size: 11px; font-weight: 600; margin-bottom: 4px; opacity: 0.6; }
.thinking { font-size: 13px; color: var(--muted); }
.spin { animation: spin 1s linear infinite; margin-right: 6px; }
@keyframes spin { to { transform: rotate(360deg); } }

.chat-error { align-self: center; padding: 8px 16px; border-radius: 6px; font-size: 13px; color: #e5484d; background: rgba(229,72,77,0.08); }

.chat-input-area { display: flex; align-items: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid var(--line); }
.chat-input { flex: 1; min-height: 42px; max-height: 160px; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--line); background: var(--surface-2); color: var(--foreground); font-size: 14px; font-family: inherit; resize: none; outline: none; line-height: 1.5; }
.chat-input:focus { border-color: var(--accent); }
.send-btn { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: none; background: var(--accent); color: #fff; cursor: pointer; flex-shrink: 0; }
.send-btn:hover { background: var(--accent-bright); }
.send-btn:disabled { opacity: 0.4; cursor: default; }

@media (max-width: 767px) {
  .chat-messages { padding: 16px; }
  .chat-input-area { padding: 12px 16px; }
  .chat-header { padding: 12px 16px; }
}
</style>
