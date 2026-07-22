<script setup lang="ts">
import type { SourceType } from "~/types";
import { DOG_BREEDS } from "~/data/dogs";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const { dogs, matchPct } = useStore();
const filters = useFilters();

/* Canonical breeds + whatever's actually in the current dataset. */
const breedOptions = computed(() => {
  const set = new Set([...DOG_BREEDS, ...dogs.value.map((d) => d.breed)]);
  return [
    { value: "all", label: "All breeds" },
    ...[...set].sort().map((b) => ({ value: b, label: b })),
  ];
});

/* Live preview: how many available dogs match right now. */
const resultCount = computed(
  () => applyFilters(dogs.value.filter((d) => !d.adopted), filters.value, matchPct).length,
);

const isDefault = computed(() => {
  const d = defaultFilters();
  const f = filters.value;
  const sameSet = (a: string[], b: string[]) =>
    a.length === b.length && [...a].sort().join() === [...b].sort().join();
  return (
    f.breed === d.breed && f.size === d.size && f.sex === d.sex &&
    f.maxAge === d.maxAge && f.maxMiles === d.maxMiles && f.minMatch === d.minMatch &&
    f.urgency === d.urgency && f.houseTrained === d.houseTrained &&
    f.fixed === d.fixed && f.vaccinated === d.vaccinated &&
    sameSet(f.goodWith, d.goodWith) && sameSet(f.sources, d.sources)
  );
});
function reset() {
  filters.value = defaultFilters();
}

const sizes = [
  { v: "all", label: "Any" }, { v: "small", label: "Small" },
  { v: "medium", label: "Medium" }, { v: "large", label: "Large" },
] as const;
const sexes = [
  { v: "all", label: "Any" }, { v: "M", label: "♂ Male" }, { v: "F", label: "♀ Female" },
] as const;
const goodWithOpts = [
  { v: "kids", label: "🧒 Kids" }, { v: "dogs", label: "🐶 Dogs" }, { v: "cats", label: "🐱 Cats" },
] as const;
const healthOpts = [
  { key: "houseTrained", label: "🏠 House trained" },
  { key: "fixed", label: "✓ Spayed / neutered" },
  { key: "vaccinated", label: "💉 Vaccinated" },
] as const;
const sourceOpts: { v: SourceType; label: string }[] = [
  { v: "shelter", label: "🏥 Shelter" }, { v: "foster", label: "🛋️ Foster" },
  { v: "individual", label: "👤 Rehoming" }, { v: "retirement", label: "🌅 Retirement" },
];

function toggleGoodWith(v: "dogs" | "cats" | "kids") {
  filters.value.goodWith = filters.value.goodWith.includes(v)
    ? filters.value.goodWith.filter((x) => x !== v)
    : [...filters.value.goodWith, v];
}
function toggleSource(v: SourceType) {
  filters.value.sources = filters.value.sources.includes(v)
    ? filters.value.sources.filter((x) => x !== v)
    : [...filters.value.sources, v];
}

const chip = (active: boolean) =>
  `px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
    active ? "bg-brand text-white border-brand" : "bg-card border-line text-ink-soft hover:border-ink-faint"
  }`;
const seg = (active: boolean) =>
  `flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
    active ? "bg-brand text-white border-brand" : "bg-card border-line text-ink-soft hover:border-ink-faint"
  }`;
const labelCls = "block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2";

watch(
  () => props.open,
  (o) => {
    if (import.meta.client) document.body.style.overflow = o ? "hidden" : "";
  },
);
onUnmounted(() => {
  if (import.meta.client) document.body.style.overflow = "";
});
</script>

