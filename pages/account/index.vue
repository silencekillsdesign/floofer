<script setup lang="ts">
import type { TraitPentagon, UserType } from "~/types";

const { dogs, profile, matchPct, toggleAdopted, dataSource, liveStatus, liveError, liveDogs, loadLive } = useStore();

const liveRiskCount = computed(() => liveDogs.value.filter((d) => d.risk === "high").length);

const sourceOptions: { v: "demo" | "rescuegroups" | "petfinder"; label: string }[] = [
  { v: "demo", label: "🧸 Demo dogs" },
  { v: "rescuegroups", label: "🚨 RescueGroups.org" },
  { v: "petfinder", label: "🐾 Petfinder" },
];

const userTypes: { v: UserType; label: string; icon: string; blurb: string }[] = [
  { v: "adopter", label: "Adopter", icon: "🏠", blurb: "Looking to adopt" },
  { v: "shelter", label: "Shelter", icon: "🏥", blurb: "Non-kill shelter org" },
  { v: "foster", label: "Foster", icon: "🛋️", blurb: "Foster home" },
  { v: "individual", label: "Rehoming", icon: "👤", blurb: "Individual rehoming a pet" },
  { v: "retirement", label: "Retirement", icon: "🌅", blurb: "Pet retirement community" },
];

/* Dogs "managed" by the current org type (demo: match on source.type). */
const managedDogs = computed(() =>
  profile.value.userType === "adopter"
    ? []
    : dogs.value.filter((d) => d.source.type === profile.value.userType),
);

const TRAIT_META: { key: keyof TraitPentagon; label: string; low: string; high: string }[] = [
  { key: "energy", label: "Household activity", low: "Quiet", high: "Always moving" },
  { key: "space", label: "Home space", low: "Studio apt", high: "Acreage" },
  { key: "social", label: "Household busyness", low: "Just me", high: "Kids & guests" },
  { key: "independence", label: "Hours away", low: "Always home", high: "Long days out" },
  { key: "training", label: "Dog experience", low: "First-timer", high: "Pro handler" },
];

const records = [
  { name: "Vaccination records — Scout.pdf", date: "Jun 12, 2026", size: "1.2 MB" },
  { name: "Spay-neuter certificate — Pearl.pdf", date: "May 30, 2026", size: "640 KB" },
  { name: "Home check report.pdf", date: "May 2, 2026", size: "2.1 MB" },
];

/* Personal info shows read-only until "Edit profile"; edits go to a draft so
   Cancel can discard them. */
const editing = ref(false);
const saved = ref(false);
const draft = reactive({ name: "", email: "", city: "" });

function startEdit() {
  draft.name = profile.value.name;
  draft.email = profile.value.email;
  draft.city = profile.value.city;
  editing.value = true;
  saved.value = false;
}
function saveEdit() {
  profile.value.name = draft.name.trim() || profile.value.name;
  profile.value.email = draft.email.trim() || profile.value.email;
  profile.value.city = draft.city.trim() || profile.value.city;
  editing.value = false;
  saved.value = true;
  setTimeout(() => (saved.value = false), 1800);
}
function cancelEdit() {
  editing.value = false;
}

/* Arriving from a pet's "Edit bio" button: focus the living-conditions card. */
const route = useRoute();
const bioSaved = ref(false);
const highlightBio = ref(false);

function saveBio() {
  bioSaved.value = true;
  highlightBio.value = false;
}

onMounted(() => {
  if (route.query.edit !== "bio") return;
  // let the router finish its own scroll-to-top before we scroll to the card
  setTimeout(() => {
    document.getElementById("living-conditions")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    highlightBio.value = true;
    setTimeout(() => (highlightBio.value = false), 2600);
  }, 250);
});
</script>

