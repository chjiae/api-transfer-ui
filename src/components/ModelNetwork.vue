<script setup lang="ts">
import { Box, Cpu, Globe2, Zap } from 'lucide-vue-next'
</script>

<template>
  <div class="network-visual" aria-label="多模型智能路由示意图">
    <div class="network-grid"></div>
    <svg class="route-map" viewBox="0 0 700 500" aria-hidden="true">
      <defs>
        <linearGradient id="routeGlow" x1="0" x2="1">
          <stop offset="0" stop-color="#156cff" stop-opacity=".35" />
          <stop offset=".55" stop-color="#2a8cff" />
          <stop offset="1" stop-color="#7cd0ff" />
        </linearGradient>
        <filter id="blueGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g class="route-traces" filter="url(#blueGlow)">
        <path d="M350 250 L350 195 L286 125 L268 125" />
        <path d="M350 250 L350 195 L414 125 L432 125" />
        <path d="M350 250 L350 305 L286 375 L268 375" />
        <path d="M350 250 L350 305 L414 375 L432 375" />
      </g>
      <g class="route-points">
        <circle cx="350" cy="250" r="7" />
        <circle cx="268" cy="125" r="4" />
        <circle cx="432" cy="125" r="4" />
        <circle cx="268" cy="375" r="4" />
        <circle cx="432" cy="375" r="4" />
      </g>
    </svg>

    <div class="signal-core" aria-hidden="true">
      <div class="signal-ring ring-one"><i></i><i></i></div>
      <div class="signal-ring ring-two"><i></i><i></i><i></i></div>
      <div class="signal-ring ring-three"><i></i></div>
      <div class="digital-globe">
        <Globe2 class="globe-symbol" :size="78" :stroke-width="1.15" />
      </div>
      <div class="core-pulse"></div>
    </div>

    <div class="model-chip chip-gpt">
      <span class="model-icon"><Cpu :size="16" /></span>
      <span><b>ChatGPT</b><small>通用对话与推理</small></span>
      <i></i>
    </div>
    <div class="model-chip chip-claude">
      <span class="model-icon"><Box :size="16" /></span>
      <span><b>Opus</b><small>复杂任务与长文本</small></span>
      <i></i>
    </div>
    <div class="model-chip chip-llama">
      <span class="model-icon"><Zap :size="16" /></span>
      <span><b>DeepSeek</b><small>深度推理与代码</small></span>
      <i></i>
    </div>
    <div class="model-chip chip-more">
      <span class="model-icon"><Globe2 :size="16" /></span>
      <span><b>Gemini</b><small>多模态理解与生成</small></span>
      <i></i>
    </div>
  </div>
</template>
