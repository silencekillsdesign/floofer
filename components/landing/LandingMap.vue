<script setup lang="ts">
/* Live map preview for the landing page: the real Leaflet map with the real
   demo pins, but every interaction disabled — panning/zooming here would
   scroll-hijack the page. The whole thing is a link into /map instead. */
const { dogs } = useStore();

const mapEl = ref<HTMLElement | null>(null);
let map: any = null;

const available = computed(() => dogs.value.filter((d) => !d.adopted).length);
const riskCount = computed(() => dogs.value.filter((d) => d.risk === "high" && !d.adopted).length);

onMounted(async () => {
  const L = await import("leaflet");
  map = L.map(mapEl.value!, {
    zoomControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    touchZoom: false,
  }).setView([41.8781, -87.6298], 10);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  }).addTo(map);
  dogs.value.forEach((d) => {
    const cls = d.adopted ? "adopted" : d.risk === "high" ? "risk" : "safe";
    L.marker([d.location.lat, d.location.lng], {
      icon: L.divIcon({
        className: "rm-marker",
        html: `<div class="rm-pin ${cls}">${d.adopted ? "🎉" : "🐶"}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
      interactive: false,
    }).addTo(map);
  });
});

onUnmounted(() => map?.remove());
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- isolate: Leaflet's internal z-indexes (400–1000) must not escape and
         float over the sticky nav (z-40) -->
    <div class="elevated group relative isolate overflow-hidden rounded-3xl">
      <ClientOnly>
        <div ref="mapEl" class="h-[360px] w-full lg:h-[480px]" />
        <template #fallback>
          <div class="h-[360px] w-full bg-[#f2f7fd] lg:h-[480px]" />
        </template>
      </ClientOnly>
      <!-- the map is a preview; the click surface is the real /map -->
      <NuxtLink to="/map" class="absolute inset-0 z-[1001] grid place-items-center" aria-label="Open the live rescue map">
        <span class="pill pill-blue text-base opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
          Open the live map
        </span>
      </NuxtLink>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm font-medium text-[#45464d]">
        <span class="font-bold text-[#1e90ff]">{{ available }}</span> waiting near Chicago ·
        <span class="font-bold text-[#ff4d42]">{{ riskCount }} at risk</span>
      </p>
      <div class="flex items-center gap-4 text-sm font-medium text-[#45464d]">
        <span class="flex items-center gap-1.5"><i class="inline-block size-3 rounded-full bg-[#ff4d42]" /> At risk</span>
        <span class="flex items-center gap-1.5"><i class="inline-block size-3 rounded-full bg-[#2fbf71]" /> Safe</span>
        <span class="flex items-center gap-1.5"><i class="inline-block size-3 rounded-full bg-[#9a9aa5]" /> Adopted</span>
      </div>
    </div>
  </div>
</template>
