<script setup lang="ts">
/* One filter-bar facet: a labeled trigger with an optional count badge, and
   a Reka popover for whatever rows the caller slots in. Five of these were
   pasted side by side in the bar before this. An active facet tints its
   trigger — a hidden filter reads as "no dogs", not "filtered". */

defineProps<{
  label: string;
  /** Selected-count badge; hidden at 0. */
  count?: number;
  /** Non-default value → brand tint. Multi facets can just pass count > 0. */
  active?: boolean;
}>();

const open = ref(false);
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger
      class="flex items-center gap-1 rounded-xl border px-2.5 py-2 text-sm font-semibold whitespace-nowrap transition-colors"
      :class="
        active
          ? 'border-brand/60 bg-brand/10 text-brand'
          : open
            ? 'border-ink-faint bg-paper text-ink'
            : 'border-line bg-paper text-ink-soft hover:border-ink-faint'
      "
    >
      {{ label }}
      <span v-if="count" class="min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-brand text-white text-[10px] font-bold">{{ count }}</span>
      <AppIcon name="chevron-down" class="w-3.5 h-3.5 transition-transform" :class="open && 'rotate-180'" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        align="start"
        :side-offset="8"
        class="z-50 min-w-[210px] rounded-2xl bg-card border border-line shadow-pop p-1.5 outline-none"
        :aria-label="label"
      >
        <slot :close="() => (open = false)" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
