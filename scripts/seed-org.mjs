#!/usr/bin/env node
/* Invite a shelter into the pilot.
 *
 *   npm run seed:org -- --name "Cook County Animal Care & Control" \
 *                       --type municipal --city "Chicago, IL" \
 *                       --invite intake@cookcountyil.gov
 *
 * Creates the org (or reuses one with the same name) and records an invite.
 * The invited address is attached to that org automatically the first time it
 * signs in — see handle_new_user() in supabase/migrations/0001_init.sql.
 *
 * Uses SUPABASE_SERVICE_KEY, which bypasses row-level security. Run it
 * locally only; never ship this key to a client or a build log.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

/* Load .env without adding a dependency — Node's --env-file isn't available
   on every version this might run under. */
try {
  for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* no .env — fall back to the ambient environment */
}

const VALID_TYPES = ["shelter", "municipal", "foster", "individual", "retirement"];

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
if (!url || !serviceKey) {
  die("Set NUXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env (see .env.example).");
}

const name = arg("name");
const type = arg("type");
const city = arg("city");
const invite = arg("invite");
const role = arg("role") ?? type;

if (!name || !type || !city) {
  die('Usage: npm run seed:org -- --name "Org name" --type municipal --city "Chicago, IL" [--invite staff@org.org]');
}
if (!VALID_TYPES.includes(type)) {
  die(`--type must be one of: ${VALID_TYPES.join(", ")}`);
}
if (invite && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(invite)) {
  die(`"${invite}" is not a valid email address.`);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

/* Re-running with the same name should be a no-op, not a duplicate org. */
const { data: existing, error: lookupErr } = await db
  .from("orgs").select("id,name").eq("name", name).maybeSingle();
if (lookupErr) die(`Lookup failed: ${lookupErr.message}`);

let org = existing;
if (org) {
  console.log(`  • Org already exists — reusing ${org.id}`);
} else {
  const { data, error } = await db
    .from("orgs").insert({ name, type, city }).select("id,name").single();
  if (error) die(`Could not create org: ${error.message}`);
  org = data;
  console.log(`  ✓ Created org ${org.id}`);
}

if (invite) {
  const { error } = await db
    .from("org_invites")
    .upsert({ email: invite.toLowerCase(), org_id: org.id, role }, { onConflict: "email" });
  if (error) die(`Could not record invite: ${error.message}`);
  console.log(`  ✓ Invited ${invite} as ${role}`);
  console.log(`\n  Tell them to sign in at /login with that address — they'll`);
  console.log(`  land in "${name}" automatically.\n`);
} else {
  console.log(`\n  No --invite given, so nobody can log in for this org yet.`);
  console.log(`  Add one:  npm run seed:org -- --name "${name}" --type ${type} --city "${city}" --invite staff@org.org\n`);
}
