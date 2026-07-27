<script setup lang="ts">
const route = useRoute();
const { liked, dogs, profile, hydrated } = useStore();
const { theme, toggle } = useTheme();
const showFilters = useShowFilters();
const { wagging } = useLogoWag();

const likedCount = computed(
  () => dogs.value.filter((d) => liked.value.includes(d.id) && !d.adopted).length,
);

const tabs = [
  { to: "/", label: "Match", icon: "M6 10.9a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8zM9.9 7.85a2.05 2.05 0 1 1 0-4.1 2.05 2.05 0 0 1 0 4.1zM14.1 7.85a2.05 2.05 0 1 1 0-4.1 2.05 2.05 0 0 1 0 4.1zM18 10.9a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8zM12 10.8c2.8 0 5.6 2.4 5.6 5.2 0 2-1.6 3.2-3.4 3.2-.85 0-1.5-.4-2.2-.4-.7 0-1.35.4-2.2.4-1.8 0-3.4-1.2-3.4-3.2 0-2.8 2.8-5.2 5.6-5.2z" },
  { to: "/map", label: "Map", icon: "M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" },
  { to: "/matches", label: "Matches", icon: "M12 21s-7.5-4.9-10-9.5C.6 8 2.4 4.5 6 4.5c2.1 0 3.6 1.2 4.5 2.6.4.7 1.5.7 1.9 0 .9-1.4 2.4-2.6 4.5-2.6 3.6 0 5.4 3.5 4 7-2.5 4.6-9 9.5-9 9.5z" },
  { to: "/account", label: "Account", icon: "M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2c-4 0-8 2-8 5v2h16v-2c0-3-4-5-8-5z" },
];
const isActive = (to: string) => (to === "/" ? route.path === "/" : route.path.startsWith(to));

/* First-run wizard, adopters only — orgs and fosters go straight to listing.
   Gated on `hydrated` so a returning user never sees it flash before
   localStorage has been read back. */
const showOnboarding = computed(
  () => hydrated.value && profile.value.userType === "adopter" && !profile.value.onboardedAt,
);
</script>

