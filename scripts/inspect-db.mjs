#!/usr/bin/env node
/* Quick read-only peek at pilot state — profiles, orgs, invites, dog counts.
   Service key, local dev only. Not wired into package.json; run directly:
     node scripts/inspect-db.mjs */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

try {
  for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const db = createClient(
  process.env.NUXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } },
);

const { data: orgs } = await db.from("orgs").select("id,name,type,city");
const { data: invites } = await db.from("org_invites").select("email,org_id,role,claimed_at");
const { data: profiles } = await db.from("profiles").select("id,email,user_type,org_id,name");
const { data: dogs } = await db.from("dogs").select("id,name,org_id,status,risk");

console.log("\nORGS:", JSON.stringify(orgs, null, 2));
console.log("\nINVITES:", JSON.stringify(invites, null, 2));
console.log("\nPROFILES:", JSON.stringify(profiles, null, 2));
console.log("\nDOGS:", JSON.stringify(dogs, null, 2));
