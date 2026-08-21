<script setup lang="ts">
/* Partner pitch page — the supply side of the network. Everything claimed here
   is a real app capability: magic-link auth (login.vue), Petfinder/RescueGroups
   integrations (runtimeConfig), risk-first deck sorting, Fast Pass boosts,
   in-app play dates, and SSR'd shareable pet pages with OG images. */
definePageMeta({ layout: false });

useHead({
  title: "Floofer for shelters & rescues — list a dog in minutes",
  meta: [
    {
      name: "description",
      content:
        "Put your animals in front of the people already looking for them. Free listings, magic-link sign-in built for front-desk devices, and priority placement for your most at-risk animals.",
    },
  ],
  link: [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Lexend:wght@300;400;500;700;800&display=swap",
    },
  ],
});

const features = [
  {
    title: "Your urgent animals go first",
    body: "Floofer sorts every deck by risk, not by cuteness or recency. Mark an animal at-risk and they move to the front of every adopter's deck in your area.",
  },
  {
    title: "Sign-in built for the front desk",
    body: "No passwords. Staff and volunteers sign in with a magic link to a work inbox — nothing to forget, rotate, or leak on a shared device.",
  },
  {
    title: "Plays well with Petfinder & RescueGroups",
    body: "Already listing elsewhere? Floofer connects to the Petfinder and RescueGroups APIs, so your animals don't need to be entered twice.",
  },
  {
    title: "Every listing is a landing page",
    body: "Pet profiles are public, shareable, and indexed by search engines — with a proper preview card when staff or fans share them anywhere.",
  },
  {
    title: "Meetings without phone tag",
    body: "Adopters request play dates inside the app. You confirm a time and place — the shelter, the park, a foster's living room.",
  },
  {
    title: "Supporters fund the boost",
    body: "People who can't adopt buy Fast Passes for your urgent animals, pushing them up nearby decks. Their money works for your dogs, not for ads.",
  },
];

const steps = [
  {
    title: "1. Sign in",
    body: "Enter your work email, click the link. That's the whole registration.",
  },
  {
    title: "2. List an animal",
    body: "Photos, a few traits, and their risk status. A listing takes minutes, and edits are instant.",
  },
  {
    title: "3. Meet adopters",
    body: "Matched adopters come to you — pre-filtered by compatibility, ready to schedule a meet.",
  },
];
</script>

<template>
  <div class="landing min-h-dvh bg-white text-black">
    <LandingHeader cta-label="List your animals" cta-to="/login" />

    <!-- hero -->
    <section class="bg-hero">
      <div class="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div class="flex max-w-[720px] flex-col gap-4">
          <p class="eyebrow text-[#ff3]">For shelters, rescues & fosters</p>
          <h1 class="text-4xl font-bold uppercase leading-tight text-white sm:text-5xl xl:text-6xl xl:leading-[1.08]">
            Your longest shots, <span class="text-[#ff3]">seen first</span>
          </h1>
          <p class="max-w-[600px] text-base font-light leading-relaxed text-white/90 lg:text-lg">
            Floofer puts the animals you're most worried about at the front of every
            adopter's deck in your area. Listing is free, takes minutes, and doesn't
            add another password to the front desk.
          </p>
        </div>
        <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <NuxtLink to="/login" class="pill pill-yellow text-base lg:text-lg">List your animals — free</NuxtLink>
          <NuxtLink to="/landing" class="pill pill-outline-yellow text-base lg:text-lg">See the adopter side</NuxtLink>
        </div>
      </div>
    </section>

    <!-- features -->
    <section class="bg-tint">
      <div class="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div class="flex flex-col gap-3">
          <p class="eyebrow text-[#45464d]">Why shelters join</p>
          <h2 class="h2 text-[#1e90ff]">Built around how rescue actually works</h2>
        </div>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div v-for="f in features" :key="f.title" class="card flex flex-col gap-3 p-6">
            <p class="text-xl font-bold text-[#1e90ff]">{{ f.title }}</p>
            <p class="text-base font-light leading-relaxed text-[#45464d]">{{ f.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- how it works -->
    <section class="bg-white">
      <div class="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div class="flex flex-col gap-3">
          <p class="eyebrow text-[#45464d]">From inbox to adopted</p>
          <h2 class="h2 text-[#1e90ff]">Three steps, no training required</h2>
        </div>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div v-for="s in steps" :key="s.title" class="card flex flex-col gap-3 p-6">
            <p class="text-xl font-bold text-[#1e90ff]">{{ s.title }}</p>
            <p class="text-base font-light leading-relaxed text-[#45464d]">{{ s.body }}</p>
          </div>
        </div>
        <p class="max-w-[720px] text-base font-light leading-relaxed text-[#45464d]">
          It costs nothing — Floofer is funded by supporters boosting your animals,
          not by charging rescues. Adoptions still run through your own application,
          screening, and paperwork. We bring you matched adopters; you stay in charge.
        </p>
      </div>
    </section>

    <!-- closing CTA -->
    <section class="bg-sun">
      <div class="mx-auto flex max-w-7xl flex-col items-center gap-7 px-4 py-16 text-center sm:px-6 lg:py-24">
        <h2 class="h2 max-w-[760px] text-[#1e90ff]">
          Put your animals in front of the people already looking for them
        </h2>
        <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <NuxtLink to="/login" class="pill pill-blue text-base lg:text-lg">List your animals — free</NuxtLink>
          <NuxtLink to="/about" class="pill pill-outline-blue text-base lg:text-lg">Questions? About Floofer</NuxtLink>
        </div>
      </div>
    </section>

    <LandingFooter />
  </div>
</template>

<style>
@import "~/assets/css/landing.css";
</style>
