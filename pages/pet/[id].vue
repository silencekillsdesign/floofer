<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const { dogs, profile, matchPct, like, pass, liked, applied, submitApplication } = useStore();

/* Like → Rescue → Message: liking stays on this page; Rescue registers intent;
   Message opens the contact sheet to the listing org. */
const isLiked = computed(() => !!dog.value && liked.value.includes(dog.value.id));
const isApplied = computed(() => !!dog.value && applied.value.includes(dog.value.id));
const isPartnerOrg = computed(() => ["shelter", "retirement"].includes(profile.value.userType));
const messageOpen = ref(false);

const dog = computed(() => dogs.value.find((d) => d.id === route.params.id));
const photoIdx = ref(0);
watch(() => dog.value?.id, () => (photoIdx.value = 0));

/* Shared links carry the dog's face and their deadline — the whole point of
   server rendering this page. */
watchEffect(() => {
  const d = dog.value;
  if (!d) return;
  const urgency = d.risk === "high" && d.daysLeft != null ? `⚠ ${d.daysLeft} days left. ` : "";
  const description = `${urgency}${d.name} is a ${d.age}yr ${d.breed} in ${d.location.city} looking for a home. ${d.tagline}`;
  useSeoMeta({
    title: `${d.name} — ${d.breed} up for adoption | Floofer`,
    description,
    ogTitle: `Meet ${d.name}${d.risk === "high" ? " — at risk" : ""}`,
    ogDescription: description,
    ogType: "website",
    twitterCard: "summary_large_image",
  });
  defineOgImage("Pet", {
    name: d.name,
    breed: d.breed,
    tagline: d.tagline,
    photo: d.photos[0],
    daysLeft: d.risk === "high" ? (d.daysLeft ?? null) : null,
    city: d.location.city,
    age: d.age,
  });
});

/* Photo gallery gestures: horizontal swipe or tap-zones (left 40% back,
   right 60% forward). Vertical drags fall through to page scroll. */
const photoCount = computed(() => dog.value?.photos.length ?? 0);
const nextPhoto = () => (photoIdx.value = (photoIdx.value + 1) % photoCount.value);
const prevPhoto = () =>
  (photoIdx.value = (photoIdx.value - 1 + photoCount.value) % photoCount.value);

const SWIPE_MIN = 40;
const TAP_SLOP = 8;
const gStartX = ref(0);
const gStartY = ref(0);
const gActive = ref(false);

function heroDown(e: PointerEvent) {
  if ((e.target as HTMLElement).closest("button, a")) return; // back / share / dots
  gActive.value = true;
  gStartX.value = e.clientX;
  gStartY.value = e.clientY;
}
function heroUp(e: PointerEvent) {
  if (!gActive.value) return;
  gActive.value = false;
  if (photoCount.value < 2) return;
  const dx = e.clientX - gStartX.value;
  const dy = e.clientY - gStartY.value;
  if (Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) {
    dx < 0 ? nextPhoto() : prevPhoto();
  } else if (Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    (gStartX.value - rect.left) / rect.width < 0.4 ? prevPhoto() : nextPhoto();
  }
}

const sourceLabels = {
  shelter: "No-kill shelter",
  foster: "Foster home",
  individual: "Private rehoming",
  retirement: "Pet retirement community",
};
const sourceIcons = { shelter: "🏥", foster: "🛋️", individual: "👤", retirement: "🌅" };

function act(dir: "left" | "right") {
  if (!dog.value) return;
  if (dir === "left") {
    pass(dog.value.id);
    router.push("/");
  } else {
    like(dog.value.id); // stay here — the button becomes Rescue
  }
}

const toastMsg = ref("");
let toastTimer: ReturnType<typeof setTimeout> | undefined;
function toast(msg: string, ms = 1800) {
  toastMsg.value = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastMsg.value = ""), ms);
}

async function share() {
  if (!dog.value) return;
  const url = `${location.origin}/pet/${dog.value.id}`;
  const data = { title: `Meet ${dog.value.name} on Floofer`, text: `${dog.value.name} — ${dog.value.tagline}`, url };
  if (navigator.share) {
    try { await navigator.share(data); } catch {}
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast("Link copied 🔗");
  } catch {
    toast(url, 4000); // clipboard blocked — show the link so it can be copied by hand
  }
}

