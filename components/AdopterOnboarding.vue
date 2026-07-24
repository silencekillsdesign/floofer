<script setup lang="ts">
/* First-run wizard for individual/family adopters looking to permanently
   place a dog. Deliberately adds NO new fields: every answer writes into the
   Profile the account page already edits, so onboarding is a guided first pass
   over existing data rather than a parallel copy of it. Questions that map to
   two stored fields (hours alone, experience) are asked ONCE here and fanned
   out on save — see `commit()`. */
import { DOG_BREEDS } from "~/data/dogs";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const { profile } = useStore();
const filters = useFilters();

const STEPS = ["Welcome", "Your home", "Your household", "Your days", "Your experience", "Your search"];
const step = ref(0);
const pct = computed(() => Math.round(((step.value + 1) / STEPS.length) * 100));

/* Draft copy — nothing touches the real profile until Finish, so backing out
   mid-wizard can't leave a half-answered profile behind. */
const d = reactive({
  name: "",
  city: "",
  phone: "",
  dwelling: "" as "" | "house" | "apartment" | "condo" | "farm" | "other",
  ownership: "" as "" | "own" | "rent" | "family",
  fencedYard: "" as "" | "yes" | "no",
  residents: 1,
  childrenAges: "",
  currentPets: "",
  activity: 6,
  hoursAlone: 4,
  experience: 2, // 0 first-timer … 3 pro
  breed: "all",
  size: "all" as "all" | "small" | "medium" | "large",
  atRiskFirst: true,
});

/* Seed from whatever the profile already holds so a returning user isn't
   retyping, and re-seed each time the wizard opens. */
watch(
  () => props.open,
  (o) => {
    if (!o) return;
    step.value = 0;
    const p = profile.value;
    d.name = p.name;
    d.city = p.city;
    d.phone = p.phone;
    d.dwelling = p.adoption.housing.dwelling;
    d.ownership = p.adoption.housing.ownership;
    d.fencedYard = p.adoption.housing.fencedYard;
    d.residents = p.adoption.household.residents;
    d.childrenAges = p.adoption.household.childrenAges;
    d.currentPets = p.adoption.vet.currentPets;
    d.activity = p.traits.energy;
    d.hoursAlone = p.adoption.housing.hoursAlone;
    d.experience = p.adoption.firstTimeOwner ? 0 : Math.round((p.traits.training - 1) / 3);
    d.breed = filters.value.breed;
    d.size = filters.value.size;
  },
  { immediate: true },
);

const EXPERIENCE = [
  { label: "First-time owner", hint: "This would be my first dog" },
  { label: "Some experience", hint: "I've had a dog before" },
  { label: "Experienced", hint: "I've raised several dogs" },
  { label: "Very experienced", hint: "I've handled training or behavior cases" },
];

const DWELLINGS = [
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condo / townhome" },
  { value: "farm", label: "Farm / acreage" },
  { value: "other", label: "Other" },
];

/* "all" is the sentinel Filters uses for an unset breed — not "". */
const breedOptions = computed(() => [
  { value: "all", label: "Open to any breed" },
  ...DOG_BREEDS.map((b) => ({ value: b, label: b })),
]);

/* --- derive the pentagon from plain-language answers ---
   The trait sliders are the matching engine's input, but "rate your home
   space 1-10" is a question nobody can answer honestly. These map concrete
   answers onto the same 1-10 scale the account page edits directly. */
const SPACE_BY_DWELLING: Record<string, number> = { apartment: 2, condo: 4, house: 7, farm: 10, other: 5 };

function derivedSpace() {
  const base = SPACE_BY_DWELLING[d.dwelling] ?? 5;
  return Math.min(10, base + (d.fencedYard === "yes" ? 2 : 0));
}
/* Busyness climbs with people, again with kids, again with resident pets. */
function derivedSocial() {
  const kids = d.childrenAges.trim() ? 2 : 0;
  const pets = d.currentPets.trim() ? 1 : 0;
  return Math.max(1, Math.min(10, 2 + Math.min(4, d.residents) + kids + pets));
}
/* 0h empty → velcro dog is fine (1); 12h+ → needs a genuinely independent dog. */
function derivedIndependence() {
  return Math.max(1, Math.min(10, Math.round(1 + (d.hoursAlone / 12) * 9)));
}
/* Handler skill on the same 1-10 axis a dog's training need uses. */
function derivedTraining() {
  return [2, 4, 7, 10][d.experience] ?? 5;
}

