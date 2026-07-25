<script setup lang="ts">
/* Floofer Plus — a supporter tier, not a paywall.
 *
 * The product's whole argument is that these dogs die because nobody sees
 * them in time. Gating any part of that behind a subscription would mean a
 * dog's chances depend on who paid, so nothing here buys access, speed or
 * priority. Plus funds shelters and the app; what a member gets back is
 * recognition and convenience.
 *
 * Saying that outright is also the strongest thing on the page. "Plus doesn't
 * get you a dog faster" is the sentence that makes the rest believable. */

const { dogs } = useStore();

/* A real dog from the deck, so sponsorship is concrete rather than abstract.
   Falls back gracefully if the deck is empty or still loading. */
const featured = computed(() => {
  const atRisk = dogs.value.filter((d) => d.risk === "high" && !d.adopted && d.adoptionFee > 0);
  return atRisk.sort((a, b) => (a.daysLeft ?? 99) - (b.daysLeft ?? 99))[0] ?? null;
});

const email = ref("");
const joined = ref(false);
const error = ref("");

function notifyMe() {
  const v = email.value.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
    error.value = "That doesn't look like an email address.";
    return;
  }
  /* Recorded on this device only — there's no signup backend yet, and the
     confirmation says so rather than implying a list somewhere. */
  try {
    localStorage.setItem("floofer-plus-interest", JSON.stringify({ email: v, at: new Date().toISOString() }));
  } catch {}
  error.value = "";
  joined.value = true;
}

const INCLUDED = [
  { icon: "💛", title: "Sponsor a dog by name", body: "Cover a specific animal's adoption fee, vaccinations, or a bottle-baby kit. Their card shows it — “fee sponsored by a neighbour” — and a waived fee measurably speeds adoption." },
  { icon: "🏅", title: "Supporter badge", body: "Shelters see you're a member when you message them. It's social proof, not priority — it says you show up, not that you skip ahead." },
  { icon: "📅", title: "Play dates in your calendar", body: "Confirmed meets sync to your calendar with the address and the shelter's direct line already filled in." },
  { icon: "🔔", title: "Alerts that matter", body: "Tell us what you could take on — a senior, a bully breed, a bottle baby — and hear the moment one nearby runs short on time." },
  { icon: "🔎", title: "Saved searches", body: "Keep the filters you actually use instead of rebuilding them every visit." },
  { icon: "📊", title: "Your impact, honestly counted", body: "Dogs you shared that went on to find homes. Reach, not acquisition — nobody gets points for taking an animal." },
];

const NEVER = [
  "Faster access to any dog",
  "Priority in a shelter's queue",
  "Dogs that non-members can't see",
  "The ability to message, apply, or arrange a meet — those are free, always",
  "Payments for adopting or fostering",
];

useSeoMeta({
  title: "Floofer Plus — fund the shelters, not a queue skip",
  description:
    "A supporter membership for Floofer. Plus funds partner shelters and the app. It never buys faster access to a dog — every feature that helps an animal stays free.",
});
</script>

