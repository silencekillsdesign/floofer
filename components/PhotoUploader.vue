<script setup lang="ts">
/* Photo gallery input: drag & drop, mobile camera capture, and photo-library
   picking. Images are downscaled to ~720px JPEG data-URLs so demo listings
   can persist in localStorage. First photo = primary headshot. */

const props = defineProps<{ modelValue: string[]; max?: number }>();
const emit = defineEmits<{ "update:modelValue": [v: string[]] }>();

const max = computed(() => props.max ?? 8);
const full = computed(() => props.modelValue.length >= max.value);
const dragging = ref(false);
const busy = ref(false);
const cameraEl = ref<HTMLInputElement | null>(null);
const libraryEl = ref<HTMLInputElement | null>(null);

/** Downscale + re-encode so 8 photos stay well under localStorage limits. */
function compress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX_EDGE = 720;
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable image"));
    };
    img.src = url;
  });
}

async function addFiles(list: FileList | null | undefined) {
  if (!list?.length) return;
  const files = [...list].filter((f) => f.type.startsWith("image/"));
  if (!files.length) return;
  busy.value = true;
  const next = [...props.modelValue];
  for (const f of files.slice(0, max.value - next.length)) {
    try {
      next.push(await compress(f));
    } catch {}
  }
  emit("update:modelValue", next.slice(0, max.value));
  busy.value = false;
}

function onDrop(e: DragEvent) {
  dragging.value = false;
  addFiles(e.dataTransfer?.files);
}
function onPick(e: Event) {
  const el = e.target as HTMLInputElement;
  addFiles(el.files);
  el.value = ""; // allow re-picking the same file
}
function removeAt(i: number) {
  emit("update:modelValue", props.modelValue.filter((_, x) => x !== i));
}
function makePrimary(i: number) {
  if (i === 0) return;
  const next = [...props.modelValue];
  const [picked] = next.splice(i, 1);
  next.unshift(picked);
  emit("update:modelValue", next);
}
</script>

<template>
  <div>
    <!-- thumbnails -->
    <div v-if="modelValue.length" class="grid grid-cols-4 gap-2 mb-3">
      <div
        v-for="(p, i) in modelValue"
        :key="`${i}-${p.slice(-24)}`"
        class="relative aspect-square rounded-xl overflow-hidden border border-line cursor-pointer"
        :title="i === 0 ? 'Primary headshot' : 'Tap to make primary'"
        role="button"
        :aria-label="i === 0 ? `Photo ${i + 1} (primary)` : `Make photo ${i + 1} the primary headshot`"
        @click="makePrimary(i)"
      >
        <img :src="p" :alt="`Photo ${i + 1}`" class="w-full h-full object-cover" draggable="false" />
        <span
          v-if="i === 0"
          class="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-full bg-brand text-white text-[9px] font-bold"
        >Primary</span>
        <button
          class="absolute top-1 right-1 w-5 h-5 grid place-items-center rounded-full bg-black/60 text-white hover:bg-risk"
          :aria-label="`Remove photo ${i + 1}`"
          @click.stop="removeAt(i)"
        >
          <svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
    </div>

    <!-- drop zone + capture buttons -->
    <div
      class="rounded-2xl border-2 border-dashed p-5 text-center transition-colors"
      :class="dragging ? 'border-brand bg-brand-soft' : 'border-line'"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <p class="text-sm font-semibold">
        {{ busy ? "Processing photos…" : full ? "Gallery full" : "Drag & drop photos here" }}
      </p>
      <p class="text-xs text-ink-faint mt-0.5">
        {{ modelValue.length }}/{{ max }} · tap a thumbnail to make it the primary headshot
      </p>
      <div class="flex flex-wrap justify-center gap-2 mt-3">
        <button
          type="button"
          class="px-4 py-2 rounded-full bg-brand text-white text-xs font-semibold hover:bg-brand-deep disabled:opacity-40"
          :disabled="full || busy"
          @click="cameraEl?.click()"
        >📷 Take photo</button>
        <button
          type="button"
          class="px-4 py-2 rounded-full border border-line bg-card text-xs font-semibold text-ink-soft hover:border-ink-faint disabled:opacity-40"
          :disabled="full || busy"
          @click="libraryEl?.click()"
        >🖼️ Photo library</button>
      </div>
    </div>

    <!-- hidden pickers: capture="environment" opens the camera app on mobile;
         the plain multiple input opens the gallery / file picker -->
    <input ref="cameraEl" type="file" accept="image/*" capture="environment" class="hidden" @change="onPick" />
    <input ref="libraryEl" type="file" accept="image/*" multiple class="hidden" @change="onPick" />
  </div>
</template>
