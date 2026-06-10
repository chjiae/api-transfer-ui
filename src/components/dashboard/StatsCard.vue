<script setup lang="ts">
import { computed } from 'vue'
import { PhTrendUp as TrendUp, PhTrendDown as TrendDown } from '@phosphor-icons/vue'
import MiniSparkline from './MiniSparkline.vue'

export interface StatsCardProps {
  label: string
  value: string
  hint?: string
  sparkData?: number[]
  tone?: 'neutral' | 'success' | 'warning' | 'danger'
  /** 环比百分比；null/undefined 不显示。 */
  changePct?: number | null
  /** 环比是「越大越好」还是「越小越好」（影响升降的着色）。 */
  changeGood?: 'up' | 'down'
  /** 环比单位后缀（如百分点用 'pp'，默认 '%'）。 */
  changeUnit?: string
}

const props = withDefaults(defineProps<StatsCardProps>(), { tone: 'neutral', changeGood: 'up', changeUnit: '%' })

const sparkColor: Record<string, string> = {
  neutral: 'var(--accent)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
}

const hasChange = computed(() => props.changePct != null && Number.isFinite(props.changePct))
const isUp = computed(() => (props.changePct ?? 0) >= 0)
// 升降是否「正面」：changeGood=up 时升为好；changeGood=down 时降为好
const isPositive = computed(() => (props.changeGood === 'up' ? isUp.value : !isUp.value))
</script>

<template>
  <div class="stat-card">
    <span class="stat-label">{{ label }}</span>
    <div class="stat-row">
      <span class="stat-value tnum">{{ value }}</span>
      <MiniSparkline
        v-if="sparkData && sparkData.length > 1"
        :data="sparkData"
        :color="sparkColor[tone]"
      />
    </div>
    <div class="stat-foot">
      <span v-if="hasChange" class="stat-change" :class="isPositive ? 'good' : 'bad'">
        <TrendUp v-if="isUp" :size="13" weight="bold" />
        <TrendDown v-else :size="13" weight="bold" />
        {{ Math.abs(changePct as number).toFixed(1) }}{{ changeUnit }}
      </span>
      <span v-if="hint" class="stat-hint">{{ hint }}</span>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--line);
  background: var(--surface);
  transition: border-color var(--dur) var(--ease);
}
.stat-card:hover {
  border-color: var(--line-2);
}
.stat-label {
  font-size: var(--text-sm);
  color: var(--text-3);
  font-weight: 480;
}
.stat-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
}
.stat-value {
  font-size: 28px;
  font-weight: 560;
  color: var(--text);
  letter-spacing: -0.02em;
  line-height: 1.1;
}
.stat-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.stat-change {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: var(--text-xs);
  font-weight: 540;
  font-variant-numeric: tabular-nums;
}
.stat-change.good {
  color: var(--success);
}
.stat-change.bad {
  color: var(--danger);
}
.stat-hint {
  font-size: var(--text-xs);
  color: var(--text-3);
}
</style>

