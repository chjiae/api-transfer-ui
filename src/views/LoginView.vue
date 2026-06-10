<script setup lang="ts">
import {
  PhArrowRight as ArrowRight,
  PhCheck as Check,
  PhEye as Eye,
  PhEyeSlash as EyeOff,
  PhBuildings as Building,
  PhUser as UserIcon,
  PhLock as Lock,
  PhTicket as Ticket,
  PhIdentificationBadge as Badge,
  PhShieldCheck as ShieldCheck,
  PhArrowsSplit as Split,
  PhPlugsConnected as Plugs,
} from '@phosphor-icons/vue'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AuthError, login, register, storeToken } from '@/lib/auth'
import UiThemeToggle from '@/components/ui/UiThemeToggle.vue'

const route = useRoute()
const router = useRouter()
const mode = ref<'login' | 'register'>('login')
const tenantCode = ref(typeof route.query.tenant === 'string' ? route.query.tenant : '')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const displayName = ref('')
const credentialType = ref<'signupKey' | 'inviteCode'>('signupKey')
const registrationCredential = ref('')
const remember = ref(true)
const showPassword = ref(false)
const submitting = ref(false)
const submitted = ref(false)
const submitError = ref('')
const submitSuccess = ref('')

const isRegister = computed(() => mode.value === 'register')
const needsCredential = computed(() => {
  const tenant = tenantCode.value.trim().toLowerCase()
  return isRegister.value && tenant !== '' && tenant !== 'default'
})

const usernameError = computed(() => {
  if (!submitted.value) return ''
  if (!username.value.trim()) return '请输入用户名'
  if (isRegister.value && (username.value.trim().length < 3 || username.value.trim().length > 64))
    return '用户名需为 3 至 64 个字符'
  return ''
})
const passwordError = computed(() => {
  if (!submitted.value) return ''
  if (!password.value) return '请输入密码'
  if (isRegister.value && (password.value.length < 6 || password.value.length > 72))
    return '密码需为 6 至 72 个字符'
  return ''
})
const confirmPasswordError = computed(() => {
  if (!submitted.value || !isRegister.value) return ''
  if (!confirmPassword.value) return '请再次输入密码'
  if (confirmPassword.value !== password.value) return '两次输入的密码不一致'
  return ''
})

const switchMode = (next: 'login' | 'register') => {
  mode.value = next
  submitted.value = false
  submitError.value = ''
  submitSuccess.value = ''
  password.value = ''
  confirmPassword.value = ''
}

const authErrorMessage = (error: unknown) => {
  if (!(error instanceof AuthError)) return error instanceof Error ? error.message : '请求失败，请稍后重试'
  if (error.code === 40101) return '租户、用户名或密码错误'
  if (error.code === 40010) return '该用户名已被使用'
  if (error.code === 40330) return '租户未开放注册，或注册凭证不正确'
  if (error.code === 40331) return '操作过于频繁，请稍后再试'
  if (error.code === 40000) return '请检查用户名和密码格式'
  return error.message
}

const resetState = () => {
  submitted.value = false
  submitError.value = ''
}

const submitAuth = async () => {
  submitted.value = true
  submitError.value = ''
  submitSuccess.value = ''
  if (usernameError.value || passwordError.value || confirmPasswordError.value) return

  submitting.value = true
  try {
    if (isRegister.value) {
      await register({
        tenantCode: tenantCode.value,
        username: username.value,
        password: password.value,
        displayName: displayName.value,
        signupKey: needsCredential.value && credentialType.value === 'signupKey' ? registrationCredential.value : undefined,
        inviteCode: needsCredential.value && credentialType.value === 'inviteCode' ? registrationCredential.value : undefined,
      })
      const registeredUsername = username.value
      switchMode('login')
      username.value = registeredUsername
      submitSuccess.value = '注册成功，请使用新账号登录'
    } else {
      const result = await login({ tenantCode: tenantCode.value, username: username.value, password: password.value })
      storeToken(result.token, remember.value)
      const redirect =
        typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/dashboard'
      await router.replace(redirect)
    }
  } catch (error) {
    submitError.value = authErrorMessage(error)
  } finally {
    submitting.value = false
  }
}

