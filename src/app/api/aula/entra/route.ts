import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { reportError } from "@/lib/report-error";
import { aulaAlCompleto } from "@/lib/aula-tetto";

export const dynamic = "force-dynamic";

/**
 * L'ingresso in aula senza registrarsi.
 *
 * ----------------------------------------------------------------------------
 * PERCHÉ UN UTENTE VERO E NON UNA SESSIONE FINTA
 * ----------------------------------------------------------------------------
 *
 * La strada breve sarebbe un gettone in una tabella e un pugno di funzioni
 * `SECURITY DEFINER` per farci passare l'ospite. È la strada che si paga dopo:
 * ogni cosa che l'ospite deve poter fare — vedere il tavolo, giocare una carta,
 * rispondere a un sondaggio — diventerebbe una funzione a sé, scritta apposta,
 * con i controlli riscritti a mano. E i controlli riscritti a mano sono
 * esattamente dove si aprono i buchi.
 *
 * Qui invece l'ospite È un utente, creato dal server. Da quel momento tutte le
 * RLS che già esistono valgono per lui senza toccarle: è membro di UNA classe e
 * vede quella. E la conversione in account vero diventa banale — stesso utente,
 * gli si aggiunge un'email — quindi «eredita tutta la sua attività» non è una
 * migrazione da scrivere, è una conseguenza.
 *
 * L'accesso anonimo di Supabase avrebbe fatto lo stesso lavoro ed è disattivato
 * su questo progetto (verificato). Se un giorno lo si accende, questa rotta si
 * può semplificare parecchio.
 *
 * ----------------------------------------------------------------------------
 * COSA IMPEDISCE CHE DIVENTI UNA FABBRICA DI UTENTI
 * ----------------------------------------------------------------------------
 *
 * Creare utenti su richiesta è una rotta che, lasciata aperta, riempie il
 * database. Tre guardie, tutte lato server:
 *
 * 1. serve un invito valido — esiste, non revocato, non scaduto;
 * 2. c'è un tetto di ospiti per invito, che l'insegnante decide;
 * 3. l'ospite nasce con ruolo `user` e con UNA sola appartenenza: non c'è
 *    percorso, nemmeno teorico, che lo porti fuori dalla sua classe.
 *
 * La password non la sceglie nessuno e non la vede nessuno: serve solo a
 * ottenere la sessione qui dentro, e viene buttata. Chi vorrà tornare si farà
 * un account vero.
 */

interface Corpo {
  token?: string;
  nome?: string;
}

