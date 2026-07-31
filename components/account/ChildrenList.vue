<script setup lang="ts">
/* Children's ages, added one at a time. Age is all that's stored — it's the
   only part that affects whether a dog flagged "good with older kids" is a
   safe match, and asking for names would collect data we'd never use. */
import type { HouseholdChild } from "~/types";

const model = defineModel<HouseholdChild[]>({ required: true });

const draft = ref<number | null>(null);
const error = ref("");

function add() {
  const age = draft.value;
  if (age == null || !Number.isFinite(age)) {
    error.value = "Enter an age.";
    return;
  }
  if (age < 0 || age > 25) {
    error.value = "Age should be between 0 and 25.";
    return;
  }
  model.value = [...model.value, { id: Math.random().toString(36).slice(2, 10), age }];
  draft.value = null;
  error.value = "";
}

function remove(id: string) {
  model.value = model.value.filter((c) => c.id !== id);
}

/** Youngest first — it's the age that constrains the match. */
const sorted = computed(() => [...model.value].sort((a, b) => a.age - b.age));

const inputCls =
  "w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/25";
</script>

<template>
  <div>
    <div class="flex gap-2 items-start">
      <div class="flex-1 min-w-0">
        <label class="sr-only" :for="`kid-age-${$.uid}`">Child's age</label>
        <input
          :id="`kid-age-${$.uid}`"
          v-model.number="draft"
          type="number"
          min="0"
          max="25"
          inputmode="numeric"
          placeholder="Age in years"
          :class="inputCls"
          @keydown.enter.prevent="add"
        />
      </div>
      <button
        type="button"
        class="px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-deep shrink-0"
        @click="add"
      >Add</button>
    </div>
    <p v-if="error" class="text-xs text-risk font-semibold mt-1.5" role="alert">{{ error }}</p>

    <div v-if="sorted.length" class="flex flex-wrap gap-1.5 mt-2.5">
      <span
        v-for="c in sorted" :key="c.id"
        class="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-brand-soft text-brand text-xs font-bold"
      >
        {{ c.age }} {{ c.age === 1 ? "yr" : "yrs" }}
        <button
          type="button"
          class="w-4 h-4 grid place-items-center rounded-full hover:bg-brand hover:text-white transition-colors"
          :aria-label="`Remove child aged ${c.age}`"
          @click="remove(c.id)"
        >×</button>
      </span>
    </div>
    <p v-else class="text-xs text-ink-faint mt-2">No children in the home.</p>
  </div>
</template>
