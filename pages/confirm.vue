<script setup lang="ts">
/* Landing page for a sign-in link. With `redirect: false` on the Supabase
   module (so browsing stays anonymous) the module does NOT auto-consume the
   auth callback — we do it here, explicitly, to cover both link shapes:
     • #access_token=…&refresh_token=…  — implicit flow / admin generateLink
     • ?code=…                          — PKCE flow (the real email magic link)
   Establish the session, then forward to wherever they were headed. */
const client = useSupabaseClient();
const user = useSupabaseUser();
const route = useRoute();

const next = computed(() => {
  const raw = String(route.query.next ?? "/account");
  return /^\/(?!\/)/.test(raw) ? raw : "/account"; // same-origin paths only
});

const state = ref<"working" | "failed">("working");
const detail = ref("");

async function establishSession() {
  try {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    const code = String(route.query.code ?? "");

    if (accessToken && refreshToken) {
      const { error } = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
    } else if (code) {
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else if (!user.value) {
      // Nothing to consume and not already signed in — a bare/expired visit.
      throw new Error("This sign-in link is missing its token. Request a fresh one.");
    }

    /* Strip the token out of the address bar before we leave, so it can't be
       bookmarked, shared, or leaked in a referrer. */
    history.replaceState(null, "", window.location.pathname + window.location.search);
    await navigateTo(next.value, { replace: true });
  } catch (e: any) {
    detail.value = e?.message ?? "The link could not be verified.";
    state.value = "failed";
  }
}

onMounted(establishSession);

useSeoMeta({ title: "Signing in — Floofer", robots: "noindex" });
</script>

<template>
  <div class="flex-1 grid place-items-center px-5 py-10 text-center">
    <div v-if="state === 'failed'" class="max-w-sm">
      <p class="text-4xl mb-3">🔗</p>
      <h1 class="font-display text-xl font-bold mb-1.5">That link didn't work</h1>
      <p class="text-sm text-ink-soft leading-relaxed mb-1.5">
        Sign-in links expire after an hour and can only be used once.
      </p>
      <p v-if="detail" class="text-xs text-ink-faint mb-4">{{ detail }}</p>
      <NuxtLink to="/login" class="inline-block px-5 py-2.5 rounded-full bg-brand text-white text-sm font-bold shadow-glow">
        Send a new link
      </NuxtLink>
    </div>
    <div v-else>
      <p class="text-4xl mb-3 animate-pulse">🐾</p>
      <p class="text-sm font-semibold text-ink-soft">Signing you in…</p>
    </div>
  </div>
</template>
