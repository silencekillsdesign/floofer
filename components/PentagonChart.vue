<script setup lang="ts">
import type { TraitPentagon } from "~/types";

const props = withDefaults(
  defineProps<{
    pet: TraitPentagon;
    user?: TraitPentagon | null;
    size?: number;
    showLegend?: boolean;
  }>(),
  { size: 300, user: null, showLegend: true },
);

const AXES: { key: keyof TraitPentagon; label: string; petHint: string; youHint: string }[] = [
  { key: "energy", label: "Energy", petHint: "energy level", youHint: "household activity" },
  { key: "space", label: "Space", petHint: "room needed", youHint: "space you have" },
  { key: "social", label: "Social", petHint: "loves company", youHint: "busy household" },
  { key: "independence", label: "Solo time", petHint: "okay alone", youHint: "hours away" },
  { key: "training", label: "Training", petHint: "needs work", youHint: "your experience" },
];

const C = computed(() => props.size / 2);
const R = computed(() => props.size / 2 - 44);

function point(axisIndex: number, value: number): [number, number] {
  const angle = (Math.PI * 2 * axisIndex) / 5 - Math.PI / 2;
  const r = (value / 10) * R.value;
  return [C.value + r * Math.cos(angle), C.value + r * Math.sin(angle)];
}

/* Axes align directly (see scoreMatch), so overlapping shapes really do mean
   a good fit — no per-axis inversion. */
const poly = (t: TraitPentagon) =>
  AXES.map((a, i) => point(i, t[a.key]).map((n) => n.toFixed(1)).join(",")).join(" ");

const rings = [2.5, 5, 7.5, 10];
const petPoly = computed(() => poly(props.pet));
const userPoly = computed(() => (props.user ? poly(props.user) : ""));
const labelPos = (i: number) => {
  const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
  const r = R.value + 26;
  return { x: C.value + r * Math.cos(angle), y: C.value + r * Math.sin(angle) };
};
</script>

<template>
  <div>
    <svg :viewBox="`0 0 ${size} ${size}`" class="w-full h-auto" role="img" aria-label="Trait pentagon comparing this dog's needs with your home">
      <!-- grid -->
      <polygon
        v-for="r in rings" :key="r"
        :points="AXES.map((_, i) => point(i, r).map((n) => n.toFixed(1)).join(',')).join(' ')"
        class="fill-none stroke-line" :stroke-width="r === 10 ? 1.5 : 1"
      />
      <line
        v-for="(_, i) in AXES" :key="'ax' + i"
        :x1="C" :y1="C" :x2="point(i, 10)[0]" :y2="point(i, 10)[1]"
        class="stroke-line" stroke-width="1"
      />
      <!-- user (living conditions) -->
      <polygon v-if="user" :points="userPoly" class="fill-you stroke-you" fill-opacity="0.18" stroke-width="2" stroke-linejoin="round" />
      <!-- pet -->
      <polygon :points="petPoly" class="fill-brand stroke-brand" fill-opacity="0.22" stroke-width="2.5" stroke-linejoin="round" />
      <circle
        v-for="(a, i) in AXES" :key="'pt' + i"
        :cx="point(i, pet[a.key])[0]"
        :cy="point(i, pet[a.key])[1]"
        r="4" class="fill-brand"
      />
      <!-- labels -->
      <text
        v-for="(a, i) in AXES" :key="'lb' + i"
        :x="labelPos(i).x" :y="labelPos(i).y"
        text-anchor="middle" dominant-baseline="middle"
        class="fill-ink font-semibold" style="font-size: 12px"
      >{{ a.label }}</text>
    </svg>
    <div v-if="showLegend" class="flex items-center justify-center gap-5 mt-2 text-xs font-medium text-ink-soft">
      <span class="flex items-center gap-1.5"><i class="w-3 h-3 rounded-sm bg-brand/70 inline-block" /> {{ "Their needs" }}</span>
      <span v-if="user" class="flex items-center gap-1.5"><i class="w-3 h-3 rounded-sm bg-you/70 inline-block" /> Your home</span>
    </div>
  </div>
</template>
