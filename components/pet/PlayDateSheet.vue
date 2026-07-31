<script setup lang="ts">
/* Request a meet-and-greet. Deliberately not a message thread: the adopter
   offers up to three windows and the shelter picks one, which collapses the
   usual four-email back-and-forth into two taps. */
import type { Dog } from "~/types";
import {
  DAY_PARTS, MAX_SLOTS, formatSlot, slotKey, upcomingDays,
  type DayPart, type PlayDateSlot,
} from "~/utils/playDates";

const props = defineProps<{ open: boolean; dog: Dog }>();
const emit = defineEmits<{ close: [] }>();

const { profile, requestPlayDate, playDateFor, dataSource } = useStore();

const slots = ref<PlayDateSlot[]>([]);
const note = ref("");
const sent = ref(false);
const error = ref("");

const days = computed(() => upcomingDays(7));
const existing = computed(() => playDateFor(props.dog.id));

watch(
  () => props.open,
  (o) => {
    if (import.meta.client) document.body.style.overflow = o ? "hidden" : "";
    if (o) {
      sent.value = false;
      error.value = "";
      slots.value = [];
      note.value = "";
    }
  },
);
onUnmounted(() => {
  if (import.meta.client) document.body.style.overflow = "";
});

const picked = (s: PlayDateSlot) => slots.value.some((x) => slotKey(x) === slotKey(s));

function toggle(date: string, part: DayPart) {
  const s = { date, part };
  if (picked(s)) {
    slots.value = slots.value.filter((x) => slotKey(x) !== slotKey(s));
    error.value = "";
    return;
  }
  if (slots.value.length >= MAX_SLOTS) {
    error.value = `Three windows is plenty — it's enough for them to find one that works.`;
    return;
  }
  slots.value = [...slots.value, s];
  error.value = "";
}

const sending = ref(false);
/* What actually happened to the email, so the confirmation can be honest
   rather than showing a tick for a message nobody received. */
const delivery = ref<{ delivered: boolean; reason?: string } | null>(null);

async function send() {
  if (!slots.value.length) {
    error.value = "Pick at least one time that works for you.";
    return;
  }
  sending.value = true;
  requestPlayDate(props.dog.id, slots.value, note.value.trim());

  /* Demo listings have no shelter behind them — only notify for real ones. */
  delivery.value =
    dataSource.value === "floofer"
      ? await notifyShelter({
          kind: "play-date",
          dogId: props.dog.id,
          fromName: profile.value.name || "A Floofer adopter",
          fromEmail: profile.value.email,
          body: note.value.trim(),
          slots: slots.value.map(formatSlot),
        })
      : null;

  sending.value = false;
  sent.value = true;
}

const cellCls = (on: boolean) =>
  `w-full py-2 rounded-lg text-[11px] font-bold transition-colors border ${
    on ? "bg-brand text-white border-brand" : "bg-paper-warm border-line text-ink-soft hover:border-ink-faint"
  }`;
</script>

