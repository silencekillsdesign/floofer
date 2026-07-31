<script setup lang="ts">
/* The interface's repeated glyphs, in one place. The close ✕ existed eleven
   times as pasted path data before this — one typo away from eleven-minus-one
   consistent icons. Size comes from the caller's classes (w-4 h-4 …); adding
   a glyph here is only justified once a second call site exists. */

const ICONS = {
  close: { body: '<path d="M6 6l12 12M18 6L6 18"/>', w: 2.4 },
  "chevron-down": { body: '<path d="m6 9 6 6 6-6"/>', w: 2.6 },
  check: { body: '<path d="m5 13 4 4L19 7"/>', w: 3 },
  search: { body: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/>', w: 2.4 },
  heart: {
    body: '<path d="M12 21s-7.5-4.9-10-9.5C.6 8 2.4 4.5 6 4.5c2.1 0 3.6 1.2 4.5 2.6.4.7 1.5.7 1.9 0 .9-1.4 2.4-2.6 4.5-2.6 3.6 0 5.4 3.5 4 7-2.5 4.6-9 9.5-9 9.5z"/>',
    w: 0,
    fill: true,
  },
  edit: { body: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', w: 2.4 },
  grid: {
    body: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    w: 2.2,
  },
  list: { body: '<path d="M4 6h16M4 12h16M4 18h16"/>', w: 2.2 },
  card: { body: '<rect x="7" y="4" width="12" height="16" rx="2.5"/><path d="M4.5 6.5v13a1.8 1.8 0 0 0 1 1.6"/>', w: 2.2 },
  info: {
    body: '<circle cx="12" cy="12" r="9.25"/><path d="M12 11v5.5"/><circle cx="12" cy="7.75" r="1.3" fill="currentColor" stroke="none"/>',
    w: 2.2,
  },
} as const;

export type IconName = keyof typeof ICONS;

const props = defineProps<{
  name: IconName;
  /** Override the glyph's default stroke weight (heavier ✕ on big buttons). */
  strokeWidth?: number;
}>();

const icon = computed(() => ICONS[props.name]);
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    :fill="'fill' in icon && icon.fill ? 'currentColor' : 'none'"
    :stroke="'fill' in icon && icon.fill ? 'none' : 'currentColor'"
    :stroke-width="strokeWidth ?? icon.w"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="icon.body"
  />
</template>
