import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { verifyUnsubToken } from "@/lib/email/tokens";

export const dynamic = "force-dynamic";

/**
 * One-click unsubscribe from marketing/re-engagement emails.
 * GET  -> user clicked the footer link (returns a friendly HTML page).
 * POST -> RFC 8058 List-Unsubscribe-Post (mail clients call this automatically).
 * Sets profiles.marketing_consent = false. Transactional emails are unaffected.
 */
async function unsubscribe(userId: string | null, token: string | null): Promise<boolean> {
  if (!userId || !token || !verifyUnsubToken(userId, token)) return false;
  try {
    const supabase = createAdminSupabaseClient();
    const { error } = await supabase
      .from("profiles")
      .update({ marketing_consent: false, marketing_consent_date: new Date().toISOString() })
      .eq("id", userId);
    if (error) {
      console.error("[unsubscribe] update fallito", error.message);
      return false;
    }
    await supabase.from("email_events").insert({ user_id: userId, email_type: "unsubscribe" });
    return true;
  } catch (e) {
    console.error("[unsubscribe] errore", e);
    return false;
  }
}

function page(title: string, message: string, ok: boolean): string {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#F7F5F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="max-width:480px;margin:12vh auto;background:#fff;border:1px solid #e7e3d8;border-radius:20px;padding:40px 32px;text-align:center;">
<div style="font-size:40px;margin-bottom:12px;">${ok ? "✅" : "⚠️"}</div>
<h1 style="margin:0 0 12px;font-size:22px;color:#1a1a2e;">${title}</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">${message}</p>
<a href="https://bridgelab.it" style="display:inline-block;padding:12px 24px;background:#003DA5;color:#fff;text-decoration:none;border-radius:12px;font-weight:700;">Torna a Bridge LAB</a>
</div></body></html>`;
}

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u");
  const t = req.nextUrl.searchParams.get("t");
  const ok = await unsubscribe(u, t);
  const html = ok
    ? page(
        "Fatto, non ti scriveremo più",
        "Non riceverai più promemoria e email di re-engagement. Continuerai a ricevere solo comunicazioni essenziali sul tuo account. Puoi riattivare i promemoria quando vuoi dal tuo profilo.",
        true
      )
    : page("Link non valido", "Questo link di disiscrizione non è valido o è scaduto. Puoi gestire le tue preferenze dal tuo profilo su Bridge LAB.", false);
  return new NextResponse(html, {
    status: ok ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u");
  const t = req.nextUrl.searchParams.get("t");
  const ok = await unsubscribe(u, t);
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
}
