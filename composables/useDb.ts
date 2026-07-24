/* The one gate between the app and Supabase.
   Floofer has to run with no backend at all — the demo deck, the shareable
   pet pages and the whole portfolio path predate the database and must keep
   working. So nothing calls Supabase without checking `configured` first. */
import type { Dog } from "~/types";
import type { DogRow } from "~/types/db";

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

  return { configured, client, user, fetchDogs, fetchMyOrgDogs, toDog };
}