const preview = computed(() => ({
  energy: d.activity,
  space: derivedSpace(),
  social: derivedSocial(),
  independence: derivedIndependence(),
  training: derivedTraining(),
}));

function commit() {
  const p = profile.value;
  p.name = d.name.trim() || p.name;
  p.city = d.city.trim() || p.city;
  p.phone = d.phone.trim();
  p.traits = { ...preview.value };

  p.adoption.housing.dwelling = d.dwelling;
  p.adoption.housing.ownership = d.ownership;
  p.adoption.housing.fencedYard = d.fencedYard;
  /* Asked once as hours; stored both as the exact number rescues want on a
     form and as the pentagon axis the matcher scores against. */
  p.adoption.housing.hoursAlone = d.hoursAlone;
  p.adoption.household.residents = d.residents;
  p.adoption.household.childrenAges = d.childrenAges.trim();
  p.adoption.vet.currentPets = d.currentPets.trim();
  /* Same single answer, second destination — the shelter-facing checkbox. */
  p.adoption.firstTimeOwner = d.experience === 0;

  filters.value.breed = d.breed;
  filters.value.size = d.size;
  filters.value.urgency = d.atRiskFirst ? "high" : "all";

  finish();
}

function finish() {
  profile.value.onboardedAt = new Date().toISOString();
  emit("close");
}

const canAdvance = computed(() => {
  if (step.value === 1) return !!d.dwelling && !!d.ownership;
  return true;
});

function next() {
  if (step.value === STEPS.length - 1) commit();
  else step.value += 1;
}

watch(
  () => props.open,
  (o) => {
    if (import.meta.client) document.body.style.overflow = o ? "hidden" : "";
  },
);
onUnmounted(() => {
  if (import.meta.client) document.body.style.overflow = "";
});

const cardCls =
  "w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-colors";
