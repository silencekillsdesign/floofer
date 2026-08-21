import { defineConfig } from "@playwright/test";

/* Smoke tests against the real production build — CI runs `nuxt build`
   first, so the same .output it ships is the one under test. */
export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "node .output/server/index.mjs",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
