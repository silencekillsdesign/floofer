/* Outbound email via Resend's REST API.
 *
 * Deliberately no SDK — one fetch against a documented endpoint is less to
 * keep current than a dependency, and this is the only place we send mail.
 *
 * Absent credentials are a supported state, not an error: the whole app has
 * to keep working without a backend, so callers get told nothing was
 * delivered rather than being handed a false success. */

export interface OutboundEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** The shelter's reply should reach the adopter, not us. This is what
      removes the need for an in-app inbox entirely — coordinators live in
      email, so let them answer where they already are. */
  replyTo?: string;
}

export type SendResult =
  | { sent: true; id: string }
  | { sent: false; reason: "not-configured" | "failed"; detail?: string };

export async function sendEmail(mail: OutboundEmail): Promise<SendResult> {
  const { resendApiKey, mailFrom } = useRuntimeConfig();
  if (!resendApiKey) return { sent: false, reason: "not-configured" };

  try {
    const res = await $fetch<{ id: string }>("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}` },
      body: {
        from: mailFrom,
        to: [mail.to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      },
    });
    return { sent: true, id: res.id };
  } catch (e: any) {
    const detail = e?.data?.message ?? e?.message ?? "unknown error";
    console.error("[floofer] email send failed:", detail);
    return { sent: false, reason: "failed", detail };
  }
}

/** Minimal, readable HTML. Shelter inboxes are Outlook and Gmail on old
    hardware, so this stays table-free and inlined rather than clever. */
export function wrapEmail(headline: string, bodyHtml: string, footer?: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#28304a">
<div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5eaf3;border-radius:14px;padding:24px">
<p style="margin:0 0 4px;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#4C5FE4">Floofer</p>
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.25;color:#00297A">${headline}</h1>
${bodyHtml}
</div>
${footer ? `<p style="max-width:520px;margin:14px auto 0;font-size:12px;line-height:1.5;color:#6b7490;text-align:center">${footer}</p>` : ""}
</body></html>`;
}