<template>
  <div class="min-h-dvh flex flex-col bg-paper">
    <!-- top bar -->
    <header class="sticky top-0 z-40 bg-paper/85 backdrop-blur border-b border-line/60">
      <div class="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <!-- Logo tracks the brand token, so the mark and the UI can never drift
             into two different blues (and it lifts correctly in dark mode). -->
        <NuxtLink
          to="/"
          class="block w-[128px] shrink-0"
          style="--floofer-ink: rgb(var(--c-brand))"
          aria-label="Floofer home"
        >
          <ClientOnly>
            <FlooferLogo :wagging="wagging" />
            <!-- same box while hydrating, so the header doesn't reflow -->
            <template #fallback><FlooferLogo /></template>
          </ClientOnly>
        </NuxtLink>
        <div class="flex items-center gap-0.5">
          <nav class="hidden sm:flex items-center gap-1 mr-2" aria-label="Main">
            <NuxtLink
              v-for="t in tabs" :key="t.to" :to="t.to"
              class="relative px-4 py-1.5 rounded-full text-sm font-semibold transition-colors"
              :class="isActive(t.to) ? 'bg-brand text-white' : 'text-ink-soft hover:bg-paper-warm hover:text-ink'"
            >
              {{ t.label }}
              <ClientOnly>
                <span
                  v-if="t.to === '/matches' && likedCount"
                  class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-pink text-white text-[10px] font-bold"
                >{{ likedCount }}</span>
              </ClientOnly>
            </NuxtLink>
            <NuxtLink
              to="/plus"
              class="plus-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-extrabold text-white ml-1"
              :class="isActive('/plus') && 'is-active'"
            >
              <svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor" aria-hidden="true"><path d="M12 2l2.2 5.6L20 9l-4.4 3.6L17 19l-5-3.2L7 19l1.4-6.4L4 9l5.8-1.4L12 2z"/></svg>
              Plus
            </NuxtLink>
          </nav>

          <!-- filters -->
          <button
            class="w-9 h-9 grid place-items-center rounded-full text-brand hover:bg-paper-warm transition-colors"
            :aria-expanded="showFilters" aria-label="Filters" title="Filters"
            @click="showFilters = !showFilters"
          >
            <svg viewBox="0 0 24 24" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 7h10m4 0h2M4 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0m14 10H8m-4 0h2m12 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/></svg>
          </button>

          <!-- theme toggle — client-only: the server can't know the stored
               preference, and rendering the wrong icon breaks hydration -->
          <ClientOnly>
            <button
              class="w-9 h-9 grid place-items-center rounded-full text-brand hover:bg-paper-warm transition-colors"
              :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
              :title="theme === 'dark' ? 'Light mode' : 'Dark mode'"
              @click="toggle"
            >
              <svg v-if="theme === 'dark'" viewBox="0 0 24 24" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2m0 15v2m9.5-9.5h-2m-15 0h-2m16.2-6.7-1.4 1.4M6.7 17.3l-1.4 1.4m0-13.4 1.4 1.4m10.6 10.6 1.4 1.4"/></svg>
              <svg v-else viewBox="0 0 24 24" class="w-6 h-6" fill="currentColor"><path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 8.5 8.5 0 1 0 21 14.5z"/></svg>
            </button>
            <template #fallback>
              <span class="w-9 h-9 block" aria-hidden="true" />
            </template>
          </ClientOnly>

          <!-- settings (mobile) -->
          <NuxtLink to="/account" class="sm:hidden w-9 h-9 grid place-items-center rounded-full text-brand hover:bg-paper-warm" aria-label="Account settings">
            <svg viewBox="0 0 24 24" class="w-6 h-6" fill="currentColor"><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.6a.5.5 0 0 0 .1-.6l-1.9-3.3a.5.5 0 0 0-.6-.2l-2.4 1a7.7 7.7 0 0 0-1.7-1l-.4-2.6a.5.5 0 0 0-.5-.4h-3.8a.5.5 0 0 0-.5.4l-.4 2.6c-.6.3-1.2.6-1.7 1l-2.4-1a.5.5 0 0 0-.6.2L2.7 8.8a.5.5 0 0 0 .1.6l2 1.6a7.6 7.6 0 0 0 0 2l-2 1.6a.5.5 0 0 0-.1.6l1.9 3.3c.1.2.4.3.6.2l2.4-1c.5.4 1.1.7 1.7 1l.4 2.6c0 .2.2.4.5.4h3.8c.3 0 .5-.2.5-.4l.4-2.6a7.7 7.7 0 0 0 1.7-1l2.4 1c.2.1.5 0 .6-.2l1.9-3.3a.5.5 0 0 0-.1-.6l-2-1.6zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/></svg>
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="flex-1 flex flex-col">
      <slot />
    </main>

    <!-- bottom tab bar (mobile) -->
    <nav class="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-paper/95 backdrop-blur border-t border-line/60" aria-label="Main" style="padding-bottom: env(safe-area-inset-bottom)">
      <div class="grid grid-cols-5 h-16">
        <NuxtLink
          v-for="t in tabs" :key="t.to" :to="t.to"
          class="relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold"
          :class="isActive(t.to) ? 'text-brand' : 'text-ink-faint'"
        >
          <svg viewBox="0 0 24 24" class="w-6 h-6"><path :d="t.icon" fill="currentColor" /></svg>
          {{ t.label }}
          <ClientOnly>
            <span
              v-if="t.to === '/matches' && likedCount"
              class="absolute top-1.5 right-1/2 translate-x-4 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-pink text-white text-[9px] font-bold"
            >{{ likedCount }}</span>
          </ClientOnly>
        </NuxtLink>

        <!-- Plus reads as an offer, not a fifth destination — so it's a filled
             pill rather than another icon-and-label like its neighbours. -->
        <NuxtLink to="/plus" class="flex items-center justify-center px-1.5" aria-label="Floofer Plus">
          <span
            class="plus-pill flex flex-col items-center justify-center w-full py-1.5 rounded-2xl text-white shadow-glow"
            :class="isActive('/plus') && 'is-active'"
          >
            <svg viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor" aria-hidden="true"><path d="M12 2l2.2 5.6L20 9l-4.4 3.6L17 19l-5-3.2L7 19l1.4-6.4L4 9l5.8-1.4L12 2z"/></svg>
            <span class="text-[11px] font-extrabold leading-none mt-0.5">Plus</span>
          </span>
        </NuxtLink>
      </div>
    </nav>

    <!-- global filter panel (self-contained full-screen overlay) -->
    <FilterPanel :open="showFilters" @close="showFilters = false" />

    <!-- first-run adopter wizard -->
    <ClientOnly>
      <!-- closes itself: finishing stamps profile.onboardedAt, which flips showOnboarding -->
      <AdopterOnboarding :open="showOnboarding" />
    </ClientOnly>
  </div>
</template>

<style scoped>
/* Brand indigo into the like-pink: the two colours the app already uses for
   "this dog" and "I want this dog". Reads as warmth rather than as an upsell. */
.plus-pill {
  background-image: linear-gradient(135deg, rgb(var(--c-brand)), rgb(var(--c-pink)));
  transition: filter 0.15s ease, transform 0.15s ease;
}
.plus-pill:hover {
  filter: brightness(1.08);
}
.plus-pill.is-active {
  filter: brightness(1.12);
  box-shadow: 0 0 0 2px rgb(var(--c-paper)), 0 0 0 4px rgb(var(--c-pink) / 0.5);
}
a:active .plus-pill {
  transform: scale(0.96);
}
@media (prefers-reduced-motion: reduce) {
  .plus-pill,
  a:active .plus-pill {
    transition: none;
    transform: none;
  }
}
</style>
