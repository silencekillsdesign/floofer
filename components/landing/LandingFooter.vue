<script setup lang="ts">
const footerCols = [
  { title: "The Network", links: [
    { label: "Adopt", to: "/" },
    { label: "For shelters & rescues", to: "/shelters" },
    { label: "Become a foster", to: "/login" },
    { label: "Boost a dog", to: "/plus" },
  ] },
  { title: "Explore", links: [
    { label: "Rescue map", to: "/map" },
    { label: "Compatibility quiz", to: "/" },
    { label: "Happy tails", to: "/landing#stories" },
    { label: "About", to: "/about" },
  ] },
  { title: "Legal", links: [
    { label: "Privacy", to: "/privacy" },
    { label: "Terms", to: "/privacy" },
  ] },
];

const socials = [
  { label: "Instagram", icon: "/img/landing/icon-instagram.svg" },
  { label: "Twitter", icon: "/img/landing/icon-twitter.svg" },
  { label: "Facebook", icon: "/img/landing/icon-facebook.svg" },
];
</script>

<template>
  <footer class="bg-dark">
    <div class="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-14 sm:px-6 lg:px-10 lg:py-16">
      <div class="flex flex-col items-start justify-between gap-10 lg:flex-row">
        <div class="flex max-w-[420px] flex-col gap-4">
          <NuxtLink to="/landing" class="block w-[140px]" style="--floofer-ink: #ff3" aria-label="Floofer home">
            <FlooferLogo />
          </NuxtLink>
          <p class="text-base font-light leading-relaxed text-[#e4dad7]">
            Floofer is the pet rescue network — shelters, fosters, adopters, and
            supporters working the same deck, so the animals with the least time
            get seen first.
          </p>
        </div>
        <div class="flex flex-wrap gap-12 lg:gap-16">
          <div v-for="col in footerCols" :key="col.title" class="flex flex-col gap-2.5">
            <p class="text-base font-bold text-white">{{ col.title }}</p>
            <NuxtLink
              v-for="l in col.links"
              :key="l.label"
              :to="l.to"
              class="text-sm font-medium text-[#e4dad7] transition-colors hover:text-[#ff3]"
            >{{ l.label }}</NuxtLink>
          </div>
        </div>
      </div>
      <div class="h-px w-full bg-white/10" />
      <div class="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <p class="text-sm font-medium text-[#e4dad7]">© 2026 Floofer. All rights reserved.</p>
        <div class="flex items-center gap-3">
          <a
            v-for="s in socials"
            :key="s.label"
            href="#"
            :aria-label="s.label"
            class="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.08] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/20"
          >
            <img :src="s.icon" alt="" class="size-4" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>
