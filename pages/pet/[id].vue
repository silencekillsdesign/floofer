<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const { dogs, profile, matchPct, like, pass, liked, applied, submitApplication } = useStore();

const isLiked = computed(() => !!dog.value && liked.value.includes(dog.value.id));
const isApplied = computed(() => !!dog.value && applied.value.includes(dog.value.id));
/* Post-match CTA depends on who you are: homes file to adopt; partner orgs take the pet in to rehome. */
const isPartnerOrg = computed(() => ["shelter", "retirement"].includes(profile.value.userType));
const actionLabel = computed(() => (isPartnerOrg.value ? "Rehome" : "File for adoption"));
const appliedLabel = computed(() =>
  isPartnerOrg.value ? "Rehome request sent" : "Application filed",
);

const dog = computed(() => dogs.value.find((d) => d.id === route.params.id));
const photoIdx = ref(0);

const sourceLabels = {
  shelter: "No-kill shelter",
  foster: "Foster home",
  individual: "Private rehoming",
  retirement: "Pet retirement community",
};
const sourceIcons = { shelter: "🏥", foster: "🛋️", individual: "👤", retirement: "🌅" };

function act(dir: "left" | "right") {
  if (!dog.value) return;
  dir === "right" ? like(dog.value.id) : pass(dog.value.id);
  router.push(dir === "right" ? "/matches" : "/");
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
    <div class="relative overflow-hidden sm:rounded-3xl sm:shadow-pop" style="aspect-ratio: 4 / 4.4">
      <DogPhoto :src="dog.photos[photoIdx]" :alt="`Photo ${photoIdx + 1} of ${dog.name}`" eager />
      <div class="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
      <button
        class="absolute top-3 left-3 w-10 h-10 grid place-items-center rounded-full bg-black/40 backdrop-blur text-white hover:bg-black/60"
        aria-label="Go back"
        @click="router.back()"
      >
        <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
      </button>
      <div class="absolute top-4 left-16"><RiskBadge :dog="dog" detailed /></div>
      <div class="absolute top-3 right-3"><MatchRing :pct="matchPct(dog)" :size="60" /></div>
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
        <span
          class="shrink-0 px-3.5 py-1.5 rounded-full text-sm font-bold whitespace-nowrap"
          :class="matchPct(dog) >= 80 ? 'bg-safe-soft text-safe' : matchPct(dog) >= 60 ? 'bg-brand-soft text-brand' : 'bg-paper-warm text-ink-soft'"
        >
          {{ matchPct(dog) }}% match
        </span>
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

    <!-- pentagon -->
    <section class="mt-6 p-5 bg-card rounded-3xl shadow-card border border-line">
      <div class="flex items-center justify-between mb-1">
        <h2 class="font-display text-xl font-semibold">Compatibility pentagon</h2>
        <span class="text-sm font-semibold" :class="matchPct(dog) >= 80 ? 'text-safe' : matchPct(dog) >= 60 ? 'text-brand' : 'text-ink-faint'">
          {{ matchPct(dog) }}% match
        </span>
      </div>
      <p class="text-xs text-ink-soft mb-2">{{ dog.name }}'s needs vs. your living conditions — the closer the shapes, the better the fit. Tune yours on the <NuxtLink to="/account" class="text-brand font-semibold underline">account page</NuxtLink>.</p>
      <PentagonChart :pet="dog.traits" :user="profile.traits" :size="320" />
    </section>

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
        class="mt-3.5 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-paper-warm text-sm font-semibold hover:bg-line transition-colors"
      >
        <svg viewBox="0 0 24 24" class="w-4 h-4 text-brand" fill="currentColor"><path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>
        View on map
      </NuxtLink>
    </section>

    <!-- actions -->
    <div v-if="!dog.adopted" class="flex items-center justify-center gap-5 mt-7">
      <button class="w-16 h-16 grid place-items-center rounded-full bg-card shadow-pop border border-line text-2xl text-risk hover:scale-110 transition-transform" aria-label="Pass" @click="act('left')">✕</button>

      <!-- not yet liked → like; liked → role-aware next step; filed → confirmation -->
      <button
        v-if="!isLiked"
        class="h-16 px-8 flex items-center gap-2 rounded-full bg-brand shadow-pop text-lg font-semibold text-white hover:scale-105 hover:bg-brand-deep transition-all"
        @click="act('right')"
      >♥ Like {{ dog.name }}</button>
      <button
        v-else-if="!isApplied"
        class="h-16 px-8 flex items-center gap-2 rounded-full bg-safe shadow-pop text-lg font-semibold text-white hover:scale-105 hover:opacity-90 transition-all"
        @click="submitApplication(dog.id)"
      >{{ isPartnerOrg ? "🏡" : "📋" }} {{ actionLabel }}</button>
      <button
        v-else
        class="h-16 px-8 flex items-center gap-2 rounded-full bg-safe-soft text-safe border border-safe/30 text-lg font-semibold cursor-default"
        disabled
      >✓ {{ appliedLabel }}</button>
    </div>
    <p v-if="isApplied && !dog.adopted" class="text-center text-xs text-ink-soft mt-3">
      {{ dog.source.name }} will review and reach out{{ isPartnerOrg ? " to coordinate the transfer" : " to schedule a meet" }}.
    </p>
    </div>
  </div>

  <div v-else class="max-w-md mx-auto px-4 pt-20 text-center">
    <p class="text-5xl mb-3">🐾</p>
    <p class="font-semibold">Couldn't find that pup.</p>
    <NuxtLink to="/" class="text-brand font-semibold underline">Back to swiping</NuxtLink>
  </div>
</template>
