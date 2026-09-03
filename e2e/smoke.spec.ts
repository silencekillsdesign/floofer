import { test, expect } from "@playwright/test";

/* Smoke, not coverage: each test is one user-visible promise the site makes.
   If one of these fails, the deploy is broken in a way a visitor would hit
   in the first minute. */

test("landing page renders with its conversion path", async ({ page }) => {
  await page.goto("/landing");
  await expect(page.getByRole("heading", { name: /your future best friend/i })).toBeVisible();
  // hero and closing CTA share this label by design — assert the hero one
  await expect(page.getByRole("link", { name: /start matching — it.s free/i }).first()).toBeVisible();
});

test("landing search deep-links into the filtered map", async ({ page }) => {
  await page.goto("/landing");
  await page.getByLabel("Search pets by name, breed, or shelter").fill("beagle");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/\/map\?q=beagle/);
  await expect(page.getByText(/matching “beagle”/)).toBeVisible();
  // Leaflet mounts client-side; a pin proves data + map both came up
  await expect(page.locator(".rm-pin").first()).toBeVisible();
});

test("match screen deals the demo deck", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Make a match" })).toBeVisible();
  await expect(page.getByText(/dogs? waiting/)).toBeVisible();
});

test("legal pages exist", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: /floofer's terms/i })).toBeVisible();
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: /privacy at floofer/i })).toBeVisible();
});
