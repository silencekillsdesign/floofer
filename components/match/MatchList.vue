<script setup lang="ts">
/* Row alternative to the grid — same deck, same ordering, more facts per dog.
   The grid sells the face; the list carries the details that decide a visit:
   who listed them, the tagline, the countdown. Scanning ten dogs by their
   circumstances is a different job than falling for one photo. */

import type { Dog } from "~/types";

defineProps<{ deck: Dog[]; passedCount?: number }>();
const emit = defineEmits<{ like: [dog: Dog]; pass: [dog: Dog]; undo: []; restore: [] }>();

const { matchPct } = useStore();
</script>

<template>
  <div>
    <!-- empty: same message as the other views, so this still feels like one place -->
    <MatchEmptyState v-if="!deck.length" :passed-count="passedCount" @undo="emit('undo')" @restore="emit('restore')" />

    <TransitionGroup v-else name="mlist" tag="div" class="relative space-y-3">
      <article
        v-for="dog in deck" :key="dog.id"
        class="group flex w-full bg-card rounded-2xl shadow-card overflow-hidden hover:shadow-pop hover:-translate-y-0.5 transition-all"
      >
        <!-- photo links to the bio -->
        <NuxtLink :to="`/pet/${dog.id}`" class="relative w-32 sm:w-36 shrink-0 self-stretch min-h-[7.5rem]" :aria-label="`View ${dog.name}'s full bio`">
          <DogPhoto :src="dog.photos[0]" :alt="`Photo of ${dog.name}`" />
          <span
            v-if="dog.risk === 'high'"
            class="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-risk text-white text-[10px] font-bold whitespace-nowrap shadow-card"
          >⚠ {{ dog.daysLeft != null ? `${dog.daysLeft} days` : "at risk" }}</span>
        </NuxtLink>

        <!-- info -->
        <NuxtLink :to="`/pet/${dog.id}`" class="flex-1 min-w-0 px-4 py-3.5 flex flex-col justify-center gap-0.5">
          <div class="flex items-center gap-2.5">
            <h3 class="font-display font-semibold text-lg leading-tight truncate">{{ dog.name }}</h3>
            <span class="text-xs font-semibold text-ink-faint shrink-0">{{ dog.sex === "F" ? "♀" : "♂" }}</span>
          </div>
          <p class="text-[13px] text-ink-soft truncate">
            {{ dog.breed }} · {{ dog.age }} yr · {{ dog.size }} · {{ milesFrom(dog) }} mi
          </p>
          <p class="text-xs text-ink-faint truncate">{{ dog.source.name }}</p>
          <!-- a ride is the smallest yes on this page — say so where scanners scan -->
          <p v-if="dog.transport" class="text-xs font-semibold text-brand truncate mt-0.5">🚐 Needs a ride → {{ dog.transport.to }}</p>
          <p v-if="dog.tagline" class="text-[13px] font-medium text-ink truncate mt-1">“{{ dog.tagline }}”</p>
        </NuxtLink>

        <!-- match % + decide -->
        <div class="flex items-center gap-3 pl-2 pr-4 shrink-0">
          <MatchRing :pct="matchPct(dog)" :size="44" />
          <div class="flex flex-col sm:flex-row items-center gap-2">
            <DecideButtons :dog="dog" @pass="emit('pass', dog)" @like="emit('like', dog)" />
          </div>
        </div>
      </article>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* Decided rows slide out; the list closes ranks. */
.mlist-move {
  transition: transform 0.35s ease;
}
.mlist-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
  position: absolute;
  left: 0;
  right: 0;
}
.mlist-leave-to {
  opacity: 0;
  transform: translateX(32px);
}
</style>
