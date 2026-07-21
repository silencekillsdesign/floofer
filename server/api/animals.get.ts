import type { Dog, YNS } from "~/types";

/* Proxy + adapter for the RescueGroups.org v5 public API (JSON:API).
   Runs server-side so the API key stays private and CORS never applies.
   Docs: https://api.rescuegroups.org/v5/public/docs */

const RG_URL =
  "https://api.rescuegroups.org/v5/public/animals/search/available/dogs/haspic";

const SEARCH_RADIUS_MILES = 50;
const SEARCH_POSTALCODE = "60601"; // Chicago Loop — matches the app's demo home base

export default defineEventHandler(async (): Promise<Dog[]> => {
  const key = useRuntimeConfig().rescuegroupsApiKey;
  if (!key) {
    throw createError({
      statusCode: 501,
      statusMessage:
        "No RescueGroups API key configured. Request a free key at rescuegroups.org, then set NUXT_RESCUEGROUPS_API_KEY in .env and restart the dev server.",
    });
  }

  let res: any;
  try {
    res = await $fetch(RG_URL, {
      method: "POST",
      query: {
        limit: 60,
        include: "pictures,locations,orgs",
        sort: "-animals.updatedDate",
      },
      headers: {
        Authorization: key,
        "Content-Type": "application/vnd.api+json",
      },
      body: {
        data: {
          filterRadius: { miles: SEARCH_RADIUS_MILES, postalcode: SEARCH_POSTALCODE },
        },
      },
    });
  } catch (e: any) {
    throw createError({
      statusCode: e?.statusCode === 401 ? 401 : 502,
      statusMessage:
        e?.statusCode === 401
          ? "RescueGroups rejected the API key — double-check NUXT_RESCUEGROUPS_API_KEY."
          : `RescueGroups API unreachable (${e?.statusCode ?? "network error"}).`,
    });
  }

  const included = new Map<string, any>();
  for (const inc of res?.included ?? []) included.set(`${inc.type}:${inc.id}`, inc);
  const rel = (animal: any, type: string) =>
    (animal.relationships?.[type]?.data ?? [])
      .map((r: any) => included.get(`${r.type}:${r.id}`))
      .filter(Boolean);

  return (res?.data ?? []).map((animal: any) => mapAnimal(animal, rel)).filter(Boolean) as Dog[];
});

/* ---------- mapping ---------- */

const AGE_YEARS: Record<string, number> = { Baby: 0.5, Young: 1.5, Adult: 4, Senior: 9 };
const SIZE_MAP: Record<string, Dog["size"]> = {
  Small: "small", Medium: "medium", Large: "large", "X-Large": "large",
};
const WEIGHT_BY_SIZE: Record<Dog["size"], number> = { small: 20, medium: 45, large: 75 };

/** RG booleans are true/false/null — null means the org hasn't assessed it. */
const yns = (v: unknown): YNS => (v === true ? "yes" : v === false ? "no" : "selective");

function stripHtml(html?: string): string {
  return (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#?\w+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mapAnimal(animal: any, rel: (a: any, t: string) => any[]): Dog | null {
  const a = animal.attributes ?? {};
  if (!a.name) return null;

  const pictures = rel(animal, "pictures")
    .map((p) => p.attributes?.large?.url ?? p.attributes?.original?.url ?? p.attributes?.small?.url)
    .filter(Boolean);
  if (!pictures.length) return null;

  const loc = rel(animal, "locations")[0]?.attributes;
  const org = rel(animal, "orgs")[0]?.attributes;
  const lat = Number(loc?.lat ?? org?.lat);
  const lng = Number(loc?.lon ?? org?.lon);

  /* THE reason we chose this API: euthanasia scheduling data. */
  const killDate = a.killDate ? new Date(a.killDate) : null;
  const daysLeft = killDate
    ? Math.max(0, Math.ceil((killDate.getTime() - Date.now()) / 86_400_000))
    : undefined;
  const atRisk = killDate != null || a.isEuthanasiaListed === true;

  const size = SIZE_MAP[a.sizeGroup as string] ?? "medium";
  const bio = stripHtml(a.descriptionText).slice(0, 700) || `${a.name} is looking for a home.`;

  const energy =
    ({ "Not Active": 2, "Slightly Active": 4, "Moderately Active": 6, "Highly Active": 9 } as
      Record<string, number>)[a.activityLevel] ?? 5;
  const social =
    3 + [a.isDogsOk, a.isCatsOk, a.isKidsOk].filter((v) => v === true).length * 2;

  return {
    id: `rg-${animal.id}`,
    name: a.name,
    species: "dog",
    breed: a.breedPrimary ?? "Mixed Breed",
    secondaryBreed: a.breedSecondary ?? undefined,
    age: a.ageGroup ? (AGE_YEARS[a.ageGroup] ?? 4) : 4,
    sex: a.sex === "Female" ? "F" : "M",
    size,
    weightLbs: Math.round(Number(a.sizeCurrent) || WEIGHT_BY_SIZE[size]),
    photos: pictures.slice(0, 5),
    videoUrl: undefined,
    goodWithDogs: yns(a.isDogsOk),
    goodWithCats: yns(a.isCatsOk),
    goodWithKids: a.isKidsOk === true ? "yes" : a.isKidsOk === false ? "no" : "older",
    houseTrained: a.isHousetrained === true ? "yes" : a.isHousetrained === false ? "no" : "in-training",
    crateTrained: a.isCratetrained === true,
    traits: {
      energy,
      space: size === "small" ? 3 : size === "medium" ? 5 : 8,
      social: Math.min(10, social),
      independence: 5,
      training: a.obedienceTraining === "None" ? 7 : a.obedienceTraining ? 4 : 5,
    },
    spayNeuter: a.isAltered === true ? "yes" : a.isAltered === false ? "no" : "scheduled",
    vaccinated: a.isCurrentVaccinations === true,
    microchipped: a.isMicrochipped === true,
    medicalNotes: stripHtml(a.specialNeedsDetails ?? a.specialNeedsDescription) || undefined,
    tagline: `${a.ageGroup ?? "Adult"} ${a.breedPrimary ?? "mixed breed"} near ${loc?.citystate ?? org?.citystate ?? "Chicago"}`,
    bio,
    background: org?.name ? `Listed by ${org.name} via RescueGroups.org.` : undefined,
    idealHome: undefined,
    quirks: undefined,
    source: { type: "shelter", name: org?.name ?? "RescueGroups partner org" },
    location: {
      lat: Number.isFinite(lat) ? lat : 41.8781,
      lng: Number.isFinite(lng) ? lng : -87.6298,
      city: loc?.citystate ?? org?.citystate ?? "Chicago, IL",
    },
    adoptionFee: Number(String(a.adoptionFeeString ?? "").replace(/[^\d]/g, "")) || 0,
    risk: atRisk ? "high" : "safe",
    riskReason: atRisk ? stripHtml(a.killReason) || "Euthanasia date listed by shelter" : undefined,
    daysLeft,
  };
}
