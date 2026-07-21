<script setup lang="ts">
import type { Dog, TraitPentagon } from "~/types";
import { CITY_OPTIONS } from "~/data/dogs";

const router = useRouter();
const { profile, addDog } = useStore();

/* Orgs list pets; adopters get redirected to browse. */
if (profile.value.userType === "adopter") {
  navigateTo("/account");
}

const form = reactive({
  // 1 — core
  name: "",
  breed: "",
  secondaryBreed: "",
  age: 2,
  sex: "M" as "M" | "F",
  size: "medium" as Dog["size"],
  weightLbs: 40,
  // 2 — media
  photos: [] as string[],
  videoUrl: "",
  // 3 — compatibility
  goodWithDogs: "yes" as Dog["goodWithDogs"],
  goodWithCats: "no" as Dog["goodWithCats"],
  goodWithKids: "yes" as Dog["goodWithKids"],
  houseTrained: "yes" as Dog["houseTrained"],
  crateTrained: true,
  // 4 — health
  spayNeuter: "yes" as Dog["spayNeuter"],
  vaccinated: true,
  microchipped: true,
  medicalNotes: "",
  // 5 — bio
  tagline: "",
  bio: "",
  quirks: "",
  background: "",
  idealHome: "",
  // 6 — logistics
  city: CITY_OPTIONS[0].city,
  adoptionFee: 250,
  atRisk: false,
  riskReason: "",
  daysLeft: 14,
  // matching pentagon
  traits: { energy: 5, space: 5, social: 5, independence: 5, training: 5 } as TraitPentagon,
});

const TRAIT_META: { key: keyof TraitPentagon; label: string; low: string; high: string }[] = [
  { key: "energy", label: "Energy level", low: "Couch potato", high: "Active athlete" },
  { key: "space", label: "Space needed", low: "Apartment-fine", high: "Needs land" },
  { key: "social", label: "Sociability", low: "Lone wolf", high: "Party animal" },
  { key: "independence", label: "Comfort alone", low: "Velcro dog", high: "Fine solo" },
  { key: "training", label: "Training needs", low: "Turnkey", high: "Project dog" },
];

const errors = ref<string[]>([]);

/* video: capture (mobile camera) or choose a file — kept as an object URL for
   the session; a pasted URL persists like any listing field */
const videoEl = ref<HTMLInputElement | null>(null);
const videoFileName = ref("");
function onVideoPick(e: Event) {
  const el = e.target as HTMLInputElement;
  const f = el.files?.[0];
  if (f) {
    form.videoUrl = URL.createObjectURL(f);
    videoFileName.value = f.name;
  }
  el.value = "";
}
function clearVideo() {
  form.videoUrl = "";
  videoFileName.value = "";
}

