<script setup lang="ts">
import type { Dog } from "~/types";
defineProps<{ dog: Dog; detailed?: boolean }>();
</script>

<template>
  <div v-if="dog.adopted" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-paper-warm text-ink-faint text-xs font-semibold">
    🎉 Adopted
  </div>
  <div v-else-if="dog.risk === 'high'" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-risk text-white text-xs font-semibold shadow-card">
    <span class="relative flex h-2 w-2">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
      <span class="relative inline-flex rounded-full h-2 w-2 bg-white" />
    </span>
    {{ detailed && dog.daysLeft != null ? `At risk — ${dog.daysLeft} days` : "At risk" }}
  </div>
  <div v-else class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-safe-soft text-safe text-xs font-semibold">
    ✓ Safe
  </div>
</template>
