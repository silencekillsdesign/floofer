<script setup lang="ts">
/* One row of a multi-select menu: label left, check square right. Click
   falls through to the button; the caller owns the state. */

defineProps<{ checked: boolean }>();
</script>

<template>
  <button
    type="button"
    class="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-colors hover:bg-paper-warm"
    :class="checked ? 'text-brand' : 'text-ink'"
    :aria-pressed="checked"
  >
    <slot />
    <span
      class="w-[18px] h-[18px] grid place-items-center rounded-md border-2 transition-colors shrink-0"
      :class="checked ? 'bg-brand border-brand text-white' : 'border-line'"
    >
      <AppIcon v-if="checked" name="check" class="w-3 h-3" :stroke-width="3.5" />
    </span>
  </button>
</template>
