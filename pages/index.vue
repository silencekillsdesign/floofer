<script setup lang="ts">
import type { Dog } from "~/types";

const { dogs, liked, passed, matchPct, like, pass, undoDecision } = useStore();
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

/* ---------- grid · list · deck ----------
   Phones always get the deck: one dog, one decision, full attention. From
   tablet width up (768px) there's room to see the whole field, so the grid
   becomes the default — with a row list for scanning circumstances and the
   deck for focus, both a toggle away in the filter bar. The choice sticks
   per device; a preference isn't a decision anyone should re-make every
   visit. */
const VIEW_KEY = "floofer-match-view";
const view = ref<"deck" | "gallery" | "list">("gallery");
const wide = ref(false);

onMounted(() => {
  const mq = window.matchMedia("(min-width: 768px)");
  const apply = () => (wide.value = mq.matches);
  apply();
  mq.addEventListener("change", apply);
  onUnmounted(() => mq.removeEventListener("change", apply));

  const saved = localStorage.getItem(VIEW_KEY);
  if (saved === "deck" || saved === "gallery" || saved === "list") view.value = saved;
});
watch(view, (v) => localStorage.setItem(VIEW_KEY, v));

function onDecided(id: string, dir: "left" | "right") {
  history.value.push(id);
  if (dir === "right") {
    // it's a match — go meet them; the bio's CTA is already at "Rescue"
    like(id);
    router.push(`/pet/${id}`);
  } else {
    pass(id);
  }
}

/* Grid and list likes don't navigate — leaving on every heart would make
   browsing pointless. A toast confirms the match and offers the door. */
const justLiked = ref<Dog | null>(null);
let likedTimer: ReturnType<typeof setTimeout> | undefined;

function galleryLike(dog: Dog) {
  history.value.push(dog.id);
  like(dog.id);
  justLiked.value = dog;
  clearTimeout(likedTimer);
  likedTimer = setTimeout(() => (justLiked.value = null), 4000);
}
function galleryPass(dog: Dog) {
  history.value.push(dog.id);
  pass(dog.id);
}

function rewind() {
  const last = history.value.pop();
  if (last) undoDecision(last);
}
function undoLike() {
  rewind();
  justLiked.value = null;
}

/* Bring every passed-on dog back into the deck (likes are untouched). */
function restorePassed() {
  history.value = history.value.filter((id) => liked.value.includes(id));
  passed.value = [];
}
</script>

<template>
  <ClientOnly>

  <!-- ==== wide (tablet & desktop): header, faceted filter bar, then the
       chosen view. The bar owns the facets AND the view toggle — one strip,
       always visible, so no view can strand you without a way back. ==== -->
  <div v-if="wide" class="w-full max-w-5xl mx-auto px-4 pt-4 pb-10">
    <div class="mb-4">
      <h1 class="font-display text-2xl font-semibold">Make a match</h1>
      <p class="text-sm text-ink-soft">
        {{ deck.length }} dog{{ deck.length === 1 ? "" : "s" }} waiting
        <span v-if="deck.filter((d) => d.risk === 'high').length" class="text-risk font-semibold">
          · {{ deck.filter((d) => d.risk === "high").length }} at risk</span>
      </p>
    </div>

    <FilterBar v-model:view="view" />

    <MatchGallery
      v-if="view === 'gallery'"
      :deck="deck"
      :passed-count="passed.length"
      @like="galleryLike"
      @pass="galleryPass"
      @undo="rewind"
      @restore="restorePassed"
    />

    <MatchList
      v-else-if="view === 'list'"
      :deck="deck"
      :passed-count="passed.length"
      @like="galleryLike"
      @pass="galleryPass"
      @undo="rewind"
      @restore="restorePassed"
    />

    <!-- deck by choice: same card, sized to fit under header + bar -->
    <div v-else class="relative w-full max-w-md mx-auto h-[calc(100dvh-17.5rem)] min-h-[420px]">
      <MatchDeck ref="deckRef" :deck="deck" :passed-count="passed.length" @decided="onDecided" @undo="rewind" @restore="restorePassed" />

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

    <!-- match toast: confirm without yanking them out of the grid -->
    <Transition
      enter-active-class="transition-all duration-300" enter-from-class="opacity-0 translate-y-3"
      leave-active-class="transition-all duration-200" leave-to-class="opacity-0 translate-y-3"
    >
      <div
        v-if="justLiked"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 pl-4 pr-2 py-2 rounded-full bg-navy text-white shadow-pop"
        role="status"
      >
        <span class="text-sm font-semibold whitespace-nowrap">💛 It's a match with {{ justLiked.name }}!</span>
        <NuxtLink to="/matches" class="px-3 py-1.5 rounded-full bg-brand text-white text-xs font-bold whitespace-nowrap hover:bg-brand-deep">See matches</NuxtLink>
        <button class="px-2 py-1.5 text-xs font-semibold text-white/70 hover:text-white" @click="undoLike">Undo</button>
      </div>
    </Transition>
  </div>

  <!-- ==== phones: the deck, full bleed, untouched ====
       full bleed: header (3.5rem) → bottom nav (4rem + safe area) -->
  <div
    v-else
    class="relative w-full sm:max-w-md mx-auto p-1.5 sm:p-2 h-[calc(100dvh-3.5rem-4rem-env(safe-area-inset-bottom))] sm:h-[calc(100dvh-3.5rem-1rem)]"
  >
    <MatchDeck ref="deckRef" :deck="deck" :passed-count="passed.length" @decided="onDecided" @undo="rewind" @restore="restorePassed" />

    <!-- docked action bar: pass / bio / like -->
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
  </ClientOnly>
</template>
