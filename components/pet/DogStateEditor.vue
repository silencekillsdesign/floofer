<script setup lang="ts">
/* The control a shelter actually uses day to day: where the adoption stands,
   and whether this dog is out of time. Saves immediately — an at-risk
   countdown behind a "save changes" button is a countdown that goes stale. */
import type { Dog } from "~/types";
import type { AdoptionStatus } from "~/types/db";

const props = defineProps<{ dog: Dog }>();
const emit = defineEmits<{ updated: [] }>();

const db = useDb();

const STATUSES: { v: AdoptionStatus; label: string; hint: string }[] = [
  { v: "available", label: "Available", hint: "Shown in the deck" },
  { v: "pending", label: "Pending", hint: "Application in progress" },
  { v: "adopted", label: "Adopted", hint: "🎉 Out of the deck" },
  { v: "withdrawn", label: "Withdrawn", hint: "Hidden, not deleted" },
];

const status = ref<AdoptionStatus>(props.dog.adopted ? "adopted" : "available");
const atRisk = ref(props.dog.risk === "high");
const reason = ref(props.dog.riskReason ?? "");
const deadline = ref("");

const today = ref("");
onMounted(() => (today.value = todayLocalISO()));

const busy = ref(false);
const error = ref("");
const savedAt = ref(0);

async function save() {
  error.value = "";
  if (atRisk.value && !reason.value.trim()) {
    error.value = "An at-risk listing needs a reason — adopters see it, and the database rejects it without one.";
    return;
  }
  busy.value = true;
  try {
    await db.updateDogState(props.dog.id, {
      status: status.value,
      risk: atRisk.value ? "high" : "safe",
      risk_reason: atRisk.value ? reason.value.trim() : null,
      risk_review_date: atRisk.value && deadline.value ? deadline.value : null,
    });
    savedAt.value = Date.now();
    emit("updated");
  } catch (e: any) {
    error.value = e?.message ?? "Could not save.";
  } finally {
    busy.value = false;
  }
}

const daysPreview = computed(() =>
  deadline.value ? Math.max(0, daysUntil(deadline.value)) : null,
);

const pill = (active: boolean, tone: "brand" | "risk" = "brand") =>
  `px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
    active
      ? tone === "risk"
        ? "bg-risk text-white border-risk"
        : "bg-brand text-white border-brand"
      : "bg-paper-warm border-line text-ink-soft hover:border-ink-faint"
  }`;
</script>

<template>
  <div class="p-4 rounded-2xl border border-line bg-paper-warm">
    <p class="text-[11px] font-bold uppercase tracking-wide text-ink-faint mb-2">Adoption status</p>
    <div class="grid grid-cols-2 gap-2 mb-4">
      <button v-for="s in STATUSES" :key="s.v" :class="pill(status === s.v)" @click="status = s.v">
        <span class="block">{{ s.label }}</span>
        <span class="block text-[10px] font-medium opacity-70 mt-0.5">{{ s.hint }}</span>
      </button>
    </div>

    <div class="rounded-xl border p-3" :class="atRisk ? 'border-risk/40 bg-risk-soft' : 'border-line bg-card'">
      <label class="flex items-center justify-between gap-3 cursor-pointer">
        <span class="text-sm font-bold" :class="atRisk && 'text-risk'">⚠ At risk</span>
        <input v-model="atRisk" type="checkbox" class="w-5 h-5 accent-[#FF4D42] shrink-0" />
      </label>

      <div v-if="atRisk" class="mt-3 space-y-2.5">
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wide text-ink-faint mb-1" :for="`r-${dog.id}`">Reason *</label>
          <input :id="`r-${dog.id}`" v-model="reason" class="w-full rounded-xl border border-line bg-card px-3 py-2 text-sm font-medium" placeholder="Over capacity — transfer list" />
        </div>
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-wide text-ink-faint mb-1" :for="`d-${dog.id}`">Deadline</label>
          <input :id="`d-${dog.id}`" v-model="deadline" type="date" :min="today" class="w-full rounded-xl border border-line bg-card px-3 py-2 text-sm font-medium" />
          <p v-if="daysPreview !== null" class="text-[11px] text-ink-soft mt-1.5">
            Adopters will see <strong class="text-risk">{{ daysPreview }} days</strong>, recounted daily from this date.
          </p>
        </div>
      </div>
    </div>

    <p v-if="error" class="text-xs text-risk font-semibold mt-2.5" role="alert">{{ error }}</p>

    <div class="flex items-center gap-3 mt-3">
      <button
        :disabled="busy"
        class="px-4 py-2.5 rounded-full bg-brand text-white text-sm font-bold shadow-glow hover:bg-brand-deep disabled:opacity-50"
        @click="save"
      >{{ busy ? "Saving…" : "Save" }}</button>
      <span v-if="savedAt" class="text-xs font-semibold text-safe">✓ Saved</span>
    </div>
  </div>
</template>