/** Compatibility & training tags with yes / selective / no styling. */
const compatTags = computed(() => {
  const d = dog.value;
  if (!d) return [];
  const yes = "bg-safe-soft text-safe";
  const mid = "bg-brand-soft text-brand";
  const no = "bg-paper-warm text-ink-faint line-through";
  const yns = (icon: string, noun: string, v: string) =>
    v === "yes"
      ? { label: `${icon} Good with ${noun}`, cls: yes }
      : v === "selective"
        ? { label: `${icon} Selective with ${noun}`, cls: mid }
        : v === "older"
          ? { label: `${icon} Older kids only`, cls: mid }
          : { label: `${icon} ${noun[0].toUpperCase() + noun.slice(1)}`, cls: no };
  return [
    yns("🐶", "dogs", d.goodWithDogs),
    yns("🐱", "cats", d.goodWithCats),
    yns("🧒", "kids", d.goodWithKids),
    d.houseTrained === "yes"
      ? { label: "🏠 House trained", cls: yes }
      : d.houseTrained === "in-training"
        ? { label: "🏠 Housetraining in progress", cls: mid }
        : { label: "🏠 Not house trained", cls: no },
    d.crateTrained ? { label: "📦 Crate trained", cls: yes } : { label: "📦 Crate", cls: no },
  ];
});
</script>

