<script setup lang="ts">
import type { Dog } from "~/types";

const { dogs, liked, applied, matchPct } = useStore();
const filters = useFilters();
const showFilters = ref(false);

type SortKey = "match" | "risk" | "age" | "distance";
const sortBy = ref<SortKey>("risk");

const matches = computed<Dog[]>(() => {
  const list = dogs.value.filter((d) => liked.value.includes(d.id));
  const filtered = applyFilters(list, filters.value, matchPct);
  return [...filtered].sort((a, b) => {
    if (sortBy.value === "match") return matchPct(b) - matchPct(a);
    if (sortBy.value === "age") return a.age - b.age;
    if (sortBy.value === "distance") return milesFrom(a) - milesFrom(b);
    // risk: at-risk first, adopted last
    const rank = (d: Dog) => (d.adopted ? 2 : d.risk === "high" ? 0 : 1);
    return rank(a) - rank(b) || (a.daysLeft ?? 99) - (b.daysLeft ?? 99);
  });
});

const atRisk = computed(() => matches.value.filter((d) => !d.adopted && d.risk === "high").length);

const sorts: { v: SortKey; label: string }[] = [
  { v: "risk", label: "Urgency" },
  { v: "match", label: "Match %" },
  { v: "age", label: "Age" },
  { v: "distance", label: "Distance" },
];
</script>

<template>
  <ClientOnly>
  <div class="w-full max-w-2xl mx-auto px-4 pt-4 pb-24 sm:pt-5 sm:pb-10">
    <div class="flex flex-wrap items-end justify-between gap-3 mb-1">
      <div>
        <h1 class="font-display text-2xl font-semibold">Your matches</h1>
        <p class="text-sm text-ink-soft">
          {{ matches.length }} dog{{ matches.length === 1 ? "" : "s" }} you've liked
          <span v-if="atRisk" class="text-risk font-semibold"> · {{ atRisk }} still at risk</span>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold uppercase tracking-wide text-ink-soft">Sort</span>
        <AppSelect
          v-model="sortBy"
          :options="sorts.map((s) => ({ value: s.v, label: s.label }))"
          aria-label="Sort matches"
          class="w-32"
        />
        <button
          class="px-3.5 py-2 rounded-xl border border-line bg-card text-sm font-semibold text-ink-soft hover:border-ink-faint"
          :aria-expanded="showFilters"
          @click="showFilters = !showFilters"
        >Filters</button>
      </div>
    </div>

    <FilterPanel :open="showFilters" @close="showFilters = false" />

    <!-- empty -->
    <div v-if="!matches.length" class="mt-16 text-center">
      <p class="text-5xl mb-3">💔</p>
      <h2 class="font-display text-xl font-semibold mb-1">No matches yet</h2>
      <p class="text-sm text-ink-soft mb-5">Head to the swipe deck — someone's waiting to meet you.</p>
      <NuxtLink to="/" class="px-6 py-3 rounded-full bg-brand text-white font-semibold shadow-card hover:bg-brand-deep">Start swiping</NuxtLink>
    </div>

    <!-- full-width list cards -->
    <div class="space-y-3 mt-5">
      <NuxtLink
        v-for="dog in matches" :key="dog.id"
        :to="`/pet/${dog.id}`"
        class="flex w-full bg-card rounded-2xl shadow-card overflow-hidden transition-all"
        :class="dog.adopted ? 'opacity-55 saturate-0 pointer-events-none' : 'hover:shadow-pop hover:-translate-y-0.5'"
        :tabindex="dog.adopted ? -1 : 0"
      >
        <!-- photo -->
        <div class="relative w-28 sm:w-32 shrink-0 self-stretch">
          <DogPhoto :src="dog.photos[0]" :alt="`Photo of ${dog.name}`" />
          <span
            v-if="dog.risk === 'high' && !dog.adopted && dog.daysLeft != null"
            class="absolute top-2 left-2 min-w-[28px] h-7 px-2 grid place-items-center rounded-full bg-risk text-white text-sm font-bold shadow-card"
            :aria-label="`${dog.daysLeft} days to placement deadline`"
            :title="`${dog.daysLeft} days to placement deadline`"
          >{{ dog.daysLeft }}</span>
          <span
            v-if="dog.adopted"
            class="absolute inset-x-0 bottom-0 py-1 bg-black/60 text-white text-[11px] font-bold text-center"
          >Adopted 🎉</span>
        </div>

        <!-- info -->
        <div class="flex-1 min-w-0 px-4 py-3.5 flex flex-col justify-center gap-0.5">
          <div class="flex items-center justify-between gap-3">
            <h3 class="font-display font-semibold text-lg leading-tight truncate">{{ dog.name }}</h3>
            <MatchRing :pct="matchPct(dog)" :size="40" />
          </div>
          <p class="text-[13px] text-ink-soft truncate">
            {{ dog.breed }} · {{ dog.age }} yr · {{ milesFrom(dog) }} mi
          </p>
          <p class="text-xs text-ink-faint truncate">{{ dog.source.name }}</p>
          <p v-if="dog.risk === 'high' && !dog.adopted" class="text-xs font-semibold text-risk mt-1 truncate">
            ⏳ {{ dog.daysLeft != null ? `${dog.daysLeft} days to deadline` : "At risk" }}
          </p>
          <p v-else-if="applied.includes(dog.id) && !dog.adopted" class="text-xs font-semibold text-safe mt-1">
            ✓ Application filed
          </p>
        </div>
      </NuxtLink>
    </div>

    <p v-if="matches.some((d) => d.adopted)" class="text-xs text-ink-faint mt-5 text-center">
      Grayed-out cards were adopted by another family — that's a win too. 🎉
    </p>
    <p v-if="matches.length" class="text-xs text-ink-faint mt-2 text-center">
      Changed your mind about someone? Open their profile and tap ✕.
    </p>
  </div>
  </ClientOnly>
</template>
