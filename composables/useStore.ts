import { get as idbGet, set as idbSet } from "idb-keyval";
import type { Dog, Filters, Profile, TraitPentagon } from "~/types";
import { DOGS } from "~/data/dogs";

/* Storage is split by weight: localStorage keeps the small, hot state so the
   deck hydrates synchronously on first paint, while base64 photos (which blow
   past the ~5MB localStorage quota) live in IndexedDB and merge in a tick later. */
const LS_KEY = "rescue-match-v1";
const IDB_PHOTOS_KEY = "floofer-photos-v1";

interface PhotoStore {
  homePhotos: string[];
  petPhotos: string[];
  dogPhotos: Record<string, string[]>;
}

const isInline = (src: string) => src.startsWith("data:");
const withoutInline = (arr: string[] = []) => arr.filter((p) => !isInline(p));

export type DataSource = "demo" | "rescuegroups" | "petfinder";

const SOURCE_ENDPOINTS: Record<Exclude<DataSource, "demo">, string> = {
  rescuegroups: "/api/animals",
  petfinder: "/api/petfinder",
};

interface Persisted {
  liked: string[];
  passed: string[];
  adoptedOverrides: string[];
  profile: Profile;
  customDogs: Dog[];
  dataSource: DataSource | "live";
  applied: string[];
}

const defaultProfile = (): Profile => ({
  userType: "adopter",
  name: "CJ Williams",
  email: "cj@silencekillsdesign.com",
  phone: "",
  city: "Chicago, IL",
  traits: { energy: 6, space: 4, social: 7, independence: 6, training: 5 },
  payment: { brand: "Visa", last4: "4242", exp: "08/28" },
  homePhotos: [],
  petPhotos: [],
  adoption: {
    employment: { employer: "", occupation: "", years: "" },
    isStudent: false,
    isMilitary: false,
    firstTimeOwner: false,
    household: { residents: 1, childrenAges: "", allergies: "", caregiver: "" },
    housing: {
      dwelling: "",
      ownership: "",
      landlordName: "",
      landlordPhone: "",
      petsAllowed: "",
      fencedYard: "",
      hoursAlone: 4,
      keptWhenAlone: "",
      traffic: "",
    },
    vet: {
      currentPets: "",
      pastPets: "",
      petsVaccinated: "",
      petsFixed: "",
      vetName: "",
      vetPhone: "",
      allowReferenceCheck: false,
      financiallyPrepared: false,
    },
  },
  documents: [
    { name: "Vaccination records — current pets.pdf", date: "Jun 12, 2026", size: "1.2 MB", builtin: true },
    { name: "Spay-neuter certificate.pdf", date: "May 30, 2026", size: "640 KB", builtin: true },
  ],
});

