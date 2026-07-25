<script setup lang="ts">
/* Play-date queue. Answering is two taps: pick one of the windows the adopter
   already offered, or decline with a reason. No thread to maintain — a
   coordinator with forty dogs will not run an inbox. */
import type { PlayDateRow } from "~/types/db";
import { formatSlot, isSlotPast, slotKey, type PlayDateSlot } from "~/utils/playDates";

const db = useDb();
const { profile, hydrated } = useStore();

watchEffect(() => {
  if (import.meta.client && hydrated.value && profile.value.userType === "adopter") {
    navigateTo("/account");
  }
});

const queue = ref<PlayDateRow[]>([]);
const loading = ref(false);
const error = ref("");
const busyId = ref("");
const place = ref<Record<string, string>>({});
const note = ref<Record<string, string>>({});

async function load() {
  if (!db.configured.value) return;
  loading.value = true;
  error.value = "";
  try {
    queue.value = await db.fetchPlayDates("requested");
  } catch (e: any) {
    error.value = e?.message ?? "Could not load the queue.";
  } finally {
    loading.value = false;
  }
}
onMounted(load);

async function confirm(row: PlayDateRow, slot: PlayDateSlot) {
  busyId.value = row.id;
  error.value = "";
  try {
    await db.answerPlayDate(row.id, "confirmed", {
      slot,
      location: place.value[row.id],
      note: note.value[row.id],
    });
    queue.value = queue.value.filter((r) => r.id !== row.id);
  } catch (e: any) {
    error.value = e?.message ?? "Could not confirm that.";
  } finally {
    busyId.value = "";
  }
}

async function decline(row: PlayDateRow) {
  if (!note.value[row.id]?.trim()) {
    error.value = "Say why, or suggest when — a bare decline leaves them nowhere to go.";
    return;
  }
  busyId.value = row.id;
  error.value = "";
  try {
    await db.answerPlayDate(row.id, "declined", { note: note.value[row.id] });
    queue.value = queue.value.filter((r) => r.id !== row.id);
  } catch (e: any) {
    error.value = e?.message ?? "Could not save that.";
  } finally {
    busyId.value = "";
  }
}

useSeoMeta({ title: "Play dates — Floofer", robots: "noindex" });
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <div class="mx-auto w-full max-w-3xl px-5 py-6">
      <NuxtLink to="/account" class="text-sm font-semibold text-brand hover:underline">← Account</NuxtLink>
      <h1 class="font-display text-2xl font-bold mt-3 mb-1">Play dates</h1>
      <p class="text-sm text-ink-soft leading-relaxed mb-5 max-w-xl">
        Someone wants to meet one of your dogs. Pick a window they already offered —
        that's the whole reply.
      </p>

      <div v-if="!db.configured.value" class="p-4 rounded-2xl border border-line bg-paper-warm text-sm">
        <p class="font-semibold mb-1">No database connected</p>
        <p class="text-ink-soft leading-relaxed">Play-date requests need a backend. This build is running on demo data.</p>
      </div>

      <template v-else>
        <p v-if="error" class="mb-3 p-3 rounded-xl bg-risk-soft border border-risk/25 text-sm font-semibold text-risk" role="alert">{{ error }}</p>
        <p v-if="loading" class="text-sm text-ink-soft">Loading…</p>

        <div v-else-if="!queue.length" class="p-6 rounded-2xl border border-line bg-card text-center">
          <p class="text-3xl mb-2">📅</p>
          <p class="font-semibold">No requests waiting</p>
          <p class="text-sm text-ink-soft mt-1">Meet-and-greet requests land here.</p>
        </div>

        <div v-else class="space-y-3">
          <article v-for="row in queue" :key="row.id" class="p-4 rounded-2xl border border-line bg-card">
            <div class="flex items-start justify-between gap-3 flex-wrap mb-3">
              <div class="min-w-0">
                <p class="font-display text-lg font-semibold leading-tight">
                  {{ row.profiles?.name || "An adopter" }} → {{ row.dogs?.name || "a dog" }}
                </p>
                <p class="text-xs text-ink-faint mt-0.5">{{ row.dogs?.breed }}</p>
              </div>
              <div class="flex flex-wrap gap-1.5 shrink-0">
                <a v-if="row.profiles?.phone" :href="`tel:${row.profiles.phone}`" class="px-2.5 py-1 rounded-full bg-brand-soft text-brand text-[11px] font-bold">📞 {{ row.profiles.phone }}</a>
                <a v-if="row.profiles?.email" :href="`mailto:${row.profiles.email}`" class="px-2.5 py-1 rounded-full bg-brand-soft text-brand text-[11px] font-bold">✉️ Email</a>
              </div>
            </div>

            <p v-if="row.adopter_note" class="text-sm text-ink-soft leading-relaxed mb-3 p-2.5 rounded-xl bg-paper-warm">
              "{{ row.adopter_note }}"
            </p>

            <p class="text-[11px] font-bold uppercase tracking-wide text-ink-faint mb-1.5">They can do</p>
            <div class="flex flex-wrap gap-2 mb-3">
              <button
                v-for="s in row.proposed_slots" :key="slotKey(s)"
                :disabled="busyId === row.id || isSlotPast(s)"
                class="px-3 py-2 rounded-xl border text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                :class="isSlotPast(s) ? 'border-line bg-paper-warm text-ink-faint line-through' : 'border-safe/40 bg-safe-soft text-safe hover:bg-safe hover:text-white'"
                @click="confirm(row, s)"
              >{{ formatSlot(s) }}</button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <input
                v-model="place[row.id]"
                placeholder="Where? e.g. the side yard"
                class="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium"
              />
              <input
                v-model="note[row.id]"
                placeholder="Note — required to decline"
                class="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium"
              />
            </div>

            <div class="flex items-center justify-between gap-3 flex-wrap">
              <p class="text-[11px] text-ink-faint">Tap a window above to confirm it.</p>
              <button
                :disabled="busyId === row.id"
                class="px-4 py-2 rounded-full border border-risk/40 bg-risk-soft text-risk text-xs font-bold hover:border-risk disabled:opacity-50"
                @click="decline(row)"
              >Can't do these</button>
            </div>
          </article>
        </div>
      </template>
    </div>
  </div>
</template>
