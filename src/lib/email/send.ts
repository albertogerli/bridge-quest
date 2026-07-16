import { renderEmail, type EmailKind, type EmailContext } from "./templates";
import { makeUnsubToken } from "./tokens";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://bridgelab.it").replace(/\/$/, "");

export interface SendResult {
  ok: boolean;
  skipped?: "disabled" | "no-key";
  id?: string;
  error?: string;
}

/** One-click unsubscribe URL for a user (sets marketing_consent = false). */
export function unsubscribeUrl(userId: string): string {
  return `${SITE}/api/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${makeUnsubToken(userId)}`;
}

/**
 * Sends a lifecycle email via the Resend REST API.
 * - Kill switch: EMAIL_ENABLED=false disables all sending (returns skipped).
 * - Missing RESEND_API_KEY -> skipped (logged), never throws.
 * - Marketing emails include an unsubscribe footer + List-Unsubscribe headers.
 * Recording to email_events is the caller's responsibility (after ok:true).
 */
export async function sendLifecycleEmail(params: {
  to: string;
  userId: string;
  kind: EmailKind;
  ctx: EmailContext;
}): Promise<SendResult> {
  const { to, userId, kind, ctx } = params;

  // Kill switch — anything other than an explicit "false" leaves sending ON.
  if ((process.env.EMAIL_ENABLED || "").toLowerCase() === "false") {
    console.warn(`[email] EMAIL_ENABLED=false → '${kind}' a ${to} saltata (dry-run).`);
    return { ok: false, skipped: "disabled" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY assente → '${kind}' a ${to} saltata.`);
    return { ok: false, skipped: "no-key" };
  }

  const from = process.env.RESEND_FROM || "BridgeLab <onboarding@resend.dev>";
  const unsubUrl = unsubscribeUrl(userId);
  const email = renderEmail(kind, ctx, kind === "welcome" ? undefined : unsubUrl);

  const headers: Record<string, string> = {};
  if (!email.transactional) {
    // RFC 8058 one-click unsubscribe — improves deliverability for bulk mail.
    headers["List-Unsubscribe"] = `<${unsubUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: email.subject,
        html: email.html,
        text: email.text,
        headers,
        tags: [{ name: "kind", value: kind }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[email] Resend ${res.status} per '${kind}' a ${to}: ${detail}`);
      return { ok: false, error: `resend_${res.status}` };
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id };
  } catch (e) {
    console.error(`[email] fetch fallita per '${kind}' a ${to}`, e);
    return { ok: false, error: "fetch_failed" };
  }
}
