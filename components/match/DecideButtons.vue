<script setup lang="ts">
/* Pass / like — the product's two verbs, identical wherever a dog can be
   decided on. `lg` is the deck's floating bar (white on photo, with a bio
   link between the verbs); default is the in-card pair on grid and list.
   The caller owns layout and state; this owns the buttons. */

import type { Dog } from "~/types";

defineProps<{
  dog: Dog;
  /** Deck-bar treatment: bigger, shadowed, with the bio link in the middle. */
  lg?: boolean;
}>();
const emit = defineEmits<{ pass: []; like: [] }>();
</script>

<template>
  <button
    class="shrink-0 grid place-items-center rounded-full transition-all hover:scale-110"
    :class="lg ? 'w-14 h-14 bg-white text-navy shadow-pop' : 'w-11 h-11 bg-paper text-navy border border-line hover:border-ink-faint'"
    :aria-label="`Pass on ${dog.name}`"
    @click="emit('pass')"
  >
    <AppIcon name="close" :class="lg ? 'w-7 h-7' : 'w-5 h-5'" :stroke-width="3.2" />
  </button>

  <NuxtLink
    v-if="lg"
    :to="`/pet/${dog.id}`"
    class="w-12 h-12 shrink-0 grid place-items-center rounded-full bg-brand text-white shadow-pop hover:scale-110 hover:bg-brand-deep transition-all"
    :aria-label="`View ${dog.name}'s full bio`"
    title="Full bio"
  >
    <AppIcon name="info" class="w-6 h-6" />
  </NuxtLink>

  <button
    class="shrink-0 grid place-items-center rounded-full transition-all hover:scale-110"
    :class="lg ? 'w-14 h-14 bg-white text-pink shadow-pop' : 'w-11 h-11 bg-paper text-pink border border-line hover:border-pink'"
    :aria-label="`Like ${dog.name}`"
    @click="emit('like')"
  >
    <AppIcon name="heart" :class="lg ? 'w-7 h-7' : 'w-5 h-5'" />
  </button>
</template>
