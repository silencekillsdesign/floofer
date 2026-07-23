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
  },
});
