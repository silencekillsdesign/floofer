<script setup lang="ts">
/* Marketing landing page — visual system from Figma "D - Home" (node 411:929),
   content positioned around the rescue *network* (shelters + fosters + adopters
   + supporters), not just adoption. Shares chrome and the design system with
   /shelters and /about via LandingHeader/LandingFooter + assets/css/landing.css.

   Funnel truth this page is built on: swiping needs no account (the adopter
   wizard onboards on first visit to "/"), shelters/fosters register at /login,
   supporters at /plus. Every CTA lands on one of those three. */
definePageMeta({ layout: false });

/* Hero search → /map?q=… (the map filters pins by name/breed/shelter). */
const searchQ = ref("");

useHead({
  title: "Floofer — The pet rescue network",
  meta: [
    {
      name: "description",
      content:
        "Floofer connects shelters, fosters, adopters, and supporters into one rescue network — and puts the dogs closest to running out of time at the front of every deck. Start matching free, no signup.",
    },
  ],
  link: [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Lexend:wght@300;400;500;700;800&display=swap",
    },
  ],
});

/* The four roles that make it a network. One card each, one CTA each. */
const roles = [
  {
    title: "Adopters",
    body: "Swipe through the dogs and cats near you, matched to your life. No account needed to start — your profile builds as you go.",
    cta: "Start matching",
    to: "/",
  },
  {
    title: "Shelters & rescues",
    body: "List a dog in minutes with a magic-link sign-in built for shared front-desk devices. Your at-risk animals go to the front of every deck.",
    cta: "List your animals",
    to: "/shelters",
  },
  {
    title: "Fosters",
    body: "Open your home between forever homes. Foster listings live in the same deck as shelters — a couch counts as a rescue.",
    cta: "Become a foster",
    to: "/login",
  },
  {
    title: "Supporters",
    body: "Can't adopt right now? Fund a Fast Pass that moves an urgent dog up every deck in their area. Every boost buys time.",
    cta: "Boost a dog",
    to: "/plus",
  },
];

const pets = [
  { name: "Luna", breed: "Golden Retriever Mix", img: "/img/landing/pet-luna.webp", urgent: false },
  { name: "Mochi", breed: "Domestic Shorthair", img: "/img/landing/pet-mochi.webp", urgent: false },
  { name: "Buddy", breed: "Beagle Mix", img: "/img/landing/pet-buddy.webp", urgent: true },
  { name: "Sage", breed: "Grey Tabby", img: "/img/landing/pet-sage.webp", urgent: false },
  { name: "River", breed: "Labrador Retriever", img: "/img/landing/pet-river.webp", urgent: false },
  { name: "Peanut", breed: "Calico", img: "/img/landing/pet-peanut.webp", urgent: true },
];

const steps = [
  {
    icon: "search",
    title: "1. Match",
    body: "Swipe the deck — no signup, no paywall. Floofer sorts the animals closest to running out of time to the front.",
  },
  {
    icon: "heart",
    title: "2. Meet",
    body: "Like a dog and book a play date right in the app. Meet at the shelter, the park, or a foster's living room.",
  },
  {
    icon: "home",
    title: "3. Adopt",
    body: "Finish the paperwork with the shelter and bring your best friend home. The network cheers. The tail wags.",
  },
] as const;

const stories = [
  {
    photo: "/img/landing/story-luna.webp",
    quote: "“Luna stole our hearts.”",
    body: "“She was three days from the euthanasia list when Floofer put her at the top of our deck. Now she runs ours.”",
    initial: "A",
    name: "Alex & Sam",
    sub: "Adopted Luna",
  },
  {
    photo: "/img/landing/story-peanut.webp",
    quote: "“Peanut is our little queen.”",
    body: "“A stranger's Fast Pass boosted Peanut into our feed. We'd never have found her. Whoever you are — thank you.”",
    initial: "M",
    name: "Mia Chen",
    sub: "Adopted Peanut",
  },
  {
    photo: "/img/landing/story-river.webp",
    quote: "“River is part of the crew.”",
    body: "“The quiz matched River's energy to our hiking-every-weekend life. It knew our dog before we did.”",
    initial: "J",
    name: "Jordan & Family",
    sub: "Adopted River",
  },
];

