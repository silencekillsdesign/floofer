<script setup lang="ts">
const props = withDefaults(defineProps<{ pct: number; size?: number }>(), { size: 52 });
const r = computed(() => (props.size - 8) / 2);
const circ = computed(() => 2 * Math.PI * r.value);
const color = computed(() =>
  props.pct >= 80 ? "rgb(var(--c-safe))" : props.pct >= 60 ? "rgb(var(--c-brand))" : "rgb(var(--c-ink-faint))",
);
</script>

<template>
  <div class="relative grid place-items-center" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" class="-rotate-90">
      <circle :cx="size / 2" :cy="size / 2" :r="r" class="fill-card stroke-line" stroke-width="5" />
      <circle
        :cx="size / 2" :cy="size / 2" :r="r" fill="none"
        :style="{ stroke: color }" stroke-width="5" stroke-linecap="round"
        :stroke-dasharray="circ" :stroke-dashoffset="circ * (1 - pct / 100)"
      />
    </svg>
    <span class="absolute font-extrabold" :style="{ fontSize: size * 0.26 + 'px', color }">{{ pct }}%</span>
  </div>
</template>
