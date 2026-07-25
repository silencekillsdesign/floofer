import { createClient } from "@supabase/supabase-js";

/* Delivers adopter → shelter notifications.
 *
 * SECURITY: the recipient is looked up from the listing, never taken from the
 * request. A client can say "notify whoever holds dog X", not "email
 * arbitrary@address.com" — otherwise this endpoint is an open relay wearing a
 * charity's name.
 *
 * Replies go straight to the adopter via reply_to, which is why there's no
 * in-app inbox to build. A coordinator answers from Outlook like they already
 * do, and the adopter gets it. */

interface Body {
  kind: "message" | "play-date";
  dogId: string;
  fromName: string;
  fromEmail: string;
  body?: string;
  /** Human-readable windows, already formatted by the client. */
  slots?: string[];
  /** Consent-gated profile chips. Only present if the adopter ticked the box. */
  summary?: string[];
}

const MAX_BODY = 2000;
const MAX_ITEMS = 12;

/* Best-effort throttle. In-memory, so it resets on a cold start and doesn't
   span instances — enough to blunt an accident, not a determined abuser. A
   real deployment wants a shared store or a captcha in front of this. */
const hits = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 10;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

const clean = (s: unknown, max = 200) =>
  typeof s === "string" ? s.trim().slice(0, max) : "";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig();
  const supa = (cfg.public as any).supabase ?? {};
  const url: string = supa.url ?? "";
  const key: string = supa.key ?? "";

  if (!url || url.includes("localhost:54321")) {
    throw createError({ statusCode: 501, statusMessage: "No database configured." });
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? "unknown";
  if (rateLimited(ip)) {
    throw createError({ statusCode: 429, statusMessage: "Too many messages — try again later." });
  }

  const b = await readBody<Body>(event);
  const kind = b?.kind === "play-date" ? "play-date" : "message";
  const dogId = clean(b?.dogId, 64);
  const fromName = clean(b?.fromName, 80) || "Someone";
  const fromEmail = clean(b?.fromEmail, 160);

  /* Listing ids are uuids. Checking the shape first means a malformed id
     reads as "no such listing" rather than a 502 blaming the database. */
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dogId);
  if (!dogId) throw createError({ statusCode: 400, statusMessage: "Missing listing." });
  if (!isUuid) throw createError({ statusCode: 404, statusMessage: "That listing no longer exists." });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fromEmail)) {
    throw createError({ statusCode: 400, statusMessage: "A valid reply address is required." });
  }

  /* Anon client: orgs are world-readable and listable dogs are public, so no
     elevated key is needed here. The service key stays out of the deploy. */
  const db = createClient(url, key, { auth: { persistSession: false } });

  const { data: dog, error } = await db
    .from("dogs")
    .select("id,name,breed,risk,risk_reason,orgs(name,contact_email,contact_name)")
    .eq("id", dogId)
    .maybeSingle();

  if (error) throw createError({ statusCode: 502, statusMessage: "Could not look up that listing." });
  if (!dog) throw createError({ statusCode: 404, statusMessage: "That listing no longer exists." });

  const org = (dog as any).orgs as
    | { name: string; contact_email: string | null; contact_name: string | null }
    | null;

  if (!org?.contact_email) {
    /* Not an error the adopter caused. Tell the truth so the UI can say the
       shelter hasn't added a contact yet rather than implying delivery. */
    return { delivered: false, reason: "no-contact", org: org?.name ?? null };
  }

  const dogName = (dog as any).name as string;
  const slots = Array.isArray(b?.slots) ? b!.slots.slice(0, MAX_ITEMS).map((s) => clean(s, 80)) : [];
  const summary = Array.isArray(b?.summary) ? b!.summary.slice(0, MAX_ITEMS).map((s) => clean(s, 80)) : [];
  const note = clean(b?.body, MAX_BODY);

  const isPlayDate = kind === "play-date";
  const subject = isPlayDate
    ? `Play date request for ${dogName} — Floofer`
    : `Adoption enquiry about ${dogName} — Floofer`;

  const li = (items: string[]) =>
    items.length
      ? `<ul style="margin:0 0 16px;padding-left:18px;font-size:14px;line-height:1.6;color:#28304a">${items
          .map((s) => `<li>${escapeHtml(s)}</li>`)
          .join("")}</ul>`
      : "";

  const riskLine =
    (dog as any).risk === "high" && (dog as any).risk_reason
      ? `<p style="margin:0 0 16px;padding:10px 12px;border-radius:10px;background:#fdecea;font-size:13px;line-height:1.5;color:#c42a22"><strong>${escapeHtml(dogName)} is flagged at risk:</strong> ${escapeHtml((dog as any).risk_reason)}</p>`
      : "";

  const bodyHtml = `
${riskLine}
<p style="margin:0 0 16px;font-size:15px;line-height:1.6">
  <strong>${escapeHtml(fromName)}</strong> ${isPlayDate ? `would like to meet <strong>${escapeHtml(dogName)}</strong>.` : `is asking about <strong>${escapeHtml(dogName)}</strong>.`}
</p>
${isPlayDate && slots.length ? `<p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#6b7490">They can do</p>${li(slots)}` : ""}
${note ? `<blockquote style="margin:0 0 16px;padding:12px 14px;border-left:3px solid #4C5FE4;background:#f4f5f9;border-radius:0 10px 10px 0;font-size:14px;line-height:1.6">${escapeHtml(note)}</blockquote>` : ""}
${summary.length ? `<p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#6b7490">They shared their adoption profile</p>${li(summary)}` : ""}
<p style="margin:0;font-size:14px;line-height:1.6">
  <a href="mailto:${encodeURIComponent(fromEmail)}" style="color:#4C5FE4;font-weight:700">Reply to ${escapeHtml(fromName)}</a>
  — or just hit reply, it goes straight to them.
</p>`;

  const text = [
    `${fromName} ${isPlayDate ? `would like to meet ${dogName}.` : `is asking about ${dogName}.`}`,
    slots.length ? `\nThey can do:\n${slots.map((s) => `  - ${s}`).join("\n")}` : "",
    note ? `\n"${note}"` : "",
    summary.length ? `\nAdoption profile:\n${summary.map((s) => `  - ${s}`).join("\n")}` : "",
    `\nReply to this email and it reaches ${fromName} at ${fromEmail}.`,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await sendEmail({
    to: org.contact_email,
    subject,
    html: wrapEmail(
      isPlayDate ? `${fromName} wants to meet ${dogName}` : `${fromName} is asking about ${dogName}`,
      bodyHtml,
      "You're receiving this because your organisation lists this animal on Floofer.",
    ),
    text,
    replyTo: fromEmail,
  });

  if (!result.sent) {
    /* 200 with delivered:false — the adopter's request was accepted and the
       shelter is reachable by phone on the listing. A 500 here would read as
       "your message failed" when the real state is "email isn't wired up". */
    return { delivered: false, reason: result.reason, org: org.name };
  }
  return { delivered: true, org: org.name, to: org.contact_name ?? null };
});