const faqs = [
  {
    q: "Is Floofer free?",
    a: "Yes — free for adopters, free for shelters and rescues. The network is funded by supporters who buy Fast Passes and Floofer Plus, which boost urgent animals instead of paying for ads.",
  },
  {
    q: "Do I need an account to browse?",
    a: "No. Browsing and swiping never need an account. You'll build a profile as you go so your matches get smarter, but you can start looking right now.",
  },
  {
    q: "Where do the animals come from?",
    a: "Listings come from the network: open-admission municipal shelters, no-kill rescues, foster homes, and families who need to rehome. Every listing is managed by the shelter or foster responsible for that animal.",
  },
  {
    q: "What does the Urgent badge mean?",
    a: "It marks animals closest to running out of time — typically dogs on a euthanasia list or in an over-capacity shelter. Floofer sorts them to the front of every deck in their area.",
  },
  {
    q: "What's a Fast Pass?",
    a: "A supporter-funded boost. When someone buys a Fast Pass for an urgent dog, that dog jumps up every nearby deck until they're matched. It's how people who can't adopt still save lives.",
  },
  {
    q: "Do I adopt through Floofer?",
    a: "You match, meet, and message through Floofer, but the adoption itself — application, paperwork, and any fee — happens with the shelter or rescue, under their own process. We connect; they approve.",
  },
];
</script>