const capabilities = [
  { icon: ShieldCheck, title: '密钥与权限隔离', desc: '每个密钥独立额度，租户间数据互不可见' },
  { icon: Split, title: '智能路由', desc: '按优先级与权重在多通道间分发请求' },
  { icon: Plugs, title: '统一接入', desc: '一套 OpenAI 兼容接口，对接全部上游' },
]
</script>

<template>
  <main class="auth">
    <div class="auth-theme"><UiThemeToggle /></div>

    <!-- 品牌侧 -->
    <section class="brand-side">
      <div class="brand-inner">
        <div class="brand-row">
          <span class="brand-mark">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <path d="M4 9h11l-3-3M20 15H9l3 3" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span class="brand-word">Relay</span>
        </div>

        <h1 class="brand-h1">一个网关，<br />接住你的全部模型流量。</h1>
        <p class="brand-sub">统一接入、智能路由与调用观测，让团队把精力放回产品本身。</p>

        <ul class="caps">
          <li v-for="c in capabilities" :key="c.title">
            <span class="cap-icon"><component :is="c.icon" :size="18" /></span>
            <div>
              <strong>{{ c.title }}</strong>
              <span>{{ c.desc }}</span>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- 表单侧 -->
    <section class="form-side">
      <div class="form-card">
        <header class="form-head">
          <h2>{{ isRegister ? '创建账号' : '欢迎回来' }}</h2>
          <p>{{ isRegister ? '注册后即可接入统一模型网关' : '登录以进入 Relay 控制台' }}</p>
        </header>

        <div class="tabs" role="tablist">
          <button type="button" :class="{ active: !isRegister }" @click="switchMode('login')">登录</button>
          <button type="button" :class="{ active: isRegister }" @click="switchMode('register')">注册</button>
        </div>

        <form novalidate @submit.prevent="submitAuth">
          <div class="field">
            <label for="tenantCode">租户编码 <span class="opt">可选</span></label>
            <div class="shell">
              <Building :size="17" />
              <input id="tenantCode" v-model="tenantCode" type="text" autocomplete="organization"
                placeholder="留空使用默认租户" @input="resetState(); registrationCredential = ''" />
            </div>
          </div>

          <div v-if="isRegister" class="field">
            <label for="displayName">显示名称 <span class="opt">可选</span></label>
            <div class="shell">
              <Badge :size="17" />
              <input id="displayName" v-model="displayName" type="text" autocomplete="name" placeholder="用于控制台展示" />
            </div>
          </div>

          <div class="field">
            <label for="username">用户名</label>
            <div class="shell" :class="{ invalid: usernameError }">
              <UserIcon :size="17" />
              <input id="username" v-model="username" type="text" autocomplete="username"
                placeholder="请输入用户名" @input="resetState" />
            </div>
            <span v-if="usernameError" class="err">{{ usernameError }}</span>
          </div>

          <div class="field">
            <label for="password">密码</label>
            <div class="shell" :class="{ invalid: passwordError }">
              <Lock :size="17" />
              <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password" placeholder="请输入密码" @input="resetState" />
              <button type="button" class="toggle" :aria-label="showPassword ? '隐藏密码' : '显示密码'" @click="showPassword = !showPassword">
                <EyeOff v-if="showPassword" :size="17" /><Eye v-else :size="17" />
              </button>
            </div>
            <span v-if="passwordError" class="err">{{ passwordError }}</span>
          </div>

          <div v-if="isRegister" class="field">
            <label for="confirmPassword">确认密码</label>
            <div class="shell" :class="{ invalid: confirmPasswordError }">
              <Lock :size="17" />
              <input id="confirmPassword" v-model="confirmPassword" :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password" placeholder="再次输入密码" @input="resetState" />
            </div>
            <span v-if="confirmPasswordError" class="err">{{ confirmPasswordError }}</span>
          </div>

          <div v-if="needsCredential" class="field">
            <div class="cred-tabs">
              <button type="button" :class="{ active: credentialType === 'signupKey' }"
                @click="credentialType = 'signupKey'; registrationCredential = ''">注册密钥</button>
              <button type="button" :class="{ active: credentialType === 'inviteCode' }"
                @click="credentialType = 'inviteCode'; registrationCredential = ''">邀请码</button>
            </div>
            <div class="shell">
              <Ticket :size="17" />
              <input v-model="registrationCredential" type="text"
                :placeholder="credentialType === 'signupKey' ? '请输入租户注册密钥' : '请输入租户邀请码'" />
            </div>
          </div>

          <label v-if="!isRegister" class="remember">
            <input v-model="remember" type="checkbox" />
            <span class="check"><Check :size="11" weight="bold" /></span>
            保持登录状态
          </label>

          <div v-if="submitSuccess" class="banner ok" role="status">{{ submitSuccess }}</div>
          <div v-if="submitError" class="banner err-banner" role="alert">{{ submitError }}</div>

          <button class="submit" type="submit" :disabled="submitting">
            <span v-if="submitting" class="spinner" />
            <template v-else>
              {{ isRegister ? '创建账号' : '登录' }}
              <ArrowRight :size="16" />
            </template>
          </button>
        </form>

        <footer class="form-foot">
          <p v-if="isRegister">已有账号？<button type="button" @click="switchMode('login')">返回登录</button></p>
          <p v-else>还没有账号？<button type="button" @click="switchMode('register')">立即注册</button></p>
        </footer>
      </div>

      <div class="status-line">
        <span><i class="dot" /> 服务运行正常</span>
        <span class="mono">TLS 1.3 加密连接</span>
      </div>
    </section>
  </main>
