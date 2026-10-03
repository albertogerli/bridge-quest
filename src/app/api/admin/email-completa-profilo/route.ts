import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendLifecycleEmail } from "@/lib/email/send";
import { reportError } from "@/lib/report-error";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * L'email «ci manca un pezzo del tuo profilo», una volta sola per persona.
 *
 * PERCHÉ ESISTE. Dal 1° agosto al 3 ottobre 2026 la registrazione non ha
 * salvato associazione, utente BBO e fascia d'età (privilegi per colonna su
 * `profiles`, Sentry BRIDGELAB-21; corretto in
 * `scripts/sql/profilo-da-registrazione-2026-10.sql`). Quei dati non sono
 * mai arrivati al server: l'unico modo di riaverli è chiederli.
 *
 * SOLO AMMINISTRATORI. Tre modi, in quest'ordine:
 *   { "modo": "conta" }  quanti la riceverebbero, senza mandare niente
 *   { "modo": "prova" }  la manda soltanto a chi chiama (o all'indirizzo in
 *                        `a`), per vederla prima di mandarla a tutti
 *   { "modo": "invia" }  la manda a tutti quelli che non l'hanno ancora avuta
 *
 * Chi l'ha già ricevuta sta in `email_events`: rilanciare `invia` dopo
 * un'interruzione riprende da dove si era fermato, non manda doppioni.
 *
 * DESTINATARI: iscritti con email e password nella finestra del guasto (chi
 * è entrato con Google non ha mai compilato il modulo), indirizzi di prova
 * esclusi.
 */
const DAL = "2026-08-01T00:00:00Z";
const AL = "2026-10-03T19:00:00Z";
const TIPO = "completa_profilo";
const DI_PROVA = /@(example\.com|bridgelab-audit\.invalid|bridgelab-test\.invalid)$|\.invalid$/i;

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { data: admin, error: erroreRuolo } = await supabase.rpc("is_admin");
  if (erroreRuolo) {
    reportError("api:email-completa-profilo", erroreRuolo);
    return NextResponse.json({ error: "Verifica del ruolo non riuscita" }, { status: 500 });
  }
  if (!admin) return NextResponse.json({ error: "Solo amministratori" }, { status: 403 });

  const corpo = (await req.json().catch(() => ({}))) as { modo?: string; a?: string };
  const modo = corpo.modo;
  if (modo !== "conta" && modo !== "prova" && modo !== "invia") {
    return NextResponse.json({ error: "modo: conta | prova | invia" }, { status: 400 });
  }

  const db = createAdminSupabaseClient();

  if (modo === "prova") {
    const a = typeof corpo.a === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(corpo.a) ? corpo.a : user.email;
    if (!a) return NextResponse.json({ error: "Nessun indirizzo per la prova" }, { status: 400 });
    const { data: p } = await db.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
    // Nessuna riga in `email_events`: la prova non conta come invio.
    const r = await sendLifecycleEmail({ to: a, userId: user.id, kind: TIPO, ctx: { name: p?.display_name } });
    return NextResponse.json({ modo, a, esito: r });
  }

  // Tutti gli utenti, pagina per pagina: `listUsers` non filtra per data.
  const candidati: { id: string; email: string }[] = [];
  for (let pagina = 1; ; pagina++) {
    const { data, error } = await db.auth.admin.listUsers({ page: pagina, perPage: 1000 });
    if (error) {
      reportError("api:email-completa-profilo", error);
      return NextResponse.json({ error: "Lettura utenti non riuscita" }, { status: 500 });
    }
    for (const u of data.users) {
      if (!u.email || DI_PROVA.test(u.email)) continue;
      if (u.created_at < DAL || u.created_at > AL) continue;
      if ((u.app_metadata?.provider ?? "email") !== "email") continue;
      candidati.push({ id: u.id, email: u.email });
    }
    if (data.users.length < 1000) break;
  }

  const { data: giaInviate, error: erroreEventi } = await db
    .from("email_events")
    .select("user_id")
    .eq("email_type", TIPO);
  if (erroreEventi) {
    reportError("api:email-completa-profilo", erroreEventi);
    return NextResponse.json({ error: "Lettura invii non riuscita" }, { status: 500 });
  }
  const fatti = new Set((giaInviate ?? []).map((e) => e.user_id));
  const daFare = candidati.filter((c) => !fatti.has(c.id));

  if (modo === "conta") {
    return NextResponse.json({ modo, nellaFinestra: candidati.length, giaInviate: fatti.size, daInviare: daFare.length });
  }

  const nomi = new Map<string, string | null>();
  const { data: profili } = await db.from("profiles").select("id, display_name").in("id", daFare.map((c) => c.id));
  for (const p of profili ?? []) nomi.set(p.id, p.display_name);

  let inviate = 0;
  const errori: string[] = [];
  for (const c of daFare) {
    const r = await sendLifecycleEmail({ to: c.email, userId: c.id, kind: TIPO, ctx: { name: nomi.get(c.id) } });
    if (r.ok) {
      inviate++;
      const { error } = await db.from("email_events").insert({ user_id: c.id, email_type: TIPO, meta: { provider_id: r.id ?? null } });
      if (error) reportError("api:email-completa-profilo", error);
    } else {
      errori.push(r.skipped ?? r.error ?? "ignoto");
      if (r.skipped) break; // invio disattivato o chiave assente: inutile insistere
    }
    // Resend accetta due richieste al secondo.
    await new Promise((ok) => setTimeout(ok, 600));
  }
  return NextResponse.json({ modo, daInviare: daFare.length, inviate, errori });
}
