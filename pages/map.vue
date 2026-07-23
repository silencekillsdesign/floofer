<script setup lang="ts">
import type { Dog } from "~/types";

const { dogs, matchPct } = useStore();
const { theme } = useTheme();
const router = useRouter();

const showRiskOnly = ref(false);
const mapEl = ref<HTMLElement | null>(null);
let map: any = null;
let markerLayer: any = null;
let tiles: any = null;
let L: any = null;

const tileUrl = computed(() =>
  `https://{s}.basemaps.cartocdn.com/${theme.value === "light" ? "light_all" : "dark_all"}/{z}/{x}/{y}{r}.png`,
);

const visible = computed<Dog[]>(() =>
  dogs.value.filter((d) => (showRiskOnly.value ? d.risk === "high" && !d.adopted : true)),
);
const riskCount = computed(() => dogs.value.filter((d) => d.risk === "high" && !d.adopted).length);

function markerHtml(d: Dog): string {
  const cls = d.adopted ? "adopted" : d.risk === "high" ? "risk" : "safe";
  const icon = d.adopted ? "🎉" : "🐶";
  return `<div class="rm-pin ${cls}">${icon}</div>`;
}

function popupHtml(d: Dog): string {
  const status = d.adopted
    ? `<span style="color:rgb(var(--c-ink-faint));font-weight:700">🎉 Adopted</span>`
    : d.risk === "high"
      ? `<span style="color:rgb(var(--c-risk));font-weight:700">⚠ At risk${d.daysLeft != null ? ` — ${d.daysLeft} days` : ""}</span>`
      : `<span style="color:rgb(var(--c-safe));font-weight:700">✓ Safe</span>`;
  return `
    <div style="min-width:180px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
        <strong style="font-size:16px">${d.name}</strong>
        <span style="font-weight:800;color:rgb(var(--c-brand))">${matchPct(d)}%</span>
      </div>
      <div style="color:rgb(var(--c-ink-soft));font-size:12px;margin:2px 0 4px">${d.breed} · ${d.age} yr · ${d.source.name}</div>
      <div style="font-size:12px;margin-bottom:8px">${status}</div>
      <button data-dog="${d.id}" style="width:100%;background:rgb(var(--c-brand));color:#fff;border:none;border-radius:999px;padding:7px 0;font-weight:700;font-size:12px;cursor:pointer">View profile</button>
    </div>`;
}

function renderMarkers() {
  if (!map || !L) return;
  markerLayer.clearLayers();
  visible.value.forEach((d) => {
    const m = L.marker([d.location.lat, d.location.lng], {
      icon: L.divIcon({ className: "rm-marker", html: markerHtml(d), iconSize: [36, 36], iconAnchor: [18, 18] }),
    });
    m.bindPopup(popupHtml(d));
    m.on("popupopen", (e: any) => {
      e.popup.getElement()?.querySelector(`[data-dog="${d.id}"]`)?.addEventListener("click", () => router.push(`/pet/${d.id}`));
    });
    markerLayer.addLayer(m);
  });
}

onMounted(async () => {
  L = await import("leaflet");
  map = L.map(mapEl.value!, { zoomControl: true }).setView([41.8781, -87.6298], 10);
  tiles = L.tileLayer(tileUrl.value, {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  }).addTo(map);
  markerLayer = L.layerGroup().addTo(map);
  renderMarkers();
});

onUnmounted(() => map?.remove());
watch(visible, renderMarkers);
watch(tileUrl, (u) => tiles?.setUrl(u));
</script>

<template>
  <ClientOnly>
  <!-- full bleed: fills header → bottom nav -->
  <div class="flex flex-col w-full h-[calc(100dvh-3.5rem-4rem-env(safe-area-inset-bottom))] sm:h-auto sm:max-w-5xl sm:mx-auto sm:px-4 sm:pt-5 sm:pb-10">
    <div class="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-0 sm:mb-3">
      <div>
        <h1 class="font-display text-xl sm:text-2xl font-semibold leading-tight">Pets near you</h1>
        <p class="text-xs sm:text-sm text-ink-soft">
          {{ dogs.filter((d) => !d.adopted).length }} available ·
          <span class="text-risk font-semibold">{{ riskCount }} at risk</span>
        </p>
      </div>
      <button
        class="shrink-0 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-colors"
        :class="showRiskOnly ? 'bg-risk text-white border-risk' : 'bg-card border-line text-ink-soft hover:border-risk hover:text-risk'"
        :aria-pressed="showRiskOnly"
        @click="showRiskOnly = !showRiskOnly"
      >
        ⚠ At-risk only
      </button>
    </div>

    <div ref="mapEl" class="flex-1 w-full z-0 sm:flex-none sm:h-[560px] sm:rounded-3xl sm:shadow-pop sm:border sm:border-line" style="min-height: 320px" />

    <!-- legend -->
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:px-0 sm:mt-3 text-[11px] sm:text-sm font-medium text-ink-soft">
      <span class="flex items-center gap-1.5"><i class="w-3 h-3 rounded-full inline-block bg-risk" /> At risk</span>
      <span class="flex items-center gap-1.5"><i class="w-3 h-3 rounded-full inline-block bg-safe" /> Safe</span>
      <span class="flex items-center gap-1.5"><i class="w-3 h-3 rounded-full inline-block bg-ink-faint" /> Adopted</span>
    </div>
  </div>
  </ClientOnly>
</template>