</template>

<style scoped>
.auth {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  min-height: 100dvh;
  background: var(--canvas);
}
.auth-theme {
  position: fixed;
  top: var(--space-5);
  right: var(--space-5);
  z-index: 5;
}

/* 品牌侧 */
.brand-side {
  position: relative;
  display: flex;
  align-items: center;
  padding: 7vw 5vw;
  background: var(--surface);
  border-right: 1px solid var(--line);
  overflow: hidden;
}
.brand-side::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(60% 50% at 18% 12%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 70%),
    radial-gradient(50% 40% at 90% 95%, color-mix(in srgb, var(--accent) 7%, transparent), transparent 70%);
  pointer-events: none;
}
.brand-inner {
  position: relative;
  max-width: 460px;
}
.brand-row {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: var(--space-10);
}
.brand-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: var(--text-on-brand);
  background: var(--accent);
  border-radius: var(--radius-md);
}
.brand-word {
  font-size: var(--text-xl);
  font-weight: 620;
  letter-spacing: -0.02em;
}
.brand-h1 {
  margin: 0 0 var(--space-4);
  font-size: clamp(28px, 3.2vw, 40px);
  line-height: 1.18;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--text);
}
.brand-sub {
  margin: 0 0 var(--space-10);
  font-size: var(--text-md);
  line-height: 1.65;
  color: var(--text-2);
  max-width: 40ch;
}
.caps {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  margin: 0;
  padding: 0;
  list-style: none;
}
.caps li {
  display: flex;
  align-items: flex-start;
  gap: 13px;
}
.cap-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--accent-soft);
  color: var(--accent-text);
}
.caps strong {
  display: block;
  font-size: var(--text-base);
  font-weight: 540;
  color: var(--text);
  margin-bottom: 2px;
}
.caps span {
  font-size: var(--text-sm);
  color: var(--text-3);
  line-height: 1.5;
}

