/** Light/dark theme + global filter-sheet visibility. */
export function useTheme() {
  const theme = useState<"dark" | "light">("rm-theme", () => "dark");
  const hydrated = useState("rm-theme-hydrated", () => false);

  if (import.meta.client && !hydrated.value) {
    hydrated.value = true;
    const saved = localStorage.getItem("rm-theme");
    if (saved === "light" || saved === "dark") theme.value = saved;
    watch(
      theme,
      (t) => {
        localStorage.setItem("rm-theme", t);
        document.documentElement.classList.toggle("light", t === "light");
      },
      { immediate: true },
    );
  }

  const toggle = () => {
    theme.value = theme.value === "dark" ? "light" : "dark";
  };

  return { theme, toggle };
}

export const useShowFilters = () => useState<boolean>("rm-show-filters", () => false);
