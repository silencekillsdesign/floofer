/* Bridges Supabase auth to the app's UI state.
   The whole UI reads userType/name/etc. from useStore's local profile, which
   predates the database. Without this, signing in authenticates you in
   Postgres but the app still thinks you're the default adopter — so a shelter
   would log in and never see their own tools. On sign-in we pull the DB
   profile and merge the identity fields in; on sign-out we hand the account
   back to a plain adopter. Local-only fields (payment, photos, documents) are
   preserved either way. */
export default defineNuxtPlugin(() => {
  const db = useDb();
  const { profile, hydrated } = useStore();

  if (!db.configured.value) return; // no backend → nothing to sync

  /* Track whether we've actually seen a signed-in user, so the hydration gap
     (user ref briefly has no id on load) isn't mistaken for a sign-out and
     doesn't flash the shelter UI back to adopter. */
  let hadUser = false;

  watch(
    /* db.userId resolves the id from the JWT-claims shape (`sub`) as well as a
       normal user object (`id`); watching it re-runs the moment it's real. */
    [db.userId, hydrated],
    async ([uid, ready]) => {
      if (!ready) return; // wait for localStorage hydration before touching profile

      if (!uid) {
        // Genuine sign-out only (we had a user, now we don't) — not the
        // initial not-yet-hydrated state.
        if (hadUser) {
          hadUser = false;
          profile.value = { ...profile.value, userType: "adopter", orgId: undefined };
        }
        return;
      }

      hadUser = true;
      try {
        const p = await db.fetchMyProfile();
        if (!p) return;
        profile.value = {
          ...profile.value,
          userType: p.user_type,
          orgId: p.org_id ?? undefined,
          // Fall back to the existing value so a blank DB field doesn't wipe
          // something the user already typed locally.
          name: p.name || profile.value.name,
          email: p.email || profile.value.email,
          phone: p.phone || profile.value.phone,
          /* The server stores a display city only; the structured address is
             local until the profiles table carries it. Never blank what's here. */
          address: p.city
            ? { ...profile.value.address, city: p.city.split(",")[0].trim() || profile.value.address.city }
            : profile.value.address,
          traits: p.traits ?? profile.value.traits,
        };
      } catch (e) {
        console.warn("[floofer] profile sync failed", e);
      }
    },
    { immediate: true },
  );
});