<template>
  <div class="hidden">
    <Teleport to="body">
      <div v-if="open" class="fixed inset-0 z-[70] bg-paper flex flex-col picker-in" role="dialog" aria-modal="true" aria-label="Filters" @keydown.esc="emit('close')">
      <!-- header -->
      <header class="shrink-0 flex items-center justify-between gap-3 px-5 h-14 border-b border-line/60">
        <h2 class="font-display font-semibold text-lg">Filters</h2>
        <div class="flex items-center gap-2">
          <button v-if="!isDefault" class="text-sm font-semibold text-brand hover:underline" @click="reset">Reset all</button>
          <button class="w-9 h-9 grid place-items-center rounded-full bg-paper-warm text-ink-soft hover:bg-line hover:text-ink" aria-label="Close filters" @click="emit('close')">
            <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
      </header>

      <!-- body -->
      <div class="flex-1 overflow-y-auto px-5 py-5 w-full sm:max-w-md sm:mx-auto space-y-6" style="padding-bottom: calc(1.5rem + env(safe-area-inset-bottom))">
        <!-- Urgency -->
        <div>
          <span :class="labelCls">Urgency</span>
          <div class="flex gap-2">
            <button :class="seg(filters.urgency === 'all')" @click="filters.urgency = 'all'">All dogs</button>
            <button :class="seg(filters.urgency === 'high')" @click="filters.urgency = 'high'">⚠ At-risk only</button>
          </div>
          <p v-if="filters.urgency === 'high'" class="text-xs text-risk font-medium mt-1.5">Showing only dogs with a placement deadline.</p>
        </div>

        <!-- Breed (predictive search picker) -->
        <div>
          <span :class="labelCls">Breed</span>
          <AppSelect v-model="filters.breed" :options="breedOptions" aria-label="Filter by breed" searchable />
        </div>

        <!-- Size -->
        <div>
          <span :class="labelCls">Size</span>
          <div class="flex gap-2">
            <button v-for="s in sizes" :key="s.v" :class="seg(filters.size === s.v)" @click="filters.size = s.v">{{ s.label }}</button>
          </div>
        </div>

        <!-- Sex -->
        <div>
          <span :class="labelCls">Sex</span>
          <div class="flex gap-2">
            <button v-for="s in sexes" :key="s.v" :class="seg(filters.sex === s.v)" @click="filters.sex = s.v">{{ s.label }}</button>
          </div>
        </div>

        <!-- Good with -->
        <div>
          <span :class="labelCls">Good with</span>
          <div class="flex flex-wrap gap-2">
            <button v-for="g in goodWithOpts" :key="g.v" :class="chip(filters.goodWith.includes(g.v))" :aria-pressed="filters.goodWith.includes(g.v)" @click="toggleGoodWith(g.v)">{{ g.label }}</button>
          </div>
        </div>

        <!-- Must be -->
        <div>
          <span :class="labelCls">Must be</span>
          <div class="flex flex-wrap gap-2">
            <button v-for="h in healthOpts" :key="h.key" :class="chip(filters[h.key])" :aria-pressed="filters[h.key]" @click="filters[h.key] = !filters[h.key]">{{ h.label }}</button>
          </div>
        </div>

        <!-- Source -->
        <div>
          <span :class="labelCls">Listed by</span>
          <div class="flex flex-wrap gap-2">
            <button v-for="s in sourceOpts" :key="s.v" :class="chip(filters.sources.includes(s.v))" :aria-pressed="filters.sources.includes(s.v)" @click="toggleSource(s.v)">{{ s.label }}</button>
          </div>
        </div>

        <!-- Max age -->
        <div>
          <label class="flex justify-between text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2" for="f-age">
            <span>Max age</span><span class="text-brand normal-case">{{ filters.maxAge >= 15 ? "15+ yrs (any)" : `${filters.maxAge} yrs` }}</span>
          </label>
          <input id="f-age" v-model.number="filters.maxAge" type="range" min="1" max="15" step="1" />
        </div>

        <!-- Distance -->
        <div>
          <label class="flex justify-between text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2" for="f-miles">
            <span>Distance</span><span class="text-brand normal-case">≤ {{ filters.maxMiles }} mi</span>
          </label>
          <input id="f-miles" v-model.number="filters.maxMiles" type="range" min="5" max="50" step="5" />
        </div>

        <!-- Min match -->
        <div>
          <label class="flex justify-between text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2" for="f-match">
            <span>Min match</span><span class="text-brand normal-case">{{ filters.minMatch }}%</span>
          </label>
          <input id="f-match" v-model.number="filters.minMatch" type="range" min="0" max="95" step="5" />
        </div>
      </div>

      <!-- footer -->
      <footer class="shrink-0 border-t border-line/60 p-4 w-full sm:max-w-md sm:mx-auto" style="padding-bottom: calc(1rem + env(safe-area-inset-bottom))">
        <button
          class="w-full py-3.5 rounded-full font-semibold shadow-glow transition-colors"
          :class="resultCount ? 'bg-brand text-white hover:bg-brand-deep' : 'bg-paper-warm text-ink-soft'"
          @click="emit('close')"
        >
          {{ resultCount ? `Show ${resultCount} dog${resultCount === 1 ? "" : "s"}` : "No dogs match — adjust filters" }}
        </button>
      </footer>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes picker-in {
  from { opacity: 0; transform: translateY(24px); }
}
.picker-in { animation: picker-in 0.15s ease-out; }
</style>
