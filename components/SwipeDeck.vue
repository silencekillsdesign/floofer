<script setup lang="ts">
import type { Dog } from "~/types";

const props = defineProps<{ deck: Dog[] }>();
const emit = defineEmits<{ swiped: [id: string, dir: "left" | "right"]; undo: [] }>();

/* --- drag state for the top card --- */
const dx = ref(0);
const dy = ref(0);
const dragging = ref(false);
const leaving = ref<null | "left" | "right">(null);
const startX = ref(0);
const startY = ref(0);
const photoIdx = ref(0);

const top = computed(() => props.deck[0]);
watch(() => top.value?.id, () => (photoIdx.value = 0));

const THRESHOLD = 110;
const PHOTO_THRESHOLD = 60;
const rawDy = ref(0);

const cardStyle = computed(() => {
  if (leaving.value) {
    const sign = leaving.value === "right" ? 1 : -1;
    return {
      transform: `translate(${sign * 640}px, ${dy.value - 40}px) rotate(${sign * 24}deg)`,
      transition: "transform 0.38s cubic-bezier(0.2, 0.7, 0.4, 1)",
      opacity: "0",
    };
  }
  return {
    transform: `translate(${dx.value}px, ${dy.value}px) rotate(${dx.value * 0.055}deg)`,
    transition: dragging.value ? "none" : "transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.3)",
  };
});

const likeOpacity = computed(() => Math.min(1, Math.max(0, dx.value / THRESHOLD)));
const noOpacity = computed(() => Math.min(1, Math.max(0, -dx.value / THRESHOLD)));

function onDown(e: PointerEvent) {
  if (leaving.value || !top.value) return;
  dragging.value = true;
  startX.value = e.clientX;
  startY.value = e.clientY;
  try {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  } catch {}
}
function onMove(e: PointerEvent) {
  if (!dragging.value) return;
  dx.value = e.clientX - startX.value;
  rawDy.value = e.clientY - startY.value;
  dy.value = rawDy.value * 0.4;
}
const TAP_SLOP = 8;

function onUp(e?: PointerEvent) {
  if (!dragging.value) return;
  dragging.value = false;
  if (dx.value > THRESHOLD) fling("right");
  else if (dx.value < -THRESHOLD) fling("left");
  else {
    const count = top.value?.photos.length ?? 0;
    const moved = Math.max(Math.abs(dx.value), Math.abs(rawDy.value));
    // mostly-vertical flick → cycle photos (up = next, down = previous)
    if (Math.abs(rawDy.value) > PHOTO_THRESHOLD && Math.abs(dx.value) < PHOTO_THRESHOLD && count) {
      photoIdx.value =
        rawDy.value < 0 ? (photoIdx.value + 1) % count : (photoIdx.value - 1 + count) % count;
    }
    // tap → Tinder-style zones: left 40% previous, right 60% next
    else if (moved < TAP_SLOP && count > 1 && e) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const frac = (startX.value - rect.left) / rect.width;
      photoIdx.value =
        frac < 0.4 ? (photoIdx.value - 1 + count) % count : (photoIdx.value + 1) % count;
    }
    dx.value = 0;
    dy.value = 0;
    rawDy.value = 0;
  }
}

function fling(dir: "left" | "right") {
  if (!top.value || leaving.value) return;
  const id = top.value.id;
  leaving.value = dir;
  setTimeout(() => {
    emit("swiped", id, dir);
    leaving.value = null;
    dx.value = 0;
    dy.value = 0;
  }, 360);
}

defineExpose({ fling });

function onKey(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement)?.tagName;
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
  if (e.key === "ArrowLeft") fling("left");
  if (e.key === "ArrowRight") fling("right");
}
onMounted(() => window.addEventListener("keydown", onKey));
onUnmounted(() => window.removeEventListener("keydown", onKey));

</script>

