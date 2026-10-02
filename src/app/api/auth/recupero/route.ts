import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendLifecycleEmail } from "@/lib/email/send";
import { rateLimit } from "@/lib/ben-guard";
import { reportError } from "@/lib/report-error";

/**
 * Manda l'email di recupero password con Resend, non con Supabase.
 *
 * PERCHÉ. Le email di autenticazione di Supabase partivano dal suo servizio di
 * prova (`noreply@mail.app.supabase.io`), che consegna SOLO agli indirizzi del
 * team del progetto e poche volte l'ora: agli utenti veri non arrivava niente,
 * nemmeno nello spam, e il sito diceva «email inviata». Qui il link lo genera
 * Supabase (`generateLink`, chiave di servizio) e l'email la spedisce Resend,
 * lo stesso canale delle altre email, che arrivano.
 *
 * Il link è in flusso implicito: si apre da qualsiasi app o browser, e
 * `/auth/callback` → `/reset-password` lo completa.
 *
 * Risponde sempre allo stesso modo, che l'indirizzo esista o no: altrimenti
 * questa rotta direbbe a chiunque quali email sono registrate.
 */
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://bridgelab.it").replace(/\/$/, "");
const FORMATO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "?";
  let email = "";
  try {
    email = String(((await request.json()) as { email?: unknown }).email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ errore: "richiesta non valida" }, { status: 400 });
  }
  if (!FORMATO.test(email) || email.length > 254) {
    return NextResponse.json({ errore: "email non valida" }, { status: 400 });
  }
  // Freni contro chi la usa per tempestare una casella o per contare gli iscritti.
  if (!rateLimit(`recupero-ip:${ip}`, 5) || !rateLimit(`recupero-email:${email}`, 2, 10 * 60_000)) {
    return NextResponse.json({ errore: "troppi tentativi" }, { status: 429 });
  }

  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${SITE}/auth/callback?type=recovery&next=/reset-password` },
    });
    // Indirizzo non registrato: stessa risposta, nessuna email.
    if (error || !data?.properties?.action_link || !data.user) {
      return NextResponse.json({ ok: true });
    }
    const { data: profilo } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", data.user.id)
      .maybeSingle();
    const esito = await sendLifecycleEmail({
      to: email,
      userId: data.user.id,
      kind: "recupero_password",
      ctx: { name: (profilo?.display_name as string | undefined) ?? null, linkRecupero: data.properties.action_link },
    });
    if (!esito.ok) {
      reportError("auth:recupero-email", new Error(`invio non riuscito: ${esito.error ?? esito.skipped}`));
      return NextResponse.json({ errore: "invio non riuscito" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    reportError("auth:recupero", err);
    return NextResponse.json({ errore: "invio non riuscito" }, { status: 502 });
  }
}
