#!/usr/bin/env node
/* Generate a magic-link sign-in URL without sending email.
 *
 *   npm run login:link -- --email cj@silencekillsdesign.com
 *
 * Supabase's free-tier email is rate-limited and often undelivered, which
 * makes it a poor way to test auth. This asks the admin API for the same
 * action link the email would have contained, and prints it so you can paste
 * it into the browser directly.
 *
 * Local dev only. It uses SUPABASE_SERVICE_KEY and mints a one-time sign-in
 * link — treat the printed URL like a password: it logs whoever clicks it
 * into that account once.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

try {
  for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* no .env — rely on the ambient environment */
}

function arg(flag) {
  const i = process.argv.indexOf(`--${flag}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}
function die(msg) {
  console.error(`\n  ✗ ${msg}\n`);
  process.exit(1);
}

const url = process.env.NUXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
if (!url || !serviceKey) die("Set NUXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.");

const email = arg("email");
if (!email) die("Usage: npm run login:link -- --email you@example.org [--next /account] [--port 4600]");

const port = arg("port") ?? "4600";
const next = arg("next") ?? "/account";
const redirectTo = `http://localhost:${port}/confirm?next=${encodeURIComponent(next)}`;

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

/* magiclink signs in an existing user; if this email has never been seen it
   404s, so fall back to signup (which also creates the profile via trigger). */
async function link(type) {
  return db.auth.admin.generateLink({ type, email, options: { redirectTo } });
}

let { data, error } = await link("magiclink");
if (error && /not found|no user|does not exist/i.test(error.message)) {
  ({ data, error } = await link("signup"));
}
if (error) die(`Could not generate link: ${error.message}`);

const action = data?.properties?.action_link;
if (!action) die("No action_link came back — check the Supabase project is reachable.");

console.log(`\n  ✓ Sign-in link for ${email} (expires in ~1 hour, single use):\n`);
console.log(`  ${action}\n`);
console.log(`  Paste it into the browser where the app is running.\n`);
