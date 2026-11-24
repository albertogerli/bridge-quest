import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/ben-guard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { schemaCorso, dataNonPassata, ETICHETTA_TIPO } from "@/lib/corsi";
import { avvisaAdminNuovoCorso } from "@/lib/email/corsi";
import { reportError } from "@/lib/report-error";

export const dynamic = "force-dynamic";

/**
 * POST /api/corsi — chi ha un account propone un corso (o la modifica di uno
 * suo già pubblicato). Il corso entra «in attesa»; lo pubblica l'amministratore
 * da /admin/corsi.
 *
 * L'inserimento passa con la sessione dell'utente (RLS: solo a nome proprio,
 * solo «in attesa»). La chiave di servizio serve dopo, per una cosa sola:
 * segnare se chi carica ha una classe su BridgeLab, che è l'indizio che
 * l'amministratore guarda accanto a «Bridge 5.0».
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Serve un account per proporre un corso" }, { status: 401 });

  // Ogni invio manda una mail all'amministratore.
  if (!rateLimit(`corsi:${user.id}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "Troppi invii: riprova fra qualche minuto" }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
  const parsed = schemaCorso.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" }, { status: 400 });
  }
  const d = parsed.data;
  if (!dataNonPassata(d.primaLezione)) {
    return NextResponse.json({ error: "La prima lezione è già passata" }, { status: 400 });
  }
  for (const p of [d.locandinaPath, d.programmaPath]) {
    if (p && !p.startsWith(`${user.id}/`)) return NextResponse.json({ error: "File non valido" }, { status: 400 });
  }

  const { data: circolo } = await supabase.from("asd_clubs").select("code, name").eq("code", d.asdCode).maybeSingle();
  if (!circolo) return NextResponse.json({ error: "Circolo non trovato nell'elenco FIGB" }, { status: 400 });

  if (d.sostituisce) {
    const { data: vecchio } = await supabase
      .from("corsi")
      .select("id, user_id, stato")
      .eq("id", d.sostituisce)
      .maybeSingle();
    if (!vecchio || vecchio.user_id !== user.id) {
      return NextResponse.json({ error: "Puoi modificare solo i corsi che hai caricato tu" }, { status: 403 });
    }
  }

  const { data: nuovo, error } = await supabase
    .from("corsi")
    .insert({
      user_id: user.id,
      tipo: d.tipo,
      asd_code: d.asdCode,
      livello: d.livello,
      maestro: d.maestro,
      prima_lezione: d.primaLezione,
      orari: d.orari,
      telefono: d.telefono,
      email: d.email,
      whatsapp: d.whatsapp,
      locandina_path: d.locandinaPath,
      programma: d.programma,
      programma_path: d.programmaPath,
      costo: d.costo,
      note: d.note,
      consenso: d.consenso,
      sostituisce: d.sostituisce,
    })
    .select("id")
    .single();
  if (error || !nuovo) {
    reportError("api:corsi:invio", error);
    return NextResponse.json({ error: "Non sono riuscito a salvare il corso. Riprova fra un attimo." }, { status: 500 });
  }

  // Ha una classe su BridgeLab (come titolare o come collega)?
  let haClasse = false;
  try {
    const admin = createAdminSupabaseClient();
    const [{ count: titolare }, { count: collega }] = await Promise.all([
      admin.from("classes").select("id", { count: "exact", head: true }).eq("instructor_id", user.id),
      admin.from("classe_insegnanti").select("class_id", { count: "exact", head: true }).eq("insegnante_id", user.id),
    ]);
    haClasse = (titolare ?? 0) + (collega ?? 0) > 0;
    if (haClasse) await admin.from("corsi").update({ ha_classe_bridgelab: true }).eq("id", nuovo.id);
  } catch (err) {
    reportError("api:corsi:classe", err);
  }

  await avvisaAdminNuovoCorso({
    circolo: circolo.name,
    tipo: ETICHETTA_TIPO[d.tipo],
    maestro: d.maestro,
    primaLezione: d.primaLezione,
    modifica: Boolean(d.sostituisce),
    haClasse,
    emailAutore: user.email ?? null,
  });

  return NextResponse.json({ ok: true, id: nuovo.id });
}
