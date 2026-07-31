<script setup lang="ts">
/* Desktop faceted filter bar — the full-screen FilterPanel works on a phone,
   but on a desktop the filters deserve to live where the results are. Same
   shared filter state; this is only a different door to it.

   Popovers and the breed combobox are Reka primitives: dismissal, Esc, focus
   return, arrow-key navigation and ARIA wiring are theirs; the pixels are
   ours. Facets with a non-default value tint their trigger so an active
   filter is never invisible — a hidden filter reads as "no dogs", not
   "filtered". */

import type { SourceType } from "~/types";
import { DOG_BREEDS } from "~/data/dogs";

export type MatchView = "gallery" | "list" | "deck";

const props = defineProps<{ view: MatchView }>();
const emit = defineEmits<{ "update:view": [v: MatchView] }>();

const { dogs } = useStore();
const filters = useFilters();

/* Open state per facet, only so the trigger can rotate its chevron —
   dismissal itself is Reka's job now. */
const menus = reactive({ size: false, sex: false, goodwith: false, mustbe: false, sources: false });

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

/* ---------- single-select facets ---------- */
const sizes = [
  { v: "all", label: "Any size" }, { v: "small", label: "Small" },
  { v: "medium", label: "Medium" }, { v: "large", label: "Large" },
] as const;
const sexes = [
  { v: "all", label: "Any gender" }, { v: "M", label: "♂ Male" }, { v: "F", label: "♀ Female" },
] as const;

/* ---------- multi-select facets ---------- */
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
const trigger = (active: boolean, open: boolean) =>
  `flex items-center gap-1 rounded-xl border px-2.5 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
    active
      ? "border-brand/60 bg-brand/10 text-brand"
      : open
        ? "border-ink-faint bg-paper text-ink"
        : "border-line bg-paper text-ink-soft hover:border-ink-faint"
  }`;
const menuCls =
  "z-50 min-w-[210px] rounded-2xl bg-card border border-line shadow-pop p-1.5 outline-none";
const rowCls = (active: boolean) =>
  `w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-colors ${
    active ? "text-brand" : "text-ink"
  } hover:bg-paper-warm`;