<template>
  <div v-if="dog" class="sm:max-w-2xl sm:mx-auto pb-24 sm:pb-10 sm:px-4 sm:pt-4">
    <!-- full-bleed hero -->
    <div
      class="relative overflow-hidden sm:rounded-3xl sm:shadow-pop select-none"
      style="aspect-ratio: 4 / 4.4; touch-action: pan-y"
      @pointerdown="heroDown"
      @pointerup="heroUp"
      @pointercancel="gActive = false"
    >
      <DogPhoto :src="dog.photos[photoIdx]" :alt="`Photo ${photoIdx + 1} of ${dog.name}`" eager />
      <div class="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
      <button
        class="absolute top-3 left-3 w-10 h-10 grid place-items-center rounded-full bg-black/40 backdrop-blur text-white hover:bg-black/60"
        aria-label="Go back"
        @click="router.back()"
      >
        <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
      </button>
      <!-- risk status sits where the match ring used to; the countdown speaks
           for itself, so no "at risk" wording -->
      <div class="absolute top-3 right-3">
        <div
          v-if="dog.adopted"
          class="px-3.5 py-2 rounded-full bg-black/60 backdrop-blur text-white text-xs font-bold"
        >🎉 Adopted</div>
        <div
          v-else-if="dog.risk === 'high' && dog.daysLeft != null"
          class="w-[60px] h-[60px] flex flex-col items-center justify-center rounded-full bg-risk text-white shadow-pop ring-4 ring-risk/30"
          :aria-label="`${dog.daysLeft} days to placement deadline`"
          :title="`${dog.daysLeft} days to placement deadline`"
        >
          <span class="text-2xl font-extrabold leading-none">{{ dog.daysLeft }}</span>
          <span class="text-[10px] font-bold uppercase tracking-wide leading-none mt-0.5">days</span>
        </div>
        <div
          v-else-if="dog.risk === 'high'"
          class="px-3.5 py-2 rounded-full bg-risk text-white text-xs font-bold shadow-pop"
          title="Placement deadline pending"
        >⚠</div>
        <div
          v-else
          class="px-3.5 py-2 rounded-full bg-safe-soft text-safe text-xs font-bold"
        >✓ Safe</div>
      </div>
      <button
        class="absolute bottom-3 right-3 w-10 h-10 grid place-items-center rounded-full bg-black/40 backdrop-blur text-white hover:bg-grape transition-colors"
        :aria-label="`Share ${dog.name}'s profile`" title="Share"
        @click="share"
      >
        <svg viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor"><path d="M18 8a3 3 0 1 0-2.83-4H15a3 3 0 0 0 .06.59L8.9 8.2a3 3 0 1 0 0 7.6l6.16 3.61A3 3 0 1 0 18 16c-.7 0-1.34.24-1.85.64l-6.2-3.63a3 3 0 0 0 0-2.02l6.2-3.63c.51.4 1.15.64 1.85.64z"/></svg>
      </button>
      <p
        v-if="toastMsg"
        class="absolute bottom-16 right-3 max-w-[85%] truncate px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur text-white text-xs font-semibold"
        role="status"
      >{{ toastMsg }}</p>
      <div class="absolute bottom-3 inset-x-0 flex justify-center gap-1.5">
        <button
          v-for="(p, i) in dog.photos" :key="i"
          class="w-2.5 h-2.5 rounded-full border border-white/70 transition-colors"
          :class="i === photoIdx ? 'bg-brand' : 'bg-white/40'"
          :aria-label="`Photo ${i + 1}`"
          @click="photoIdx = i"
        />
      </div>
    </div>

    <div class="px-5 sm:px-0">
    <!-- header -->
    <div class="mt-5">
      <div class="flex items-start justify-between gap-4">
        <h1 class="font-display text-3xl font-semibold">{{ dog.name }}</h1>
        <ClientOnly>
          <span
            class="shrink-0 px-3.5 py-1.5 rounded-full text-sm font-bold whitespace-nowrap"
            :class="matchPct(dog) >= 80 ? 'bg-safe-soft text-safe' : matchPct(dog) >= 60 ? 'bg-brand-soft text-brand' : 'bg-paper-warm text-ink-soft'"
          >
            {{ matchPct(dog) }}% match
          </span>
        </ClientOnly>
      </div>
      <p class="flex items-center gap-2 w-full text-ink-soft font-medium mt-1">
        <span aria-hidden="true">🐕</span>
        <span>{{ dog.breed }}<template v-if="dog.secondaryBreed"> / {{ dog.secondaryBreed }}</template></span>
      </p>
      <div class="flex flex-wrap gap-1.5 mt-2.5">
        <span class="px-2.5 py-1 rounded-full bg-paper-warm text-ink-soft text-xs font-semibold">{{ dog.sex === "F" ? "♀ Female" : "♂ Male" }}</span>
        <span class="px-2.5 py-1 rounded-full bg-paper-warm text-ink-soft text-xs font-semibold">{{ lifeStage(dog) }} · {{ dog.age }} {{ dog.age === 1 ? "yr" : "yrs" }}</span>
        <span class="px-2.5 py-1 rounded-full bg-paper-warm text-ink-soft text-xs font-semibold">{{ dog.weightLbs }} lbs</span>
        <span class="px-2.5 py-1 rounded-full bg-paper-warm text-ink-soft text-xs font-semibold">📍 {{ milesFrom(dog) }} mi away</span>
      </div>
    </div>

    <!-- risk banner -->
    <div v-if="dog.risk === 'high' && !dog.adopted" class="mt-4 p-4 rounded-2xl bg-risk-soft border border-risk/25">
      <p class="font-semibold text-risk text-sm">⚠️ {{ dog.riskReason }}</p>
      <p class="text-sm text-ink-soft mt-0.5">
        <template v-if="dog.daysLeft != null"><strong>{{ dog.daysLeft }} days</strong> to find a home. </template>
        Liking {{ dog.name }} notifies {{ dog.source.name }} immediately.
      </p>
    </div>
    <div v-if="dog.adopted" class="mt-4 p-4 rounded-2xl bg-paper-warm border border-line">
      <p class="font-semibold text-sm">🎉 {{ dog.name }} has been adopted!</p>
    </div>

    <!-- compatibility tags -->
    <div class="flex flex-wrap gap-2 mt-4">
      <span v-for="tag in compatTags" :key="tag.label" class="px-3 py-1 rounded-full text-xs font-semibold" :class="tag.cls">
        {{ tag.label }}
      </span>
    </div>

    <!-- bio -->
    <p class="mt-5 text-[15px] leading-relaxed">{{ dog.bio }}</p>

    <!-- story details -->
    <div v-if="dog.quirks || dog.background || dog.idealHome" class="mt-4 space-y-2.5">
      <div v-if="dog.quirks" class="flex gap-2.5 text-sm"><span class="shrink-0">✨</span><p><strong class="font-semibold">Quirks:</strong> <span class="text-ink-soft">{{ dog.quirks }}</span></p></div>
      <div v-if="dog.background" class="flex gap-2.5 text-sm"><span class="shrink-0">📖</span><p><strong class="font-semibold">Background:</strong> <span class="text-ink-soft">{{ dog.background }}</span></p></div>
      <div v-if="dog.idealHome" class="flex gap-2.5 text-sm"><span class="shrink-0">🏡</span><p><strong class="font-semibold">Ideal home:</strong> <span class="text-ink-soft">{{ dog.idealHome }}</span></p></div>
    </div>

    <!-- video -->
    <a
      v-if="dog.videoUrl" :href="dog.videoUrl" target="_blank" rel="noopener"
      class="mt-4 flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-line shadow-card hover:border-brand transition-colors"
    >
      <span class="w-10 h-10 grid place-items-center rounded-full bg-brand text-white text-lg shrink-0">▶</span>
      <span class="text-sm font-semibold">Watch {{ dog.name }}'s video</span>
    </a>

    <!-- health -->
    <section class="mt-5 p-5 bg-card rounded-3xl shadow-card border border-line">
      <h2 class="font-display text-lg font-semibold mb-3">Health & medical</h2>
      <div class="flex flex-wrap gap-2">
        <span class="px-3 py-1 rounded-full text-xs font-semibold" :class="dog.spayNeuter === 'yes' ? 'bg-safe-soft text-safe' : 'bg-paper-warm text-ink-soft'">
          {{ dog.spayNeuter === "yes" ? "✓ Spayed/neutered" : dog.spayNeuter === "scheduled" ? "🗓 Spay/neuter scheduled" : "Not yet fixed" }}
        </span>
        <span class="px-3 py-1 rounded-full text-xs font-semibold" :class="dog.vaccinated ? 'bg-safe-soft text-safe' : 'bg-paper-warm text-ink-soft'">
          {{ dog.vaccinated ? "💉 Vaccinations up to date" : "Vaccinations pending" }}
        </span>
        <span class="px-3 py-1 rounded-full text-xs font-semibold" :class="dog.microchipped ? 'bg-safe-soft text-safe' : 'bg-paper-warm text-ink-soft'">
          {{ dog.microchipped ? "📡 Microchipped" : "No microchip yet" }}
        </span>
      </div>
      <p v-if="dog.medicalNotes" class="mt-3 text-sm text-ink-soft p-3 rounded-xl bg-paper border border-line">
        <strong class="font-semibold text-ink">Medical profile:</strong> {{ dog.medicalNotes }}
      </p>
    </section>

    <!-- pentagon (personalized: needs the visitor's own trait profile) -->
    <ClientOnly>
    <section class="mt-6 p-5 bg-card rounded-3xl shadow-card border border-line">
      <div class="flex items-center justify-between mb-1">
        <h2 class="font-display text-xl font-semibold">Compatibility pentagon</h2>
        <span class="text-sm font-semibold" :class="matchPct(dog) >= 80 ? 'text-safe' : matchPct(dog) >= 60 ? 'text-brand' : 'text-ink-faint'">
          {{ matchPct(dog) }}% match
        </span>
      </div>
      <p class="text-xs text-ink-soft mb-2">{{ dog.name }}'s needs vs. your living conditions — the closer the shapes, the better the fit.</p>
      <PentagonChart :pet="dog.traits" :user="profile.traits" :size="320" />
      <NuxtLink
        to="/account?edit=bio"
        class="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-full bg-paper-warm border border-line text-sm font-semibold hover:bg-line transition-colors"
      >
        <svg viewBox="0 0 24 24" class="w-4 h-4 text-brand" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
        Edit bio
      </NuxtLink>
    </section>
    </ClientOnly>

    <!-- source -->
    <section class="mt-4 p-5 bg-card rounded-3xl shadow-card border border-line">
      <div class="flex items-center gap-3.5 min-w-0">
        <span class="w-11 h-11 grid place-items-center rounded-2xl bg-brand-soft text-xl shrink-0" aria-hidden="true">
          {{ sourceIcons[dog.source.type] }}
        </span>
        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{{ sourceLabels[dog.source.type] }}</p>
          <p class="font-semibold truncate">{{ dog.source.name }}</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-1.5 mt-3.5">
        <span class="px-2.5 py-1 rounded-full bg-paper-warm text-ink-soft text-xs font-semibold">📍 {{ dog.location.city }}</span>
        <span class="px-2.5 py-1 rounded-full bg-paper-warm text-ink-soft text-xs font-semibold">
          {{ dog.adoptionFee > 0 ? `$${dog.adoptionFee} adoption fee` : "Ask about the fee" }}
        </span>
      </div>
      <NuxtLink
        to="/map"
        class="mt-3.5 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-paper-warm border border-line text-sm font-semibold hover:bg-line transition-colors"
      >
        <svg viewBox="0 0 24 24" class="w-4 h-4 text-brand" fill="currentColor"><path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>
        View on map
      </NuxtLink>
    </section>

    <!-- actions (depend on this visitor's liked/applied state) -->
    <ClientOnly>
    <div v-if="!dog.adopted" class="flex items-center justify-center gap-5 mt-7">
      <button class="w-16 h-16 grid place-items-center rounded-full bg-card shadow-pop border border-line text-2xl text-risk hover:scale-110 transition-transform" aria-label="Pass" @click="act('left')">✕</button>

      <!-- not yet liked → Like (stays on page); liked → Rescue; rescued → Message -->
      <button
        v-if="!isLiked"
        class="h-16 px-8 flex items-center gap-2 rounded-full bg-brand shadow-pop text-lg font-semibold text-white hover:scale-105 hover:bg-brand-deep transition-all"
        @click="act('right')"
      >♥ Like {{ dog.name }}</button>
      <button
        v-else-if="!isApplied"
        class="h-16 px-8 flex items-center gap-2.5 rounded-full bg-safe shadow-pop text-lg font-semibold text-white hover:scale-105 hover:opacity-90 transition-all"
        @click="submitApplication(dog.id)"
      >
        <svg viewBox="0 0 24 24" class="w-6 h-6" fill="currentColor" aria-hidden="true"><path d="M6 10.9a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8zM9.9 7.85a2.05 2.05 0 1 1 0-4.1 2.05 2.05 0 0 1 0 4.1zM14.1 7.85a2.05 2.05 0 1 1 0-4.1 2.05 2.05 0 0 1 0 4.1zM18 10.9a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8zM12 10.8c2.8 0 5.6 2.4 5.6 5.2 0 2-1.6 3.2-3.4 3.2-.85 0-1.5-.4-2.2-.4-.7 0-1.35.4-2.2.4-1.8 0-3.4-1.2-3.4-3.2 0-2.8 2.8-5.2 5.6-5.2z"/></svg>
        Rescue
      </button>
      <button
        v-else
        class="h-16 px-8 flex items-center gap-2.5 rounded-full bg-brand shadow-pop text-lg font-semibold text-white hover:scale-105 hover:bg-brand-deep transition-all"
        @click="messageOpen = true"
      >
        <svg viewBox="0 0 24 24" class="w-6 h-6" fill="currentColor" aria-hidden="true"><path d="M5 3h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9.5L4 21.5V5a2 2 0 0 1 1-2z"/><path d="M7.5 8h9v1.7h-9zM7.5 11.3h6v1.7h-6z" fill="rgb(var(--c-brand))"/></svg>
        Message
      </button>
    </div>
    <p v-if="isApplied && !dog.adopted" class="text-center text-xs text-ink-soft mt-3">
      {{ dog.source.name }} has been notified — message them{{ isPartnerOrg ? " to coordinate the transfer" : " to set up a meet" }}.
    </p>

    <MessageSheet :open="messageOpen" :dog="dog" @close="messageOpen = false" />
    </ClientOnly>
    </div>
  </div>

  <div v-else class="max-w-md mx-auto px-4 pt-20 text-center">
    <p class="text-5xl mb-3">🐾</p>
    <p class="font-semibold">Couldn't find that pup.</p>
    <NuxtLink to="/" class="text-brand font-semibold underline">Back to swiping</NuxtLink>
  </div>
</template>
