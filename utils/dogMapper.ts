/* DB row -> the `Dog` shape every component already speaks. Keeping this the
   single translation point means the swipe deck, map, matches list and OG
   cards never learn that a second data source exists. */
import type { Dog } from "~/types";
import type { DogRow } from "~/types/db";

const MS_PER_DAY = 86_400_000;

/** Whole days from today until an ISO `YYYY-MM-DD` date.
    Parsed as UTC midnight on both sides so the answer can't drift by one
    depending on the viewer's timezone or the hour they open the app.
    Negative means the deadline has passed. */
export function daysUntil(isoDate: string, now = new Date()): number {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return Number.NaN;
  const target = Date.UTC(y, m - 1, d);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - today) / MS_PER_DAY);
}

/** Today as `YYYY-MM-DD` in the viewer's own timezone.
    `toISOString()` would return the UTC date — west of Greenwich that flips
    to tomorrow during the evening, so a shelter working late would be blocked
    from setting a deadline of today. */
export function todayLocalISO(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Public storage URL for a `pet-photos` object path. */
export function photoUrlFor(supabaseUrl: string, path: string): string {
  if (/^https?:\/\//.test(path)) return path; // already absolute (seeded/demo rows)
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/pet-photos/${path}`;
}

export function mapDogRow(row: DogRow, photoUrl: (path: string) => string): Dog {
  const photos = [...(row.dog_photos ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((p) => photoUrl(p.storage_path));

  /* The countdown is derived, never stored, so it stays true between shelter
     edits. A passed deadline clamps to 0 rather than going negative: "0 days"
     reads as out of time, which is the honest interpretation of a date the
     shelter set and hasn't moved. */
  const raw = row.risk_review_date ? daysUntil(row.risk_review_date) : null;
  const daysLeft = raw == null || Number.isNaN(raw) ? undefined : Math.max(0, raw);

  return {
    id: row.id,
    name: row.name,
    species: "dog",
    breed: row.breed,
    secondaryBreed: row.secondary_breed ?? undefined,
    age: Number(row.age),
    sex: row.sex,
    size: row.size,
    weightLbs: row.weight_lbs ?? 0,
    photos,
    goodWithDogs: row.good_with_dogs,
    goodWithCats: row.good_with_cats,
    goodWithKids: row.good_with_kids,
    houseTrained: row.house_trained,
    crateTrained: row.crate_trained,
    traits: row.traits,
    spayNeuter: row.spay_neuter,
    vaccinated: row.vaccinated,
    microchipped: row.microchipped,
    medicalNotes: row.medical_notes ?? undefined,
    tagline: row.tagline,
    bio: row.bio,
    quirks: row.quirks ?? undefined,
    background: row.background ?? undefined,
    idealHome: row.ideal_home ?? undefined,
    source: {
      type: row.orgs?.type ?? "shelter",
      name: row.orgs?.name ?? "Partner organization",
    },
    location: {
      lat: row.lat ?? row.orgs?.lat ?? 0,
      lng: row.lng ?? row.orgs?.lng ?? 0,
      city: row.city || row.orgs?.city || "",
    },
    adoptionFee: row.adoption_fee,
    risk: row.risk,
    riskReason: row.risk_reason ?? undefined,
    daysLeft,
    adopted: row.status === "adopted",
  };
}

/** Columns the app needs, with org and photos embedded in one round-trip. */
export const DOG_SELECT =
  "*, orgs(id,name,type,city,lat,lng,contact_email,contact_phone), dog_photos(id,dog_id,storage_path,position)";