const viewBtn = (active: boolean) =>
  `w-9 h-9 grid place-items-center rounded-lg transition-colors ${
    active ? "bg-card text-brand shadow-card" : "text-ink-faint hover:text-ink-soft"
  }`;
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
        <svg viewBox="0 0 24 24" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/></svg>
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
          <svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </ComboboxAnchor>

      <ComboboxContent position="popper" :side-offset="8" align="start" :class="menuCls" class="w-[var(--reka-combobox-trigger-width)] max-h-72 overflow-y-auto">
        <button v-if="filters.breed !== 'all'" :class="rowCls(false)" @click="clearBreed">All breeds</button>
        <ComboboxItem
          v-for="b in breedMatches"
          :key="b"
          :value="b"
          class="group"
          :class="rowCls(b === filters.breed)"
          data-highlight-row
        >
          <span class="truncate">{{ parts(b).pre }}<span v-if="parts(b).match" class="underline underline-offset-2 decoration-2 decoration-brand text-brand">{{ parts(b).match }}</span>{{ parts(b).post }}</span>
          <ComboboxItemIndicator as-child>
            <svg viewBox="0 0 24 24" class="w-4 h-4 shrink-0 text-brand" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>
          </ComboboxItemIndicator>
        </ComboboxItem>
        <ComboboxEmpty class="px-3 py-6 text-center text-sm font-medium text-ink-soft">
          No breeds match “{{ breedQuery }}” 🐾
        </ComboboxEmpty>
      </ComboboxContent>
    </ComboboxRoot>

    <!-- size -->
    <PopoverRoot v-model:open="menus.size">
      <PopoverTrigger :class="trigger(filters.size !== 'all', menus.size)">
        {{ sizes.find((s) => s.v === filters.size)?.label }}
        <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 transition-transform" :class="menus.size && 'rotate-180'" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent align="start" :side-offset="8" :class="menuCls" aria-label="Size">
          <button v-for="s in sizes" :key="s.v" :class="rowCls(filters.size === s.v)" @click="filters.size = s.v; menus.size = false">
            {{ s.label }}
            <svg v-if="filters.size === s.v" viewBox="0 0 24 24" class="w-4 h-4 shrink-0 text-brand" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>
          </button>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>

    <!-- gender -->
    <PopoverRoot v-model:open="menus.sex">
      <PopoverTrigger :class="trigger(filters.sex !== 'all', menus.sex)">
        {{ sexes.find((s) => s.v === filters.sex)?.label }}
        <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 transition-transform" :class="menus.sex && 'rotate-180'" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent align="start" :side-offset="8" :class="menuCls" aria-label="Gender">
          <button v-for="s in sexes" :key="s.v" :class="rowCls(filters.sex === s.v)" @click="filters.sex = s.v; menus.sex = false">
            {{ s.label }}
            <svg v-if="filters.sex === s.v" viewBox="0 0 24 24" class="w-4 h-4 shrink-0 text-brand" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>
          </button>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>

    <!-- good with (multi) -->
    <PopoverRoot v-model:open="menus.goodwith">
      <PopoverTrigger :class="trigger(filters.goodWith.length > 0, menus.goodwith)">
        Good with
        <span v-if="filters.goodWith.length" class="min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-brand text-white text-[10px] font-bold">{{ filters.goodWith.length }}</span>
        <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 transition-transform" :class="menus.goodwith && 'rotate-180'" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent align="start" :side-offset="8" :class="menuCls" aria-label="Good with">
          <button v-for="g in goodWithOpts" :key="g.v" :class="rowCls(filters.goodWith.includes(g.v))" :aria-pressed="filters.goodWith.includes(g.v)" @click="toggleGoodWith(g.v)">
            {{ g.label }}
            <span class="w-[18px] h-[18px] grid place-items-center rounded-md border-2 transition-colors" :class="filters.goodWith.includes(g.v) ? 'bg-brand border-brand text-white' : 'border-line'">
              <svg v-if="filters.goodWith.includes(g.v)" viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>
            </span>
          </button>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>

    <!-- must be (multi) -->
    <PopoverRoot v-model:open="menus.mustbe">
      <PopoverTrigger :class="trigger(mustBeCount > 0, menus.mustbe)">
        Must be
        <span v-if="mustBeCount" class="min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-brand text-white text-[10px] font-bold">{{ mustBeCount }}</span>
        <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 transition-transform" :class="menus.mustbe && 'rotate-180'" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent align="start" :side-offset="8" :class="menuCls" aria-label="Must be">
          <button v-for="h in mustBeOpts" :key="h.key" :class="rowCls(filters[h.key])" :aria-pressed="filters[h.key]" @click="filters[h.key] = !filters[h.key]">
            {{ h.label }}
            <span class="w-[18px] h-[18px] grid place-items-center rounded-md border-2 transition-colors" :class="filters[h.key] ? 'bg-brand border-brand text-white' : 'border-line'">
              <svg v-if="filters[h.key]" viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>
            </span>
          </button>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>

    <!-- listed by (multi) -->
    <PopoverRoot v-model:open="menus.sources">
      <PopoverTrigger :class="trigger(filters.sources.length > 0, menus.sources)">
        Listed by
        <span v-if="filters.sources.length" class="min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-brand text-white text-[10px] font-bold">{{ filters.sources.length }}</span>
        <svg viewBox="0 0 24 24" class="w-3.5 h-3.5 transition-transform" :class="menus.sources && 'rotate-180'" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent align="start" :side-offset="8" :class="menuCls" aria-label="Listed by">
          <button v-for="s in sourceOpts" :key="s.v" :class="rowCls(filters.sources.includes(s.v))" :aria-pressed="filters.sources.includes(s.v)" @click="toggleSource(s.v)">
            {{ s.label }}
            <span class="w-[18px] h-[18px] grid place-items-center rounded-md border-2 transition-colors" :class="filters.sources.includes(s.v) ? 'bg-brand border-brand text-white' : 'border-line'">
              <svg v-if="filters.sources.includes(s.v)" viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>
            </span>
          </button>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>

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
        <button :class="viewBtn(view === 'gallery')" :aria-pressed="view === 'gallery'" aria-label="Grid view" title="Grid view" @click="emit('update:view', 'gallery')">
          <svg viewBox="0 0 24 24" class="w-4.5 h-4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>
        </button>
        <button :class="viewBtn(view === 'list')" :aria-pressed="view === 'list'" aria-label="List view" title="List view" @click="emit('update:view', 'list')">
          <svg viewBox="0 0 24 24" class="w-4.5 h-4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <button :class="viewBtn(view === 'deck')" :aria-pressed="view === 'deck'" aria-label="Deck view" title="One card at a time" @click="emit('update:view', 'deck')">
          <svg viewBox="0 0 24 24" class="w-4.5 h-4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="4" width="12" height="16" rx="2.5"/><path d="M4.5 6.5v13a1.8 1.8 0 0 0 1 1.6"/></svg>
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
