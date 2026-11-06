import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/ben-guard";
import { normalizzaRisposta } from "@/lib/esercizi-posizione";
import { leggiFigura } from "@/lib/figura-domanda";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { gruppoTest, TEST_COMMISSIONE, titoloDomanda } from "@/lib/test-commissione";
import { reportError } from "@/lib/report-error";
import dati from "@/data/commissione/test-commissione.json";

interface DomandaTest {
  numero: string;
  testo: string;
  contesto?: string;
  figura: unknown;
  opzioni: string[];
  giusta: number;
  /** Il perché della risposta, quando Trevissoi l'ha scritto. */
  spiegazione?: string;
  sospesa?: boolean;
}

/**
 * POST /api/istruttori/test-commissione  { numero }  →  { gruppo, ids }
 *
 * Copia un test della Commissione fra le domande a scelta dell'insegnante,
 * come se le avesse scritte lui: da lì vanno nei compiti come tutte le altre.
 * Se c'era già, non lo ricopia: restituisce gli id che ha, nell'ordine del
 * test, così «Assegna» funziona con un clic sia la prima volta sia le dopo.
 *
 * PERCHÉ LATO SERVER. Il file con le domande contiene le risposte giuste. Letto
 * dal browser starebbe nel JavaScript della pagina, che scarica chiunque; qui
 * resta sul server, e nel database finisce nelle colonne che l'allievo non
 * legge (`risposte`, `risposte_norm`). L'inserimento gira con la sessione
 * dell'insegnante, quindi vale la regola di sempre: crea esercizi solo chi
 * insegna.
 *
 * Le domande sospese non si copiano: sono quelle con un errore nell'originale
 * (una mano di 12 o 14 carte) o una risposta da confermare con Trevissoi. Dal
 * 06/11/2026 non ce ne sono più, ma la regola resta per i test che verranno.
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  if (!rateLimit(`test-commissione:${user.id}`, 20)) {
    return NextResponse.json({ error: "Troppe richieste" }, { status: 429 });
  }

  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ error: "Body non valido" }, { status: 400 });
  }
  const parsed = z.object({ numero: z.number().int().min(1).max(12) }).safeParse(corpo);
  if (!parsed.success) return NextResponse.json({ error: "Body non valido" }, { status: 400 });

  const test = TEST_COMMISSIONE.find((t) => t.numero === parsed.data.numero)!;
  const domande = ((dati as { numero: number; domande: DomandaTest[] }[]).find((t) => t.numero === test.numero)?.domande ?? [])
    .filter((d) => !d.sospesa);
  const gruppo = gruppoTest(test);

  // Già aggiunto: una seconda copia raddoppierebbe ogni domanda.
  const { data: esistenti, error: erroreLettura } = await supabase
    .from("esercizi_posizione")
    .select("id")
    .eq("autore_id", user.id)
    .eq("gruppo", gruppo)
    .order("created_at", { ascending: true });
  if (erroreLettura) {
    reportError("test-commissione:leggi", erroreLettura);
    return NextResponse.json({ error: "Errore" }, { status: 500 });
  }
  if ((esistenti ?? []).length > 0) {
    return NextResponse.json({ gia: true, gruppo, ids: (esistenti ?? []).map((e) => e.id as string) });
  }

  // Un millisecondo di distanza fra una domanda e la successiva: inserite
  // insieme avrebbero tutte lo stesso istante, e l'ordine del test (che va
  // dal facile al difficile) si perderebbe fra «Nuovo compito» e l'allievo.
  const base = Date.now();
  const righe = domande.map((d, i) => {
    const giusta = d.opzioni[d.giusta];
    return {
      autore_id: user.id,
      titolo: titoloDomanda(test, d.numero),
      consegna: "scelta",
      domanda: d.contesto ? `${d.testo}\n${d.contesto}` : d.testo,
      hands: {},
      dealer: "south",
      vulnerability: "none",
      bids: [],
      played: [],
      posizione: "south",
      contract: null,
      declarer: null,
      risposte: [giusta],
      risposte_norm: [normalizzaRisposta(giusta)],
      soluzione: d.spiegazione ?? null,
      gruppo,
      class_id: null,
      opzioni: d.opzioni,
      figura: leggiFigura(d.figura),
      created_at: new Date(base + i).toISOString(),
    };
  });

  const { data: inserite, error } = await supabase.from("esercizi_posizione").insert(righe).select("id, created_at");
  if (error) {
    // 42501: chi non insegna non può creare esercizi (RLS). 42703: manca la
    // colonna `figura`, cioè non è ancora stato eseguito lo script.
    if (error.code === "42501") return NextResponse.json({ error: "Solo chi insegna" }, { status: 403 });
    reportError("test-commissione:inserisci", error);
    return NextResponse.json({ error: "Errore", codice: error.code }, { status: 500 });
  }
  const ids = [...(inserite ?? [])]
    .sort((a, b) => Date.parse(a.created_at as string) - Date.parse(b.created_at as string))
    .map((e) => e.id as string);
  return NextResponse.json({ aggiunte: righe.length, gruppo, ids });
}
