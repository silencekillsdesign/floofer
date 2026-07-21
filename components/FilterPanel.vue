<script setup lang="ts">
const { dogs } = useStore();
const BREEDS = computed(() => [...new Set(dogs.value.map((d) => d.breed))].sort());

const filters = useFilters();
const emit = defineEmits<{ close: [] }>();

const sizes = [
  { v: "all", label: "Any" },
  { v: "small", label: "Small" },
  { v: "medium", label: "Medium" },
  { v: "large", label: "Large" },
] as const;

const isDefault = computed(() => {
  const d = defaultFilters();
  const f = filters.value;
  return f.breed === d.breed && f.size === d.size && f.maxAge === d.maxAge && f.maxMiles === d.maxMiles && f.minMatch === d.minMatch;
});

function reset() {
  filters.value = defaultFilters();
}
</script>

<template>
  <div
    class="bg-card shadow-pop border border-line p-5 space-y-5 rounded-t-2xl rounded-b-none sm:rounded-2xl max-h-[85dvh] overflow-y-auto"
    style="padding-bottom: calc(1.25rem + env(safe-area-inset-bottom))"
  >
    <div class="flex items-center justify-between">
      <h3 class="font-display font-semibold text-lg">Filters</h3>
      <div class="flex items-center gap-2">
        <button v-if="!isDefault" class="text-xs font-semibold text-brand hover:underline" @click="reset">Reset</button>
        <button class="w-8 h-8 grid place-items-center rounded-full bg-paper-warm text-ink-soft hover:bg-line" aria-label="Close filters" @click="emit('close')">✕</button>
      </div>
    </div>

    <div>
      <span class="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1.5">Breed</span>
      <AppSelect
        v-model="filters.breed"
        :options="[{ value: 'all', label: 'All breeds' }, ...BREEDS.map((b) => ({ value: b, label: b }))]"
        aria-label="Filter by breed"
      />
    </div>

    <div>
      <span class="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1.5">Size</span>
      <div class="flex gap-2">
        <button
          v-for="s in sizes" :key="s.v"
          class="flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors"
          :class="filters.size === s.v ? 'bg-brand text-white border-brand' : 'bg-card border-line text-ink-soft hover:border-ink-faint'"
          :aria-pressed="filters.size === s.v"
          @click="filters.size = s.v"
        >{{ s.label }}</button>
      </div>
    </div>

    <div>
      <label class="flex justify-between text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1.5" for="f-age">
        <span>Max age</span><span class="text-ink">{{ filters.maxAge }} yrs</span>
      </label>
      <input id="f-age" v-model.number="filters.maxAge" type="range" min="1" max="12" step="1" />
    </div>

    <div>
      <label class="flex justify-between text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1.5" for="f-miles">
        <span>Distance</span><span class="text-ink">≤ {{ filters.maxMiles }} mi</span>
      </label>
      <input id="f-miles" v-model.number="filters.maxMiles" type="range" min="5" max="50" step="5" />
    </div>

    <div>
      <label class="flex justify-between text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1.5" for="f-match">
        <span>Min match</span><span class="text-ink">{{ filters.minMatch }}%</span>
      </label>
      <input id="f-match" v-model.number="filters.minMatch" type="range" min="0" max="95" step="5" />
    </div>
  </div>
</template>