function pick(active: boolean) {
  return `${cardCls} ${active ? "border-brand bg-brand-soft text-ink" : "border-line bg-paper-warm text-ink-soft hover:border-ink-faint"}`;
}
const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-ink-faint mb-1.5";
const inputCls =
  "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/25";
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[70] bg-paper flex flex-col" role="dialog" aria-modal="true" aria-label="Welcome to Floofer">
      <!-- progress -->
      <div class="shrink-0 px-5 pt-4" style="padding-top: max(1rem, env(safe-area-inset-top))">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            Step {{ step + 1 }} of {{ STEPS.length }}
          </span>
          <button class="text-[12px] font-semibold text-ink-faint hover:text-ink" @click="finish">Skip for now</button>
        </div>
        <div class="h-1.5 rounded-full bg-paper-warm overflow-hidden">
          <div class="h-full rounded-full bg-brand transition-[width] duration-300" :style="{ width: `${pct}%` }" />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-5 pt-6 pb-10 no-scrollbar">
        <div class="mx-auto w-full max-w-md">
          <!-- 0 — welcome -->
          <template v-if="step === 0">
            <p class="text-5xl mb-4">🐾</p>
            <h1 class="font-display text-[28px] font-bold leading-tight mb-2">Let's find the dog who needs you most.</h1>
            <p class="text-sm text-ink-soft leading-relaxed mb-6">
              Floofer surfaces dogs closest to running out of time. Sixty seconds here means we
              can rank them by how well they'd actually fit your home — not just how cute they look.
            </p>
            <div class="space-y-4">
              <div>
                <label :class="labelCls" for="ob-name">Your name</label>
                <input id="ob-name" v-model="d.name" :class="inputCls" placeholder="First and last" />
              </div>
              <div>
                <label :class="labelCls" for="ob-city">Where you live</label>
                <input id="ob-city" v-model="d.city" :class="inputCls" placeholder="Chicago, IL" />
                <p class="text-[11px] text-ink-faint mt-1.5">Sets your search radius. Nothing is shared until you message a rescue.</p>
              </div>
              <div>
                <label :class="labelCls" for="ob-phone">Phone <span class="normal-case font-medium text-ink-faint">(optional)</span></label>
                <input id="ob-phone" v-model="d.phone" type="tel" :class="inputCls" placeholder="(312) 555-0142" />
              </div>
            </div>
          </template>

          <!-- 1 — home -->
          <template v-else-if="step === 1">
            <h2 class="font-display text-2xl font-bold mb-1">Your home</h2>
            <p class="text-sm text-ink-soft mb-6">A 90 lb livestock guardian and a studio apartment are a heartbreak waiting to happen.</p>
            <p :class="labelCls">You live in a…</p>
            <div class="grid grid-cols-2 gap-2 mb-5">
              <button v-for="o in DWELLINGS" :key="o.value" :class="pick(d.dwelling === o.value)" @click="d.dwelling = o.value as any">{{ o.label }}</button>
            </div>
            <p :class="labelCls">And you…</p>
            <div class="grid grid-cols-3 gap-2 mb-5">
              <button :class="pick(d.ownership === 'own')" @click="d.ownership = 'own'">Own it</button>
              <button :class="pick(d.ownership === 'rent')" @click="d.ownership = 'rent'">Rent it</button>
              <button :class="pick(d.ownership === 'family')" @click="d.ownership = 'family'">Live with family</button>
            </div>
            <p v-if="d.ownership === 'rent'" class="text-[12px] text-ink-soft bg-paper-warm border border-line rounded-xl px-3.5 py-2.5 mb-5">
              Most rescues verify with your landlord before approving. You can add their contact later in your adoption profile.
            </p>
            <p :class="labelCls">Fenced yard?</p>
            <div class="grid grid-cols-2 gap-2">
              <button :class="pick(d.fencedYard === 'yes')" @click="d.fencedYard = 'yes'">Yes</button>
              <button :class="pick(d.fencedYard === 'no')" @click="d.fencedYard = 'no'">No</button>
            </div>
          </template>

          <!-- 2 — household -->
          <template v-else-if="step === 2">
            <h2 class="font-display text-2xl font-bold mb-1">Your household</h2>
            <p class="text-sm text-ink-soft mb-6">This is how we filter out dogs who've been flagged as unsafe with kids or other pets.</p>
            <div class="space-y-5">
              <div>
                <label :class="labelCls" for="ob-res">People in the home — {{ d.residents }}</label>
                <input id="ob-res" v-model.number="d.residents" type="range" min="1" max="8" step="1" />
              </div>
              <div>
                <label :class="labelCls" for="ob-kids">Children's ages <span class="normal-case font-medium text-ink-faint">(leave blank if none)</span></label>
                <input id="ob-kids" v-model="d.childrenAges" :class="inputCls" placeholder="e.g. 6 and 11" />
              </div>
              <div>
                <label :class="labelCls" for="ob-pets">Pets already at home <span class="normal-case font-medium text-ink-faint">(leave blank if none)</span></label>
                <input id="ob-pets" v-model="d.currentPets" :class="inputCls" placeholder="e.g. one 4yo cat, spayed" />
              </div>
            </div>
          </template>

          <!-- 3 — days -->
          <template v-else-if="step === 3">
            <h2 class="font-display text-2xl font-bold mb-1">Your days</h2>
            <p class="text-sm text-ink-soft mb-6">Returned adoptions usually come down to one of these two numbers being wrong.</p>
            <div class="space-y-6">
              <div>
                <label :class="labelCls" for="ob-act">How active is your household?</label>
                <input id="ob-act" v-model.number="d.activity" type="range" min="1" max="10" step="1" />
                <div class="flex justify-between text-[11px] font-semibold text-ink-faint mt-1">
                  <span>Homebody</span><span>Trail every weekend</span>
                </div>
              </div>
              <div>
                <label :class="labelCls" for="ob-alone">
                  Hours the home sits empty on a workday — {{ d.hoursAlone }}{{ d.hoursAlone >= 12 ? "+" : "" }}
                </label>
                <input id="ob-alone" v-model.number="d.hoursAlone" type="range" min="0" max="12" step="1" />
                <p class="text-[11px] text-ink-faint mt-1.5">
                  Honest answers here save lives — a separation-anxiety dog placed in an empty house comes back.
                </p>
              </div>
            </div>
          </template>

          <!-- 4 — experience -->
          <template v-else-if="step === 4">
            <h2 class="font-display text-2xl font-bold mb-1">Your experience</h2>
            <p class="text-sm text-ink-soft mb-6">
              There's no wrong answer. Some of the dogs closest to running out of time are labeled
              "project dogs" — they need a match, not a warning label.
            </p>
            <div class="space-y-2">
              <button v-for="(o, i) in EXPERIENCE" :key="o.label" :class="pick(d.experience === i)" @click="d.experience = i">
                <span class="block">{{ o.label }}</span>
                <span class="block text-[12px] font-medium text-ink-faint mt-0.5">{{ o.hint }}</span>
              </button>
            </div>
          </template>

          <!-- 5 — search prefs + pentagon preview -->
          <template v-else>
            <h2 class="font-display text-2xl font-bold mb-1">Your search</h2>
            <p class="text-sm text-ink-soft mb-6">All of this stays changeable from Filters — nothing here is locked in.</p>
            <div class="space-y-5">
              <div>
                <p :class="labelCls">Breed</p>
                <AppSelect v-model="d.breed" :options="breedOptions" aria-label="Preferred breed" searchable />
              </div>
              <div>
                <p :class="labelCls">Size</p>
                <div class="grid grid-cols-4 gap-2">
                  <button v-for="s in (['all', 'small', 'medium', 'large'] as const)" :key="s" :class="pick(d.size === s)" @click="d.size = s">
                    <span class="capitalize">{{ s === "all" ? "Any" : s }}</span>
                  </button>
                </div>
              </div>
              <button
                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors"
                :class="d.atRiskFirst ? 'border-risk bg-risk-soft' : 'border-line bg-paper-warm'"
                @click="d.atRiskFirst = !d.atRiskFirst"
              >
                <span class="text-xl">⚠</span>
                <span class="text-left flex-1">
                  <span class="block text-sm font-bold">Show me at-risk dogs first</span>
                  <span class="block text-[12px] text-ink-soft mt-0.5">Dogs with a countdown. You can widen this any time.</span>
                </span>
                <span class="w-5 h-5 rounded-md grid place-items-center text-white text-xs font-bold" :class="d.atRiskFirst ? 'bg-risk' : 'bg-ink-faint/30'">✓</span>
              </button>

              <div class="pt-2">
                <p :class="labelCls">Your match profile</p>
                <div class="rounded-2xl border border-line bg-card p-4">
                  <!-- single-shape render, same as Account → living conditions -->
                  <PentagonChart :pet="preview" :user="null" :size="280" :show-legend="false" />
                  <p class="text-[12px] text-ink-soft text-center mt-2">
                    Built from your answers. Fine-tune it any time under Account → Your living conditions.
                  </p>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- footer -->
      <div class="shrink-0 border-t border-line bg-paper px-5 py-4 flex items-center gap-3" style="padding-bottom: max(1rem, env(safe-area-inset-bottom))">
        <button
          v-if="step > 0"
          class="px-5 py-3 rounded-full border border-line bg-card text-sm font-semibold text-ink-soft hover:border-ink-faint"
          @click="step -= 1"
        >Back</button>
        <button
          class="flex-1 px-5 py-3 rounded-full bg-brand text-white text-sm font-bold shadow-glow hover:bg-brand-deep disabled:opacity-40 disabled:shadow-none"
          :disabled="!canAdvance"
          @click="next"
        >{{ step === STEPS.length - 1 ? "Start swiping" : "Continue" }}</button>
      </div>
    </div>
  </Teleport>
</template>