<template>
  <div class="relative w-full h-full">
    <!-- card stack (top 3) -->
    <div
      v-for="(dog, i) in deck.slice(0, 3).reverse()"
      :key="dog.id"
      class="absolute inset-0 rounded-3xl overflow-hidden shadow-deck bg-card select-none"
      :style="
        dog.id === top?.id
          ? cardStyle
          : {
              transform: `scale(${1 - (deck.slice(0, 3).length - 1 - i) * 0.04}) translateY(${(deck.slice(0, 3).length - 1 - i) * 14}px)`,
              transition: 'transform 0.3s ease',
            }
      "
      :class="dog.id === top?.id ? 'touch-none cursor-grab active:cursor-grabbing z-10' : ''"
      @pointerdown="dog.id === top?.id && onDown($event)"
      @pointermove="dog.id === top?.id && onMove($event)"
      @pointerup="dog.id === top?.id && onUp($event)"
      @pointercancel="dog.id === top?.id && onUp()"
    >
      <DogPhoto
        :src="dog.photos[dog.id === top?.id ? photoIdx : 0]"
        :alt="`Photo of ${dog.name}`"
        :eager="dog.id === top?.id"
      />

      <!-- top gradient + info (Floofer style) -->
      <div class="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none" />
      <div class="absolute top-0 inset-x-0 p-3.5 pr-9 text-white">
        <div class="flex items-center gap-2 flex-wrap">
          <h2 class="font-display font-semibold text-[26px] leading-none drop-shadow">{{ dog.name }}</h2>
          <span
            v-if="dog.risk === 'high'"
            class="px-2.5 py-0.5 rounded-full bg-risk text-white text-[10px] font-bold whitespace-nowrap"
          >⚠ {{ dog.daysLeft != null ? `${dog.daysLeft} days` : "at risk" }}</span>
        </div>
        <p class="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[12px] font-semibold mt-1">
          <span class="flex items-center gap-0.5">
            <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="currentColor"><path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>
            {{ dog.location.city }} <span class="text-white/60 font-medium">({{ milesFrom(dog) }}mi.)</span>
          </span>
          <span class="text-white/40" aria-hidden="true">·</span>
          <span>{{ dog.breed }}</span>
          <span class="text-white/40" aria-hidden="true">·</span>
          <span>{{ dog.sex === "F" ? "♀" : "♂" }}<span class="sr-only">{{ dog.sex === "F" ? "Female" : "Male" }}</span></span>
        </p>
      </div>

      <!-- photo dots -->
      <div v-if="dog.id === top?.id" class="absolute top-5 right-3 flex flex-col gap-1.5">
        <button
          v-for="(p, pi) in dog.photos" :key="pi"
          class="w-2 h-2 rounded-full transition-colors"
          :class="pi === photoIdx ? 'bg-brand' : 'bg-white/40'"
          :aria-label="`Photo ${pi + 1} of ${dog.photos.length}`"
          @pointerdown.stop
          @click.stop="photoIdx = pi"
        />
      </div>

      <!-- stamps -->
      <template v-if="dog.id === top?.id">
        <div
          class="absolute top-24 left-6 px-4 py-1.5 border-4 border-pink text-pink font-extrabold text-3xl rounded-lg -rotate-12 tracking-widest bg-black/30"
          :style="{ opacity: likeOpacity }"
        >LIKE</div>
        <div
          class="absolute top-24 right-6 px-4 py-1.5 border-4 border-brand text-brand font-extrabold text-3xl rounded-lg rotate-12 tracking-widest bg-black/30"
          :style="{ opacity: noOpacity }"
        >Good Luck</div>
      </template>

      <!-- bottom gradient so the action bar reads on any photo -->
      <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
    </div>

    <!-- empty deck -->
    <div v-if="!deck.length" class="absolute inset-0 rounded-3xl border-2 border-dashed border-line grid place-items-center bg-card/60">
      <div class="text-center px-8">
        <p class="text-5xl mb-3">🐾</p>
        <h3 class="font-display text-xl font-semibold mb-1">That's everyone nearby</h3>
        <p class="text-sm text-ink-soft mb-4">Widen your filters, or revisit the ones you passed on — hearts change.</p>
        <button class="px-5 py-2.5 rounded-full bg-brand text-white text-sm font-bold shadow-glow hover:bg-brand-deep" @click="emit('undo')">Rewind last swipe</button>
      </div>
    </div>
  </div>
</template>
