import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/* The matching/filtering logic is pure, so it tests fast without a Nuxt
   runtime — we only need the ~ alias that the app code imports with. */
export default defineConfig({
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./", import.meta.url)),
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.spec.ts"],
    /* Pinned so the risk-deadline tests mean the same thing everywhere. Left
       unset they pass on a Chicago laptop and fail on a UTC CI box — and the
       whole point of those tests is that a euthanasia countdown must not
       depend on where it's read. */
    env: { TZ: "America/Chicago" },
  },
});