/** Single reactive store, hydrated from localStorage once on the client. */
export function useStore() {
  const liked = useState<string[]>("rm-liked", () => []);
  const passed = useState<string[]>("rm-passed", () => []);
  const adoptedOverrides = useState<string[]>("rm-adopted", () => []);
  const applied = useState<string[]>("rm-applied", () => []);
  const profile = useState<Profile>("rm-profile", defaultProfile);
  const customDogs = useState<Dog[]>("rm-custom-dogs", () => []);
  const dataSource = useState<DataSource>("rm-source", () => "demo");
  const liveDogs = useState<Dog[]>("rm-live-dogs", () => []);
  const liveStatus = useState<"idle" | "loading" | "ready" | "error">("rm-live-status", () => "idle");
  const liveError = useState<string>("rm-live-error", () => "");
  /** Which provider liveDogs was loaded from — a source switch invalidates the cache. */
  const liveLoadedFor = useState<DataSource | "">("rm-live-for", () => "");
  const hydrated = useState<boolean>("rm-hydrated", () => false);

  async function loadLive(force = false) {
    if (!import.meta.client) return;
    const src = dataSource.value;
    if (src === "demo" || liveStatus.value === "loading") return;
    if (!force && liveStatus.value === "ready" && liveLoadedFor.value === src) return;
    liveStatus.value = "loading";
    liveError.value = "";
    try {
      liveDogs.value = await $fetch<Dog[]>(SOURCE_ENDPOINTS[src]);
      liveStatus.value = "ready";
      liveLoadedFor.value = src;
    } catch (e: any) {
      liveStatus.value = "error";
      liveLoadedFor.value = "";
      liveError.value =
        e?.data?.statusMessage || e?.statusMessage ||
        (src === "petfinder" ? "Could not reach Petfinder." : "Could not reach RescueGroups.org.");
    }
  }

  if (import.meta.client && !hydrated.value) {
    hydrated.value = true;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const p: Persisted = JSON.parse(raw);
        liked.value = p.liked ?? [];
        passed.value = p.passed ?? [];
        adoptedOverrides.value = p.adoptedOverrides ?? [];
        applied.value = p.applied ?? [];
        customDogs.value = p.customDogs ?? [];
        // migrate the old "live" value (pre-Petfinder) to its provider name
        dataSource.value = p.dataSource === "live" ? "rescuegroups" : (p.dataSource ?? "demo");
        if (p.profile) profile.value = { ...defaultProfile(), ...p.profile };
      }
    } catch {}

    /* Photos land a tick after first paint — images load async anyway, so the
       swipe deck never waits on them. */
    idbGet<PhotoStore>(IDB_PHOTOS_KEY)
      .then((ph) => {
        if (!ph) return;
        if (ph.homePhotos?.length) profile.value.homePhotos = ph.homePhotos;
        if (ph.petPhotos?.length) profile.value.petPhotos = ph.petPhotos;
        if (ph.dogPhotos) {
          customDogs.value = customDogs.value.map((d) =>
            ph.dogPhotos[d.id]?.length ? { ...d, photos: ph.dogPhotos[d.id] } : d,
          );
        }
      })
      .catch(() => {});

    watch(
      [liked, passed, adoptedOverrides, applied, profile, customDogs, dataSource],
      () => {
        // small/hot state → localStorage, stripped of inline images
        try {
          localStorage.setItem(
            LS_KEY,
            JSON.stringify({
              liked: liked.value,
              passed: passed.value,
              adoptedOverrides: adoptedOverrides.value,
              applied: applied.value,
              profile: {
                ...profile.value,
                homePhotos: withoutInline(profile.value.homePhotos),
                petPhotos: withoutInline(profile.value.petPhotos),
              },
              customDogs: customDogs.value.map((d) => ({ ...d, photos: withoutInline(d.photos) })),
              dataSource: dataSource.value,
            } satisfies Persisted),
          );
        } catch (e) {
          console.warn("[floofer] persist failed (storage quota?)", e);
        }

        /* Heavy base64 images → IndexedDB. Spread into plain arrays first:
           IndexedDB structured-clones its input and cannot clone Vue's
           reactive Proxy objects. */
        const photos: PhotoStore = {
          homePhotos: [...(profile.value.homePhotos ?? [])],
          petPhotos: [...(profile.value.petPhotos ?? [])],
          dogPhotos: Object.fromEntries(
            customDogs.value.map((d) => [d.id, [...(d.photos ?? [])]]),
          ),
        };
        idbSet(IDB_PHOTOS_KEY, photos).catch((e) =>
          console.warn("[floofer] photo persist failed", e),
        );
      },
      { deep: true },
    );

    watch(dataSource, (s) => s !== "demo" && loadLive(), { immediate: true });
  }

  const isAdopted = (d: Dog) => d.adopted || adoptedOverrides.value.includes(d.id);

  /* Live modes swap the seed dogs for API animals (your own listings stay);
     while loading or on error we fall back to demo so the app never goes empty. */
  const dogs = computed<Dog[]>(() => {
    const live =
      dataSource.value !== "demo" &&
      liveStatus.value === "ready" &&
      liveLoadedFor.value === dataSource.value;
    return [...(live ? liveDogs.value : DOGS), ...customDogs.value].map((d) => ({
      ...d,
      adopted: isAdopted(d),
    }));
  });

  const addDog = (dog: Dog) => {
    customDogs.value = [...customDogs.value, dog];
  };

  const matchPct = (d: Dog) => scoreMatch(d.traits, profile.value.traits);

  const like = (id: string) => {
    passed.value = passed.value.filter((x) => x !== id);
    if (!liked.value.includes(id)) liked.value = [...liked.value, id];
  };
  const pass = (id: string) => {
    liked.value = liked.value.filter((x) => x !== id);
    if (!passed.value.includes(id)) passed.value = [...passed.value, id];
  };
  const unswipe = (id: string) => {
    liked.value = liked.value.filter((x) => x !== id);
    passed.value = passed.value.filter((x) => x !== id);
  };
  const submitApplication = (id: string) => {
    if (!applied.value.includes(id)) applied.value = [...applied.value, id];
  };
  const toggleAdopted = (id: string) => {
    adoptedOverrides.value = adoptedOverrides.value.includes(id)
      ? adoptedOverrides.value.filter((x) => x !== id)
      : [...adoptedOverrides.value, id];
  };

  return {
    dogs, liked, passed, applied, profile, hydrated,
    matchPct, like, pass, unswipe, toggleAdopted, addDog, submitApplication,
    dataSource, liveStatus, liveError, liveDogs, loadLive,
  };
}

