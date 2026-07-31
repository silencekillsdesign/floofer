<script setup lang="ts">
/* End of the deck, shared by every view so they feel like one place. Offers
   the two honest outs: rewind the last decision, or bring back the passed. */

defineProps<{ passedCount?: number }>();
const emit = defineEmits<{ undo: []; restore: [] }>();
</script>

<template>
  <div class="rounded-3xl border-2 border-dashed border-line grid place-items-center bg-card/60 py-20">
    <div class="text-center px-8">
      <p class="text-5xl mb-3">🐾</p>
      <h3 class="font-display text-xl font-semibold mb-1">That's everyone nearby</h3>
      <p class="text-sm text-ink-soft mb-4">Widen your filters, or revisit the ones you passed on — hearts change.</p>
      <div class="flex flex-col items-center gap-2">
        <button class="px-5 py-2.5 rounded-full bg-brand text-white text-sm font-bold shadow-glow hover:bg-brand-deep" @click="emit('undo')">Rewind last card</button>
        <button
          v-if="passedCount"
          class="px-5 py-2.5 rounded-full border border-line bg-card text-sm font-semibold text-ink-soft hover:border-ink-faint"
          @click="emit('restore')"
        >↺ Restore {{ passedCount }} skipped {{ passedCount === 1 ? "dog" : "dogs" }}</button>
      </div>
    </div>
  </div>
</template>
