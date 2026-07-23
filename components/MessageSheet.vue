<script setup lang="ts">
/* Full-screen contact form — prefilled from the user profile + the pet's
   listing. Demo build: "send" confirms locally; real delivery comes with
   the backend. */
import type { Dog } from "~/types";

const props = defineProps<{ open: boolean; dog: Dog }>();
const emit = defineEmits<{ close: [] }>();

const { profile } = useStore();

const name = ref("");
const email = ref("");
const message = ref("");
const sent = ref(false);

watch(
  () => props.open,
  (o) => {
    if (import.meta.client) document.body.style.overflow = o ? "hidden" : "";
    if (o) {
      sent.value = false;
      name.value = profile.value.name;
      email.value = profile.value.email;
      message.value = `Hi ${props.dog.source.name}! I'd love to give ${props.dog.name} a home. When could we set up a meet?`;
    }
  },
);
onUnmounted(() => {
  if (import.meta.client) document.body.style.overflow = "";
});

const canSend = computed(() => name.value.trim() && email.value.trim() && message.value.trim());

/* Adopters send their profile summary along with the message — this is the
   moment the standing adoption profile earns its keep with the rescue. */
const isAdopter = computed(() => profile.value.userType === "adopter");
const completeness = computed(() => adoptionCompleteness(profile.value));
const highlights = computed(() => {
  const a = profile.value.adoption;
  const items: { label: string; good: boolean }[] = [];
  if (a.firstTimeOwner) {
    items.push({ label: "🌱 First-time owner", good: true });
  } else {
    items.push(
      a.vet.vetName.trim() && a.vet.vetPhone.trim()
        ? { label: "🩺 Vet reference on file", good: true }
        : { label: "🩺 No vet reference yet", good: false },
    );
  }
  items.push(
    a.vet.allowReferenceCheck
      ? { label: "✓ Reference check permitted", good: true }
      : { label: "Reference check not yet permitted", good: false },
  );
  if (a.housing.ownership === "own") items.push({ label: "🏠 Owns their home", good: true });
  else if (a.housing.landlordPhone.trim()) items.push({ label: "🏠 Landlord contact on file", good: true });
  else if (a.housing.ownership) items.push({ label: "🏠 Landlord contact missing", good: false });
  if (a.housing.fencedYard) {
    items.push({ label: a.housing.fencedYard === "yes" ? "🚧 Fenced yard" : "🚧 No fenced yard", good: a.housing.fencedYard === "yes" });
  }
  if (profile.value.petPhotos.length) items.push({ label: `🐾 ${profile.value.petPhotos.length} resident-pet photo${profile.value.petPhotos.length > 1 ? "s" : ""}`, good: true });
  return items;
});

const inputCls =
  "w-full rounded-xl border border-line bg-card px-3.5 py-3 text-[15px] font-medium focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/25";
const labelCls = "block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1.5";
</script>

