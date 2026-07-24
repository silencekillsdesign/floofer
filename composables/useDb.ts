/* The one gate between the app and Supabase.
   Floofer has to run with no backend at all — the demo deck, the shareable
   pet pages and the whole portfolio path predate the database and must keep
   working. So nothing calls Supabase without checking `configured` first. */
import type { Dog, TraitPentagon, UserType } from "~/types";
import type { AdoptionStatus, DogRow } from "~/types/db";

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
    if (!configured.value || !user.value) return [];
    const { data, error } = await client
      .from("dogs")
      .select(DOG_SELECT)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as DogRow[]).map(toDog);
  }

  /** The signed-in user's profile row, including which org they belong to. */
  async function fetchMyProfile() {
    if (!configured.value || !user.value) return null;
    const { data, error } = await client
      .from("profiles")
      .select("id,email,name,phone,city,user_type,org_id,traits,adoption,onboarded_at")
      .eq("id", user.value.id)
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

  return {
    configured, client, user, toDog,
    fetchDogs, fetchMyOrgDogs, fetchMyProfile,
    createDog, updateDogState, uploadDogPhotos,
  };
}
