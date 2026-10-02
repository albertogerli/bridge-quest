import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Ritorno dai link email in formato `token_hash`, che funziona da QUALSIASI
 * browser.
 *
 * PERCHÉ ESISTE ACCANTO A /auth/callback. Il link standard (PKCE) si può aprire
 * solo nel browser in cui è stato chiesto, perché lì sta la metà segreta dello
 * scambio. Sul telefono l'email apre spesso un'altra app, e il recupero
 * password fallisce. Con `token_hash` la verifica la fa il server, senza
 * bisogno di quella metà.
 *
 * Per usarlo, il modello «Reset password» su Supabase (Authentication → Email
 * Templates) deve puntare qui:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
 */
const TIPI: EmailOtpType[] = ["recovery", "signup", "invite", "magiclink", "email_change", "email"];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  const richiesto = searchParams.get("next") ?? "/";
  // Solo percorsi interni: `next` arriva dall'indirizzo, e un valore esterno
  // trasformerebbe il link in un rimbalzo verso un altro sito.
  const next = richiesto.startsWith("/") && !richiesto.startsWith("//") ? richiesto : "/";

  if (tokenHash && tipo && TIPI.includes(tipo)) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${tipo === "recovery" ? "/reset-password" : next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=link_scaduto`);
}
