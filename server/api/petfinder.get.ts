import type { Dog, YNS } from "~/types";

/* Proxy + adapter for the Petfinder v2 API.
   OAuth2 client-credentials: tokens live 60 min and are cached in module scope.
   Petfinder has no euthanasia fields — long-stay listings are flagged at-risk instead.
   Docs: https://www.petfinder.com/developers/v2/docs/ */

const PF = "https://api.petfinder.com/v2";
const SEARCH_LOCATION = "60601"; // Chicago Loop — matches the app's demo home base
const SEARCH_DISTANCE = 50;
const LONG_STAY_DAYS = 120;

let cachedToken: { token: string; expiresAt: number } | null = null;
const zipCache = new Map<string, { lat: number; lng: number }>();
let orgNames: Map<string, string> | null = null;

async function getToken(key: string, secret: string): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) return cachedToken.token;
  const res = await $fetch<any>(`${PF}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: key,
      client_secret: secret,
    }).toString(),
  });
  cachedToken = { token: res.access_token, expiresAt: Date.now() + res.expires_in * 1000 };
  return cachedToken.token;
}

/** Free zip→coords lookup (Petfinder exposes addresses, never coordinates). */
async function geocodeZip(zip?: string): Promise<{ lat: number; lng: number } | null> {
  if (!zip || !/^\d{5}/.test(zip)) return null;
  const z = zip.slice(0, 5);
  if (zipCache.has(z)) return zipCache.get(z)!;
  try {
    const res = await $fetch<any>(`https://api.zippopotam.us/us/${z}`);
    const place = res?.places?.[0];
    if (!place) return null;
    const coords = { lat: Number(place.latitude), lng: Number(place.longitude) };
    zipCache.set(z, coords);
    return coords;
  } catch {
    return null;
  }
}

async function getOrgNames(token: string): Promise<Map<string, string>> {
  if (orgNames) return orgNames;
  try {
    const res = await $fetch<any>(`${PF}/organizations`, {
      headers: { Authorization: `Bearer ${token}` },
      query: { location: SEARCH_LOCATION, distance: SEARCH_DISTANCE, limit: 100 },
    });
    orgNames = new Map((res?.organizations ?? []).map((o: any) => [o.id, o.name]));
  } catch {
    orgNames = new Map();
  }
  return orgNames;
}

export default defineEventHandler(async (): Promise<Dog[]> => {
  const { petfinderApiKey, petfinderSecret } = useRuntimeConfig();
  if (!petfinderApiKey || !petfinderSecret) {
    throw createError({
      statusCode: 501,
      statusMessage:
        "No Petfinder credentials configured. Get a free key at petfinder.com/developers, then set NUXT_PETFINDER_API_KEY and NUXT_PETFINDER_SECRET in .env and restart the dev server.",
    });
  }

  let token: string;
  try {
    token = await getToken(petfinderApiKey, petfinderSecret);
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: "Petfinder rejected the credentials — double-check key and secret in .env.",
    });
  }

  let res: any;
  try {
    res = await $fetch(`${PF}/animals`, {
      headers: { Authorization: `Bearer ${token}` },
      query: {
        type: "dog",
        status: "adoptable",
        location: SEARCH_LOCATION,
        distance: SEARCH_DISTANCE,
        limit: 100,
        sort: "recent",
      },
    });
  } catch (e: any) {
    throw createError({
      statusCode: 502,
      statusMessage: `Petfinder API unreachable (${e?.statusCode ?? "network error"}).`,
    });
  }

  const names = await getOrgNames(token);
  const animals: any[] = (res?.animals ?? []).filter((a: any) => a.photos?.length);

  const dogs = await Promise.all(animals.map((a) => mapAnimal(a, names)));
  return dogs.filter(Boolean) as Dog[];
});

/* ---------- mapping ---------- */

const AGE_YEARS: Record<string, number> = { Baby: 0.5, Young: 1.5, Adult: 4, Senior: 9 };
const SIZE_MAP: Record<string, Dog["size"]> = {
  Small: "small", Medium: "medium", Large: "large", "Extra Large": "large",
};
const WEIGHT_BY_SIZE: Record<Dog["size"], number> = { small: 20, medium: 45, large: 75 };

