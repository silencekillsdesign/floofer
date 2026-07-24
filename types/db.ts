/* Hand-written mirror of supabase/migrations/0001_init.sql.
   Once the project exists this can be regenerated instead:
     npx supabase gen types typescript --linked > types/db.ts
   Keep the two in sync — the mapper below is the only thing standing between
   a schema change and a silently wrong dog card. */

import type { SourceType, TraitPentagon, YNS } from "~/types";

export type AdoptionStatus = "available" | "pending" | "adopted" | "withdrawn";

export interface OrgRow {
  id: string;
  name: string;
  type: SourceType;
  city: string;
  lat: number | null;
  lng: number | null;
  contact_email: string | null;
  contact_phone: string | null;
}

export interface DogPhotoRow {
  id: string;
  dog_id: string;
  storage_path: string;
  position: number;
}

export interface DogRow {
  id: string;
  org_id: string;
  name: string;
  breed: string;
  secondary_breed: string | null;
  age: number;
  sex: "M" | "F";
  size: "small" | "medium" | "large";
  weight_lbs: number | null;
  good_with_dogs: YNS;
  good_with_cats: YNS;
  good_with_kids: "yes" | "no" | "older";
  house_trained: "yes" | "no" | "in-training";
  crate_trained: boolean;
  traits: TraitPentagon;
  spay_neuter: "yes" | "no" | "scheduled";
  vaccinated: boolean;
  microchipped: boolean;
  medical_notes: string | null;
  tagline: string;
  bio: string;
  quirks: string | null;
  background: string | null;
  ideal_home: string | null;
  city: string;
  lat: number | null;
  lng: number | null;
  adoption_fee: number;
  risk: "safe" | "high";
  risk_reason: string | null;
  risk_review_date: string | null; // ISO date (no time) — a deadline, not a countdown
  status: AdoptionStatus;
  /* Supabase embeds these when the select asks for them. */
  orgs?: OrgRow | null;
  dog_photos?: DogPhotoRow[];
}
