<script setup lang="ts">
/* Landing page for the magic link. Supabase parses the token out of the URL
   fragment on load; we just wait for the user object to appear, then forward. */
const user = useSupabaseUser();
const route = useRoute();

const next = computed(() => {
  const raw = String(route.query.next ?? "/account");
  return /^\/(?!\/)/.test(raw) ? raw : "/account"; // same-origin paths only
});

const timedOut = ref(false);

onMounted(() => {
  /* If the session never materialises the link was expired or already used —
     say so instead of spinning forever. */
  setTimeout(() => {
    if (!user.value) timedOut.value = true;
  }, 6000);
});

watchEffect(() => {
  if (user.value) navigateTo(next.value, { replace: true });
});

useSeoMeta({ title: "Signing in — Floofer", robots: "noindex" });
</script>

<template>
  <div class="flex-1 grid place-items-center px-5 py-10 text-center">
    <div v-if="timedOut" class="max-w-sm">
      <p class="text-4xl mb-3">🔗</p>
      <h1 class="font-display text-xl font-bold mb-1.5">That link didn't work</h1>
      <p class="text-sm text-ink-soft leading-relaxed mb-4">
        Sign-in links expire after an hour and can only be used once.
      </p>
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
