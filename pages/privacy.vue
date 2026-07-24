<script setup lang="ts">
/* Plain-language privacy notice describing Floofer's ACTUAL data practices at
   the pilot stage. Kept factual and modest on purpose — it should never
   promise more than the code does. CJ: have this reviewed by someone
   qualified before non-invited members use the app, especially because it
   handles other people's data and children's ages. Update `lastUpdated` and
   the contact address as needed. */
const lastUpdated = "July 2026";
const contact = "cj@silencekillsdesign.com";
useSeoMeta({
  title: "Privacy — Floofer",
  description: "What Floofer collects, where it's stored, who can see it, and how to delete it.",
});
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <div class="mx-auto w-full max-w-2xl px-5 py-8">
      <NuxtLink to="/account" class="text-sm font-semibold text-brand hover:underline">← Back</NuxtLink>

      <h1 class="font-display text-[30px] font-bold leading-tight mt-4 mb-1.5">Privacy at Floofer</h1>
      <p class="text-sm text-ink-soft mb-2">Last updated {{ lastUpdated }}.</p>

      <div class="p-3.5 rounded-2xl bg-brand-soft border border-brand/25 text-[13px] leading-relaxed text-ink-soft mb-7">
        <strong class="text-ink">Floofer is an early pilot.</strong> We collect as little as we can, keep most
        of it on your own device, and let you delete it at any time. This page describes exactly what happens today —
        not what we might do someday.
      </div>

      <section class="space-y-6 text-[15px] leading-relaxed">
        <div>
          <h2 class="font-display text-lg font-bold mb-1.5">What we collect</h2>
          <p class="text-ink-soft mb-2">Only what you type in. Depending on how you use the app, that can include:</p>
          <ul class="list-disc pl-5 space-y-1 text-ink-soft">
            <li>Your name, email, phone, and city.</li>
            <li>Your adoption profile: household make-up (including children's ages if you enter them),
              housing and landlord details, work, and pet/vet history.</li>
            <li>Photos you add — of your home, your current pets, or (for shelters) the animals you list.</li>
            <li>Which dogs you swipe on, so your deck and matches make sense.</li>
          </ul>
          <p class="text-ink-soft mt-2">
            We do <strong class="text-ink">not</strong> use tracking cookies, advertising, or third-party analytics
            that identify you. There is no real payment processing in this pilot; any card fields are placeholders.
          </p>
        </div>

        <div>
          <h2 class="font-display text-lg font-bold mb-1.5">Where it's stored</h2>
          <ul class="list-disc pl-5 space-y-1 text-ink-soft">
            <li><strong class="text-ink">On your device.</strong> Your profile, photos, and swipe history live in
              your own browser. If you never sign in, they never leave it.</li>
            <li><strong class="text-ink">In our database</strong> (Supabase), only if you sign in. Your account row
              is protected so that <strong class="text-ink">only you can read it</strong> — other users, including
              shelters, cannot query your profile.</li>
          </ul>
        </div>

        <div>
          <h2 class="font-display text-lg font-bold mb-1.5">Who can see it</h2>
          <p class="text-ink-soft">
            Your adoption profile is private to you. It is shared with a shelter
            <strong class="text-ink">only at the moment you choose to contact one</strong>, and only the summary you
            see attached to that message — and only after you tick the consent box. We never sell your data, and we
            never share it with anyone you didn't message. Shelters can see the pets they list; adopters browsing
            those listings see what the shelter chose to publish.
          </p>
        </div>

        <div>
          <h2 class="font-display text-lg font-bold mb-1.5">Deleting your data</h2>
          <p class="text-ink-soft">
            Go to <NuxtLink to="/account" class="text-brand font-semibold underline">Account</NuxtLink> and use
            <em>Delete my data</em>. It erases your profile, photos, documents, and swipe history from this device and
            from our database. To remove your sign-in account entirely, email us and we'll delete it.
          </p>
        </div>

        <div>
          <h2 class="font-display text-lg font-bold mb-1.5">Children</h2>
          <p class="text-ink-soft">
            Floofer is for adults arranging adoptions. We ask for children's ages only to match dogs safely to your
            household; enter a range if you'd rather not be specific. Don't create an account for anyone under 18.
          </p>
        </div>

        <div>
          <h2 class="font-display text-lg font-bold mb-1.5">Contact</h2>
          <p class="text-ink-soft">
            Questions, or want your account removed? Email
            <a :href="`mailto:${contact}`" class="text-brand font-semibold underline">{{ contact }}</a>.
          </p>
        </div>
      </section>

      <p class="text-[12px] text-ink-faint leading-relaxed mt-8 pt-5 border-t border-line/60">
        This notice reflects a pilot product and may change as Floofer grows. Material changes will be posted here with
        an updated date.
      </p>
    </div>
  </div>
</template>