<template>
  <div class="landing min-h-dvh bg-white text-black">
    <LandingHeader />

    <!-- hero -->
    <section class="bg-hero relative overflow-hidden">
      <div class="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 pt-12 sm:px-6 lg:flex-row lg:items-end lg:gap-10 lg:px-10 lg:pt-0">
        <div class="relative z-10 flex flex-col gap-6 py-2 lg:max-w-[540px] lg:shrink-0 lg:py-16 xl:max-w-[600px]">
          <div class="flex flex-col gap-4">
            <p class="reveal eyebrow text-[#ff3]">The Pet Rescue Network</p>
            <h1 class="reveal text-4xl font-bold uppercase leading-tight text-white sm:text-5xl xl:text-[72px] xl:leading-[1.02]" style="--d: 0.08s">
              Your Future best friend <span class="text-[#ff3]">Needs</span> you
            </h1>
            <p class="reveal max-w-[460px] text-base font-light leading-relaxed text-white/90" style="--d: 0.16s">
              Shelters, fosters, adopters, and supporters in one network — the animals
              closest to running out of time go first. Free. No signup. Just start.
            </p>
          </div>
          <div class="reveal flex flex-col items-stretch gap-3 sm:flex-row sm:items-center" style="--d: 0.24s">
            <NuxtLink to="/" class="pill pill-yellow text-base">Start matching — it's free</NuxtLink>
            <NuxtLink to="#network" class="pill pill-outline-yellow text-base">Join the network</NuxtLink>
          </div>
        </div>
        <div class="relative flex w-full items-end justify-center self-end lg:min-w-0 lg:flex-1">
          <!-- soft glow so the cutout pup sits in the scene instead of floating -->
          <div class="hero-glow absolute bottom-0 left-1/2 h-[70%] w-[120%] -translate-x-1/2 rounded-[50%] bg-[#ff3]/10 blur-3xl" aria-hidden="true" />
          <NuxtImg
            src="/img/landing/pup-hero.webp"
            alt="A grey Weimaraner puppy looking up hopefully"
            class="pup-in relative max-h-[380px] w-auto object-contain object-bottom sm:max-h-[460px] lg:max-h-[640px] xl:max-h-[760px]"
            sizes="100vw lg:760px"
          />
        </div>
      </div>
    </section>

    <!-- CTA band -->
    <section class="bg-sun">
      <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:px-10 lg:py-16">
        <p class="display text-4xl font-bold text-[#1e90ff] lg:text-[56px]">Find your Floofr</p>
        <form
          class="flex w-full max-w-[480px] items-center gap-3 rounded-full border-2 border-[#2064e8] px-6 py-3.5 transition-colors focus-within:bg-white"
          @submit.prevent="navigateTo({ path: '/map', query: searchQ.trim() ? { q: searchQ.trim() } : {} })"
        >
          <input
            v-model="searchQ"
            type="search"
            placeholder="search pets"
            aria-label="Search pets by name, breed, or shelter"
            class="min-w-0 flex-1 bg-transparent text-sm font-semibold uppercase tracking-[0.08em] text-[#2064e8] placeholder:text-[#2064e8]/70 focus:outline-none lg:text-base"
          />
          <button type="submit" aria-label="Search" class="shrink-0 text-[#2064e8] transition-transform hover:scale-110">
            <AppIcon name="search" class="h-5 w-5" />
          </button>
        </form>
      </div>
    </section>

    <!-- the network -->
    <section id="network" class="bg-tint scroll-mt-20">
      <div class="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div class="flex flex-col gap-3">
          <p class="eyebrow text-[#45464d]">More than an adoption site</p>
          <h2 class="h2 text-[#1e90ff]">It takes a network to save a life</h2>
          <p class="max-w-[760px] text-base font-light leading-relaxed text-[#45464d] lg:text-lg">
            A dog doesn't run out of time because nobody wants them — they run out of time
            because the right person never saw them. Floofer closes that gap by connecting
            everyone who can help, four ways in:
          </p>
        </div>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div v-for="r in roles" :key="r.title" class="card flex flex-col gap-3 p-6">
            <p class="text-xl font-bold text-[#1e90ff]">{{ r.title }}</p>
            <p class="flex-1 text-base font-light leading-relaxed text-[#45464d]">{{ r.body }}</p>
            <NuxtLink :to="r.to" class="pill pill-blue self-start text-sm">{{ r.cta }}</NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- compatibility quiz -->
    <section id="quiz" class="bg-white">
      <div class="mx-auto flex max-w-7xl flex-col items-center gap-10 px-4 py-16 sm:px-6 lg:flex-row lg:gap-20 lg:px-10 lg:py-24">
        <img
          src="/img/landing/compat-chart.svg"
          alt="Compatibility radar chart matching a pet's traits to yours"
          class="float-slow w-full max-w-[400px] shrink-0"
          loading="lazy"
        />
        <div class="flex max-w-[640px] flex-col items-start gap-5">
          <p class="eyebrow text-[#45464d]">Someone is Wagging for you</p>
          <h2 class="h2 text-[#1e90ff]">Matched to your life, not just your feed</h2>
          <p class="text-base font-light leading-relaxed text-[#45464d] lg:text-lg">
            Two minutes of questions about your home, schedule, energy, and family builds
            your compatibility ring. Every animal in your deck is scored against it — so
            the hiking dog finds the hikers, and the couch potato finds the couch.
          </p>
          <NuxtLink to="/" class="pill pill-blue text-base">
            Take the&nbsp;<span class="font-extrabold">compatibility</span>&nbsp;quiz
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- adoption gallery -->
    <section class="bg-dark">
      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div class="mx-auto flex max-w-[820px] flex-col items-center gap-5 pb-12 text-center">
          <h2 class="h2 text-[#1e90ff]">Who You Can Save Today</h2>
          <p class="text-base leading-relaxed text-[#e4dad7] lg:text-lg">
            Animals like these are on Floofer right now — from municipal shelters, no-kill
            rescues, fosters, and homes. The ones marked urgent are closest to running out
            of time, so they go first.
          </p>
        </div>
        <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink v-for="p in pets" :key="p.name" to="/" class="group flex flex-col gap-3">
            <div class="relative overflow-hidden rounded-2xl">
              <NuxtImg
                :src="p.img"
                :alt="`${p.name}, a ${p.breed} looking for a home`"
                class="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="100vw sm:50vw lg:420px"
                loading="lazy"
              />
              <span
                v-if="p.urgent"
                class="urgent-chip absolute left-4 top-4 rounded-full bg-[#ff4d42] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white"
              >Urgent</span>
            </div>
            <div class="flex items-baseline justify-between gap-3">
              <p class="text-xl font-bold text-white">{{ p.name }}</p>
              <p class="text-sm font-medium text-[#e4dad7]">{{ p.breed }}</p>
            </div>
          </NuxtLink>
        </div>
        <div class="flex justify-center pt-12">
          <NuxtLink to="/" class="pill pill-yellow text-base lg:text-lg">Meet them all — start matching</NuxtLink>
        </div>
      </div>
    </section>

    <!-- live map -->
    <section id="map" class="bg-white scroll-mt-20">
      <div class="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div class="flex flex-col gap-3">
          <p class="eyebrow text-[#45464d]">The live network</p>
          <h2 class="h2 text-[#1e90ff]">Rescue is happening near you</h2>
          <p class="max-w-[760px] text-base font-light leading-relaxed text-[#45464d] lg:text-lg">
            Every pin is an animal in the network — shelters, rescues, and foster homes
            across the map. The red ones are running out of time. Open the map and see
            who's waiting in your neighborhood.
          </p>
        </div>
        <LandingMap />
        <NuxtLink to="/map" class="pill pill-blue self-start text-base">Explore the rescue map</NuxtLink>
      </div>
    </section>

    <!-- how it works -->
    <section id="how" class="bg-tint scroll-mt-20">
      <div class="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div class="flex flex-col gap-3">
          <p class="eyebrow text-[#45464d]">The Floofer Way</p>
          <h2 class="h2 text-[#1e90ff]">How it works</h2>
        </div>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div v-for="s in steps" :key="s.title" class="card flex flex-col gap-4 p-6">
            <div class="grid size-14 place-items-center rounded-full bg-[#ff3] text-[#2064e8]">
              <img v-if="s.icon === 'home'" src="/img/landing/icon-home.svg" alt="" class="size-6" />
              <AppIcon v-else :name="s.icon" class="size-6" />
            </div>
            <p class="text-xl font-bold text-[#1e90ff]">{{ s.title }}</p>
            <p class="text-base font-light leading-relaxed text-[#45464d]">{{ s.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- testimonials -->
    <section id="stories" class="bg-hero scroll-mt-20">
      <div class="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div class="flex flex-col gap-3">
          <p class="eyebrow text-[#ff3]">Success Stories</p>
          <h2 class="h2 text-white">Happy tails</h2>
        </div>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div v-for="t in stories" :key="t.name" class="card flex flex-col gap-4 p-6">
            <NuxtImg
              :src="t.photo"
              :alt="`${t.name} at home with their adopted pet`"
              class="h-[220px] w-full rounded-2xl object-cover object-[center_30%]"
              sizes="100vw md:400px"
              loading="lazy"
            />
            <p class="text-lg font-bold text-[#1e90ff] lg:text-xl">{{ t.quote }}</p>
            <p class="flex-1 text-base font-light leading-relaxed text-[#45464d]">{{ t.body }}</p>
            <div class="flex items-center gap-3">
              <div class="grid size-10 place-items-center rounded-full bg-[#ff3] text-sm font-bold text-[#1e90ff]">
                {{ t.initial }}
              </div>
              <div class="flex flex-col">
                <p class="text-base font-bold text-[#1e90ff]">{{ t.name }}</p>
                <p class="text-sm font-medium text-[#45464d]">{{ t.sub }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- app download -->
    <section id="app" class="bg-white scroll-mt-20">
      <div class="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:px-10 lg:py-24">
        <div class="flex max-w-[640px] flex-col gap-4">
          <p class="eyebrow text-[#45464d]">Get Floofr</p>
          <h2 class="h2 text-[#1e90ff]">Take the network with you</h2>
          <p class="text-base font-light leading-relaxed text-[#45464d] lg:text-lg">
            Match on the bus, book a play date from the park, get a ping when an urgent dog
            appears near you. Install Floofer and the whole rescue network rides in your pocket.
          </p>
        </div>
        <div class="flex flex-col gap-3">
          <NuxtLink
            to="/"
            class="flex items-center gap-3 rounded-full border-2 border-[#1e90ff] bg-white px-6 py-3.5 transition-colors hover:bg-[#1e90ff]/5"
          >
            <img src="/img/landing/icon-apple.svg" alt="" class="size-5" />
            <span class="text-base font-bold text-[#1e90ff]">App Store</span>
          </NuxtLink>
          <NuxtLink
            to="/"
            class="flex items-center gap-3 rounded-full border-2 border-[#1e90ff] bg-white px-6 py-3.5 transition-colors hover:bg-[#1e90ff]/5"
          >
            <img src="/img/landing/icon-play.svg" alt="" class="size-5" />
            <span class="text-base font-bold text-[#1e90ff]">Google Play</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="bg-tint scroll-mt-20">
      <div class="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div class="flex flex-col gap-3">
          <p class="eyebrow text-[#45464d]">Good questions</p>
          <h2 class="h2 text-[#1e90ff]">Before you ask</h2>
        </div>
        <div class="mx-auto grid w-full max-w-[880px] grid-cols-1 gap-4">
          <details v-for="f in faqs" :key="f.q" class="faq">
            <summary>{{ f.q }}</summary>
            <p class="faq-body">{{ f.a }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- closing CTA -->
    <section class="bg-sun">
      <div class="mx-auto flex max-w-7xl flex-col items-center gap-7 px-4 py-16 text-center sm:px-6 lg:py-24">
        <h2 class="h2 max-w-[720px] text-[#1e90ff]">Somewhere out there, a dog is waiting on you</h2>
        <div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <NuxtLink to="/" class="pill pill-blue text-base lg:text-lg">Start matching — it's free</NuxtLink>
          <NuxtLink to="/shelters" class="pill pill-outline-blue text-base lg:text-lg">Join as a shelter or foster</NuxtLink>
        </div>
      </div>
    </section>

    <LandingFooter />
  </div>
</template>

<style>
@import "~/assets/css/landing.css";
</style>
