<script setup lang="ts">
/* Remote pet photos go through @nuxt/image (resized + WebP — a real win on
   mobile data). Locally-uploaded photos are already-compressed data URLs, so
   they bypass the optimizer entirely. */
const props = defineProps<{ src: string; alt: string; eager?: boolean }>();

const failed = ref(false);
watch(() => props.src, () => (failed.value = false));

const isInline = computed(() => /^(data:|blob:)/.test(props.src));
</script>

<template>
  <div class="relative w-full h-full bg-paper-warm overflow-hidden">
    <template v-if="!failed">
      <img
        v-if="isInline"
        :src="src" :alt="alt"
        class="w-full h-full object-cover"
        :loading="eager ? 'eager' : 'lazy'"
        draggable="false"
        @error="failed = true"
      />
      <NuxtImg
        v-else
        :src="src" :alt="alt"
        class="w-full h-full object-cover"
        sizes="xs:100vw sm:100vw md:50vw lg:33vw"
        :loading="eager ? 'eager' : 'lazy'"
        format="webp"
        :quality="72"
        draggable="false"
        @error="failed = true"
      />
    </template>
    <div v-else class="w-full h-full grid place-items-center bg-gradient-to-br from-brand-soft to-paper-warm">
      <span class="text-6xl" aria-hidden="true">🐕</span>
    </div>
  </div>
</template>