<template>
  <div class="flex-1 overflow-y-auto pb-8">
    <!-- hero -->
    <section class="relative overflow-hidden px-5 pt-8 pb-9 text-center">
      <div class="plus-glow" aria-hidden="true"></div>
      <div class="relative mx-auto max-w-md">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold text-white plus-chip">
          <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="currentColor" aria-hidden="true"><path d="M12 2l2.2 5.6L20 9l-4.4 3.6L17 19l-5-3.2L7 19l1.4-6.4L4 9l5.8-1.4L12 2z"/></svg>
          Floofer Plus
        </span>

        <h1 class="font-display text-[30px] font-bold leading-tight mt-4 mb-3">
          Plus doesn't get you a dog faster.
        </h1>
        <p class="text-[15px] text-ink-soft leading-relaxed">
          It funds the shelters holding the dogs with the least time — and keeps every
          feature that saves one free for everybody, forever.
        </p>

        <p class="mt-5 inline-block px-3 py-1.5 rounded-full bg-paper-warm border border-line text-[12px] font-semibold text-ink-soft">
          Not live yet — here's what it'll be
        </p>
      </div>
    </section>

    <!-- where the money goes -->
    <section class="px-5 py-7 bg-card border-y border-line">
      <div class="mx-auto max-w-md">
        <p class="text-[11px] font-extrabold uppercase tracking-widest text-brand mb-2">Where it goes</p>
        <h2 class="font-display text-xl font-bold mb-4">Most of it leaves us.</h2>

        <div class="flex h-3 rounded-full overflow-hidden mb-3">
          <span class="bg-safe" style="width: 60%"></span>
          <span class="bg-brand" style="width: 30%"></span>
          <span class="bg-ink-faint" style="width: 10%"></span>
        </div>
        <ul class="space-y-2.5">
          <li class="flex items-start gap-2.5">
            <span class="w-2.5 h-2.5 rounded-sm bg-safe mt-1.5 shrink-0"></span>
            <span class="text-sm"><strong>60% to partner shelters</strong><span class="block text-ink-soft text-[13px] leading-relaxed">Paid against real costs — vaccinations, transport, isolation space for a treatable illness.</span></span>
          </li>
          <li class="flex items-start gap-2.5">
            <span class="w-2.5 h-2.5 rounded-sm bg-brand mt-1.5 shrink-0"></span>
            <span class="text-sm"><strong>30% keeps Floofer running</strong><span class="block text-ink-soft text-[13px] leading-relaxed">Hosting, photo storage, and the work of onboarding new shelters.</span></span>
          </li>
          <li class="flex items-start gap-2.5">
            <span class="w-2.5 h-2.5 rounded-sm bg-ink-faint mt-1.5 shrink-0"></span>
            <span class="text-sm"><strong>10% payment fees</strong><span class="block text-ink-soft text-[13px] leading-relaxed">What the card processor takes. Named because pretending otherwise is how trust gets lost.</span></span>
          </li>
        </ul>
      </div>
    </section>

    <!-- sponsorship, made concrete -->
    <section v-if="featured" class="px-5 py-7">
      <div class="mx-auto max-w-md">
        <p class="text-[11px] font-extrabold uppercase tracking-widest text-brand mb-2">The bit that works hardest</p>
        <h2 class="font-display text-xl font-bold mb-1.5">Sponsor a dog by name</h2>
        <p class="text-sm text-ink-soft leading-relaxed mb-4">
          A waived adoption fee measurably shortens how long an animal waits — and waiting is
          what kills them. You can cover one outright.
        </p>

        <div class="flex items-center gap-3.5 p-3.5 rounded-2xl bg-card border border-line">
          <div class="w-16 h-16 rounded-xl overflow-hidden shrink-0">
            <DogPhoto :src="featured.photos[0]" :alt="`Photo of ${featured.name}`" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-display font-semibold text-lg leading-tight">{{ featured.name }}</p>
            <p class="text-xs text-ink-faint truncate">{{ featured.breed }} · {{ featured.source.name }}</p>
            <p v-if="featured.daysLeft != null" class="text-[11px] font-bold text-risk mt-0.5">
              ⚠ {{ featured.daysLeft }} days left
            </p>
          </div>
          <span class="shrink-0 px-3 py-2 rounded-full plus-chip text-white text-xs font-extrabold">
            ${{ featured.adoptionFee }}
          </span>
        </div>
        <p class="text-[11px] text-ink-faint mt-2">
          Sponsorship is open to anyone, member or not. Plus members get it at cost.
        </p>
      </div>
    </section>

    <!-- what's included -->
    <section class="px-5 py-7 bg-card border-y border-line">
      <div class="mx-auto max-w-md">
        <p class="text-[11px] font-extrabold uppercase tracking-widest text-brand mb-2">What you get</p>
        <h2 class="font-display text-xl font-bold mb-4">Recognition and convenience.</h2>
        <ul class="space-y-4">
          <li v-for="f in INCLUDED" :key="f.title" class="flex gap-3">
            <span class="text-lg shrink-0" aria-hidden="true">{{ f.icon }}</span>
            <span>
              <span class="block text-sm font-bold">{{ f.title }}</span>
              <span class="block text-[13px] text-ink-soft leading-relaxed mt-0.5">{{ f.body }}</span>
            </span>
          </li>
        </ul>
      </div>
    </section>

    <!-- what it never buys -->
    <section class="px-5 py-7">
      <div class="mx-auto max-w-md">
        <p class="text-[11px] font-extrabold uppercase tracking-widest text-risk mb-2">What it never buys</p>
        <h2 class="font-display text-xl font-bold mb-1.5">The list that matters more.</h2>
        <p class="text-sm text-ink-soft leading-relaxed mb-4">
          If any of these were for sale, a dog's chances would depend on who paid. They aren't,
          and they won't be.
        </p>
        <ul class="space-y-2">
          <li v-for="n in NEVER" :key="n" class="flex items-start gap-2.5 text-sm">
            <span class="text-risk font-bold mt-px shrink-0" aria-hidden="true">✕</span>
            <span class="text-ink-soft">{{ n }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- notify -->
    <section class="px-5 py-8 bg-card border-t border-line">
      <div class="mx-auto max-w-md text-center">
        <template v-if="!joined">
          <h2 class="font-display text-xl font-bold mb-1.5">Want it when it opens?</h2>
          <p class="text-sm text-ink-soft leading-relaxed mb-4">
            No card, no charge — Plus doesn't exist yet. Leave an address and you'll be asked first.
          </p>
          <div class="flex flex-col sm:flex-row gap-2">
            <label class="sr-only" for="plus-email">Your email</label>
            <input
              id="plus-email" v-model="email" type="email" inputmode="email" autocomplete="email"
              placeholder="you@example.com"
              class="flex-1 rounded-full border border-line bg-paper px-4 py-3 text-sm font-semibold focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/25"
              @keydown.enter.prevent="notifyMe"
            />
            <button
              class="plus-chip px-6 py-3 rounded-full text-white text-sm font-extrabold shadow-glow shrink-0"
              @click="notifyMe"
            >Keep me posted</button>
          </div>
          <p v-if="error" class="text-sm text-risk font-semibold mt-2" role="alert">{{ error }}</p>
        </template>

        <template v-else>
          <p class="text-4xl mb-2">🐾</p>
          <h2 class="font-display text-xl font-bold mb-1.5">Noted — thank you.</h2>
          <p class="text-sm text-ink-soft leading-relaxed">
            Saved on this device for now. Nothing's been charged and no list exists yet;
            when Plus is real, this is the address we'll use.
          </p>
        </template>

        <p class="text-[12px] text-ink-faint leading-relaxed mt-5">
          Everything that helps a dog — browsing, messaging, applying, sharing, play dates,
          Fast-Pass — is free today and stays free.
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.plus-chip {
  background-image: linear-gradient(135deg, rgb(var(--c-brand)), rgb(var(--c-pink)));
}
/* Ambient wash behind the hero, in the same two colours as the nav pill. */
.plus-glow {
  position: absolute;
  inset: -40% 20% auto;
  height: 320px;
  background: radial-gradient(
    circle at 50% 0,
    rgb(var(--c-pink) / 0.28),
    rgb(var(--c-brand) / 0.16) 45%,
    transparent 70%
  );
  filter: blur(50px);
  pointer-events: none;
}
</style>