function submit() {
  errors.value = [];
  if (!form.name.trim()) errors.value.push("Name is required.");
  if (!form.breed.trim()) errors.value.push("Primary breed is required.");
  if (!form.photos.length) errors.value.push("At least one photo is required — it's the single most important asset.");
  if (!form.tagline.trim()) errors.value.push("A short tagline is required.");
  if (!form.bio.trim()) errors.value.push("The personality bio is required.");
  if (form.atRisk && !form.riskReason.trim()) errors.value.push("At-risk listings need a reason (adopters see it).");
  if (errors.value.length) {
    document.querySelector("#form-errors")?.scrollIntoView({ block: "center" });
    return;
  }

  const loc = CITY_OPTIONS.find((c) => c.city === form.city) ?? CITY_OPTIONS[0];
  const id = `${form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;

  const dog: Dog = {
    id,
    name: form.name.trim(),
    species: "dog",
    breed: form.breed.trim(),
    secondaryBreed: form.secondaryBreed.trim() || undefined,
    age: form.age,
    sex: form.sex,
    size: form.size,
    weightLbs: form.weightLbs,
    photos: form.photos.slice(0, 8),
    videoUrl: form.videoUrl.trim() || undefined,
    goodWithDogs: form.goodWithDogs,
    goodWithCats: form.goodWithCats,
    goodWithKids: form.goodWithKids,
    houseTrained: form.houseTrained,
    crateTrained: form.crateTrained,
    traits: { ...form.traits },
    spayNeuter: form.spayNeuter,
    vaccinated: form.vaccinated,
    microchipped: form.microchipped,
    medicalNotes: form.medicalNotes.trim() || undefined,
    tagline: form.tagline.trim(),
    bio: form.bio.trim(),
    quirks: form.quirks.trim() || undefined,
    background: form.background.trim() || undefined,
    idealHome: form.idealHome.trim() || undefined,
    source: {
      type: profile.value.userType === "adopter" ? "shelter" : profile.value.userType,
      name: profile.value.name,
    },
    location: { ...loc },
    adoptionFee: form.adoptionFee,
    risk: form.atRisk ? "high" : "safe",
    riskReason: form.atRisk ? form.riskReason.trim() : undefined,
    daysLeft: form.atRisk ? form.daysLeft : undefined,
  };

  addDog(dog);
  router.push(`/pet/${id}`);
}

const inputCls = "w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm font-medium";
const labelCls = "block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1";
const segCls = (active: boolean) =>
  `flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors ${
    active ? "bg-brand text-white border-brand" : "bg-card border-line text-ink-soft hover:border-ink-faint"
  }`;
</script>

<template>
  <div class="w-full max-w-2xl mx-auto px-4 pt-4 pb-24 sm:pt-5 sm:pb-10">
    <button class="mb-2 text-sm font-semibold text-ink-soft hover:text-ink" @click="router.back()">← Back to dashboard</button>
    <h1 class="font-display text-2xl font-semibold mb-1">List a pet</h1>
    <p class="text-sm text-ink-soft mb-5">Complete listings get adopted faster — compatibility tags and honest bios drastically cut waiting time.</p>

    <div id="form-errors" v-if="errors.length" class="mb-4 p-4 rounded-2xl bg-risk-soft border border-risk/25">
      <p v-for="e in errors" :key="e" class="text-sm font-semibold text-risk">• {{ e }}</p>
    </div>

    <div class="space-y-5">
      <!-- 1 · Core -->
      <section class="min-w-0 p-5 bg-card rounded-3xl shadow-card border border-line space-y-3">
        <h2 class="font-display text-lg font-semibold">1 · The basics</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label :class="labelCls" for="f-name">Name *</label><input id="f-name" v-model="form.name" :class="inputCls" placeholder="e.g. Hankenstien" /></div>
          <div>
            <span :class="labelCls">Species</span>
            <AppSelect
              model-value="dog"
              :options="[{ value: 'dog', label: 'Dog (cats & more coming)', icon: '🐶' }]"
              aria-label="Species"
              disabled
            />
          </div>
          <div><label :class="labelCls" for="f-breed">Primary breed *</label><input id="f-breed" v-model="form.breed" :class="inputCls" placeholder="Border Collie, or Mixed Breed" /></div>
          <div><label :class="labelCls" for="f-breed2">Secondary breed (guess)</label><input id="f-breed2" v-model="form.secondaryBreed" :class="inputCls" placeholder="Optional" /></div>
          <div>
            <label :class="labelCls" for="f-age">Age — {{ lifeStage({ age: form.age } as any) }}</label>
            <input id="f-age" v-model.number="form.age" type="number" min="0" max="20" step="0.5" :class="inputCls" />
          </div>
          <div>
            <span :class="labelCls">Sex</span>
            <div class="flex gap-2">
              <button :class="segCls(form.sex === 'M')" @click="form.sex = 'M'">♂ Male</button>
              <button :class="segCls(form.sex === 'F')" @click="form.sex = 'F'">♀ Female</button>
            </div>
          </div>
          <div>
            <span :class="labelCls">Size</span>
            <div class="flex gap-2">
              <button v-for="s in ['small', 'medium', 'large']" :key="s" :class="segCls(form.size === s)" @click="form.size = s as any">{{ s[0].toUpperCase() + s.slice(1) }}</button>
            </div>
          </div>
          <div><label :class="labelCls" for="f-weight">Weight (lbs)</label><input id="f-weight" v-model.number="form.weightLbs" type="number" min="1" max="200" :class="inputCls" /></div>
        </div>
      </section>

      <!-- 2 · Media -->
      <section class="min-w-0 p-5 bg-card rounded-3xl shadow-card border border-line space-y-3">
        <h2 class="font-display text-lg font-semibold">2 · Photos & video</h2>
        <p class="text-xs text-ink-soft">A bright, eye-level headshot is the single most important asset. Add up to 8 photos.</p>

        <PhotoUploader v-model="form.photos" :max="8" />

        <div>
          <span :class="labelCls">Video (30–60s clip)</span>
          <div v-if="form.videoUrl" class="flex items-center justify-between gap-3 p-3 rounded-xl bg-paper border border-line">
            <p class="text-sm font-semibold truncate">🎥 {{ videoFileName || form.videoUrl }}</p>
            <button type="button" class="text-xs font-semibold text-risk hover:underline shrink-0" @click="clearVideo">Remove</button>
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <button
              type="button"
              class="px-4 py-2 rounded-full border border-line bg-card text-xs font-semibold text-ink-soft hover:border-ink-faint"
              @click="videoEl?.click()"
            >🎥 Record or choose video</button>
            <input
              v-model="form.videoUrl"
              :class="inputCls + ' flex-1 min-w-[180px]'"
              placeholder="…or paste a video URL"
            />
          </div>
          <p class="text-xs text-ink-faint mt-1">Show them playing, leash walking, or meeting people.</p>
        </div>
        <input ref="videoEl" type="file" accept="video/*" capture="environment" class="hidden" @change="onVideoPick" />
      </section>

      <!-- 3 · Compatibility -->
      <section class="min-w-0 p-5 bg-card rounded-3xl shadow-card border border-line space-y-3">
        <h2 class="font-display text-lg font-semibold">3 · Compatibility & behavior</h2>
        <p class="text-xs text-ink-soft">Adopters filter by these — accurate tags drastically reduce time waiting for a home.</p>
        <div>
          <span :class="labelCls">Good with dogs</span>
          <div class="flex gap-2">
            <button v-for="v in ['yes', 'selective', 'no']" :key="v" :class="segCls(form.goodWithDogs === v)" @click="form.goodWithDogs = v as any">{{ v[0].toUpperCase() + v.slice(1) }}</button>
          </div>
        </div>
        <div>
          <span :class="labelCls">Good with cats</span>
          <div class="flex gap-2">
            <button v-for="v in ['yes', 'selective', 'no']" :key="v" :class="segCls(form.goodWithCats === v)" @click="form.goodWithCats = v as any">{{ v[0].toUpperCase() + v.slice(1) }}</button>
          </div>
        </div>
        <div>
          <span :class="labelCls">Good with children</span>
          <div class="flex gap-2">
            <button :class="segCls(form.goodWithKids === 'yes')" @click="form.goodWithKids = 'yes'">Yes</button>
            <button :class="segCls(form.goodWithKids === 'older')" @click="form.goodWithKids = 'older'">Older kids only</button>
            <button :class="segCls(form.goodWithKids === 'no')" @click="form.goodWithKids = 'no'">No</button>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span :class="labelCls">House trained</span>
            <div class="flex gap-2">
              <button :class="segCls(form.houseTrained === 'yes')" @click="form.houseTrained = 'yes'">Yes</button>
              <button :class="segCls(form.houseTrained === 'in-training')" @click="form.houseTrained = 'in-training'">In training</button>
              <button :class="segCls(form.houseTrained === 'no')" @click="form.houseTrained = 'no'">No</button>
            </div>
          </div>
          <div>
            <span :class="labelCls">Crate trained</span>
            <div class="flex gap-2">
              <button :class="segCls(form.crateTrained)" @click="form.crateTrained = true">Yes</button>
              <button :class="segCls(!form.crateTrained)" @click="form.crateTrained = false">No</button>
            </div>
          </div>
        </div>
      </section>

      <!-- 4 · Health -->
      <section class="min-w-0 p-5 bg-card rounded-3xl shadow-card border border-line space-y-3">
        <h2 class="font-display text-lg font-semibold">4 · Health & medical</h2>
        <div>
          <span :class="labelCls">Spayed / neutered</span>
          <div class="flex gap-2">
            <button :class="segCls(form.spayNeuter === 'yes')" @click="form.spayNeuter = 'yes'">Yes</button>
            <button :class="segCls(form.spayNeuter === 'scheduled')" @click="form.spayNeuter = 'scheduled'">Scheduled</button>
            <button :class="segCls(form.spayNeuter === 'no')" @click="form.spayNeuter = 'no'">No</button>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span :class="labelCls">Vaccinations up to date</span>
            <div class="flex gap-2">
              <button :class="segCls(form.vaccinated)" @click="form.vaccinated = true">Yes</button>
              <button :class="segCls(!form.vaccinated)" @click="form.vaccinated = false">No</button>
            </div>
          </div>
          <div>
            <span :class="labelCls">Active microchip</span>
            <div class="flex gap-2">
              <button :class="segCls(form.microchipped)" @click="form.microchipped = true">Yes</button>
              <button :class="segCls(!form.microchipped)" @click="form.microchipped = false">No</button>
            </div>
          </div>
        </div>
        <div>
          <label :class="labelCls" for="f-med">Medical profile</label>
          <textarea id="f-med" v-model="form.medicalNotes" rows="2" :class="inputCls" placeholder="Ongoing conditions, daily meds, special diet, disabilities — transparency builds trust" />
        </div>
      </section>

      <!-- 5 · Bio -->
      <section class="min-w-0 p-5 bg-card rounded-3xl shadow-card border border-line space-y-3">
        <h2 class="font-display text-lg font-semibold">5 · Personality bio</h2>
        <div><label :class="labelCls" for="f-tag">Tagline *</label><input id="f-tag" v-model="form.tagline" :class="inputCls" placeholder="One memorable line — 'Snores in italics.'" /></div>
        <div><label :class="labelCls" for="f-bio">Bio *</label><textarea id="f-bio" v-model="form.bio" rows="3" :class="inputCls" placeholder="Their story, beyond the checkboxes" /></div>
        <div><label :class="labelCls" for="f-quirks">Quirks & traits</label><input id="f-quirks" v-model="form.quirks" :class="inputCls" placeholder="Vocal? Carries toys? Massive fan of belly rubs?" /></div>
        <div><label :class="labelCls" for="f-bg">Background context</label><input id="f-bg" v-model="form.background" :class="inputCls" placeholder="e.g. transferred from an overcrowded partner shelter" /></div>
        <div><label :class="labelCls" for="f-ideal">Ideal home requirements</label><input id="f-ideal" v-model="form.idealHome" :class="inputCls" placeholder="e.g. fenced yard, no apartments, only pet" /></div>
      </section>

      <!-- Pentagon -->
      <section class="min-w-0 p-5 bg-card rounded-3xl shadow-card border border-line">
        <h2 class="font-display text-lg font-semibold mb-1">Matching pentagon</h2>
        <p class="text-xs text-ink-soft mb-4">These five traits drive the match % adopters see. Score honestly — good matches stick.</p>
        <div class="grid grid-cols-1 md:grid-cols-[1fr,280px] gap-6 items-center">
          <div class="space-y-3">
            <div v-for="t in TRAIT_META" :key="t.key">
              <label class="flex justify-between text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1" :for="`pt-${t.key}`">
                <span>{{ t.label }}</span><span class="text-brand">{{ form.traits[t.key] }}/10</span>
              </label>
              <input :id="`pt-${t.key}`" v-model.number="form.traits[t.key]" type="range" min="1" max="10" />
              <div class="flex justify-between text-[10px] text-ink-faint mt-0.5"><span>{{ t.low }}</span><span>{{ t.high }}</span></div>
            </div>
          </div>
          <div class="w-full max-w-[280px] mx-auto md:mx-0">
            <PentagonChart :pet="form.traits" :user="null" :size="280" :show-legend="false" />
          </div>
        </div>
      </section>

      <!-- 6 · Logistics -->
      <section class="min-w-0 p-5 bg-card rounded-3xl shadow-card border border-line space-y-3">
        <h2 class="font-display text-lg font-semibold">6 · Location, fee & urgency</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span :class="labelCls">Pet's location</span>
            <AppSelect
              v-model="form.city"
              :options="CITY_OPTIONS.map((c) => ({ value: c.city, label: c.city, icon: '📍' }))"
              aria-label="Pet's location"
            />
          </div>
          <div>
            <label :class="labelCls" for="f-fee">Adoption fee ($ — 0 = fee waived)</label>
            <input id="f-fee" v-model.number="form.adoptionFee" type="number" min="0" max="1000" step="25" :class="inputCls" />
          </div>
        </div>
        <p class="text-xs text-ink-faint">Listed by <strong>{{ profile.name }}</strong> ({{ profile.userType }}).</p>

        <div class="p-4 rounded-2xl border" :class="form.atRisk ? 'bg-risk-soft border-risk/30' : 'bg-paper border-line'">
          <label class="flex items-center justify-between gap-3 cursor-pointer">
            <span>
              <span class="block text-sm font-semibold" :class="form.atRisk ? 'text-risk' : ''">⚠ Flag as at-risk</span>
              <span class="block text-xs text-ink-soft">At-risk pets surface first in every adopter's deck and pulse red on the map.</span>
            </span>
            <input v-model="form.atRisk" type="checkbox" class="w-5 h-5 accent-[#FF4D42] shrink-0" />
          </label>
          <div v-if="form.atRisk" class="grid grid-cols-1 sm:grid-cols-[1fr,140px] gap-3 mt-3">
            <div><label :class="labelCls" for="f-riskwhy">Reason (shown to adopters) *</label><input id="f-riskwhy" v-model="form.riskReason" :class="inputCls" placeholder="e.g. Shelter over capacity — transfer list" /></div>
            <div><label :class="labelCls" for="f-days">Days left</label><input id="f-days" v-model.number="form.daysLeft" type="number" min="1" max="90" :class="inputCls" /></div>
          </div>
        </div>
      </section>

      <div class="flex flex-col sm:flex-row gap-3">
        <button class="flex-1 py-3.5 rounded-full bg-brand text-white font-semibold shadow-glow hover:bg-brand-deep transition-colors" @click="submit">
          Publish listing 🐾
        </button>
        <button class="py-3.5 px-6 rounded-full border border-line text-sm font-semibold text-ink-soft hover:border-ink-faint" @click="router.back()">Cancel</button>
      </div>
    </div>
  </div>
</template>
