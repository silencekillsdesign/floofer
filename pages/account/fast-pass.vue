<script setup lang="ts">
/* Fast-Pass review queue — the human step behind the automation.
   An org reviews a frozen snapshot of what the adopter submitted, not their
   live profile. Verifying is the moment a household becomes reachable at 2am,
   so the decision gets a note either way. */
import { CAPABILITIES, RESPONSE_WINDOWS, type Capability } from "~/utils/fastPass";
import type { FastPassApplication } from "~/types/db";

const db = useDb();
const { profile, hydrated } = useStore();

/* Adopters have no business here. Client-gated for the same reason the listing
   form is — the server has no idea who you are during SSR. */
watchEffect(() => {
  if (import.meta.client && hydrated.value && profile.value.userType === "adopter") {
    navigateTo("/account");
  }
});

const queue = ref<FastPassApplication[]>([]);
const loading = ref(false);
const error = ref("");
const noteFor = ref<Record<string, string>>({});
const busyId = ref("");

async function load() {
  if (!db.configured.value) return;
  loading.value = true;
  error.value = "";
  try {
    queue.value = await db.fetchFastPassQueue("pending");
  } catch (e: any) {
    error.value = e?.message ?? "Could not load the queue.";
  } finally {
    loading.value = false;
  }
}
onMounted(load);

async function rule(app: FastPassApplication, state: "verified" | "declined") {
  if (state === "declined" && !noteFor.value[app.id]?.trim()) {
    error.value = "A decline needs a reason — the adopter sees it and can act on it.";
    return;
  }
  busyId.value = app.id;
  error.value = "";
  try {
    await db.reviewFastPass(app.id, state, noteFor.value[app.id]);
    queue.value = queue.value.filter((a) => a.id !== app.id);
  } catch (e: any) {
    error.value = e?.message ?? "Could not save that decision.";
  } finally {
    busyId.value = "";
  }
}

const windowLabel = (v: string) =>
  RESPONSE_WINDOWS.find((w) => w.value === v)?.label ?? v;

function since(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return d <= 0 ? "today" : d === 1 ? "1 day ago" : `${d} days ago`;
}

