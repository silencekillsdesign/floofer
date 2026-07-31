<script setup lang="ts">
/* Segmented single-choice group — the `seg()` helper and its hand-wired
   button rows, as one model-bound component. Defaults to equal-width flex;
   `twoCol` switches to a 2-column grid for long labels. (A numeric cols prop
   would read nicer, but `grid-cols-${n}` is invisible to Tailwind's compiler
   — literal class names only.) */

defineProps<{
  modelValue: string;
  options: readonly { value: string; label: string }[] | { value: string; label: string }[];
  twoCol?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [v: string] }>();
</script>

<template>
  <div :class="twoCol ? 'grid grid-cols-2 gap-2' : 'flex gap-2'">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      class="py-2.5 rounded-xl text-sm font-semibold border transition-colors"
      :class="[
        twoCol ? 'px-2' : 'flex-1',
        o.value === modelValue
          ? 'bg-brand text-white border-brand'
          : 'bg-card border-line text-ink-soft hover:border-ink-faint',
      ]"
      :aria-pressed="o.value === modelValue"
      @click="emit('update:modelValue', o.value)"
    >{{ o.label }}</button>
  </div>
</template>
