<script setup lang="ts">
/* Desktop faceted filter bar — the full-screen FilterPanel works on a phone,
   but on a desktop the filters deserve to live where the results are. Same
   shared filter state; this is only a different door to it.

   Each dropdown facet is a FacetPopover (Reka underneath); the breed search
   is a Reka combobox. Filtering is kept local so the matched substring can
   be underlined. */

import type { SourceType } from "~/types";
import { DOG_BREEDS } from "~/data/dogs";

export type MatchView = "gallery" | "list" | "deck";

const props = defineProps<{ view: MatchView }>();
const emit = defineEmits<{ "update:view": [v: MatchView] }>();

const { dogs } = useStore();
const filters = useFilters();

/* ---------- breed: predictive search ---------- */
const breedQuery = ref(filters.value.breed === "all" ? "" : filters.value.breed);

const allBreeds = computed(() =>
  [...new Set([...DOG_BREEDS, ...dogs.value.map((d) => d.breed)])].sort(),
);
const breedMatches = computed(() => {
  const q = breedQuery.value.trim().toLowerCase();
  const list = q ? allBreeds.value.filter((b) => b.toLowerCase().includes(q)) : allBreeds.value;
  return list.slice(0, 10);
});

/* If the panel (or reset) changes the breed, the input follows. */
watch(
  () => filters.value.breed,
  (b) => (breedQuery.value = b === "all" ? "" : b),
);
/* Typing over a chosen breed un-chooses it — the text is the filter. */
watch(breedQuery, (q) => {
  if (filters.value.breed !== "all" && q !== filters.value.breed) filters.value.breed = "all";
});

function chooseBreed(b: string | null) {
  if (b) filters.value.breed = b;
}
function clearBreed() {
  filters.value.breed = "all";
  breedQuery.value = "";
}

/** Split a breed name around the query so the match can be underlined. */
function parts(label: string) {
  const q = breedQuery.value.trim();
  const idx = q ? label.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (idx < 0) return { pre: label, match: "", post: "" };
  return { pre: label.slice(0, idx), match: label.slice(idx, idx + q.length), post: label.slice(idx + q.length) };
}

