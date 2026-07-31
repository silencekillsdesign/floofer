<script setup lang="ts">
/* Grid alternative to the one-card deck, for screens wide enough to hold it.
   The deck's forced sequence is the point on a phone — one dog, one decision —
   but on a desktop it wastes the space and hides how many dogs are waiting.
   The grid keeps the same ordering (at-risk first), so urgency still leads. */

import type { Dog } from "~/types";

defineProps<{ deck: Dog[]; passedCount?: number }>();
const emit = defineEmits<{ like: [dog: Dog]; pass: [dog: Dog]; undo: []; restore: [] }>();

const { matchPct } = useStore();
</script>

<template>
  <div>
    <!-- empty: same message as the deck, so the two views feel like one place -->
    <div v-if="!deck.length" class="rounded-3xl border-2 border-dashed border-line grid place-items-center bg-card/60 py-20">
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

    <TransitionGroup v-else name="gal" tag="div" class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <article
        v-for="dog in deck" :key="dog.id"
        class="group relative rounded-3xl overflow-hidden bg-card shadow-card hover:shadow-pop hover:-translate-y-0.5 transition-all"
      >
        <!-- photo links to the bio; the buttons below decide -->
        <NuxtLink :to="`/pet/${dog.id}`" class="block relative aspect-[4/5]" :aria-label="`View ${dog.name}'s full bio`">
          <DogPhoto :src="dog.photos[0]" :alt="`Photo of ${dog.name}`" />

          <span
            v-if="dog.risk === 'high'"
            class="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-risk text-white text-[10px] font-bold whitespace-nowrap shadow-card"
          >⚠ {{ dog.daysLeft != null ? `${dog.daysLeft} days` : "at risk" }}</span>

          <span class="absolute top-2 right-2 grid place-items-center rounded-full bg-black/35 backdrop-blur-sm p-0.5">
            <MatchRing :pct="matchPct(dog)" :size="36" />
          </span>

          <!-- bottom gradient + identity, mirroring the deck card -->
          <div class="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
          <div class="absolute inset-x-0 bottom-0 p-3 text-white">
            <h3 class="font-display font-semibold text-lg leading-tight drop-shadow truncate">{{ dog.name }}</h3>
            <p class="flex items-center gap-1 text-[11px] font-semibold mt-0.5">
              <span class="truncate">{{ dog.breed }}</span>
              <span class="text-white/50 shrink-0" aria-hidden="true">·</span>
              <span class="shrink-0">{{ dog.age }} yr</span>
              <span class="text-white/50 shrink-0" aria-hidden="true">·</span>
              <span class="shrink-0">{{ milesFrom(dog) }} mi</span>
            </p>
          </div>
        </NuxtLink>

        <!-- pass / like — the same two verbs as the deck, per card -->
        <div class="flex items-center justify-center gap-3 px-3 py-2.5">
          <button
            class="w-11 h-11 grid place-items-center rounded-full bg-paper text-navy border border-line hover:scale-110 hover:border-ink-faint transition-all"
            :aria-label="`Pass on ${dog.name}`"
            @click="emit('pass', dog)"
          >
            <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
          <button
            class="w-11 h-11 grid place-items-center rounded-full bg-paper text-pink border border-line hover:scale-110 hover:border-pink transition-all"
            :aria-label="`Like ${dog.name}`"
            @click="emit('like', dog)"
          >
            <svg viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor"><path d="M12 21s-7.5-4.9-10-9.5C.6 8 2.4 4.5 6 4.5c2.1 0 3.6 1.2 4.5 2.6.4.7 1.5.7 1.9 0 .9-1.4 2.4-2.6 4.5-2.6 3.6 0 5.4 3.5 4 7-2.5 4.6-9 9.5-9 9.5z"/></svg>
          </button>
        </div>
      </article>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* Decided cards shrink out and the grid closes ranks around them. */
.gal-move {
  transition: transform 0.35s ease;
}
.gal-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
  position: absolute;
}
.gal-leave-to {
  opacity: 0;
  transform: scale(0.88);
}
</style>
