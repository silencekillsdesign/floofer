/* The one gate between the app and Supabase.
   Floofer has to run with no backend at all — the demo deck, the shareable
   pet pages and the whole portfolio path predate the database and must keep
   working. So nothing calls Supabase without checking `configured` first. */
import type { Dog, Profile, TraitPentagon, UserType } from "~/types";
import { cityLine, formatAddress } from "~/types";
import type {
  AdoptionStatus, DogRow, FastPassApplication, FastPassState,
} from "~/types/db";

export interface MyProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  city: string;
  user_type: UserType;
  org_id: string | null;
  traits: TraitPentagon;
  adoption: Record<string, unknown>;
  onboarded_at: string | null;
}

/** Columns a listing form supplies; org_id and created_by are set server-side
    from the caller's own profile, never from the form. */
export type NewDogInput = Omit<
  DogRow,
  "id" | "org_id" | "orgs" | "dog_photos" | "created_by"
>;

export function useDb() {
  const { public: pub } = useRuntimeConfig();
  const url = (pub as any).supabase?.url as string | undefined;

  /* nuxt.config falls back to a localhost placeholder so the client can be
     constructed without credentials; that placeholder is exactly what "not
     configured" looks like. */
  const configured = computed(
    () => !!url && !url.includes("localhost:54321"),
  );

  const client = useSupabaseClient();
  const user = useSupabaseUser();

  /* The Supabase module (asymmetric-JWT mode, used by the sb_publishable /
     sb_secret keys) fills useSupabaseUser with raw JWT claims, where the user
     id is `sub`, not `id`. Read both so this survives either shape. */
  const userId = computed(
    () => ((user.value as any)?.id ?? (user.value as any)?.sub ?? null) as string | null,
  );

  const toDog = (row: DogRow): Dog => mapDogRow(row, (p) => photoUrlFor(url ?? "", p));

  /** Every listable dog, newest first. Returns [] when there's no backend
      yet, so callers can fall back to demo data without special-casing. */
  async function fetchDogs(): Promise<Dog[]> {
    if (!configured.value) return [];
    const { data, error } = await client
      .from("dogs")
      .select(DOG_SELECT)
      .in("status", ["available", "pending"])
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as DogRow[]).map(toDog);
  }

  /** Dogs belonging to the signed-in user's org, including withdrawn and
      adopted ones — the shelter dashboard needs the full history. */
  async function fetchMyOrgDogs(): Promise<Dog[]> {
    if (!configured.value || !userId.value) return [];
    const { data, error } = await client
      .from("dogs")
      .select(DOG_SELECT)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as DogRow[]).map(toDog);
  }

  /** The signed-in user's profile row, including which org they belong to. */
  async function fetchMyProfile() {
    /* Guard on the id, not just truthiness: the module briefly emits a user
       ref before its id is populated, and querying .eq("id", undefined) is a
       Postgres uuid-syntax error, not an empty result. */
    if (!configured.value || !userId.value) return null;
    const { data, error } = await client
      .from("profiles")
      .select("id,email,name,phone,city,user_type,org_id,traits,adoption,onboarded_at")
      .eq("id", userId.value)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as MyProfile | null;
  }

  /** Insert a listing. Returns the new row's id.
      `org_id` is set from the caller's own profile rather than anything the
      form supplies — RLS would reject a mismatch anyway, but not sending it
      at all means there's nothing to spoof. */
  async function createDog(input: NewDogInput): Promise<string> {
    if (!configured.value) throw new Error("No database configured.");
    const profile = await fetchMyProfile();
    if (!profile?.org_id) {
      throw new Error("Your account isn't linked to an organization yet — ask for an invite.");
    }
    const { data, error } = await client
      .from("dogs")
      .insert({ ...input, org_id: profile.org_id, created_by: profile.id })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return (data as { id: string }).id;
  }

  /** Update the two things a shelter changes after listing: where the
      adoption stands, and whether the dog is out of time. */
  async function updateDogState(
    id: string,
    patch: {
      status?: AdoptionStatus;
      risk?: "safe" | "high";
      risk_reason?: string | null;
      risk_review_date?: string | null;
    },
  ) {
    if (!configured.value) throw new Error("No database configured.");
    const { error } = await client.from("dogs").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  }

  /** PhotoUploader hands back downscaled data: URLs; storage wants bytes. */
  function dataUrlToBlob(dataUrl: string): Blob {
    const [meta, b64] = dataUrl.split(",");
    const mime = meta.match(/:(.*?);/)?.[1] ?? "image/jpeg";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  /** Upload photos for a dog and record them in order.
      Path is `<org_id>/<dog_id>/<uuid>` — the leading segment is what the
      storage policy checks, so an org physically cannot write into another
      org's folder. */
  async function uploadDogPhotos(dogId: string, photos: string[]): Promise<number> {
    if (!configured.value || !photos.length) return 0;
    const profile = await fetchMyProfile();
    if (!profile?.org_id) throw new Error("No organization on your account.");

    let position = 0;
    for (const photo of photos) {
      /* Already-hosted URLs (demo seeds, re-edits) are recorded as-is rather
         than re-uploaded — mapDogRow passes absolute URLs straight through. */
      if (!photo.startsWith("data:")) {
        const { error } = await client
          .from("dog_photos")
          .insert({ dog_id: dogId, storage_path: photo, position: position++ });
        if (error) throw new Error(error.message);
        continue;
      }

      const blob = dataUrlToBlob(photo);
      const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
      const path = `${profile.org_id}/${dogId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await client.storage
        .from("pet-photos")
        .upload(path, blob, { contentType: blob.type, upsert: false });
      if (upErr) throw new Error(`Photo upload failed: ${upErr.message}`);

      const { error: rowErr } = await client
        .from("dog_photos")
        .insert({ dog_id: dogId, storage_path: path, position: position++ });
      if (rowErr) throw new Error(rowErr.message);
    }
    return position;
  }

  /** Erase the personal data held in the signed-in user's profile row,
      leaving an empty shell (the email stays — it's the login identity).
      Backs the adopter-facing "delete my data" control. */
  async function eraseMyProfile() {
    if (!configured.value || !userId.value) return;
    const { error } = await client
      .from("profiles")
      .update({
        name: "",
        phone: "",
        city: "",
        adoption: {},
        traits: { energy: 5, space: 5, social: 5, independence: 5, training: 5 },
        onboarded_at: null,
      })
      .eq("id", userId.value);
    if (error) throw new Error(error.message);
  }

  /* ---------- Fast-Pass verification ---------- */

  /** Submit a Fast-Pass application to one named org. The snapshot is what the
      org will review — the live profile stays private to its owner. */
  async function submitFastPass(orgId: string, profile: Profile) {
    if (!configured.value || !userId.value) throw new Error("Sign in to submit a Fast-Pass.");
    const fp = profile.fastPass;
    if (!fp?.capabilities.length) throw new Error("Declare at least one capability first.");

    const a = profile.adoption;
    const snapshot = {
      name: profile.name,
      phone: profile.phone,
      city: cityLine(profile.address),
      /* Full address — a verifier can't run a home check on a city name. */
      address: formatAddress(profile.address).join(", "),
      dwelling: a.housing.dwelling,
      ownership: a.housing.ownership,
      landlordName: a.housing.landlordName,
      landlordPhone: a.housing.landlordPhone,
      petsAllowed: a.housing.petsAllowed,
      fencedYard: a.housing.fencedYard,
      hoursAlone: a.housing.hoursAlone,
      residents: a.household.residents,
      /* Flattened for the reviewer, who reads rather than queries. The arrays
         stay the source of truth; this is a display snapshot. */
      childrenAges: a.household.children.map((c) => `${c.age}`).sort().join(", "),
      currentPets: a.vet.pets
        .filter((p) => p.stillWithMe)
        .map((p) => [p.name, p.kind].filter(Boolean).join(" — "))
        .join("; "),
      pastPets: a.vet.pets
        .filter((p) => !p.stillWithMe)
        .map((p) => [p.name, p.kind, p.note].filter(Boolean).join(" — "))
        .join("; "),
      vetName: a.vet.vetName,
      vetPhone: a.vet.vetPhone,
      allowReferenceCheck: a.vet.allowReferenceCheck,
      homePhotoCount: profile.homePhotos.length,
    };

    const { error } = await client.from("fast_pass_applications").upsert(
      {
        adopter_id: userId.value,
        org_id: orgId,
        state: "pending",
        capabilities: fp.capabilities,
        response_window: fp.responseWindow,
        snapshot,
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        reviewed_by: null,
        reviewer_note: null,
      },
      { onConflict: "adopter_id,org_id" },
    );
    if (error) throw new Error(error.message);
  }

  /** The signed-in org's review queue. */
  async function fetchFastPassQueue(state: FastPassState = "pending") {
    if (!configured.value || !userId.value) return [];
    const { data, error } = await client
      .from("fast_pass_applications")
      .select("*")
      .eq("state", state)
      .order("submitted_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as FastPassApplication[];
  }

  /** Rule on an application. A decline carries a note, so it's actionable. */
  async function reviewFastPass(id: string, state: "verified" | "declined", note?: string) {
    if (!configured.value || !userId.value) throw new Error("No database configured.");
    const { error } = await client
      .from("fast_pass_applications")
      .update({
        state,
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId.value,
        reviewer_note: note?.trim() || null,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  /** The adopter's own application, so the card can show where it stands. */
  async function fetchMyFastPass(): Promise<FastPassApplication | null> {
    if (!configured.value || !userId.value) return null;
    const { data, error } = await client
      .from("fast_pass_applications")
      .select("*")
      .eq("adopter_id", userId.value)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as FastPassApplication) ?? null;
  }

  return {
    configured, client, user, userId, toDog,
    fetchDogs, fetchMyOrgDogs, fetchMyProfile,
    createDog, updateDogState, uploadDogPhotos, eraseMyProfile,
    submitFastPass, fetchFastPassQueue, reviewFastPass, fetchMyFastPass,
  };
}
