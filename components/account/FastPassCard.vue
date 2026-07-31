<script setup lang="ts">
/* Fast-Pass readiness. The point of this card is to make the slow parts of
   adoption happen on a calm Tuesday instead of during the three hours a
   bottle-baby has. Everything it asks for is something a rescue would
   otherwise be chasing at the worst possible moment. */
import { CAPABILITIES, RESPONSE_WINDOWS, type Capability, type ResponseWindow } from "~/utils/fastPass";

const { profile } = useStore();

/* Seed the object on first interaction rather than in defaultProfile, so an
   adopter who never opts in doesn't carry an empty Fast-Pass around. */
function ensure() {
  if (!profile.value.fastPass) {
    profile.value.fastPass = { capabilities: [], responseWindow: "24h" };
  }
  return profile.value.fastPass;
}

const checks = computed(() => fastPassChecks(profile.value));
const status = computed(() => fastPassStatus(profile.value));
const doneCount = computed(() => checks.value.filter((c) => c.done).length);
const pct = computed(() => Math.round((doneCount.value / checks.value.length) * 100));

const STATUS_UI: Record<string, { label: string; cls: string; blurb: string }> = {
  none: { label: "Not started", cls: "bg-paper-warm text-ink-soft", blurb: "Get vetted before an emergency, not during one." },
  incomplete: { label: "In progress", cls: "bg-brand-soft text-brand", blurb: "Finish these and a rescue can hand you an animal the day it matters." },
  pending: { label: "Awaiting verification", cls: "bg-brand-soft text-brand", blurb: "Everything's on file. A partner org confirms it from here." },
  verified: { label: "✓ Emergency ready", cls: "bg-safe-soft text-safe", blurb: "You can be contacted directly when an animal's window opens." },
  expired: { label: "Needs re-check", cls: "bg-risk-soft text-risk", blurb: "Verification lapses annually. A quick re-confirm puts you back on the list." },
};
const ui = computed(() => STATUS_UI[status.value]);

const isPaused = computed(() => {
  const u = profile.value.fastPass?.pausedUntil;
  return !!u && new Date(u).getTime() > Date.now();
});

function toggleCap(c: Capability) {
  const fp = ensure();
  fp.capabilities = fp.capabilities.includes(c)
    ? fp.capabilities.filter((x) => x !== c)
    : [...fp.capabilities, c];
}
function setWindow(w: ResponseWindow) {
  ensure().responseWindow = w;
}
function togglePause() {
  const fp = ensure();
  if (isPaused.value) {
    fp.pausedUntil = undefined;
  } else {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    fp.pausedUntil = d.toISOString();
  }
}

const capKeys = Object.keys(CAPABILITIES) as Capability[];
</script>

<template>
  <section class="min-w-0 p-5 bg-card rounded-3xl shadow-card border border-line md:col-span-2">
    <div class="flex items-start justify-between gap-3 flex-wrap mb-1">
      <h2 class="font-display text-lg font-semibold">Fast-Pass</h2>
      <span class="px-2.5 py-1 rounded-full text-[11px] font-bold" :class="ui.cls">{{ ui.label }}</span>
    </div>
    <p class="text-xs text-ink-soft mb-4 max-w-xl leading-relaxed">
      Approval normally takes days. A bottle-fed kitten has hours, and a dog on a space-clearing
      list often has one working day. {{ ui.blurb }}
    </p>

    <!-- readiness -->
    <div class="mb-4">
      <div class="flex items-center justify-between text-xs font-semibold mb-1.5">
        <span class="text-ink-soft">Readiness</span>
        <span :class="pct === 100 ? 'text-safe' : 'text-brand'">{{ doneCount }} of {{ checks.length }}</span>
      </div>
      <div class="h-2 rounded-full bg-paper-warm overflow-hidden">
        <div class="h-full rounded-full transition-[width] duration-500"
             :class="pct === 100 ? 'bg-safe' : 'bg-brand'" :style="{ width: `${pct}%` }" />
      </div>
    </div>

    <ul class="space-y-2 mb-5">
      <li v-for="c in checks" :key="c.label" class="flex gap-2.5 items-start">
        <span class="w-4 h-4 mt-0.5 shrink-0 rounded-full grid place-items-center text-[9px] font-bold"
              :class="c.done ? 'bg-safe text-white' : 'bg-paper-warm text-ink-faint border border-line'">
          {{ c.done ? "✓" : "" }}
        </span>
        <span class="min-w-0">
          <span class="block text-sm font-semibold" :class="c.done ? 'text-ink-soft line-through decoration-line' : 'text-ink'">{{ c.label }}</span>
          <span v-if="!c.done" class="block text-[11px] text-ink-faint leading-relaxed mt-0.5">{{ c.why }}</span>
        </span>
      </li>
    </ul>

    <!-- capabilities -->
    <p class="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1">What could you take on?</p>
    <p class="text-[11px] text-ink-faint mb-2.5 leading-relaxed">
      Only pick what you could genuinely do at 2am. Shelters dispatch on these.
    </p>
    <div class="space-y-2 mb-5">
      <button
        v-for="c in capKeys" :key="c"
        class="w-full text-left p-3 rounded-2xl border transition-colors"
        :class="profile.fastPass?.capabilities.includes(c)
          ? 'border-brand bg-brand-soft'
          : 'border-line bg-paper-warm hover:border-ink-faint'"
        :aria-pressed="profile.fastPass?.capabilities.includes(c)"
        @click="toggleCap(c)"
      >
        <span class="flex items-center gap-2">
          <span aria-hidden="true">{{ CAPABILITIES[c].icon }}</span>
          <span class="text-sm font-bold">{{ CAPABILITIES[c].label }}</span>
          <span v-if="profile.fastPass?.capabilities.includes(c)" class="ml-auto text-brand text-xs font-bold">Selected</span>
        </span>
        <span class="block text-[11px] text-ink-soft leading-relaxed mt-1">{{ CAPABILITIES[c].ask }}</span>
      </button>
    </div>

    <!-- response window -->
    <p class="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-2">How fast could you collect?</p>
    <div class="flex flex-wrap gap-2 mb-5">
      <button
        v-for="w in RESPONSE_WINDOWS" :key="w.value"
        class="px-3 py-2 rounded-xl text-xs font-bold border transition-colors"
        :class="profile.fastPass?.responseWindow === w.value
          ? 'border-brand bg-brand text-white'
          : 'border-line bg-paper-warm text-ink-soft hover:border-ink-faint'"
        @click="setWindow(w.value)"
      >{{ w.label }}</button>
    </div>

    <!-- pause -->
    <div class="flex items-center justify-between gap-3 flex-wrap pt-4 border-t border-line/60">
      <p class="text-[11px] text-ink-faint leading-relaxed max-w-sm">
        {{ isPaused
          ? "Paused — you won't be contacted. Nobody is waiting on a reply from you."
          : "Going away or already full? Pause instead of deleting, so your vetting stays valid." }}
      </p>
      <button
        class="px-4 py-2 rounded-full text-xs font-bold border transition-colors shrink-0"
        :class="isPaused ? 'border-safe bg-safe-soft text-safe' : 'border-line bg-card text-ink-soft hover:border-ink-faint'"
        @click="togglePause"
      >{{ isPaused ? "Resume availability" : "Pause for 30 days" }}</button>
    </div>
  </section>
</template>
