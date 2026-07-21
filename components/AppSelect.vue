<script setup lang="ts">
/* Headless select — the trigger looks like an input; the open state is a
   full-screen picker with a predictive search box on longer lists.
   Keyboard: type to filter, ↑↓ navigate, Enter/Space select, Esc closes. */

interface Option {
  value: string;
  label: string;
  icon?: string;
  hint?: string;
}

const props = defineProps<{
  modelValue: string;
  options: Option[];
  ariaLabel?: string;
  disabled?: boolean;
  /** Force the search box on/off; defaults to auto (shown for 8+ options). */
  searchable?: boolean;
}>();
const emit = defineEmits<{ "update:modelValue": [v: string] }>();

const uid = useId();
const open = ref(false);
const hi = ref(0);
const query = ref("");
const btnEl = ref<HTMLButtonElement | null>(null);
const listEl = ref<HTMLElement | null>(null);
const searchEl = ref<HTMLInputElement | null>(null);

const selected = computed(() => props.options.find((o) => o.value === props.modelValue));
/* Vue casts an absent Boolean prop to false (not undefined), so `??` can't
   express "auto" — searchable=true forces it on; otherwise 8+ options shows it. */
const showSearch = computed(() => props.searchable || props.options.length >= 8);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.options;
  return props.options.filter((o) =>
    `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(q),
  );
});

/** Split a label around the query match so it can be highlighted. */
function parts(label: string): { pre: string; match: string; post: string } {
  const q = query.value.trim();
  if (!q) return { pre: label, match: "", post: "" };
  const idx = label.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return { pre: label, match: "", post: "" };
  return {
    pre: label.slice(0, idx),
    match: label.slice(idx, idx + q.length),
    post: label.slice(idx + q.length),
  };
}

watch(query, () => {
  hi.value = 0;
  scrollHi();
});

function openMenu() {
  if (props.disabled) return;
  query.value = "";
  open.value = true;
  hi.value = Math.max(0, props.options.findIndex((o) => o.value === props.modelValue));
  nextTick(() => {
    (showSearch.value ? searchEl.value : listEl.value)?.focus();
    scrollHi();
  });
}
function close(refocus = true) {
  open.value = false;
  if (refocus) btnEl.value?.focus();
}
function choose(o?: Option) {
  if (!o) return;
  emit("update:modelValue", o.value);
  close();
}
function scrollHi() {
  nextTick(() =>
    listEl.value?.querySelector(`[data-i="${hi.value}"]`)?.scrollIntoView({ block: "nearest" }),
  );
}

function moveHi(delta: number) {
  hi.value = Math.min(Math.max(0, hi.value + delta), Math.max(0, filtered.value.length - 1));
  scrollHi();
}
function onBtnKey(e: KeyboardEvent) {
  if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
    e.preventDefault();
    openMenu();
  }
}
function onNavKey(e: KeyboardEvent): boolean {
  if (e.key === "ArrowDown") { e.preventDefault(); moveHi(1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); moveHi(-1); }
  else if (e.key === "Home") { e.preventDefault(); hi.value = 0; scrollHi(); }
  else if (e.key === "End") { e.preventDefault(); hi.value = Math.max(0, filtered.value.length - 1); scrollHi(); }
  else if (e.key === "Enter") { e.preventDefault(); choose(filtered.value[hi.value]); }
  else if (e.key === "Escape") { e.preventDefault(); close(); }
  else return false;
  return true;
}
function onListKey(e: KeyboardEvent) {
  if (!onNavKey(e) && e.key === " ") {
    e.preventDefault();
    choose(filtered.value[hi.value]);
  }
}

/* lock page scroll while the picker is up */
watch(open, (o) => {
  if (import.meta.client) document.body.style.overflow = o ? "hidden" : "";
});
onUnmounted(() => {
  if (import.meta.client) document.body.style.overflow = "";
});
</script>

<template>
  <div>
    <button
      ref="btnEl"
      type="button"
      :disabled="disabled"
      class="w-full flex items-center justify-between gap-2 rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm font-semibold text-left transition-colors hover:border-ink-faint focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/25 disabled:opacity-55 disabled:cursor-not-allowed"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-label="ariaLabel"
      @click="open ? close() : openMenu()"
      @keydown="onBtnKey"
    >
      <span class="flex items-center gap-2 min-w-0">
        <span v-if="selected?.icon" aria-hidden="true">{{ selected.icon }}</span>
        <span class="truncate">{{ selected?.label ?? "Select…" }}</span>
      </span>
      <svg
        viewBox="0 0 24 24" class="w-4 h-4 shrink-0 text-brand transition-transform"
        :class="open && 'rotate-180'"
        fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"
      ><path d="m6 9 6 6 6-6"/></svg>
    </button>

    <!-- full-screen picker -->
    <Teleport to="body">
      <div
        v-if="open"
        class="fixed inset-0 z-[70] bg-paper flex flex-col picker-in"
        role="dialog"
        aria-modal="true"
        :aria-label="ariaLabel ?? 'Select an option'"
        @keydown.esc="close()"
      >
        <header class="shrink-0 flex items-center justify-between gap-3 px-5 h-14 border-b border-line/60">
          <h2 class="font-display font-semibold text-lg truncate">{{ ariaLabel ?? "Select" }}</h2>
          <button
            class="w-9 h-9 grid place-items-center rounded-full bg-paper-warm text-ink-soft hover:bg-line hover:text-ink"
            aria-label="Close"
            @click="close()"
          >
            <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </header>

        <div class="flex-1 min-h-0 flex flex-col w-full sm:max-w-md sm:mx-auto">
          <!-- predictive search -->
          <div v-if="showSearch" class="shrink-0 px-3 pt-3 pb-1.5">
            <div class="relative">
              <svg
                viewBox="0 0 24 24"
                class="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-ink-faint pointer-events-none"
                fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"
              ><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/></svg>
              <input
                ref="searchEl"
                v-model="query"
                type="text"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                :placeholder="`Search ${options.length} options…`"
                class="w-full rounded-xl border border-line bg-card pl-10 pr-10 py-3 text-[15px] font-semibold placeholder:text-ink-faint placeholder:font-medium focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/25"
                :aria-label="`Search ${ariaLabel ?? 'options'}`"
                @keydown="onNavKey"
              />
              <button
                v-if="query"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-full bg-paper-warm text-ink-soft hover:text-ink"
                aria-label="Clear search"
                @click="query = ''; searchEl?.focus()"
              >
                <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
              </button>
            </div>
          </div>

          <ul
            ref="listEl"
            tabindex="-1"
            role="listbox"
            :aria-activedescendant="`${uid}-opt-${hi}`"
            class="flex-1 overflow-y-auto p-3 focus:outline-none"
            :class="showSearch && 'pt-1.5'"
            style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom))"
            @keydown="onListKey"
          >
            <li
              v-for="(o, i) in filtered"
              :id="`${uid}-opt-${i}`"
              :key="o.value"
              :data-i="i"
              role="option"
              :aria-selected="o.value === modelValue"
              class="flex items-center gap-3.5 px-4 py-4 mb-1 rounded-2xl cursor-pointer font-semibold transition-colors"
              :class="i === hi ? 'bg-brand text-white' : 'text-ink'"
              @pointermove="hi = i"
              @click="choose(o)"
            >
              <span v-if="o.icon" class="text-xl" aria-hidden="true">{{ o.icon }}</span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[15px]">
                  <template v-if="parts(o.label).match">{{ parts(o.label).pre }}<mark
                    class="bg-transparent underline underline-offset-2 decoration-2"
                    :class="i === hi ? 'text-white decoration-white' : 'text-brand decoration-brand'"
                  >{{ parts(o.label).match }}</mark>{{ parts(o.label).post }}</template>
                  <template v-else>{{ o.label }}</template>
                </span>
                <span
                  v-if="o.hint"
                  class="block text-xs font-medium truncate mt-0.5"
                  :class="i === hi ? 'text-white/70' : 'text-ink-faint'"
                >{{ o.hint }}</span>
              </span>
              <svg
                v-if="o.value === modelValue"
                viewBox="0 0 24 24" class="w-5 h-5 shrink-0"
                :class="i === hi ? 'text-white' : 'text-brand'"
                fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
              ><path d="m5 13 4 4L19 7"/></svg>
            </li>

            <li v-if="!filtered.length" class="px-4 py-10 text-center text-sm font-medium text-ink-soft">
              No matches for “{{ query }}” 🐾
            </li>
          </ul>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes picker-in {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
}
.picker-in {
  animation: picker-in 0.15s ease-out;
}
</style>
