<script setup lang="ts">
import { PhWrench as Wrench } from '@phosphor-icons/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import UiEmpty from '@/components/ui/UiEmpty.vue'

const route = useRoute()
const meta: Record<string, { title: string; desc: string }> = {
  routing: { title: '路由策略', desc: '基于模型、成本或延迟的智能路由规则即将上线，届时可在此编排请求分发。' },
  'load-balance': { title: '负载均衡', desc: '多通道间的权重与故障转移配置正在开发，敬请期待。' },
  billing: { title: '账单', desc: '用量账单与发票管理即将上线。当前可在「成本分析」查看消费明细。' },
}
const info = computed(() => meta[String(route.name)] ?? { title: '功能开发中', desc: '此模块正在建设中。' })
</script>

<template>
  <div class="page-wrap placeholder">
    <UiEmpty :title="info.title" :description="info.desc">
      <template #icon><Wrench :size="24" /></template>
    </UiEmpty>
  </div>
</template>

<style scoped>
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}
</style>
