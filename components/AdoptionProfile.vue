<script setup lang="ts">
/* Adopter's standing adoption profile, modeled on a humane-society dog
   adoption application. Everything binds straight to the profile and
   auto-persists; sections are native <details> for accessibility. */

const { profile } = useStore();
const a = computed(() => profile.value.adoption);

/* ---------- completeness ---------- */
const checks = computed<{ label: string; done: boolean }[]>(() => {
  const d = a.value;
  return [
    { label: "Phone number", done: !!profile.value.phone.trim() },
    { label: "Primary caregiver", done: !!d.household.caregiver.trim() },
    { label: "Dwelling type", done: !!d.housing.dwelling },
    { label: "Rent or own", done: !!d.housing.ownership },
    {
      label: "Landlord contact",
      done: d.housing.ownership === "own" || (!!d.housing.landlordName.trim() && !!d.housing.landlordPhone.trim()),
    },
    { label: "Pets allowed", done: d.housing.ownership === "own" || !!d.housing.petsAllowed },
    { label: "Fenced yard", done: !!d.housing.fencedYard },
    { label: "Where the dog stays when alone", done: !!d.housing.keptWhenAlone.trim() },
    { label: "Employment", done: !!d.employment.employer.trim() || d.isStudent },
    { label: "Current or past pets", done: d.firstTimeOwner || !!d.vet.currentPets.trim() || !!d.vet.pastPets.trim() },
    { label: "Vet reference", done: d.firstTimeOwner || (!!d.vet.vetName.trim() && !!d.vet.vetPhone.trim()) },
    { label: "Reference-check permission", done: d.vet.allowReferenceCheck },
    { label: "Prepared for vet costs", done: d.vet.financiallyPrepared },
  ];
});
const pct = computed(() => Math.round((checks.value.filter((c) => c.done).length / checks.value.length) * 100));
const missing = computed(() => checks.value.filter((c) => !c.done).map((c) => c.label));

const sectionDone = (labels: string[]) =>
  labels.every((l) => checks.value.find((c) => c.label === l)?.done);

/* ---------- ui helpers ---------- */
const inputCls = "w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/25";
const labelCls = "block text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1";
const chip = (active: boolean) =>
  `px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
    active ? "bg-brand text-white border-brand" : "bg-card border-line text-ink-soft hover:border-ink-faint"
  }`;
const seg = (active: boolean) =>
  `flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
    active ? "bg-brand text-white border-brand" : "bg-card border-line text-ink-soft hover:border-ink-faint"
  }`;

const DWELLINGS = [
  { value: "house", label: "House", icon: "🏠" },
  { value: "apartment", label: "Apartment", icon: "🏢" },
  { value: "condo", label: "Condo / townhome", icon: "🏘️" },
  { value: "farm", label: "Farm / acreage", icon: "🌾" },
  { value: "other", label: "Other", icon: "📍" },
];
</script>