<template>
  <div class="hidden">
    <Teleport to="body">
      <div
        v-if="open"
        class="fixed inset-0 z-[70] bg-paper flex flex-col"
        role="dialog"
        aria-modal="true"
        :aria-label="`Request a play date with ${dog.name}`"
        @keydown.esc="emit('close')"
      >
        <header class="shrink-0 flex items-center justify-between gap-3 px-5 h-14 border-b border-line/60">
          <h2 class="font-display font-semibold text-lg truncate">Meet {{ dog.name }}</h2>
          <button
            class="w-9 h-9 shrink-0 grid place-items-center rounded-full bg-paper-warm text-ink-soft hover:bg-line hover:text-ink"
            aria-label="Close"
            @click="emit('close')"
          >
            <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </header>

        <!-- already requested -->
        <div v-if="existing && !sent" class="flex-1 grid place-items-center px-8 text-center">
          <div>
            <p class="text-4xl mb-3">📅</p>
            <h3 class="font-display text-xl font-semibold mb-1">You've already asked</h3>
            <p class="text-sm text-ink-soft leading-relaxed max-w-xs mx-auto">
              {{ dog.source.name }} has your request. You offered:
            </p>
            <ul class="mt-3 space-y-1.5">
              <li v-for="s in existing.slots" :key="slotKey(s)" class="text-sm font-semibold">{{ formatSlot(s) }}</li>
            </ul>
            <button class="mt-5 px-5 py-2.5 rounded-full border border-line text-sm font-semibold text-ink-soft" @click="emit('close')">Close</button>
          </div>
        </div>

        <!-- picker -->
        <div v-else-if="!sent" class="flex-1 overflow-y-auto px-5 py-5 w-full sm:max-w-md sm:mx-auto">
          <div class="flex items-center gap-3.5 p-3.5 rounded-2xl bg-card border border-line mb-4">
            <div class="w-14 h-14 rounded-xl overflow-hidden shrink-0">
              <DogPhoto :src="dog.photos[0]" :alt="`Photo of ${dog.name}`" />
            </div>
            <div class="min-w-0">
              <p class="font-display font-semibold text-lg leading-tight">{{ dog.name }}</p>
              <p class="text-xs text-ink-faint truncate">{{ dog.source.name }}</p>
            </div>
          </div>

          <p class="text-sm text-ink-soft leading-relaxed mb-4">
            Kennels make dogs look like someone they're not. Pick up to
            {{ MAX_SLOTS }} windows that work for you — {{ dog.source.name }} confirms one.
          </p>

          <div class="space-y-2">
            <div v-for="d in days" :key="d.date" class="grid grid-cols-[3.4rem,1fr,1fr,1fr] gap-1.5 items-center">
              <div class="text-left">
                <p class="text-[11px] font-bold uppercase text-ink-faint leading-none">{{ d.weekday }}</p>
                <p class="text-sm font-bold leading-tight">{{ d.day }} {{ d.month }}</p>
              </div>
              <button
                v-for="p in DAY_PARTS" :key="p.value"
                :class="cellCls(picked({ date: d.date, part: p.value }))"
                :aria-pressed="picked({ date: d.date, part: p.value })"
                :aria-label="`${d.weekday} ${d.day} ${d.month}, ${p.label}`"
                @click="toggle(d.date, p.value)"
              >{{ p.label }}</button>
            </div>
          </div>

          <div class="flex flex-wrap gap-3 mt-2.5 text-[11px] text-ink-faint">
            <span v-for="p in DAY_PARTS" :key="p.value">{{ p.label }} · {{ p.hint }}</span>
          </div>

          <div class="mt-4">
            <label class="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1.5" for="pd-note">
              Anything they should know? <span class="normal-case font-medium text-ink-faint">(optional)</span>
            </label>
            <textarea
              id="pd-note" v-model="note" rows="3"
              class="w-full rounded-xl border border-line bg-card px-3.5 py-3 text-[15px] font-medium focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/25"
              placeholder="Bringing our resident dog to see how they get on."
            />
          </div>

          <p v-if="error" class="text-sm text-risk font-semibold mt-2" role="alert">{{ error }}</p>
        </div>

        <!-- sent -->
        <div v-else class="flex-1 grid place-items-center px-8">
          <div class="text-center">
            <div class="w-20 h-20 mx-auto mb-4 grid place-items-center rounded-full bg-safe-soft">
              <svg viewBox="0 0 24 24" class="w-10 h-10 text-safe" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>
            </div>
            <h3 class="font-display text-xl font-semibold mb-1">Asked! 🐾</h3>
            <p class="text-sm text-ink-soft leading-relaxed">
              {{ dog.source.name }} will confirm one of your windows. You'll see it on {{ dog.name }}'s page.
            </p>
            <!-- Never claim an email landed when it didn't. -->
            <p v-if="delivery?.delivered" class="text-[12px] font-semibold text-safe mt-2">
              ✓ Emailed to {{ dog.source.name }}
            </p>
            <p v-else-if="delivery && !delivery.delivered" class="text-[12px] text-ink-faint mt-2 leading-relaxed">
              We couldn't email them automatically.
              <template v-if="dog.source.phone">Their number is on {{ dog.name }}'s page — a call gets there faster anyway.</template>
              <template v-else>Your request is saved and visible to them in Floofer.</template>
            </p>
          </div>
        </div>

        <footer class="shrink-0 border-t border-line/60 p-4 w-full sm:max-w-md sm:mx-auto" style="padding-bottom: calc(1rem + env(safe-area-inset-bottom))">
          <button
            v-if="!sent && !existing"
            class="w-full py-3.5 rounded-full font-semibold shadow-glow transition-colors"
            :class="slots.length ? 'bg-brand text-white hover:bg-brand-deep' : 'bg-paper-warm text-ink-faint cursor-not-allowed'"
            :disabled="!slots.length"
            @click="send"
          >
            {{ slots.length ? `Request ${slots.length} time${slots.length > 1 ? "s" : ""}` : "Pick a time" }}
          </button>
          <button
            v-else-if="sent"
            class="w-full py-3.5 rounded-full bg-safe text-white font-semibold hover:opacity-90"
            @click="emit('close')"
          >Done</button>
        </footer>
      </div>
    </Teleport>
  </div>
</template>