<template>
  <div class="hidden">
    <Teleport to="body">
      <div
        v-if="open"
        class="fixed inset-0 z-[70] bg-paper flex flex-col sheet-in"
        role="dialog"
        aria-modal="true"
        :aria-label="`Message ${dog.source.name} about ${dog.name}`"
        @keydown.esc="emit('close')"
      >
        <!-- header -->
        <header class="shrink-0 flex items-center justify-between gap-3 px-5 h-14 border-b border-line/60">
          <h2 class="font-display font-semibold text-lg truncate">Message {{ dog.source.name }}</h2>
          <button
            class="w-9 h-9 shrink-0 grid place-items-center rounded-full bg-paper-warm text-ink-soft hover:bg-line hover:text-ink"
            aria-label="Close"
            @click="emit('close')"
          >
            <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </header>

        <!-- form -->
        <div v-if="!sent" class="flex-1 overflow-y-auto px-5 py-5 w-full sm:max-w-md sm:mx-auto space-y-4">
          <!-- the pet this is about -->
          <div class="flex items-center gap-3.5 p-3.5 rounded-2xl bg-card border border-line">
            <div class="w-14 h-14 rounded-xl overflow-hidden shrink-0">
              <DogPhoto :src="dog.photos[0]" :alt="`Photo of ${dog.name}`" />
            </div>
            <div class="min-w-0">
              <p class="font-display font-semibold text-lg leading-tight">{{ dog.name }}</p>
              <p class="text-xs text-ink-faint truncate">Listing ID: {{ dog.id }}</p>
            </div>
            <span class="ml-auto shrink-0 px-2.5 py-1 rounded-full bg-safe-soft text-safe text-[10px] font-bold">🐾 Rescue request</span>
          </div>

          <!-- attached adoption-profile summary (adopters) -->
          <div v-if="isAdopter" class="p-3.5 rounded-2xl bg-card border border-line">
            <div class="flex items-center justify-between gap-3 mb-2">
              <p class="text-xs font-semibold uppercase tracking-wide text-ink-soft">📎 Attached · adoption profile</p>
              <span class="text-xs font-bold shrink-0" :class="completeness.pct === 100 ? 'text-safe' : 'text-brand'">
                {{ completeness.pct }}% complete
              </span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="h in highlights" :key="h.label"
                class="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                :class="h.good ? 'bg-safe-soft text-safe' : 'bg-paper-warm text-ink-faint'"
              >{{ h.label }}</span>
            </div>
            <p v-if="completeness.pct < 100" class="text-[11px] text-ink-faint mt-2">
              Rescues see this summary — <NuxtLink to="/account" class="text-brand font-semibold underline" @click="emit('close')">finish your profile</NuxtLink> to boost approval odds.
            </p>
          </div>

          <div>
            <label :class="labelCls" for="msg-name">Your name</label>
            <input id="msg-name" v-model="name" :class="inputCls" autocomplete="name" />
          </div>
          <div>
            <label :class="labelCls" for="msg-email">Your email</label>
            <input id="msg-email" v-model="email" type="email" :class="inputCls" autocomplete="email" />
          </div>
          <div>
            <label :class="labelCls" for="msg-body">Message</label>
            <textarea id="msg-body" v-model="message" rows="6" :class="inputCls" />
          </div>
        </div>

        <!-- sent confirmation -->
        <div v-else class="flex-1 grid place-items-center px-8">
          <div class="text-center">
            <div class="w-20 h-20 mx-auto mb-4 grid place-items-center rounded-full bg-safe-soft">
              <svg viewBox="0 0 24 24" class="w-10 h-10 text-safe" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>
            </div>
            <h3 class="font-display text-xl font-semibold mb-1">Message sent! 🐾</h3>
            <p class="text-sm text-ink-soft">
              {{ dog.source.name }} will reach out at <strong class="text-ink font-semibold">{{ email }}</strong> to set up a meet with {{ dog.name }}.
            </p>
            <p v-if="isAdopter" class="text-xs text-ink-faint mt-2">Your adoption profile summary went along with it.</p>
          </div>
        </div>

        <!-- footer -->
        <footer class="shrink-0 border-t border-line/60 p-4 w-full sm:max-w-md sm:mx-auto" style="padding-bottom: calc(1rem + env(safe-area-inset-bottom))">
          <button
            v-if="!sent"
            class="w-full py-3.5 rounded-full font-semibold shadow-glow transition-colors"
            :class="canSend ? 'bg-brand text-white hover:bg-brand-deep' : 'bg-paper-warm text-ink-faint cursor-not-allowed'"
            :disabled="!canSend"
            @click="sent = true"
          >
            Send message
          </button>
          <button
            v-else
            class="w-full py-3.5 rounded-full bg-safe text-white font-semibold hover:opacity-90 transition-opacity"
            @click="emit('close')"
          >
            Done
          </button>
        </footer>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes sheet-in {
  from { opacity: 0; transform: translateY(24px); }
}
.sheet-in { animation: sheet-in 0.15s ease-out; }
</style>
