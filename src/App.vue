<script setup lang="ts">
import UiToaster from '@/components/ui/UiToaster.vue'
import UiConfirmHost from '@/components/ui/UiConfirmHost.vue'
</script>

<template>
  <RouterView />
  <UiToaster />
  <UiConfirmHost />
</template>
