<script setup lang="ts">
/* Plain-language terms for the pilot. Same voice and honesty rules as
   privacy.vue: describe how the product actually works today, promise
   nothing the code doesn't do. CJ: have this reviewed by someone qualified
   before public launch — especially the liability and payments sections. */
const lastUpdated = "August 2026";
const contact = "cj@silencekillsdesign.com";
useSeoMeta({
  title: "Terms — Floofer",
  description: "The plain-language rules for using Floofer: what we do, what you agree to, and where our role ends.",
});
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <div class="mx-auto w-full max-w-2xl px-5 py-8">
      <NuxtLink to="/" class="text-sm font-semibold text-brand hover:underline">← Back</NuxtLink>

      <h1 class="font-display text-[30px] font-bold leading-tight mt-4 mb-1.5">Floofer's terms, in plain language</h1>
      <p class="text-sm text-ink-soft mb-2">Last updated {{ lastUpdated }}.</p>

      <div class="p-3.5 rounded-2xl bg-brand-soft border border-brand/25 text-[13px] leading-relaxed text-ink-soft mb-7">
        <strong class="text-ink">Floofer is an early pilot.</strong> These terms are written to be read, not
        skimmed past. Using Floofer means you agree to them. If something here seems unfair or unclear,
        tell us — that's not a rhetorical offer.
      </div>

      <section class="space-y-6 text-[15px] leading-relaxed">
        <div>
          <h2 class="font-display text-lg font-bold mb-1.5">What Floofer is (and isn't)</h2>
          <p class="text-ink-soft">
            Floofer connects people with shelters, rescues, and fosters that have animals looking for homes.
            We are the introduction, not the adoption: every application, screening decision, fee, and
            contract happens with the organisation responsible for the animal, under their process.
            We never take custody of animals and we don't approve or reject adopters.
          </p>
        </div>

        <div>
          <h2 class="font-display text-lg font-bold mb-1.5">Listings</h2>
          <ul class="list-disc pl-5 space-y-1 text-ink-soft">
            <li>Shelters, rescues, and fosters are responsible for their listings being accurate and theirs to post —
              including photos, health details, and risk status.</li>
            <li>Risk status ("urgent") is declared by the listing organisation, not by Floofer. We sort by it;
              we don't invent it.</li>
            <li>Some listings come from partner platforms (Petfinder, RescueGroups) under their data terms.
              We show them in good faith and link back to the source of truth.</li>
          </ul>
        </div>

        <div>
          <h2 class="font-display text-lg font-bold mb-1.5">Your account and conduct</h2>
          <p class="text-ink-soft mb-2">Browsing needs no account. If you create one, or contact a shelter through Floofer:</p>
          <ul class="list-disc pl-5 space-y-1 text-ink-soft">
            <li>Be truthful — in your adoption profile, your messages, and your listings.</li>
            <li>Use Floofer only to adopt, foster, list, or support animals. Not to harass people,
              scrape data, resell animals, send spam, or misrepresent who you are.</li>
            <li>You're responsible for what happens under your sign-in. Magic links are tied to your email;
              guard that inbox.</li>
            <li>We can suspend accounts or remove content that breaks these rules or endangers an animal or a person.
              For a pilot this small, that call is made by a human.</li>
          </ul>
        </div>

        <div>
          <h2 class="font-display text-lg font-bold mb-1.5">Your content</h2>
          <p class="text-ink-soft">
            What you post stays yours. By posting it you give us permission to show it in the app and in
            share previews (that's what a listing is for). Delete your content or account and that permission
            ends, as described in our <NuxtLink to="/privacy" class="text-brand font-semibold hover:underline">privacy notice</NuxtLink>.
          </p>
        </div>

        <div>
          <h2 class="font-display text-lg font-bold mb-1.5">Supporter features</h2>
          <p class="text-ink-soft">
            Fast Passes and Floofer Plus fund visibility for at-risk animals. Where paid features are offered,
            the price and what you get are stated at the point of purchase. A boost buys visibility —
            it never guarantees an adoption, and it never overrides a shelter's screening.
          </p>
        </div>

        <div>
          <h2 class="font-display text-lg font-bold mb-1.5">Honest limits</h2>
          <ul class="list-disc pl-5 space-y-1 text-ink-soft">
            <li>Floofer is provided as-is, free, during the pilot. We work hard to keep it accurate and up,
              but we can't promise either.</li>
            <li>Animal details come from the listing organisation; meeting an animal in person is part of every
              adoption for a reason.</li>
            <li>To the extent the law allows, our liability is limited to what you paid us — which, for most
              of the pilot, is nothing.</li>
          </ul>
        </div>

        <div>
          <h2 class="font-display text-lg font-bold mb-1.5">Changes</h2>
          <p class="text-ink-soft">
            If these terms change in a way that matters, we'll say so in the app with a date — not bury it.
            The "last updated" line above is the version you're agreeing to.
          </p>
        </div>

        <div>
          <h2 class="font-display text-lg font-bold mb-1.5">Questions</h2>
          <p class="text-ink-soft">
            Write to <a :href="`mailto:${contact}`" class="text-brand font-semibold hover:underline">{{ contact }}</a>.
            A person reads it.
          </p>
        </div>
      </section>
    </div>
  </div>
</template>
