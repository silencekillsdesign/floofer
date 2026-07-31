<script setup lang="ts">
/* Select styled as an input; the open state is a full-screen picker with a
   predictive search box on longer lists.

   Built on Reka's Dialog + Listbox primitives: they own the hard parts we
   used to hand-roll — focus trap and return, Esc, body scroll lock,
   aria-activedescendant, arrow/Home/End navigation — while every visible
   pixel stays ours. Filtering is kept local (ignoring Reka's built-in) so
   the matched substring can be underlined in the rows. */

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
  /** Lands on the trigger button so a `<label for>` can point at it — the
      root is a renderless Reka component, so a fallthrough id goes nowhere. */
  id?: string;
}>();
const emit = defineEmits<{ "update:modelValue": [v: string] }>();

const open = ref(false);
const query = ref("");

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

function onOpenChange(o: boolean) {
  if (o) query.value = "";
}
function choose(v: string) {
  emit("update:modelValue", v);
  open.value = false;
}

/* The dialog's default initial focus is its first focusable element — the
   close button, which leaves arrow keys dead. Send focus where typing works:
   the search box when there is one, the listbox itself when there isn't. */
const filterEl = ref<HTMLInputElement | null>(null);
const listEl = ref<{ $el: HTMLElement } | null>(null);
function onOpenAutoFocus(e: Event) {
  e.preventDefault();
  nextTick(() => {
    if (showSearch.value) filterEl.value?.focus();
    else listEl.value?.$el?.focus();
  });
}
</script>

<template>
  <DialogRoot v-model:open="open" @update:open="onOpenChange">
    <DialogTrigger as-child>
      <button
        :id="id"
        type="button"
        :disabled="disabled"
        class="w-full flex items-center justify-between gap-2 rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm font-semibold text-left transition-colors hover:border-ink-faint focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/25 disabled:opacity-55 disabled:cursor-not-allowed"
        :aria-label="ariaLabel"
      >
        <span class="flex items-center gap-2 min-w-0">
          <span v-if="selected?.icon" aria-hidden="true">{{ selected.icon }}</span>
          <span class="truncate">{{ selected?.label ?? "Select…" }}</span>
        </span>
        <AppIcon name="chevron-down" class="w-4 h-4 shrink-0 text-brand transition-transform" :class="open && 'rotate-180'" />
      </button>
    </DialogTrigger>

    <!-- full-screen picker -->
    <DialogPortal>
      <DialogContent
        class="fixed inset-0 z-[70] bg-paper flex flex-col picker-in focus:outline-none"
        :aria-describedby="undefined"
        @open-auto-focus="onOpenAutoFocus"
      >
        <header class="shrink-0 flex items-center justify-between gap-3 px-5 h-14 border-b border-line/60">
          <DialogTitle class="font-display font-semibold text-lg truncate">{{ ariaLabel ?? "Select" }}</DialogTitle>
          <DialogClose
            class="w-9 h-9 grid place-items-center rounded-full bg-paper-warm text-ink-soft hover:bg-line hover:text-ink"
            aria-label="Close"
          >
            <AppIcon name="close" class="w-5 h-5" />
          </DialogClose>
        </header>

        <ListboxRoot
          :model-value="modelValue"
          highlight-on-hover
          class="flex-1 min-h-0 flex flex-col w-full sm:max-w-md sm:mx-auto"
          @update:model-value="choose($event as string)"
        >
          <!-- predictive search -->
          <div v-if="showSearch" class="shrink-0 px-3 pt-3 pb-1.5">
            <div class="relative">
              <AppIcon name="search" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-ink-faint pointer-events-none" />
              <ListboxFilter
                v-model="query"
                as-child
              >
                <input
                  ref="filterEl"
                  type="text"
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck="false"
                  :placeholder="`Search ${options.length} options…`"
                  class="w-full rounded-xl border border-line bg-card pl-10 pr-10 py-3 text-[15px] font-semibold placeholder:text-ink-faint placeholder:font-medium focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/25"
                  :aria-label="`Search ${ariaLabel ?? 'options'}`"
                />
              </ListboxFilter>
              <button
                v-if="query"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-full bg-paper-warm text-ink-soft hover:text-ink"
                aria-label="Clear search"
                @click="query = ''"
              >
                <AppIcon name="close" class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <ListboxContent
            ref="listEl"
            as="ul"
            class="flex-1 overflow-y-auto p-3 focus:outline-none"
            :class="showSearch && 'pt-1.5'"
            style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom))"
          >
            <ListboxItem
              v-for="o in filtered"
              :key="o.value"
              :value="o.value"
              as="li"
              class="group flex items-center gap-3.5 px-4 py-4 mb-1 rounded-2xl cursor-pointer font-semibold text-ink transition-colors data-[highlighted]:bg-brand data-[highlighted]:text-white outline-none"
            >
              <span v-if="o.icon" class="text-xl" aria-hidden="true">{{ o.icon }}</span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[15px]">
                  <template v-if="parts(o.label).match">{{ parts(o.label).pre }}<mark
                    class="bg-transparent underline underline-offset-2 decoration-2 text-brand decoration-brand group-data-[highlighted]:text-white group-data-[highlighted]:decoration-white"
                  >{{ parts(o.label).match }}</mark>{{ parts(o.label).post }}</template>
                  <template v-else>{{ o.label }}</template>
                </span>
                <span
                  v-if="o.hint"
                  class="block text-xs font-medium truncate mt-0.5 text-ink-faint group-data-[highlighted]:text-white/70"
                >{{ o.hint }}</span>
              </span>
              <ListboxItemIndicator as-child>
                <AppIcon name="check" class="w-5 h-5 shrink-0 text-brand group-data-[highlighted]:text-white" />
              </ListboxItemIndicator>
            </ListboxItem>

            <li v-if="!filtered.length" class="px-4 py-10 text-center text-sm font-medium text-ink-soft">
              No matches for “{{ query }}” 🐾
            </li>
          </ListboxContent>
        </ListboxRoot>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
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