<template>
  <section class="min-w-0 p-5 bg-card rounded-3xl shadow-card border border-line md:col-span-2">
    <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
      <h2 class="font-display text-lg font-semibold">Adoption profile</h2>
      <span class="text-sm font-bold" :class="pct === 100 ? 'text-safe' : 'text-brand'">{{ pct }}% complete</span>
    </div>
    <p class="text-xs text-ink-soft mb-3">
      Rescues review this before approving a meet — complete profiles typically get approved days faster. Changes save automatically.
    </p>

    <!-- completeness bar -->
    <div class="h-2 rounded-full bg-paper-warm overflow-hidden mb-1.5" role="progressbar" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100" aria-label="Adoption profile completeness">
      <div class="h-full rounded-full transition-all duration-500" :class="pct === 100 ? 'bg-safe' : 'bg-brand'" :style="{ width: pct + '%' }" />
    </div>
    <p v-if="missing.length" class="text-[11px] text-ink-faint mb-4">
      Still needed: {{ missing.slice(0, 3).join(" · ") }}<template v-if="missing.length > 3"> · +{{ missing.length - 3 }} more</template>
    </p>
    <p v-else class="text-[11px] text-safe font-semibold mb-4">✓ Ready to apply — rescues can verify everything they need.</p>

    <div class="divide-y divide-line/60">
      <!-- ===== Household ===== -->
      <details class="group py-1">
        <summary class="flex items-center justify-between gap-3 py-3 cursor-pointer list-none select-none">
          <span class="flex items-center gap-2.5 font-semibold"><span aria-hidden="true">👪</span> Household</span>
          <span class="flex items-center gap-2">
            <span v-if="sectionDone(['Primary caregiver'])" class="text-safe text-xs font-bold">✓</span>
            <svg viewBox="0 0 24 24" class="w-4 h-4 text-brand transition-transform group-open:rotate-180" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </span>
        </summary>
        <div class="pb-4 space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label :class="labelCls" for="ap-residents">People in household</label>
              <input id="ap-residents" v-model.number="a.household.residents" type="number" min="1" max="20" :class="inputCls" />
            </div>
            <div>
              <label :class="labelCls" for="ap-children">Children's ages (if any)</label>
              <input id="ap-children" v-model="a.household.childrenAges" :class="inputCls" placeholder="e.g. 6 and 9 — or none" />
            </div>
          </div>
          <div>
            <label :class="labelCls" for="ap-allergies">Any allergies in the household?</label>
            <input id="ap-allergies" v-model="a.household.allergies" :class="inputCls" placeholder="e.g. none / mild pet dander" />
          </div>
          <div>
            <label :class="labelCls" for="ap-caregiver">Who will be responsible for the dog's care?</label>
            <input id="ap-caregiver" v-model="a.household.caregiver" :class="inputCls" placeholder="e.g. me, with the whole family helping" />
          </div>
        </div>
      </details>

      <!-- ===== Home & housing ===== -->
      <details class="group py-1">
        <summary class="flex items-center justify-between gap-3 py-3 cursor-pointer list-none select-none">
          <span class="flex items-center gap-2.5 font-semibold"><span aria-hidden="true">🏡</span> Home & housing</span>
          <span class="flex items-center gap-2">
            <span v-if="sectionDone(['Dwelling type', 'Rent or own', 'Landlord contact', 'Pets allowed', 'Fenced yard', 'Where the dog stays when alone'])" class="text-safe text-xs font-bold">✓</span>
            <svg viewBox="0 0 24 24" class="w-4 h-4 text-brand transition-transform group-open:rotate-180" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </span>
        </summary>
        <div class="pb-4 space-y-3.5">
          <div>
            <span :class="labelCls">Dwelling type</span>
            <AppSelect v-model="a.housing.dwelling" :options="DWELLINGS" aria-label="Dwelling type" />
          </div>
          <div>
            <span :class="labelCls">Do you rent or own?</span>
            <div class="flex gap-2">
              <button :class="seg(a.housing.ownership === 'own')" @click="a.housing.ownership = 'own'">Own</button>
              <button :class="seg(a.housing.ownership === 'rent')" @click="a.housing.ownership = 'rent'">Rent</button>
              <button :class="seg(a.housing.ownership === 'family')" @click="a.housing.ownership = 'family'">With family</button>
            </div>
          </div>
          <template v-if="a.housing.ownership === 'rent' || a.housing.ownership === 'family'">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label :class="labelCls" for="ap-landlord">{{ a.housing.ownership === "rent" ? "Landlord name" : "Homeowner name" }}</label>
                <input id="ap-landlord" v-model="a.housing.landlordName" :class="inputCls" />
              </div>
              <div>
                <label :class="labelCls" for="ap-landlord-phone">Their phone</label>
                <input id="ap-landlord-phone" v-model="a.housing.landlordPhone" type="tel" :class="inputCls" placeholder="(555) 555-5555" />
              </div>
            </div>
            <div>
              <span :class="labelCls">Are pets allowed there?</span>
              <div class="flex gap-2">
                <button :class="seg(a.housing.petsAllowed === 'yes')" @click="a.housing.petsAllowed = 'yes'">Yes</button>
                <button :class="seg(a.housing.petsAllowed === 'no')" @click="a.housing.petsAllowed = 'no'">No</button>
                <button :class="seg(a.housing.petsAllowed === 'unsure')" @click="a.housing.petsAllowed = 'unsure'">Not sure</button>
              </div>
              <p v-if="a.housing.petsAllowed === 'no' || a.housing.petsAllowed === 'unsure'" class="text-xs text-risk font-medium mt-1.5">
                Rescues need written landlord consent (and any pet deposit paid) before an adoption is finalized.
              </p>
            </div>
          </template>
          <div>
            <span :class="labelCls">Securely fenced yard?</span>
            <div class="flex gap-2">
              <button :class="seg(a.housing.fencedYard === 'yes')" @click="a.housing.fencedYard = 'yes'">Yes</button>
              <button :class="seg(a.housing.fencedYard === 'no')" @click="a.housing.fencedYard = 'no'">No</button>
            </div>
            <p class="text-[11px] text-ink-faint mt-1">Some dogs require secure fencing — this helps us match you honestly, not disqualify you.</p>
          </div>
          <div>
            <label class="flex justify-between text-xs font-semibold uppercase tracking-wide text-ink-soft mb-1" for="ap-hours">
              <span>Hours the dog would be alone on a typical day</span>
              <span class="text-brand normal-case">{{ a.housing.hoursAlone }}{{ a.housing.hoursAlone >= 12 ? "+" : "" }} hrs</span>
            </label>
            <input id="ap-hours" v-model.number="a.housing.hoursAlone" type="range" min="0" max="12" step="1" />
          </div>
          <div>
            <label :class="labelCls" for="ap-kept">Where will the dog stay when no one's home?</label>
            <input id="ap-kept" v-model="a.housing.keptWhenAlone" :class="inputCls" placeholder="e.g. free roam indoors / crated in the living room" />
          </div>
          <div>
            <span :class="labelCls">Traffic near your home</span>
            <div class="flex gap-2">
              <button :class="seg(a.housing.traffic === 'light')" @click="a.housing.traffic = 'light'">Light</button>
              <button :class="seg(a.housing.traffic === 'moderate')" @click="a.housing.traffic = 'moderate'">Moderate</button>
              <button :class="seg(a.housing.traffic === 'heavy')" @click="a.housing.traffic = 'heavy'">Heavy</button>
            </div>
          </div>
        </div>
      </details>

      <!-- ===== Work & background ===== -->
      <details class="group py-1">
        <summary class="flex items-center justify-between gap-3 py-3 cursor-pointer list-none select-none">
          <span class="flex items-center gap-2.5 font-semibold"><span aria-hidden="true">💼</span> Work & background</span>
          <span class="flex items-center gap-2">
            <span v-if="sectionDone(['Employment'])" class="text-safe text-xs font-bold">✓</span>
            <svg viewBox="0 0 24 24" class="w-4 h-4 text-brand transition-transform group-open:rotate-180" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </span>
        </summary>
        <div class="pb-4 space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label :class="labelCls" for="ap-employer">Employer</label>
              <input id="ap-employer" v-model="a.employment.employer" :class="inputCls" />
            </div>
            <div>
              <label :class="labelCls" for="ap-occupation">Occupation</label>
              <input id="ap-occupation" v-model="a.employment.occupation" :class="inputCls" />
            </div>
          </div>
          <div>
            <label :class="labelCls" for="ap-years">How long with your current employer?</label>
            <input id="ap-years" v-model="a.employment.years" :class="inputCls" placeholder="e.g. 4 years" />
          </div>
          <div class="flex flex-wrap gap-2">
            <button :class="chip(a.isStudent)" :aria-pressed="a.isStudent" @click="a.isStudent = !a.isStudent">🎓 Student</button>
            <button :class="chip(a.isMilitary)" :aria-pressed="a.isMilitary" @click="a.isMilitary = !a.isMilitary">🎖️ Military</button>
            <button :class="chip(a.firstTimeOwner)" :aria-pressed="a.firstTimeOwner" @click="a.firstTimeOwner = !a.firstTimeOwner">🌱 First-time owner</button>
          </div>
          <p v-if="a.firstTimeOwner" class="text-[11px] text-ink-faint">
            First-timer? No problem — rescues will just ask for personal references instead of a vet history.
          </p>
        </div>
      </details>

      <!-- ===== Pet history & vet reference ===== -->
      <details class="group py-1">
        <summary class="flex items-center justify-between gap-3 py-3 cursor-pointer list-none select-none">
          <span class="flex items-center gap-2.5 font-semibold"><span aria-hidden="true">🩺</span> Pet history & vet reference</span>
          <span class="flex items-center gap-2">
            <span v-if="sectionDone(['Current or past pets', 'Vet reference', 'Reference-check permission', 'Prepared for vet costs'])" class="text-safe text-xs font-bold">✓</span>
            <svg viewBox="0 0 24 24" class="w-4 h-4 text-brand transition-transform group-open:rotate-180" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </span>
        </summary>
        <div class="pb-4 space-y-3.5">
          <div>
            <label :class="labelCls" for="ap-current-pets">Pets currently in your household</label>
            <textarea id="ap-current-pets" v-model="a.vet.currentPets" rows="2" :class="inputCls" placeholder="e.g. Miso, 4yo tabby cat, spayed & vaccinated" />
          </div>
          <div>
            <label :class="labelCls" for="ap-past-pets">Pets you've owned before (and where they are now)</label>
            <textarea id="ap-past-pets" v-model="a.vet.pastPets" rows="2" :class="inputCls" placeholder="e.g. Rex, lab mix, passed of old age in 2022" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span :class="labelCls">Pets current on vaccinations?</span>
              <div class="flex gap-2">
                <button :class="seg(a.vet.petsVaccinated === 'yes')" @click="a.vet.petsVaccinated = 'yes'">Yes</button>
                <button :class="seg(a.vet.petsVaccinated === 'no')" @click="a.vet.petsVaccinated = 'no'">No</button>
              </div>
            </div>
            <div>
              <span :class="labelCls">Pets spayed / neutered?</span>
              <div class="flex gap-2">
                <button :class="seg(a.vet.petsFixed === 'yes')" @click="a.vet.petsFixed = 'yes'">Yes</button>
                <button :class="seg(a.vet.petsFixed === 'no')" @click="a.vet.petsFixed = 'no'">No</button>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label :class="labelCls" for="ap-vet-name">Veterinarian</label>
              <input id="ap-vet-name" v-model="a.vet.vetName" :class="inputCls" placeholder="Clinic or vet's name" />
            </div>
            <div>
              <label :class="labelCls" for="ap-vet-phone">Vet phone</label>
              <input id="ap-vet-phone" v-model="a.vet.vetPhone" type="tel" :class="inputCls" placeholder="(555) 555-5555" />
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button :class="chip(a.vet.allowReferenceCheck)" :aria-pressed="a.vet.allowReferenceCheck" @click="a.vet.allowReferenceCheck = !a.vet.allowReferenceCheck">
              ✓ Rescues may check my vet reference
            </button>
            <button :class="chip(a.vet.financiallyPrepared)" :aria-pressed="a.vet.financiallyPrepared" @click="a.vet.financiallyPrepared = !a.vet.financiallyPrepared">
              💛 Prepared for annual checkups & medical care
            </button>
          </div>
        </div>
      </details>
    </div>
  </section>
</template>
