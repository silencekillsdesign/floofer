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
    <MatchEmptyState v-if="!deck.length" :passed-count="passedCount" @undo="emit('undo')" @restore="emit('restore')" />

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
          <DecideButtons :dog="dog" @pass="emit('pass', dog)" @like="emit('like', dog)" />
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
