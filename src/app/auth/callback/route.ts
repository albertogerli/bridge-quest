import { NextResponse, after } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendWelcomeIfNeeded } from "@/lib/email/welcome";

/**
 * Auth callback route handler for PKCE code exchange.
 * Handles redirects from Supabase Auth after:
 * - Email confirmation
 * - Magic link login
 * - OAuth login
 * - Password reset
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const type = searchParams.get("type");
  const recupero = type === "recovery" || next === "/reset-password";

  // Supabase rimanda qui SENZA codice quando il link non vale più: scaduto, già
  // usato (anche da un filtro antispam che lo apre per controllarlo) o
  // manomesso. Prima finiva in un generico «accesso fallito» che il login non
  // mostrava nemmeno: la persona si ritrovava sul login senza sapere perché.
  if (!code && (searchParams.get("error_code") || searchParams.get("error"))) {
    return NextResponse.redirect(`${origin}/login?error=link_scaduto`);
  }

  // Recupero in flusso implicito: niente `code`, la sessione viaggia nel
  // frammento `#access_token=…`, che il server non vede. Una pagina minima, SENZA
  // il client Supabase dell'app (che in modalità PKCE scarterebbe il frammento),
  // lo mette da parte per /reset-password, che installa la sessione.
  if (!code && recupero) {
    const html =
      '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="robots" content="noindex">' +
      "<title>BridgeLab</title></head><body><script>" +
      'try{sessionStorage.setItem("bq_recupero",location.hash.slice(1))}catch(e){}' +
      'location.replace("/reset-password")' +
      "</script></body></html>";
    return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Password recovery: redirect to the reset-password page instead of next
      const isRecovery = type === "recovery" || next === "/reset-password";
      const destination = isRecovery ? "/reset-password" : next;

      // First email confirmation / login: send the welcome email once, after the
      // redirect response (non-blocking). Deduped via email_events.
      if (!isRecovery) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id && user.email) {
          const uid = user.id;
          const mail = user.email;
          after(() => sendWelcomeIfNeeded(uid, mail));
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${destination}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${destination}`);
      } else {
        return NextResponse.redirect(`${origin}${destination}`);
      }
    }
  }

  // Codice presente ma scambio fallito. Per il recupero password la causa quasi
  // sempre è il browser: il link si apre solo dove è stato chiesto (PKCE), e sul
  // telefono l'email apre spesso un'altra app.
  return NextResponse.redirect(`${origin}/login?error=${recupero ? "link_altro_browser" : "auth_callback_failed"}`);
}
