<script setup lang="ts">
import {
  Activity,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Code2,
  Copy,
  LockKeyhole,
  Menu,
  Network,
  Route,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-vue-next'
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import ModelNetwork from '@/components/ModelNetwork.vue'

const mobileMenuOpen = ref(false)
const copied = ref(false)

const endpoint = 'https://api.seasovereign.com/v1/chat/completions'

const copyEndpoint = async () => {
  await navigator.clipboard.writeText(endpoint)
  copied.value = true
  window.setTimeout(() => (copied.value = false), 1600)
}

const features = [
  { title: '统一 API 接口与协议', icon: Code2 },
  { title: '基于策略的智能路由', icon: Route },
  { title: '实时监控与可观测性', icon: Activity },
  { title: '企业级安全与合规', icon: LockKeyhole },
]

const models = [
  { name: 'Claude 3.5 Sonnet', detail: '延迟 612ms  |  $0.0021', color: '#f5a94e', active: true },
  { name: 'GPT-4o mini', detail: '延迟 635ms  |  $0.0016', color: '#42a5ff' },
  { name: 'Gemini 1.5 Flash', detail: '延迟 706ms  |  $0.0012', color: '#70d6ff' },
]

</script>

<template>
  <main class="site-shell">
    <div class="ambient ambient-one"></div>
    <div class="ambient ambient-two"></div>

    <header class="topbar">
      <a class="brand" href="#" aria-label="SeaSovereign API 首页">
        <span class="brand-mark"><span>S</span></span>
        <span>SeaSovereign <b>API</b></span>
      </a>

      <nav class="desktop-nav" aria-label="主导航">
        <a href="#product">产品 <ChevronDown :size="13" /></a>
        <a href="#solutions">解决方案 <ChevronDown :size="13" /></a>
        <a href="#docs">文档</a>
        <a href="#pricing">定价</a>
        <a href="#about">关于我们</a>
        <a href="#console">控制台</a>
      </nav>

      <div class="nav-actions">
        <RouterLink class="button button-ghost nav-link-button" to="/login">登录</RouterLink>
        <button class="button button-primary">开始使用</button>
      </div>

      <button class="menu-button" aria-label="打开菜单" @click="mobileMenuOpen = !mobileMenuOpen">
        <X v-if="mobileMenuOpen" :size="22" />
        <Menu v-else :size="22" />
      </button>

      <div v-if="mobileMenuOpen" class="mobile-menu">
        <a href="#product" @click="mobileMenuOpen = false">产品</a>
        <a href="#solutions" @click="mobileMenuOpen = false">解决方案</a>
        <a href="#docs" @click="mobileMenuOpen = false">文档</a>
        <a href="#pricing" @click="mobileMenuOpen = false">定价</a>
        <RouterLink to="/login">登录</RouterLink>
        <button class="button button-primary">开始使用</button>
      </div>
    </header>

    <section class="hero">
      <div class="hero-copy">
        <div class="eyebrow"><Sparkles :size="13" /> 新一代 AI 基础设施</div>
        <h1>统一 AI API 网关</h1>
        <p class="hero-subtitle">用一个接口连接主流模型，在性能、稳定性与成本之间自动选择最优路径。</p>

        <div class="hero-actions">
          <button class="button button-primary button-large">立即开始</button>
          <button class="button button-outline button-large">查看定价</button>
        </div>

        <div class="endpoint-wrap">
          <label><span class="endpoint-status"></span> OpenAI 协议兼容</label>
          <button class="endpoint" @click="copyEndpoint">
            <code>{{ endpoint }}</code>
            <span><Check v-if="copied" :size="16" /><Copy v-else :size="16" /></span>
          </button>
        </div>
      </div>

      <ModelNetwork />
    </section>

    <section id="product" class="product-panel">
      <div class="product-copy">
        <span class="section-kicker">产品概览</span>
        <h2>统一接入，智能路由</h2>
        <p>通过统一 API 接口访问多个顶级模型，根据策略、成本与性能自动选择最优通道。</p>

        <ul class="feature-list">
          <li v-for="feature in features" :key="feature.title">
            <component :is="feature.icon" :size="17" />
            {{ feature.title }}
          </li>
        </ul>

        <a class="text-link" href="#docs">了解更多产品能力 <ArrowRight :size="15" /></a>
      </div>

      <div class="code-window">
        <div class="window-tabs">
          <span class="active">cURL 示例</span>
          <span>OpenAI 兼容</span>
          <span>Python SDK</span>
        </div>
        <pre><code><span class="code-blue">curl</span> https://api.seasovereign.com/v1/chat/completions \
  -H <span class="code-green">"Authorization: Bearer sk-****"</span> \
  -H <span class="code-green">"Content-Type: application/json"</span> \
  -d <span class="code-green">'{</span>
    <span class="code-red">"model"</span>: <span class="code-green">"auto"</span>,
    <span class="code-red">"messages"</span>: [
      { <span class="code-red">"role"</span>: <span class="code-green">"user"</span>, <span class="code-red">"content"</span>: <span class="code-green">"你好"</span> }
    ],
    <span class="code-red">"stream"</span>: false
  <span class="code-green">}'</span></code></pre>
        <div class="response-strip">
          <span><small>状态</small><b>200 OK</b></span>
          <span><small>延迟</small><b>512ms</b></span>
          <span><small>模型</small><b>Claude 3.5 Sonnet</b></span>
          <span><small>路由</small><b>优先成本</b></span>
        </div>
      </div>

      <div class="routing-panel">
        <h3>智能路由</h3>
        <div class="route-rules">
          <span><Zap :size="14" /> 自动选择 <small>最优模型</small></span>
          <span><Clock3 :size="14" /> 延迟优先 <small>更快响应</small></span>
          <span><ShieldCheck :size="14" /> 健康优先 <small>更高成功率</small></span>
        </div>
        <div class="model-stack">
          <div v-for="model in models" :key="model.name" class="model-row" :class="{ active: model.active }">
            <i :style="{ background: model.color }"></i>
            <span><b>{{ model.name }}</b><small>{{ model.detail }}</small></span>
          </div>
        </div>
        <div class="route-log"><Network :size="14" /> 路由日志</div>
      </div>
    </section>

  </main>
</template>
