<script setup lang="ts">
/* Magic-link sign-in. Deliberately passwordless: shelter staff share devices
   and rotate volunteers, and a link to a work inbox is both lower friction
   and one less credential to leak. */
const { configured, client, user } = useDb();
const route = useRoute();

const email = ref("");
const sent = ref(false);
const busy = ref(false);
const error = ref("");

/* Where to land after the link is clicked. Only same-origin relative paths —
   an open redirect here would let a crafted "sign in to Floofer" link bounce
   staff to an attacker's page carrying their session in the URL. */
const next = computed(() => {
  const raw = String(route.query.next ?? "/account");
  return /^\/(?!\/)/.test(raw) ? raw : "/account";
});

watchEffect(() => {
  if (user.value) navigateTo(next.value);
});

async function send() {
  error.value = "";
  const address = email.value.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address)) {
    error.value = "That doesn't look like an email address.";
    return;
  }
  if (!configured.value) {
    error.value = "No database is connected yet, so sign-in is unavailable.";
    return;
  }

  busy.value = true;
  try {
    const { error: err } = await client.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: `${window.location.origin}/confirm?next=${encodeURIComponent(next.value)}` },
    });
    if (err) throw err;
    sent.value = true;
  } catch (e: any) {
    error.value = e?.message ?? "Could not send the link. Try again in a moment.";
  } finally {
    busy.value = false;
  }
}

useSeoMeta({ title: "Sign in — Floofer", robots: "noindex" });
</script>

<template>
  <div class="flex-1 flex items-center justify-center px-5 py-10">
    <div class="w-full max-w-sm">
      <h1 class="font-display text-[26px] font-bold leading-tight mb-1.5">Sign in to Floofer</h1>
      <p class="text-sm text-ink-soft leading-relaxed mb-6">
        For shelters and rescues managing listings. Browsing and swiping never needs an account.
      </p>

      <!-- No backend yet: say so plainly rather than failing on submit. -->
      <div v-if="!configured" class="p-4 rounded-2xl border border-line bg-paper-warm text-sm text-ink-soft">
        <p class="font-semibold text-ink mb-1">Sign-in isn't connected yet</p>
        <p class="leading-relaxed">
          This build is running on demo data. Once a Supabase project is linked, shelter
          accounts work here.
        </p>
      </div>

      <div v-else-if="sent" class="p-5 rounded-2xl border border-safe/40 bg-safe-soft">
        <p class="text-3xl mb-2">📬</p>
        <p class="font-semibold mb-1">Check {{ email }}</p>
        <p class="text-sm text-ink-soft leading-relaxed">
          We sent a sign-in link. It expires in an hour and only works once.
        </p>
        <button class="mt-3 text-sm font-semibold text-brand hover:underline" @click="sent = false">
          Use a different address
        </button>
      </div>

      <form v-else class="space-y-3" @submit.prevent="send">
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wide text-ink-faint mb-1.5" for="login-email">
            Work email
          </label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            autocomplete="email"
            inputmode="email"
            placeholder="intake@yourshelter.org"
            class="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/25"
          />
        </div>

        <p v-if="error" class="text-sm text-risk font-semibold" role="alert">{{ error }}</p>

        <button
          type="submit"
          :disabled="busy"
          class="w-full px-5 py-3 rounded-full bg-brand text-white text-sm font-bold shadow-glow hover:bg-brand-deep disabled:opacity-50"
        >
          {{ busy ? "Sending…" : "Email me a sign-in link" }}
        </button>

        <p class="text-[12px] text-ink-faint leading-relaxed pt-1">
          No password to create or forget. If your shelter hasn't been invited yet, the link
          will sign you in as an adopter.
        </p>
      </form>
    </div>
  </div>
</template>
