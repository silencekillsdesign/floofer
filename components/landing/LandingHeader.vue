<script setup lang="ts">
/* Shared chrome for the marketing pages (landing / shelters / about).
   Nav hashes are absolute (/landing#…) so they work from any page. */
withDefaults(defineProps<{ ctaLabel?: string; ctaTo?: string }>(), {
  ctaLabel: "Start matching",
  ctaTo: "/",
});

const nav = [
  { label: "The Network", to: "/landing#network" },
  { label: "How it works", to: "/landing#how" },
  { label: "For shelters", to: "/shelters" },
  { label: "FAQ", to: "/landing#faq" },
  { label: "About", to: "/about" },
];
</script>

<template>
  <header class="bg-hero sticky top-0 z-40 border-b border-dashed border-[#ff3]/70">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:gap-6 sm:px-6 lg:px-10">
      <NuxtLink to="/landing" class="block w-[120px] shrink-0 sm:w-[140px] lg:w-[168px]" style="--floofer-ink: #ff3" aria-label="Floofer home">
        <FlooferLogo />
      </NuxtLink>
      <nav class="hidden items-center gap-7 lg:flex" aria-label="Landing">
        <NuxtLink
          v-for="n in nav"
          :key="n.label"
          :to="n.to"
          class="nav-link text-sm font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:text-[#ff3]"
        >{{ n.label }}</NuxtLink>
      </nav>
      <NuxtLink :to="ctaTo" class="pill pill-yellow text-sm">{{ ctaLabel }}</NuxtLink>
    </div>
  </header>
</template>
