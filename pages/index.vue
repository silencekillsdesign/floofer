<script setup lang="ts">
import type { Dog } from "~/types";

const { dogs, liked, passed, matchPct, like, pass, unswipe } = useStore();
const filters = useFilters();
const router = useRouter();
const history = ref<string[]>([]);
const deckRef = ref<InstanceType<any> | null>(null);

/* At-risk dogs surface first (soonest deadline), then by match %. */
const deck = computed<Dog[]>(() => {
  const available = dogs.value.filter(
    (d) => !d.adopted && !liked.value.includes(d.id) && !passed.value.includes(d.id),
  );
  return applyFilters(available, filters.value, matchPct).sort((a, b) => {
    if (a.risk !== b.risk) return a.risk === "high" ? -1 : 1;
    if (a.risk === "high" && b.risk === "high") return (a.daysLeft ?? 99) - (b.daysLeft ?? 99);
    return matchPct(b) - matchPct(a);
  });
});

function onSwiped(id: string, dir: "left" | "right") {
  history.value.push(id);
  if (dir === "right") {
    // it's a match — go meet them; the bio's CTA is already at "Rescue"
    like(id);
    router.push(`/pet/${id}`);
  } else {
    pass(id);
  }
}

function rewind() {
  const last = history.value.pop();
  if (last) unswipe(last);
}

/* Bring every passed-on dog back into the deck (likes are untouched). */
function restorePassed() {
  history.value = history.value.filter((id) => liked.value.includes(id));
  passed.value = [];
}
</script>

<template>
  <!-- full bleed: header (3.5rem) → bottom nav (4rem + safe area) -->
  <div
    class="relative w-full sm:max-w-md mx-auto p-1.5 sm:p-2 h-[calc(100dvh-3.5rem-4rem-env(safe-area-inset-bottom))] sm:h-[calc(100dvh-3.5rem-1rem)]"
  >
    <SwipeDeck ref="deckRef" :deck="deck" :passed-count="passed.length" @swiped="onSwiped" @undo="rewind" @restore="restorePassed" />

    <!-- docked action bar: pass / bio / like centered, share as a right-edge utility -->
    <div v-if="deck.length" class="absolute inset-x-2 bottom-4 z-20 flex items-center justify-center gap-3">
      <button
        class="w-14 h-14 shrink-0 grid place-items-center rounded-full bg-white text-navy shadow-pop hover:scale-110 transition-transform"
        aria-label="Pass"
        @click="deckRef?.fling('left')"
      >
        <svg viewBox="0 0 24 24" class="w-7 h-7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>

      <NuxtLink
        :to="`/pet/${deck[0].id}`"
        class="w-12 h-12 shrink-0 grid place-items-center rounded-full bg-brand text-white shadow-pop hover:scale-110 hover:bg-brand-deep transition-all"
        :aria-label="`View ${deck[0].name}'s full bio`" title="Full bio"
      >
        <svg viewBox="0 0 24 24" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9.25"/><path d="M12 11v5.5"/><circle cx="12" cy="7.75" r="1.3" fill="currentColor" stroke="none"/></svg>
      </NuxtLink>

      <button
        class="w-14 h-14 shrink-0 grid place-items-center rounded-full bg-white text-pink shadow-pop hover:scale-110 transition-transform"
        aria-label="Like"
        @click="deckRef?.fling('right')"
      >
        <svg viewBox="0 0 24 24" class="w-7 h-7" fill="currentColor"><path d="M12 21s-7.5-4.9-10-9.5C.6 8 2.4 4.5 6 4.5c2.1 0 3.6 1.2 4.5 2.6.4.7 1.5.7 1.9 0 .9-1.4 2.4-2.6 4.5-2.6 3.6 0 5.4 3.5 4 7-2.5 4.6-9 9.5-9 9.5z"/></svg>
      </button>

    </div>
  </div>
</template>
