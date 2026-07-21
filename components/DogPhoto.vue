<script setup lang="ts">
const props = defineProps<{ src: string; alt: string; eager?: boolean }>();
const failed = ref(false);
watch(() => props.src, () => (failed.value = false));
</script>

<template>
  <div class="relative w-full h-full bg-paper-warm overflow-hidden">
    <img
      v-if="!failed"
      :src="src" :alt="alt"
      class="w-full h-full object-cover"
      :loading="eager ? 'eager' : 'lazy'"
      draggable="false"
      @error="failed = true"
    />
    <div v-else class="w-full h-full grid place-items-center bg-gradient-to-br from-brand-soft to-paper-warm">
      <span class="text-6xl" aria-hidden="true">🐕</span>
    </div>
  </div>
</template>