useSeoMeta({ title: "Fast-Pass review — Floofer", robots: "noindex" });
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <div class="mx-auto w-full max-w-3xl px-5 py-6">
      <NuxtLink to="/account" class="text-sm font-semibold text-brand hover:underline">← Account</NuxtLink>
      <h1 class="font-display text-2xl font-bold mt-3 mb-1">Fast-Pass review</h1>
      <p class="text-sm text-ink-soft leading-relaxed mb-5 max-w-xl">
        Verifying a household now is what makes them reachable when an animal has hours.
        You're reviewing what they submitted — not their live profile.
      </p>

      <div v-if="!db.configured.value" class="p-4 rounded-2xl border border-line bg-paper-warm text-sm">
        <p class="font-semibold mb-1">No database connected</p>
        <p class="text-ink-soft leading-relaxed">Fast-Pass applications need a backend. This build is running on demo data.</p>
      </div>

      <template v-else>
        <p v-if="error" class="mb-3 p-3 rounded-xl bg-risk-soft border border-risk/25 text-sm font-semibold text-risk" role="alert">{{ error }}</p>
        <p v-if="loading" class="text-sm text-ink-soft">Loading queue…</p>

        <div v-else-if="!queue.length" class="p-6 rounded-2xl border border-line bg-card text-center">
          <p class="text-3xl mb-2">✅</p>
          <p class="font-semibold">Nothing waiting</p>
          <p class="text-sm text-ink-soft mt-1">New Fast-Pass applications land here.</p>
        </div>

        <div v-else class="space-y-3">
          <article v-for="app in queue" :key="app.id" class="p-4 rounded-2xl border border-line bg-card">
            <div class="flex items-start justify-between gap-3 flex-wrap">
              <div class="min-w-0">
                <p class="font-display text-lg font-semibold leading-tight">{{ app.snapshot.name || "Unnamed applicant" }}</p>
                <p class="text-xs text-ink-faint mt-0.5">{{ app.snapshot.city }} · submitted {{ since(app.submitted_at) }}</p>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-brand-soft text-brand text-[11px] font-bold shrink-0">
                {{ windowLabel(app.response_window) }}
              </span>
            </div>

            <!-- what they can absorb -->
            <div class="flex flex-wrap gap-1.5 mt-3">
              <span
                v-for="c in app.capabilities" :key="c"
                class="px-2.5 py-1 rounded-full bg-paper-warm text-ink-soft text-[11px] font-semibold"
              >{{ CAPABILITIES[c as Capability]?.icon }} {{ CAPABILITIES[c as Capability]?.label ?? c }}</span>
            </div>

            <!-- the snapshot -->
            <dl class="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 mt-4 pt-3 border-t border-line/60">
              <div><dt class="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Housing</dt><dd class="text-sm font-semibold capitalize">{{ app.snapshot.dwelling || "—" }}, {{ app.snapshot.ownership || "—" }}</dd></div>
              <div><dt class="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Pets allowed</dt><dd class="text-sm font-semibold capitalize">{{ app.snapshot.petsAllowed || (app.snapshot.ownership === "own" ? "owner" : "—") }}</dd></div>
              <div><dt class="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Landlord</dt><dd class="text-sm font-semibold">{{ app.snapshot.landlordPhone || "n/a" }}</dd></div>
              <div><dt class="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Vet</dt><dd class="text-sm font-semibold truncate">{{ app.snapshot.vetName || "—" }}</dd></div>
              <div><dt class="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Vet phone</dt><dd class="text-sm font-semibold">{{ app.snapshot.vetPhone || "—" }}</dd></div>
              <div><dt class="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Reference check</dt><dd class="text-sm font-semibold" :class="app.snapshot.allowReferenceCheck ? 'text-safe' : 'text-risk'">{{ app.snapshot.allowReferenceCheck ? "Authorised" : "Not authorised" }}</dd></div>
              <div><dt class="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Household</dt><dd class="text-sm font-semibold">{{ app.snapshot.residents }} people{{ app.snapshot.childrenAges ? `, kids ${app.snapshot.childrenAges}` : "" }}</dd></div>
              <div><dt class="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Hours empty</dt><dd class="text-sm font-semibold">{{ app.snapshot.hoursAlone }}h</dd></div>
              <div><dt class="text-[10px] font-bold uppercase tracking-wide text-ink-faint">Home photos</dt><dd class="text-sm font-semibold">{{ app.snapshot.homePhotoCount }}</dd></div>
            </dl>

            <p v-if="app.snapshot.currentPets" class="text-xs text-ink-soft mt-2.5">
              <span class="font-bold text-ink">Current pets:</span> {{ app.snapshot.currentPets }}
            </p>

            <!-- decision -->
            <div class="mt-4 pt-3 border-t border-line/60">
              <input
                v-model="noteFor[app.id]"
                :placeholder="`Note to ${app.snapshot.name || 'applicant'} — required if declining`"
                class="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium mb-2.5"
              />
              <div class="flex gap-2 flex-wrap">
                <button
                  :disabled="busyId === app.id"
                  class="px-4 py-2.5 rounded-full bg-safe text-white text-sm font-bold hover:opacity-90 disabled:opacity-50"
                  @click="rule(app, 'verified')"
                >{{ busyId === app.id ? "Saving…" : "✓ Verify — emergency ready" }}</button>
                <button
                  :disabled="busyId === app.id"
                  class="px-4 py-2.5 rounded-full border border-risk/40 bg-risk-soft text-risk text-sm font-bold hover:border-risk disabled:opacity-50"
                  @click="rule(app, 'declined')"
                >Decline</button>
              </div>
            </div>
          </article>
        </div>
      </template>
    </div>
  </div>
</template>