/* ---------- facet options ---------- */
const sizes = [
  { v: "all", label: "Any size" }, { v: "small", label: "Small" },
  { v: "medium", label: "Medium" }, { v: "large", label: "Large" },
] as const;
const sexes = [
  { v: "all", label: "Any gender" }, { v: "M", label: "♂ Male" }, { v: "F", label: "♀ Female" },
] as const;
const goodWithOpts = [
  { v: "kids", label: "🧒 Kids" }, { v: "dogs", label: "🐶 Dogs" }, { v: "cats", label: "🐱 Cats" },
] as const;
const mustBeOpts = [
  { key: "houseTrained", label: "🏠 House trained" },
  { key: "fixed", label: "✓ Spayed / neutered" },
  { key: "vaccinated", label: "💉 Vaccinated" },
] as const;
const sourceOpts: { v: SourceType; label: string }[] = [
  { v: "municipal", label: "🚨 Municipal" }, { v: "shelter", label: "🏥 No-kill" },
  { v: "foster", label: "🛋️ Foster" }, { v: "individual", label: "👤 Rehoming" },
  { v: "retirement", label: "🌅 Retirement" },
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
const mustBeCount = computed(() => mustBeOpts.filter((o) => filters.value[o.key]).length);

/* ---------- reset ---------- */
const isDefault = computed(() => {
  const d = defaultFilters();
  const f = filters.value;
  return (
    f.breed === d.breed && f.size === d.size && f.sex === d.sex && f.urgency === d.urgency &&
    !f.goodWith.length && !f.sources.length && !f.riskCategories.length &&
    !f.houseTrained && !f.fixed && !f.vaccinated &&
    f.maxAge === d.maxAge && f.maxMiles === d.maxMiles && f.minMatch === d.minMatch
  );
});
function reset() {
  filters.value = defaultFilters();
  breedQuery.value = "";
}

/* ---------- styles ---------- */
const rowCls = (active: boolean) =>
  `w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-colors ${
    active ? "text-brand" : "text-ink"
  } hover:bg-paper-warm`;
const viewBtn = (active: boolean) =>
  `w-9 h-9 grid place-items-center rounded-lg transition-colors ${
    active ? "bg-card text-brand shadow-card" : "text-ink-faint hover:text-ink-soft"
  }`;

const VIEWS: { v: MatchView; icon: "grid" | "list" | "card"; label: string; title: string }[] = [
  { v: "gallery", icon: "grid", label: "Grid view", title: "Grid view" },
  { v: "list", icon: "list", label: "List view", title: "List view" },
  { v: "deck", icon: "card", label: "Deck view", title: "One card at a time" },
];
</script>

<template>
  <div class="relative flex flex-wrap items-center gap-1.5 p-2 rounded-2xl bg-card border border-line shadow-card mb-5">
    <!-- breed: predictive search -->
    <ComboboxRoot
      :model-value="filters.breed === 'all' ? null : filters.breed"
      ignore-filter
      open-on-focus
      open-on-click
      :reset-search-term-on-blur="false"
      :reset-search-term-on-select="false"
      class="relative flex-1 min-w-[150px]"
      @update:model-value="chooseBreed($event as string | null)"
    >
      <ComboboxAnchor class="relative w-full">
        <AppIcon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
        <ComboboxInput v-model="breedQuery" as-child>
          <input
            type="text"
            placeholder="Any breed"
            autocomplete="off" autocapitalize="off" spellcheck="false"
            class="w-full rounded-xl border py-2 pl-9 pr-8 text-sm font-semibold placeholder:text-ink-faint placeholder:font-medium focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/25 transition-colors"
            :class="filters.breed !== 'all' ? 'border-brand/60 bg-brand/10 text-brand' : 'border-line bg-paper'"
            aria-label="Filter by breed"
          />
        </ComboboxInput>
        <button
          v-if="breedQuery"
          class="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 grid place-items-center rounded-full bg-paper-warm text-ink-soft hover:text-ink"
          aria-label="Clear breed"
          @click="clearBreed"
        >
          <AppIcon name="close" class="w-3 h-3" :stroke-width="2.8" />
        </button>
      </ComboboxAnchor>

      <ComboboxContent
        position="popper" :side-offset="8" align="start"
        class="z-50 rounded-2xl bg-card border border-line shadow-pop p-1.5 outline-none w-[var(--reka-combobox-trigger-width)] max-h-72 overflow-y-auto"
      >
        <button v-if="filters.breed !== 'all'" :class="rowCls(false)" @click="clearBreed">All breeds</button>
        <ComboboxItem
          v-for="b in breedMatches"
          :key="b"
          :value="b"
          :class="rowCls(b === filters.breed)"
          data-highlight-row
        >
          <span class="truncate">{{ parts(b).pre }}<span v-if="parts(b).match" class="underline underline-offset-2 decoration-2 decoration-brand text-brand">{{ parts(b).match }}</span>{{ parts(b).post }}</span>
          <ComboboxItemIndicator as-child>
            <AppIcon name="check" class="w-4 h-4 shrink-0 text-brand" />
          </ComboboxItemIndicator>
        </ComboboxItem>
        <ComboboxEmpty class="px-3 py-6 text-center text-sm font-medium text-ink-soft">
          No breeds match “{{ breedQuery }}” 🐾
        </ComboboxEmpty>
      </ComboboxContent>
    </ComboboxRoot>

    <!-- size -->
    <FacetPopover :label="sizes.find((s) => s.v === filters.size)?.label ?? 'Any size'" :active="filters.size !== 'all'">
      <template #default="{ close }">
        <button v-for="s in sizes" :key="s.v" :class="rowCls(filters.size === s.v)" @click="filters.size = s.v; close()">
          {{ s.label }}
          <AppIcon v-if="filters.size === s.v" name="check" class="w-4 h-4 shrink-0 text-brand" />
        </button>
      </template>
    </FacetPopover>

    <!-- gender -->
    <FacetPopover :label="sexes.find((s) => s.v === filters.sex)?.label ?? 'Any gender'" :active="filters.sex !== 'all'">
      <template #default="{ close }">
        <button v-for="s in sexes" :key="s.v" :class="rowCls(filters.sex === s.v)" @click="filters.sex = s.v; close()">
          {{ s.label }}
          <AppIcon v-if="filters.sex === s.v" name="check" class="w-4 h-4 shrink-0 text-brand" />
        </button>
      </template>
    </FacetPopover>

    <!-- good with (multi) -->
    <FacetPopover label="Good with" :count="filters.goodWith.length" :active="filters.goodWith.length > 0">
      <CheckRow v-for="g in goodWithOpts" :key="g.v" :checked="filters.goodWith.includes(g.v)" @click="toggleGoodWith(g.v)">
        {{ g.label }}
      </CheckRow>
    </FacetPopover>

    <!-- must be (multi) -->
    <FacetPopover label="Must be" :count="mustBeCount" :active="mustBeCount > 0">
      <CheckRow v-for="h in mustBeOpts" :key="h.key" :checked="filters[h.key]" @click="filters[h.key] = !filters[h.key]">
        {{ h.label }}
      </CheckRow>
    </FacetPopover>

    <!-- listed by (multi) -->
    <FacetPopover label="Listed by" :count="filters.sources.length" :active="filters.sources.length > 0">
      <CheckRow v-for="s in sourceOpts" :key="s.v" :checked="filters.sources.includes(s.v)" @click="toggleSource(s.v)">
        {{ s.label }}
      </CheckRow>
    </FacetPopover>

    <!-- at-risk toggle -->
    <button
      class="flex items-center gap-1 rounded-xl border px-2.5 py-2 text-sm font-bold whitespace-nowrap transition-colors"
      :class="filters.urgency === 'high' ? 'border-risk bg-risk text-white' : 'border-line bg-paper text-ink-soft hover:border-risk/60 hover:text-risk'"
      :aria-pressed="filters.urgency === 'high'"
      @click="filters.urgency = filters.urgency === 'high' ? 'all' : 'high'"
    >⚠ At-risk only</button>

    <!-- right rail: reset + view toggle -->
    <div class="ml-auto flex items-center gap-1.5">
      <button v-if="!isDefault" class="text-sm font-semibold text-brand hover:underline whitespace-nowrap" @click="reset">Reset</button>

      <div class="flex items-center gap-0.5 p-1 rounded-xl bg-paper-warm border border-line" role="group" aria-label="View">
        <button
          v-for="vw in VIEWS"
          :key="vw.v"
          :class="viewBtn(view === vw.v)"
          :aria-pressed="view === vw.v"
          :aria-label="vw.label"
          :title="vw.title"
          @click="emit('update:view', vw.v)"
        >
          <AppIcon :name="vw.icon" class="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Reka marks the keyboard/pointer-highlighted item with a data attribute;
   rowCls carries the resting look, this carries the highlight. */
[data-highlight-row][data-highlighted] {
  background: rgb(var(--c-paper-warm));
}
</style>
