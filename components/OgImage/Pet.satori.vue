<script setup lang="ts">
/* Rendered to a 1200x630 share card. Kept to plain flex + inline styles
   because satori supports only a subset of CSS. */
withDefaults(
  defineProps<{
    name?: string;
    breed?: string;
    tagline?: string;
    photo?: string;
    daysLeft?: number | null;
    city?: string;
    age?: number;
  }>(),
  {
    name: "A dog who needs you",
    breed: "",
    tagline: "",
    photo: "",
    daysLeft: null,
    city: "",
    age: 0,
  },
)
</script>

<template>
  <div style="width: 1200px; height: 630px; display: flex; background-color: #000000; color: #ffffff; font-family: Inter, sans-serif;">
    <!-- photo -->
    <div style="display: flex; width: 520px; height: 630px;">
      <img v-if="photo" :src="photo" width="520" height="630" style="width: 520px; height: 630px; object-fit: cover;" />
      <div v-else style="display: flex; width: 520px; height: 630px; background-color: #15151c;" />
    </div>

    <!-- copy -->
    <div style="display: flex; flex-direction: column; justify-content: center; padding: 60px; width: 680px;">
      <div style="display: flex; font-size: 30px; font-weight: 700; color: #1E8FFF; margin-bottom: 24px;">
        floofer
      </div>

      <div
        v-if="daysLeft !== null"
        style="display: flex; align-self: flex-start; background-color: #FF4D42; color: #ffffff; font-size: 24px; font-weight: 700; padding: 10px 22px; border-radius: 999px; margin-bottom: 24px;"
      >
        ⚠ At risk — {{ daysLeft }} days left
      </div>

      <div style="display: flex; font-size: 76px; font-weight: 700; line-height: 1.05; margin-bottom: 16px;">
        {{ name }}<span v-if="age">, {{ age }}</span>
      </div>

      <div style="display: flex; font-size: 30px; color: #A7ACBB; margin-bottom: 28px;">
        {{ breed }}<span v-if="city"> · {{ city }}</span>
      </div>

      <div v-if="tagline" style="display: flex; font-size: 30px; font-style: italic; color: #F2F3F7;">
        “{{ tagline }}”
      </div>
    </div>
  </div>
</template>