export async function POST(req: NextRequest) {
  let corpo: Corpo;
  try {
    corpo = (await req.json()) as Corpo;
  } catch {
    return NextResponse.json({ errore: "Richiesta illeggibile." }, { status: 400 });
  }

  const token = (corpo.token ?? "").trim();
  const nome = (corpo.nome ?? "").trim().slice(0, 60);
  if (!token) return NextResponse.json({ errore: "Manca il link." }, { status: 400 });
  if (nome.length < 2) {
    return NextResponse.json({ errore: "Scrivi il tuo nome." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminSupabaseClient();
  } catch (e) {
    return NextResponse.json(
      { errore: e instanceof Error ? e.message : "Configurazione mancante." },
      { status: 500 },
    );
  }

  // ── 1. L'invito ────────────────────────────────────────────────────────────
  const { data: invito } = await admin
    .from("inviti_aula")
    .select("id, class_id, scade_il, revocato, max_ospiti")
    .eq("token", token)
    .maybeSingle();

  if (!invito || invito.revocato || new Date(invito.scade_il) <= new Date()) {
    // Un solo messaggio per tutti e tre i casi: distinguerli direbbe a chi
    // prova gettoni a caso quali esistono.
    return NextResponse.json(
      { errore: "Questo link non è più valido. Chiedilo di nuovo al tuo insegnante." },
      { status: 403 },
    );
  }

  // ── 2. Il tetto ────────────────────────────────────────────────────────────
  // SI CONTANO GLI OSPITI, NON GLI ISCRITTI. Contare i membri attivi voleva
  // dire che una classe con quaranta allievi veri risultava «al completo»
  // prima che entrasse il primo ospite: il tetto scattava su gente che non
  // c'entrava niente, e l'insegnante vedeva il link non funzionare senza
  // capire perché — proprio le sere in cui la classe è grande.
  //
  // Si contano gli ospiti DI QUESTA CLASSE e non di questo singolo invito
  // perché non esiste un legame fra l'ospite e il gettone con cui è entrato.
  // È anche la lettura giusta per l'insegnante: il tetto è «quanti estranei
  // ho in aula stasera», non «quanti ne ho fatti entrare con quel link».
  //
  // Gli ospiti SCADUTI non occupano posto: finita la lezione il posto torna
  // libero, altrimenti il tetto si riempirebbe una volta per sempre.
  const { data: membri } = await admin
    .from("class_members")
    .select("student_id")
    .eq("class_id", invito.class_id)
    .eq("status", "active");

  const idMembri = (membri ?? []).map((m) => m.student_id as string);
  let ospitiInAula = 0;
  if (idMembri.length > 0) {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("id", idMembri)
      .eq("ospite", true)
      .gt("ospite_scade_il", new Date().toISOString());
    ospitiInAula = count ?? 0;
  }

  if (aulaAlCompleto(ospitiInAula, invito.max_ospiti)) {
    return NextResponse.json(
      { errore: "L'aula è al completo. Dillo al tuo insegnante." },
      { status: 429 },
    );
  }

  // ── 3. L'utente ────────────────────────────────────────────────────────────
  const email = `ospite-${crypto.randomUUID()}@bridgelab-ospite.invalid`;
  const password = crypto.randomUUID() + crypto.randomUUID();

  const { data: creato, error: erroreCreazione } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: nome, ospite: true },
  });

  if (erroreCreazione || !creato.user) {
    reportError("aula:crea-ospite", erroreCreazione);
    return NextResponse.json({ errore: "Non riesco a farti entrare adesso." }, { status: 500 });
  }

  const uid = creato.user.id;
  // La sessione ospite dura quanto l'invito: finita la lezione, finita.
  const scade = invito.scade_il;

  const { error: erroreProfilo } = await admin
    .from("profiles")
    .update({ display_name: nome, ospite: true, ospite_scade_il: scade, role: "user" })
    .eq("id", uid);

  // SE QUESTA FALLISCE L'OSPITE NON È PIÙ UN OSPITE. Senza `ospite` e senza
  // `ospite_scade_il` resta un account PERMANENTE che nessuno sa di aver
  // creato: il commento qui sopra — «finita la lezione, finita» — diventa
  // falso, e la pulizia non lo troverà mai perché cerca proprio quei campi.
  //
  // Si ritira come già si fa quando fallisce l'iscrizione alla classe, poco
  // più sotto: un utente a metà è peggio di un ingresso negato, perché
  // l'ingresso negato lo si riprova.
  if (erroreProfilo) {
    reportError("aula:profilo-ospite", erroreProfilo);
    await admin.auth.admin.deleteUser(uid);
    return NextResponse.json({ errore: "Non riesco a farti entrare adesso." }, { status: 500 });
  }

  const { error: erroreIscrizione } = await admin
    .from("class_members")
    .insert({ class_id: invito.class_id, student_id: uid, status: "active" });

  if (erroreIscrizione) {
    // Un ospite senza classe non serve a niente e resterebbe lì: si ritira.
    await admin.auth.admin.deleteUser(uid);
    reportError("aula:iscrivi-ospite", erroreIscrizione);
    return NextResponse.json({ errore: "Non riesco a farti entrare adesso." }, { status: 500 });
  }

  // ── 4. La sessione, da restituire al browser ──────────────────────────────
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  const { data: sessione, error: erroreAccesso } = await anon.auth.signInWithPassword({
    email,
    password,
  });

  if (erroreAccesso || !sessione.session) {
    reportError("aula:sessione-ospite", erroreAccesso);
    return NextResponse.json({ errore: "Non riesco a farti entrare adesso." }, { status: 500 });
  }

  return NextResponse.json({
    classId: invito.class_id,
    access_token: sessione.session.access_token,
    refresh_token: sessione.session.refresh_token,
  });
}
