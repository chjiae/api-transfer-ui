<script setup lang="ts">
import { computed } from 'vue'
import MiniSparkline from './MiniSparkline.vue'

export interface StatsCardProps {
  label: string
  value: string
  change: number
  changeLabel: string
  sparkData?: number[]
  trend?: 'up' | 'down'
}

const props = withDefaults(defineProps<StatsCardProps>(), {
  trend: 'up',
  sparkData: () => Array.from({ length: 24 }, () => Math.random() * 40 + 40),
})

const isPositive = computed(() => props.change > 0)
</script>

<template>
  <div class="stat-card">
    <div class="stat-head">
      <span class="stat-label">{{ label }}</span>
      <MiniSparkline v-if="sparkData" :data="sparkData" :color="trend === 'up' ? '#38d99a' : '#e5484d'" />
    </div>
    <div class="stat-body">
      <span class="stat-value">{{ value }}</span>
      <span class="stat-change" :class="{ positive: isPositive, negative: !isPositive }">
        {{ change >= 0 ? '+' : '' }}{{ change }}%
      </span>
    </div>
    <div class="stat-foot">{{ changeLabel }}</div>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 22px;
  border-radius: 9px;
  border: 1px solid var(--line);
  background: var(--surface);
  transition: border-color 180ms;
}

.stat-card:hover { border-color: var(--line-strong); }

.stat-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.stat-label {
  font-size: 13px;
  color: var(--muted);
  font-weight: 500;
}

.stat-body {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: 720;
  color: var(--foreground);
  letter-spacing: -0.02em;
}

.stat-change {
  font-size: 13px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
}

.stat-change.positive { color: var(--green); background: rgba(56, 217, 154, 0.1); }
.stat-change.negative { color: #e5484d; background: rgba(229, 72, 77, 0.1); }

.stat-foot {
  font-size: 12px;
  color: var(--muted);
}
</style>
