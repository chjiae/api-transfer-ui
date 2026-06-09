<script setup lang="ts">
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  LockKeyhole,
  Building2,
  BadgeCheck,
  TicketCheck,
  UserRound,
  ShieldCheck,
  Zap,
} from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ModelNetwork from '@/components/ModelNetwork.vue'
import { AuthError, login, register, storeToken } from '@/lib/auth'

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
  if (isRegister.value && (username.value.trim().length < 3 || username.value.trim().length > 64)) {
    return '用户名需为 3–64 个字符'
  }
  return ''
})

const passwordError = computed(() => {
  if (!submitted.value) return ''
  if (!password.value) return '请输入密码'
  if (isRegister.value && (password.value.length < 6 || password.value.length > 72)) {
    return '密码需为 6–72 个字符'
  }
  return ''
})

const confirmPasswordError = computed(() => {
  if (!submitted.value || !isRegister.value) return ''
  if (!confirmPassword.value) return '请再次输入密码'
  if (confirmPassword.value !== password.value) return '两次输入的密码不一致'
  return ''
})

const switchMode = (nextMode: 'login' | 'register') => {
  mode.value = nextMode
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
        signupKey: needsCredential.value && credentialType.value === 'signupKey'
          ? registrationCredential.value
          : undefined,
        inviteCode: needsCredential.value && credentialType.value === 'inviteCode'
          ? registrationCredential.value
          : undefined,
      })
      const registeredUsername = username.value
      switchMode('login')
      username.value = registeredUsername
      submitSuccess.value = '注册成功，请使用新账号登录'
    } else {
      const result = await login({
        tenantCode: tenantCode.value,
        username: username.value,
        password: password.value,
      })
      storeToken(result.token, remember.value)
      const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
        ? route.query.redirect
        : '/dashboard'
      await router.replace(redirect)
    }
  } catch (error) {
    submitError.value = authErrorMessage(error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="login-page" :class="{ 'register-mode': isRegister }">
    <div class="login-grid"></div>
    <RouterLink class="login-brand" to="/" aria-label="返回首页">
      <span class="brand-mark"><span>S</span></span>
      <span>SeaSovereign <b>API</b></span>
    </RouterLink>

    <RouterLink class="back-home" to="/">
      <ArrowLeft :size="15" />
      返回首页
    </RouterLink>

    <section class="login-showcase">
      <div class="showcase-copy">
        <span class="login-kicker"><span></span> AI Gateway Control Plane</span>
        <h1>一个入口，<br />连接你的全部模型。</h1>
        <p>统一管理模型接入、智能路由和调用观测，让团队专注于构建产品。</p>
      </div>

      <ModelNetwork class="login-network" />

      <div class="trust-points">
        <div><ShieldCheck :size="18" /><span><b>企业级安全</b><small>密钥加密与权限隔离</small></span></div>
        <div><Zap :size="18" /><span><b>智能路由</b><small>自动选择最优模型通道</small></span></div>
        <div><Globe2 :size="18" /><span><b>统一接入</b><small>兼容主流 API 协议</small></span></div>
      </div>
    </section>

    <section class="login-panel">
      <div class="login-card">
        <header>
          <div class="card-icon">
            <BadgeCheck v-if="isRegister" :size="20" />
            <KeyRound v-else :size="20" />
          </div>
          <h2>{{ isRegister ? '创建账号' : '登录控制台' }}</h2>
          <p>{{ isRegister ? '注册后即可使用统一模型网关' : '使用租户账号进入管理控制台' }}</p>
        </header>

        <div class="auth-tabs" role="tablist" aria-label="认证方式">
          <button type="button" :class="{ active: !isRegister }" @click="switchMode('login')">登录</button>
          <button type="button" :class="{ active: isRegister }" @click="switchMode('register')">注册</button>
        </div>

        <form novalidate @submit.prevent="submitAuth">
          <div class="form-field">
            <label for="tenantCode">租户编码 <span class="optional-label">可选</span></label>
            <div class="input-shell">
              <Building2 :size="17" />
              <input
                id="tenantCode"
                v-model="tenantCode"
                type="text"
                autocomplete="organization"
                placeholder="留空使用默认租户"
                @input="submitted = false; submitError = ''; registrationCredential = ''"
              />
            </div>
          </div>

          <div v-if="isRegister" class="form-field">
            <label for="displayName">显示名称 <span class="optional-label">可选</span></label>
            <div class="input-shell">
              <BadgeCheck :size="17" />
              <input
                id="displayName"
                v-model="displayName"
                type="text"
                autocomplete="name"
                placeholder="用于控制台展示"
              />
            </div>
          </div>

          <div class="form-field">
            <label for="username">用户名</label>
            <div class="input-shell" :class="{ invalid: usernameError }">
              <UserRound :size="17" />
              <input
                id="username"
                v-model="username"
                type="text"
                autocomplete="username"
                placeholder="请输入用户名"
                @input="submitted = false; submitError = ''"
              />
            </div>
            <span v-if="usernameError" class="field-error">{{ usernameError }}</span>
          </div>

          <div class="form-field">
            <div class="field-heading">
              <label for="password">密码</label>
            </div>
            <div class="input-shell" :class="{ invalid: passwordError }">
              <LockKeyhole :size="17" />
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="请输入密码"
                @input="submitted = false; submitError = ''"
              />
              <button type="button" class="password-toggle" :aria-label="showPassword ? '隐藏密码' : '显示密码'" @click="showPassword = !showPassword">
                <EyeOff v-if="showPassword" :size="17" />
                <Eye v-else :size="17" />
              </button>
            </div>
            <span v-if="passwordError" class="field-error">{{ passwordError }}</span>
          </div>

          <div v-if="isRegister" class="form-field">
            <label for="confirmPassword">确认密码</label>
            <div class="input-shell" :class="{ invalid: confirmPasswordError }">
              <LockKeyhole :size="17" />
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="再次输入密码"
                @input="submitted = false; submitError = ''"
              />
            </div>
            <span v-if="confirmPasswordError" class="field-error">{{ confirmPasswordError }}</span>
          </div>

          <div v-if="needsCredential" class="credential-field">
            <div class="credential-tabs">
              <button type="button" :class="{ active: credentialType === 'signupKey' }" @click="credentialType = 'signupKey'; registrationCredential = ''">注册密钥</button>
              <button type="button" :class="{ active: credentialType === 'inviteCode' }" @click="credentialType = 'inviteCode'; registrationCredential = ''">邀请码</button>
            </div>
            <div class="input-shell">
              <TicketCheck :size="17" />
              <input
                v-model="registrationCredential"
                type="text"
                :placeholder="credentialType === 'signupKey' ? '请输入租户注册密钥' : '请输入租户邀请码'"
              />
            </div>
          </div>

          <label v-if="!isRegister" class="remember-option">
            <input v-model="remember" type="checkbox" />
            <span class="custom-check"><Check :size="12" /></span>
            保持登录状态
          </label>

          <div v-if="submitSuccess" class="login-success" role="status">{{ submitSuccess }}</div>
          <div v-if="submitError" class="login-error" role="alert">{{ submitError }}</div>

          <button class="login-submit" type="submit" :disabled="submitting">
            <span>{{ submitting ? (isRegister ? '正在注册...' : '正在登录...') : (isRegister ? '创建账号' : '登录') }}</span>
            <ArrowRight v-if="!submitting" :size="17" />
            <i v-else></i>
          </button>
        </form>

        <footer>
          <p v-if="isRegister">已有账号？ <button type="button" @click="switchMode('login')">返回登录</button></p>
          <p v-else>还没有账号？ <button type="button" @click="switchMode('register')">创建账号</button></p>
          <span>{{ isRegister ? '注册即表示你同意服务条款与隐私政策' : '登录即表示你同意服务条款与隐私政策' }}</span>
        </footer>
      </div>

      <div class="login-status">
        <span><i></i> 所有系统运行正常</span>
        <span>安全连接 · TLS 1.3</span>
      </div>
    </section>
  </main>
</template>
