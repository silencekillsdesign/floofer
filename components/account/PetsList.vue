<script setup lang="ts">
/* Pets, current and previous, as records rather than prose.
   Current and past live in one list because they're the same kind of record —
   splitting them into two boxes made people enter the same animal twice, and
   a pet moving from "current" to "past" is a status change, not a re-entry. */
import type { HouseholdPet } from "~/types";

const model = defineModel<HouseholdPet[]>({ required: true });

const name = ref("");
const kind = ref("");
const stillWithMe = ref(true);
const error = ref("");

function add() {
  if (!name.value.trim()) {
    error.value = "Give them a name.";
    return;
  }
  model.value = [
    ...model.value,
    {
      id: Math.random().toString(36).slice(2, 10),
      name: name.value.trim(),
      kind: kind.value.trim(),
      stillWithMe: stillWithMe.value,
      note: "",
    },
  ];
  name.value = "";
  kind.value = "";
  error.value = "";
}

function remove(id: string) {
  model.value = model.value.filter((p) => p.id !== id);
}

function toggleStatus(id: string) {
  model.value = model.value.map((p) =>
    p.id === id ? { ...p, stillWithMe: !p.stillWithMe } : p,
  );
}

function setNote(id: string, note: string) {
  model.value = model.value.map((p) => (p.id === id ? { ...p, note } : p));
}

const current = computed(() => model.value.filter((p) => p.stillWithMe));
const past = computed(() => model.value.filter((p) => !p.stillWithMe));

const inputCls =
  "w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/25";
</script>

<template>
  <div>
    <!-- quick add -->
    <div class="grid grid-cols-1 sm:grid-cols-[1fr,1fr,auto] gap-2 items-start">
      <div>
        <label class="sr-only" :for="`pet-name-${$.uid}`">Pet's name</label>
        <input :id="`pet-name-${$.uid}`" v-model="name" placeholder="Name" :class="inputCls" @keydown.enter.prevent="add" />
      </div>
      <div>
        <label class="sr-only" :for="`pet-kind-${$.uid}`">Species or breed</label>
        <input :id="`pet-kind-${$.uid}`" v-model="kind" placeholder="Cat, lab mix…" :class="inputCls" @keydown.enter.prevent="add" />
      </div>
      <button
        type="button"
        class="px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-bold hover:bg-brand-deep shrink-0"
        @click="add"
      >Add</button>
    </div>

    <div class="flex items-center gap-2 mt-2">
      <button
        type="button"
        class="px-3 py-1.5 rounded-full text-xs font-bold border transition-colors"
        :class="stillWithMe ? 'border-safe bg-safe-soft text-safe' : 'border-line bg-paper-warm text-ink-soft'"
        :aria-pressed="stillWithMe"
        @click="stillWithMe = true"
      >Still with me</button>
      <button
        type="button"
        class="px-3 py-1.5 rounded-full text-xs font-bold border transition-colors"
        :class="!stillWithMe ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-paper-warm text-ink-soft'"
        :aria-pressed="!stillWithMe"
        @click="stillWithMe = false"
      >A previous pet</button>
    </div>
    <p v-if="error" class="text-xs text-risk font-semibold mt-1.5" role="alert">{{ error }}</p>

    <!-- current -->
    <div v-if="current.length" class="mt-3.5">
      <p class="text-[11px] font-bold uppercase tracking-wide text-ink-faint mb-1.5">In your home now</p>
      <ul class="space-y-1.5">
        <li v-for="p in current" :key="p.id" class="flex items-center gap-2.5 p-2.5 rounded-xl border border-line bg-paper">
          <span class="w-6 h-6 shrink-0 rounded-full bg-safe-soft text-safe grid place-items-center text-[11px] font-bold">🐾</span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-bold truncate">{{ p.name }}</span>
            <span v-if="p.kind" class="block text-[11px] text-ink-faint truncate">{{ p.kind }}</span>
          </span>
          <button type="button" class="text-[11px] font-semibold text-ink-faint hover:text-ink shrink-0" @click="toggleStatus(p.id)">No longer with me</button>
          <button type="button" class="w-6 h-6 grid place-items-center rounded-full text-ink-faint hover:bg-risk-soft hover:text-risk shrink-0" :aria-label="`Remove ${p.name}`" @click="remove(p.id)">×</button>
        </li>
      </ul>
    </div>

    <!-- past -->
    <div v-if="past.length" class="mt-3.5">
      <p class="text-[11px] font-bold uppercase tracking-wide text-ink-faint mb-1.5">Pets you've had before</p>
      <ul class="space-y-1.5">
        <li v-for="p in past" :key="p.id" class="p-2.5 rounded-xl border border-line bg-paper">
          <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 shrink-0 rounded-full bg-paper-warm text-ink-faint grid place-items-center text-[11px]">🐾</span>
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-bold truncate">{{ p.name }}</span>
              <span v-if="p.kind" class="block text-[11px] text-ink-faint truncate">{{ p.kind }}</span>
            </span>
            <button type="button" class="text-[11px] font-semibold text-ink-faint hover:text-ink shrink-0" @click="toggleStatus(p.id)">Still with me</button>
            <button type="button" class="w-6 h-6 grid place-items-center rounded-full text-ink-faint hover:bg-risk-soft hover:text-risk shrink-0" :aria-label="`Remove ${p.name}`" @click="remove(p.id)">×</button>
          </div>
          <!-- The question rescues actually care about. -->
          <input
            :value="p.note"
            placeholder="Where are they now? e.g. passed of old age in 2022"
            class="w-full mt-2 rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-brand"
            :aria-label="`Where is ${p.name} now?`"
            @input="setNote(p.id, ($event.target as HTMLInputElement).value)"
          />
        </li>
      </ul>
    </div>

    <p v-if="!model.length" class="text-xs text-ink-faint mt-2.5">
      No pets added yet. First-time owners can leave this empty.
    </p>
  </div>
</template>