/* 表单侧 */
.form-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) 6vw;
  gap: var(--space-6);
}
.form-card {
  width: 100%;
  max-width: 380px;
}
.form-head {
  margin-bottom: var(--space-6);
}
.form-head h2 {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 600;
  letter-spacing: -0.02em;
}
.form-head p {
  margin: 7px 0 0;
  font-size: var(--text-sm);
  color: var(--text-3);
}
.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px;
  padding: 3px;
  margin-bottom: var(--space-5);
  background: var(--surface-2);
  border-radius: var(--radius-md);
}
.tabs button {
  height: 34px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-3);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background var(--dur-fast), color var(--dur-fast), box-shadow var(--dur-fast);
}
.tabs button.active {
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-sm);
}
form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.field label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-2);
}
.opt {
  margin-left: 3px;
  font-size: 11px;
  font-weight: 400;
  color: var(--text-3);
}
.shell {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 13px;
  border: 1px solid var(--line-2);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text-3);
  transition: border-color var(--dur-fast), box-shadow var(--dur-fast);
}
.shell:focus-within {
  border-color: var(--accent);
  box-shadow: var(--shadow-focus);
  color: var(--accent);
}
.shell.invalid {
  border-color: var(--danger);
}
.shell input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text);
  font-size: var(--text-base);
}
.shell input::placeholder {
  color: var(--text-3);
}
.toggle {
  display: grid;
  place-items: center;
  border: none;
  background: transparent;
  color: var(--text-3);
  cursor: pointer;
  padding: 2px;
}
.toggle:hover {
  color: var(--text-2);
}
.err {
  font-size: var(--text-xs);
  color: var(--danger);
}
.cred-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 7px;
}
.cred-tabs button {
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--line-2);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-3);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all var(--dur-fast);
}
.cred-tabs button.active {
  border-color: var(--accent-soft-border);
  background: var(--accent-soft);
  color: var(--accent-text);
}
.remember {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-size: var(--text-sm);
  color: var(--text-2);
  cursor: pointer;
  user-select: none;
}
.remember input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.check {
  display: grid;
  place-items: center;
  width: 17px;
  height: 17px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-xs);
  background: var(--surface);
  color: transparent;
  transition: all var(--dur-fast);
}
.remember input:checked + .check {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-on-brand);
}
.banner {
  padding: 10px 13px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  line-height: 1.5;
}
.banner.ok {
  background: var(--success-soft);
  color: var(--success);
}
.banner.err-banner {
  background: var(--danger-soft);
  color: var(--danger);
}
.submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 46px;
  margin-top: var(--space-1);
  border: none;
  border-radius: var(--radius-md);
  background: var(--accent);
  color: var(--text-on-brand);
  font-size: var(--text-md);
  font-weight: 540;
  cursor: pointer;
  transition: background var(--dur-fast), transform var(--dur-fast);
}
.submit:hover:not(:disabled) {
  background: var(--accent-hover);
}
.submit:active:not(:disabled) {
  transform: translateY(0.5px);
}
.submit:disabled {
  cursor: wait;
  opacity: 0.85;
}
.spinner {
  width: 17px;
  height: 17px;
  border: 2px solid color-mix(in srgb, var(--text-on-brand) 40%, transparent);
  border-top-color: var(--text-on-brand);
  border-radius: 50%;
  animation: spin 600ms linear infinite;
}
.form-foot {
  margin-top: var(--space-5);
  text-align: center;
}
.form-foot p {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-3);
}
.form-foot button {
  border: none;
  background: transparent;
  color: var(--accent-text);
  font: inherit;
  font-weight: 520;
  cursor: pointer;
  padding: 0;
}
.form-foot button:hover {
  text-decoration: underline;
}
.status-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 380px;
  font-size: var(--text-xs);
  color: var(--text-3);
}
.status-line span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--success);
}
.mono {
  font-family: var(--font-mono);
}

@media (max-width: 900px) {
  .auth {
    grid-template-columns: 1fr;
  }
  .brand-side {
    display: none;
  }
}
</style>
