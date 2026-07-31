<script setup lang="ts">
/* Pill toggle — the `chip()` class helper that was pasted into three files,
   as a component. Click handling falls through to the button. */

defineProps<{ active?: boolean }>();
</script>

<template>
  <button
    type="button"
    class="px-4 py-2 rounded-full text-sm font-semibold border transition-colors"
    :class="active ? 'bg-brand text-white border-brand' : 'bg-card border-line text-ink-soft hover:border-ink-faint'"
    :aria-pressed="active"
  >
    <slot />
  </button>
</template>