<template>
  <div class="w-full max-w-5xl mx-auto px-4 pt-4 pb-24 sm:pt-5 sm:pb-10">
    <h1 class="font-display text-2xl font-semibold mb-1">Account</h1>
    <p class="text-sm text-ink-soft mb-5">Your dashboard changes with your role — switch below to preview each experience.</p>

    <!-- user type switcher -->
    <div class="mb-6 max-w-sm">
      <span class="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1.5">Account type</span>
      <AppSelect
        v-model="profile.userType"
        :options="userTypes.map((t) => ({ value: t.v, label: t.label, icon: t.icon, hint: t.blurb }))"
        aria-label="Account type"
      />
    </div>

    <div class="grid md:grid-cols-2 gap-5">
      <!-- ==== Data source (all types) ==== -->
      <section class="min-w-0 p-5 bg-card rounded-3xl shadow-card border border-line md:col-span-2">
        <h2 class="font-display text-lg font-semibold mb-1">Data source</h2>
        <p class="text-xs text-ink-soft mb-3">
          Live modes pull adoptable dogs within 50 miles of Chicago. RescueGroups includes real euthanasia-risk data; Petfinder has the largest inventory (at-risk = long-stay listings).
        </p>
        <div class="flex flex-col sm:flex-row gap-2 max-w-xl">
          <button
            v-for="opt in sourceOptions"
            :key="opt.v"
            class="flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold border transition-colors"
            :class="dataSource === opt.v ? 'bg-brand text-white border-brand' : 'bg-card border-line text-ink-soft hover:border-ink-faint'"
            @click="dataSource = opt.v"
          >{{ opt.label }}</button>
        </div>
        <div v-if="dataSource !== 'demo'" class="mt-3 text-sm">
          <p v-if="liveStatus === 'loading'" class="text-ink-soft">⏳ Fetching adoptable dogs near Chicago…</p>
          <p v-else-if="liveStatus === 'ready'" class="text-safe font-semibold">
            ✓ {{ liveDogs.length }} real adoptable dogs loaded<span v-if="liveRiskCount"> · <span class="text-risk">{{ liveRiskCount }} flagged at-risk</span></span>
          </p>
          <div v-else-if="liveStatus === 'error'" class="p-3 rounded-xl bg-risk-soft border border-risk/25">
            <p class="font-semibold text-risk text-xs">{{ liveError }}</p>
            <p class="text-xs text-ink-soft mt-1">
              Showing demo dogs meanwhile.
              <template v-if="dataSource === 'petfinder'">
                Get free credentials at
                <a href="https://www.petfinder.com/developers/" target="_blank" rel="noopener" class="text-brand font-semibold underline">petfinder.com/developers</a>
                — instant signup, then set <code class="font-mono">NUXT_PETFINDER_API_KEY</code> and <code class="font-mono">NUXT_PETFINDER_SECRET</code> in <code class="font-mono">.env</code>,
              </template>
              <template v-else>
                Get a free key at
                <a href="https://rescuegroups.org/services/adoptable-pet-data-api/" target="_blank" rel="noopener" class="text-brand font-semibold underline">rescuegroups.org</a>
                and set <code class="font-mono">NUXT_RESCUEGROUPS_API_KEY</code> in <code class="font-mono">.env</code>,
              </template>
              restart the dev server, then
              <button class="text-brand font-semibold underline" @click="loadLive(true)">retry</button>.
            </p>
          </div>
        </div>
      </section>

      <!-- ==== Personal info + payment (all types) ==== -->
      <section class="min-w-0 p-5 bg-card rounded-3xl shadow-card border border-line md:col-span-2">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 class="font-display text-lg font-semibold">{{ profile.userType === "adopter" ? "Personal info" : "Organization info" }}</h2>
          <span v-if="saved" class="text-sm font-semibold text-safe">Saved ✓</span>
        </div>

        <!-- view mode: rows only, payment stays tucked away until editing -->
        <template v-if="!editing">
          <dl class="divide-y divide-line/60">
            <div class="flex items-center justify-between gap-4 py-2.5">
              <dt class="text-xs font-semibold uppercase tracking-wide text-ink-soft">Name</dt>
              <dd class="text-sm font-semibold text-right truncate">{{ profile.name }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4 py-2.5">
              <dt class="text-xs font-semibold uppercase tracking-wide text-ink-soft">Email</dt>
              <dd class="text-sm font-semibold text-right truncate">{{ profile.email }}</dd>
            </div>
            <div class="flex items-center justify-between gap-4 py-2.5">
              <dt class="text-xs font-semibold uppercase tracking-wide text-ink-soft">Location</dt>
              <dd class="text-sm font-semibold text-right truncate">{{ profile.city }}</dd>
            </div>
          </dl>
          <button
            class="mt-3 w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full border border-line text-sm font-semibold text-ink-soft hover:border-ink-faint transition-colors"
            @click="startEdit"
          >
            <svg viewBox="0 0 24 24" class="w-4 h-4 text-brand" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
            Edit bio
          </button>
        </template>

        <!-- edit mode: fields + payment method -->
        <div v-else class="space-y-3">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1" for="p-name">Name</label>
            <input id="p-name" v-model="draft.name" class="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm font-medium" />
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1" for="p-email">Email</label>
            <input id="p-email" v-model="draft.email" type="email" class="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm font-medium" />
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1" for="p-city">Location</label>
            <input id="p-city" v-model="draft.city" class="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm font-medium" />
          </div>

          <!-- payment only surfaces while the bio form is open -->
          <div class="pt-3 mt-1 border-t border-line/60">
            <h3 class="text-xs font-semibold uppercase tracking-wide text-ink-soft mb-3">
              {{ profile.userType === "adopter" ? "Payment method" : "Payout & donations" }}
            </h3>
            <div class="sm:max-w-xs">
              <div v-if="profile.payment" class="p-4 rounded-2xl bg-gradient-to-br from-[#1E2A44] to-[#0B1626] text-white border border-line mb-3">
                <p class="text-xs uppercase tracking-widest opacity-70 mb-4">{{ profile.userType === "adopter" ? "Adoption fees & donations" : "Receiving account" }}</p>
                <p class="font-mono text-lg tracking-wider">•••• •••• •••• {{ profile.payment.last4 }}</p>
                <div class="flex justify-between text-xs mt-2 opacity-80">
                  <span>{{ profile.payment.brand }}</span><span>Exp {{ profile.payment.exp }}</span>
                </div>
              </div>
            </div>
            <p class="text-xs text-ink-faint mb-3">Demo data — a real build would tokenize via Stripe; card numbers never touch the app.</p>
            <button class="w-full sm:w-auto px-5 py-2.5 rounded-full border border-line text-sm font-semibold text-ink-soft hover:border-ink-faint">Update payment method</button>
          </div>

          <div class="flex flex-col sm:flex-row gap-2 pt-1">
            <button class="px-5 py-2.5 rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-deep transition-colors" @click="saveEdit">Save changes</button>
            <button class="px-5 py-2.5 rounded-full border border-line text-sm font-semibold text-ink-soft hover:border-ink-faint" @click="cancelEdit">Cancel</button>
          </div>
        </div>
      </section>

      <!-- ==== Adopter: living conditions ==== -->
      <section
        v-if="profile.userType === 'adopter'"
        id="living-conditions"
        class="min-w-0 p-5 bg-card rounded-3xl shadow-card border md:col-span-2 transition-all duration-500 scroll-mt-20"
        :class="highlightBio ? 'border-brand ring-[3px] ring-brand/25' : 'border-line'"
      >
        <h2 class="font-display text-lg font-semibold mb-1">Your living conditions</h2>
        <p class="text-xs text-ink-soft mb-4">These five sliders are your side of the pentagon — every match % in the app updates live as you move them.</p>
        <div class="grid grid-cols-1 md:grid-cols-[1fr,320px] gap-6 items-center">
          <div class="space-y-4">
            <div v-for="t in TRAIT_META" :key="t.key">
              <label class="flex justify-between text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1" :for="`tr-${t.key}`">
                <span>{{ t.label }}</span><span class="text-brand">{{ profile.traits[t.key] }}/10</span>
              </label>
              <input :id="`tr-${t.key}`" v-model.number="profile.traits[t.key]" type="range" min="1" max="10" />
              <div class="flex justify-between text-[10px] text-ink-faint mt-0.5"><span>{{ t.low }}</span><span>{{ t.high }}</span></div>
            </div>
          </div>
          <div class="w-full max-w-[300px] mx-auto md:mx-0">
            <PentagonChart :pet="profile.traits" :user="null" :size="300" :show-legend="false" />
          </div>
        </div>

        <!-- save, then offer the way back to matches -->
        <div class="flex flex-col sm:flex-row gap-2.5 mt-5 pt-4 border-t border-line/60">
          <button
            class="px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
            :class="bioSaved ? 'bg-safe-soft text-safe border border-safe/30' : 'bg-brand text-white hover:bg-brand-deep'"
            @click="saveBio"
          >{{ bioSaved ? "Saved ✓" : "Save bio" }}</button>
          <NuxtLink
            v-if="bioSaved"
            to="/matches"
            class="px-5 py-2.5 rounded-full bg-paper-warm text-sm font-semibold text-center hover:bg-line transition-colors"
          >← Back to matches</NuxtLink>
        </div>
        <p v-if="bioSaved" class="text-xs text-ink-soft mt-2">Bio saved — every match % has been recalculated.</p>
      </section>

      <!-- ==== Org types: managed pets ==== -->
      <section v-if="managedDogs.length" class="min-w-0 p-5 bg-card rounded-3xl shadow-card border border-line md:col-span-2">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 class="font-display text-lg font-semibold">Pets you manage</h2>
          <NuxtLink to="/account/new-pet" class="px-4 py-2 rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-deep">+ List a pet</NuxtLink>
        </div>

        <!-- mobile: card list -->
        <div class="md:hidden space-y-2.5">
          <div v-for="d in managedDogs" :key="d.id" class="flex items-center gap-3 p-3 rounded-2xl border border-line bg-paper">
            <NuxtLink :to="`/pet/${d.id}`" class="w-12 h-12 rounded-xl overflow-hidden shrink-0">
              <DogPhoto :src="d.photos[0]" :alt="d.name" />
            </NuxtLink>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                <NuxtLink :to="`/pet/${d.id}`" class="font-semibold truncate min-w-0 hover:text-brand">{{ d.name }}</NuxtLink>
                <RiskBadge :dog="d" />
              </div>
              <p class="text-xs text-ink-faint mt-0.5">{{ 40 + d.name.length * 17 }} views · {{ 3 + d.name.length }} likes</p>
            </div>
            <button
              class="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
              :class="d.adopted ? 'border-line text-ink-faint hover:text-ink' : 'bg-safe text-white border-safe hover:opacity-90'"
              @click="toggleAdopted(d.id)"
            >{{ d.adopted ? "Relist" : "Adopted ✓" }}</button>
          </div>
        </div>

        <!-- desktop: table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-sm min-w-[560px]">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wide text-ink-soft border-b border-line">
                <th class="py-2 pr-3">Pet</th><th class="py-2 pr-3">Status</th><th class="py-2 pr-3">Match views</th><th class="py-2 pr-3">Likes</th><th class="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in managedDogs" :key="d.id" class="border-b border-line/60">
                <td class="py-2.5 pr-3">
                  <NuxtLink :to="`/pet/${d.id}`" class="flex items-center gap-2.5 font-semibold hover:text-brand">
                    <span class="w-9 h-9 rounded-full overflow-hidden shrink-0"><DogPhoto :src="d.photos[0]" :alt="d.name" /></span>
                    {{ d.name }}
                  </NuxtLink>
                </td>
                <td class="py-2.5 pr-3"><RiskBadge :dog="d" detailed /></td>
                <td class="py-2.5 pr-3 text-ink-soft">{{ 40 + d.name.length * 17 }}</td>
                <td class="py-2.5 pr-3 text-ink-soft">{{ 3 + d.name.length }}</td>
                <td class="py-2.5">
                  <button
                    class="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                    :class="d.adopted ? 'border-line text-ink-faint hover:text-ink' : 'bg-safe text-white border-safe hover:opacity-90'"
                    @click="toggleAdopted(d.id)"
                  >{{ d.adopted ? "Relist" : "Mark adopted" }}</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-xs text-ink-faint mt-3">Marking a pet adopted disables its card on every adopter's matches page instantly.</p>
      </section>

      <!-- ==== Records ==== -->
      <section class="min-w-0 p-5 bg-card rounded-3xl shadow-card border border-line" :class="profile.userType === 'adopter' ? '' : 'md:col-span-2'">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 class="font-display text-lg font-semibold">{{ profile.userType === "adopter" ? "My documents" : "Pet records" }}</h2>
          <button class="px-4 py-2 rounded-full border border-line text-sm font-semibold text-ink-soft hover:border-ink-faint">Upload</button>
        </div>
        <ul class="divide-y divide-line/60">
          <li v-for="r in records" :key="r.name" class="py-2.5 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="text-lg shrink-0">📄</span>
              <div class="min-w-0">
                <p class="text-sm font-semibold truncate">{{ r.name }}</p>
                <p class="text-xs text-ink-faint">{{ r.date }} · {{ r.size }}</p>
              </div>
            </div>
            <button class="text-xs font-semibold text-brand hover:underline shrink-0">Download</button>
          </li>
        </ul>
      </section>

      <!-- ==== Adopter: photo gallery placeholder ==== -->
      <section v-if="profile.userType === 'adopter'" class="min-w-0 p-5 bg-card rounded-3xl shadow-card border border-line">
        <h2 class="font-display text-lg font-semibold mb-1">Home photos</h2>
        <p class="text-xs text-ink-soft mb-3">Shelters review these during home checks — yard, fencing, and where the dog would sleep.</p>
        <PhotoUploader v-model="profile.homePhotos" :max="6" :show-primary="false" />
      </section>

      <!-- ==== Adopter: photos of pets already in the home ==== -->
      <section v-if="profile.userType === 'adopter'" class="min-w-0 p-5 bg-card rounded-3xl shadow-card border border-line">
        <h2 class="font-display text-lg font-semibold mb-1">Pet photos</h2>
        <p class="text-xs text-ink-soft mb-3">Pets already living with you. Rescues check these when assessing whether a dog will get along with your crew.</p>
        <PhotoUploader v-model="profile.petPhotos" :max="6" :show-primary="false" />
      </section>
    </div>
  </div>
</template>