const yns = (v: unknown): YNS => (v === true ? "yes" : v === false ? "no" : "selective");

function clean(text?: string | null): string {
  return (text ?? "")
    .replace(/&amp;/g, "&").replace(/&#039;|&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&#?\w+;/g, " ").replace(/\s+/g, " ").trim();
}

/** Deterministic jitter so pins without a geocoded zip don't stack on one point. */
function jitter(id: number): { lat: number; lng: number } {
  return {
    lat: 41.8781 + ((id % 17) - 8) * 0.012,
    lng: -87.6298 + ((id % 13) - 6) * 0.016,
  };
}

async function mapAnimal(a: any, orgNamesMap: Map<string, string>): Promise<Dog | null> {
  if (!a?.name) return null;

  const size = SIZE_MAP[a.size as string] ?? "medium";
  const photos = (a.photos ?? [])
    .map((p: any) => p.large ?? p.full ?? p.medium)
    .filter(Boolean)
    .slice(0, 5);
  if (!photos.length) return null;

  const coords = (await geocodeZip(a.contact?.address?.postcode)) ?? jitter(Number(a.id) || 0);
  const cityState = [a.contact?.address?.city, a.contact?.address?.state].filter(Boolean).join(", ") || "Chicago, IL";

  /* No euthanasia data on Petfinder — long-stay is the honest risk proxy. */
  const daysListed = a.published_at
    ? Math.floor((Date.now() - new Date(a.published_at).getTime()) / 86_400_000)
    : 0;
  const longStay = daysListed >= LONG_STAY_DAYS;

  const orgName = orgNamesMap.get(a.organization_id) ?? "Petfinder partner org";
  const env = a.environment ?? {};
  const attrs = a.attributes ?? {};
  const ageYears = AGE_YEARS[a.age as string] ?? 4;

  const videoSrc = a.videos?.[0]?.embed?.match(/src="([^"]+)"/)?.[1];

  return {
    id: `pf-${a.id}`,
    name: clean(a.name).slice(0, 40),
    species: "dog",
    breed: a.breeds?.primary ?? "Mixed Breed",
    secondaryBreed: a.breeds?.secondary ?? (a.breeds?.mixed ? "Mixed" : undefined),
    age: ageYears,
    sex: a.gender === "Female" ? "F" : "M",
    size,
    weightLbs: WEIGHT_BY_SIZE[size],
    photos,
    videoUrl: videoSrc || undefined,
    goodWithDogs: yns(env.dogs),
    goodWithCats: yns(env.cats),
    goodWithKids: env.children === true ? "yes" : env.children === false ? "no" : "older",
    /* Petfinder's house_trained is a plain boolean; false usually means "not confirmed". */
    houseTrained: attrs.house_trained === true ? "yes" : "in-training",
    crateTrained: false,
    traits: {
      energy: a.age === "Baby" || a.age === "Young" ? 7 : a.age === "Senior" ? 3 : 5,
      space: size === "small" ? 3 : size === "medium" ? 5 : 8,
      social: Math.min(10, 3 + [env.dogs, env.cats, env.children].filter((v) => v === true).length * 2),
      independence: 5,
      training: attrs.house_trained ? 4 : 6,
    },
    spayNeuter: attrs.spayed_neutered === true ? "yes" : "no",
    vaccinated: attrs.shots_current === true,
    microchipped: false,
    medicalNotes: attrs.special_needs ? "Special needs — ask the shelter for details." : undefined,
    tagline: (a.tags?.length ? a.tags.slice(0, 3).join(" · ") : `${a.age ?? "Adult"} ${a.breeds?.primary ?? "mixed breed"}`).slice(0, 60),
    bio: clean(a.description).slice(0, 700) || `${clean(a.name)} is looking for a home. Full bio on Petfinder.`,
    quirks: a.tags?.length ? clean(a.tags.join(", ")) : undefined,
    background: `Listed by ${orgName} via Petfinder.`,
    idealHome: undefined,
    source: { type: "shelter", name: orgName },
    location: { ...coords, city: cityState },
    adoptionFee: 0, // Petfinder doesn't expose fees
    risk: longStay ? "high" : "safe",
    riskReason: longStay ? `Long-stay — ${daysListed} days listed without adoption` : undefined,
    daysLeft: undefined,
  };
}
