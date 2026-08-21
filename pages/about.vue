<script setup lang="ts">
/* Mission page — earns trust for the landing page's big claims and gives the
   footer's contact links a real home. */
definePageMeta({ layout: false });

useHead({
  title: "About Floofer — why risk goes first",
  meta: [
    {
      name: "description",
      content:
        "Floofer exists because visibility, not desirability, decides which shelter animals make it out. Here's how the network and the risk-first deck work.",
    },
  ],
  link: [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Lexend:wght@300;400;500;700;800&display=swap",
    },
  ],
});

const principles = [
  {
    title: "Risk goes first",
    body: "Most adoption sites sort by newest or cutest. Floofer sorts by time left. Animals flagged at-risk by their shelter — euthanasia lists, over-capacity intakes — go to the front of every deck in their area.",
  },
  {
    title: "Shelters stay in charge",
    body: "Risk status comes from the shelter or foster responsible for the animal, never from us. Adoptions run through their own screening and paperwork. Floofer connects; the rescue decides.",
  },
  {
    title: "No login walls",
    body: "An at-risk dog's profile has to be shareable, searchable, and open — a login wall is a wall between them and the one person who'd say yes. Browsing never requires an account.",
  },
  {
    title: "Supporters fund dogs, not ads",
    body: "Floofer Plus and Fast Passes are how the network pays for itself: money from people who can't adopt becomes visibility for the animals who need it most.",
  },
];
</script>

<template>
  <div class="landing min-h-dvh bg-white text-black">
    <LandingHeader />

    <!-- hero -->
    <section class="bg-hero">
      <div class="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <p class="eyebrow text-[#ff3]">Our mission</p>
        <h1 class="max-w-[760px] text-4xl font-bold uppercase leading-tight text-white sm:text-5xl xl:text-6xl xl:leading-[1.08]">
          A dog's best day <span class="text-[#ff3]">shouldn't</span> be their last
        </h1>
        <p class="max-w-[640px] text-base font-light leading-relaxed text-white/90 lg:text-lg">
          Hundreds of thousands of healthy, adoptable animals run out of time in shelters
          every year — not because nobody wanted them, but because the right person never
          saw them. Floofer is built on one idea: visibility, not desirability, is what
          decides who makes it out. So we engineered visibility for the ones with the
          least time.
        </p>
      </div>
    </section>

    <!-- principles -->
    <section class="bg-tint">
      <div class="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div class="flex flex-col gap-3">
          <p class="eyebrow text-[#45464d]">How it stays honest</p>
          <h2 class="h2 text-[#1e90ff]">Four rules we won't break</h2>
        </div>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div v-for="p in principles" :key="p.title" class="card flex flex-col gap-3 p-6">
            <p class="text-xl font-bold text-[#1e90ff]">{{ p.title }}</p>
            <p class="text-base font-light leading-relaxed text-[#45464d]">{{ p.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- contact -->
    <section id="contact" class="bg-white scroll-mt-20">
      <div class="mx-auto flex max-w-7xl flex-col items-start gap-5 px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <p class="eyebrow text-[#45464d]">Contact</p>
        <h2 class="h2 text-[#1e90ff]">Talk to a human</h2>
        <p class="max-w-[600px] text-base font-light leading-relaxed text-[#45464d] lg:text-lg">
          Shelter wanting to join, foster with questions, reporter, or someone who just
          found a typo — we read everything.
        </p>
        <a href="mailto:hello@floofer.app" class="pill pill-blue text-base">hello@floofer.app</a>
      </div>
    </section>

    <!-- closing CTA -->
    <section class="bg-sun">
      <div class="mx-auto flex max-w-7xl flex-col items-center gap-7 px-4 py-16 text-center sm:px-6 lg:py-24">
        <h2 class="h2 max-w-[720px] text-[#1e90ff]">Be the reason a countdown stops</h2>
        <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <NuxtLink to="/" class="pill pill-blue text-base lg:text-lg">Start matching — it's free</NuxtLink>
          <NuxtLink to="/shelters" class="pill pill-outline-blue text-base lg:text-lg">Join as a shelter</NuxtLink>
        </div>
      </div>
    </section>

    <LandingFooter />
  </div>
</template>

<style>
@import "~/assets/css/landing.css";
</style>