/** Adoption-profile completeness — shared by the profile editor and the
    message sheet (which attaches a summary for the rescue). */
export function adoptionCompleteness(p: Profile) {
  const d = p.adoption;
  const checks: { label: string; done: boolean }[] = [
    { label: "Phone number", done: !!p.phone.trim() },
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
  const pct = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
  const missing = checks.filter((c) => !c.done).map((c) => c.label);
  return { checks, pct, missing };
}

/** Life stage per adoption-platform convention, derived from age. */
export function lifeStage(d: Dog): string {
  if (d.age < 1) return "Puppy";
  if (d.age <= 2) return "Young";
  if (d.age <= 7) return "Adult";
  return "Senior";
}

/** Pentagon match: per-axis closeness between what the dog needs and what the
    home offers. Every axis aligns directly — including `training`, where the
    pet scale runs turnkey→project and the user scale runs first-timer→pro, so
    a project dog belongs with an experienced handler. */
export function scoreMatch(pet: TraitPentagon, user: TraitPentagon): number {
  const axes: (keyof TraitPentagon)[] = ["energy", "space", "social", "independence", "training"];
  const total = axes.reduce(
    (sum, axis) => sum + (1 - Math.abs(pet[axis] - user[axis]) / 9),
    0,
  );
  return Math.round((total / axes.length) * 100);
}

/* ---------- Geo ---------- */

/** Demo home base: Chicago Loop. */
export const HOME = { lat: 41.8781, lng: -87.6298 };

export function milesFrom(d: Dog): number {
  const R = 3958.8;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(d.location.lat - HOME.lat);
  const dLng = toRad(d.location.lng - HOME.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(HOME.lat)) * Math.cos(toRad(d.location.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/* ---------- Shared filters ---------- */

export const defaultFilters = (): Filters => ({
  breed: "all",
  size: "all",
  sex: "all",
  maxAge: 15, // 15 = "15+", no cap
  maxMiles: 50,
  minMatch: 0,
  urgency: "all",
  goodWith: [],
  houseTrained: false,
  fixed: false,
  vaccinated: false,
  sources: [],
});

export function useFilters() {
  return useState<Filters>("rm-filters", defaultFilters);
}

export function applyFilters(list: Dog[], f: Filters, matchPct: (d: Dog) => number): Dog[] {
  return list.filter((d) => {
    if (f.breed !== "all" && d.breed !== f.breed) return false;
    if (f.size !== "all" && d.size !== f.size) return false;
    if (f.sex !== "all" && d.sex !== f.sex) return false;
    if (f.maxAge < 15 && d.age > f.maxAge) return false; // 15 = no cap
    if (milesFrom(d) > f.maxMiles) return false;
    if (matchPct(d) < f.minMatch) return false;
    if (f.urgency === "high" && d.risk !== "high") return false;
    // "good with" — exclude only explicit incompatibility
    if (f.goodWith.includes("dogs") && d.goodWithDogs === "no") return false;
    if (f.goodWith.includes("cats") && d.goodWithCats === "no") return false;
    if (f.goodWith.includes("kids") && d.goodWithKids === "no") return false;
    if (f.houseTrained && d.houseTrained === "no") return false;
    if (f.fixed && d.spayNeuter === "no") return false;
    if (f.vaccinated && !d.vaccinated) return false;
    if (f.sources.length && !f.sources.includes(d.source.type)) return false;
    return true;
  });
}
