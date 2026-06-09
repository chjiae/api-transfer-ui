<script setup lang="ts">
import { Construction } from 'lucide-vue-next'
import { useRoute } from 'vue-router'
const route = useRoute()
const titles: Record<string, string> = {
  models: '模型管理',
  routing: '路由策略',
  'load-balance': '负载均衡',
  cost: '成本分析',
  billing: '账单中心',
  audit: '审计日志',
}
const title = titles[String(route.name)] ?? '页面开发中'
</script>

<template>
  <div class="placeholder">
    <Construction :size="48" class="icon" />
    <h2>{{ title }}</h2>
    <p>此功能正在开发中，敬请期待。</p>
  </div>
</template>

<style scoped>
.placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 100px 24px; text-align: center; }
.icon { color: var(--muted); opacity: 0.4; }
h2 { margin: 0; font-size: 20px; font-weight: 650; color: var(--foreground); }
p { margin: 0; font-size: 14px; color: var(--muted); }
</style>
