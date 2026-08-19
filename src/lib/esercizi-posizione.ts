import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/report-error";
import type { Card, Position } from "@/lib/bridge-engine";
import type { Vulnerability } from "@/lib/catalog";

/**
 * Una posizione salvata come esercizio.
 *
 * PERCHÉ È IL MODO PIÙ RAPIDO DI COSTRUIRE IL REPERTORIO. Un esercizio scritto
 * da zero costa mezz'ora: bisogna inventare la mano, verificare che l'argomento
 * ci sia davvero, scrivere la domanda. Una posizione appena vista a lezione
 * costa un clic, e ha già tutto quello che serve — la mano è quella su cui la
 * classe stava discutendo un minuto fa, e la domanda è quella che l'insegnante
 * ha appena fatto a voce.
 *
 * SI SALVA IL MOMENTO, NON LA SMAZZATA. Dentro ci sono la dichiarazione fin lì
 * e le carte già giocate: l'allievo riparte esattamente da dove eravate, non
 * dall'inizio della mano. È la differenza fra «rigioca questa smazzata» e
 * «tocca a te, cosa fai adesso».
 *
 * LE MANI CI SONO TUTTE E QUATTRO, ma `posizione` dice da quale si guarda: il
 * gioco mostra solo quella. Tenerle tutte serve a calcolare l'esito e a mostrare
 * la soluzione dopo — toglierle vorrebbe dire non poter dire quante prese
 * faceva la carta giusta.
 */

export type Consegna = "dichiara" | "carta" | "piano";

export const ETICHETTE_CONSEGNA: Record<Consegna, string> = {
  dichiara: "Cosa dichiari?",
  carta: "Quale carta giochi?",
  piano: "Come pianifichi il gioco?",
};

export interface EsercizioPosizione {
  id: string;
  autore_id: string | null;
  titolo: string;
  consegna: Consegna;
  domanda: string | null;
  hands: Record<Position, Card[]>;
  dealer: Position;
  vulnerability: Vulnerability;
  bids: string[];
  played: { seat: Position; card: Card }[];
  posizione: Position;
  contract: string | null;
  declarer: Position | null;
  /**
   * Le risposte accettabili. Più d'una perché al bridge quasi sempre lo sono:
   * «3SA o 4♠» sono due scelte difendibili, e segnare errore la seconda
   * insegnerebbe una regola che non esiste.
   */
  risposte: string[];
  soluzione: string | null;
  gruppo: string | null;
  class_id: string | null;
  created_at: string;
}

export type NuovoEsercizio = Omit<EsercizioPosizione, "id" | "autore_id" | "created_at">;

export async function salvaEsercizio(e: NuovoEsercizio): Promise<EsercizioPosizione | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("esercizi_posizione")
    .insert({ ...e, autore_id: user.id })
    .select()
    .single();
  if (error) {
    reportError("esercizi:salva", error);
    return null;
  }
  return data as EsercizioPosizione;
}

export async function elencaMieiEsercizi(): Promise<EsercizioPosizione[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("esercizi_posizione")
    .select("*")
    .eq("autore_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    reportError("esercizi:elenca", error);
    return [];
  }
  return (data ?? []) as EsercizioPosizione[];
}

export async function leggiEsercizi(ids: string[]): Promise<EsercizioPosizione[]> {
  if (ids.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase.from("esercizi_posizione").select("*").in("id", ids);
  if (error) {
    reportError("esercizi:leggi", error);
    return [];
  }
  // Nell'ordine in cui li ha messi l'insegnante, non in quello del database:
  // un esercizio che introduce e uno che verifica non sono intercambiabili.
  const per = new Map((data ?? []).map((r) => [(r as EsercizioPosizione).id, r as EsercizioPosizione]));
  return ids.map((i) => per.get(i)).filter((x): x is EsercizioPosizione => x !== undefined);
}

/**
 * Confronta la risposta dell'allievo con quelle attese.
 *
 * NORMALIZZA PRIMA DI CONFRONTARE, perché la stessa dichiarazione si scrive in
 * cinque modi: `3SA`, `3sa`, `3NT`, `3 SA`, `3nt`. Segnare errore per la
 * notazione sarebbe insegnare l'ortografia invece del bridge. Stessa cosa per i
 * semi, che l'allievo può scrivere col simbolo o con la lettera.
 */
export function normalizzaRisposta(r: string): string {
  return r
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/NT$/, "SA")
    .replace(/♠/g, "S")
    .replace(/♥/g, "H")
    .replace(/♦/g, "D")
    .replace(/♣/g, "C")
    .replace(/PICCHE/g, "S")
    .replace(/CUORI/g, "H")
    .replace(/QUADRI/g, "D")
    .replace(/FIORI/g, "C");
}

export function rispostaGiusta(data: string, attese: readonly string[]): boolean {
  if (attese.length === 0) return true; // Nessuna risposta attesa: è una domanda aperta.
  const n = normalizzaRisposta(data);
  return attese.some((a) => normalizzaRisposta(a) === n);
}

/**
 * Le carte giocate finora, appiattite in ordine.
 *
 * Il motore le tiene in prese (`Trick[]`) più la presa in corso; l'esercizio le
 * vuole in fila, perché una posizione può cadere a metà presa — anzi, quasi
 * sempre cade lì: «tocca a te, cosa giochi» ha senso quando gli altri hanno
 * già messo giù qualcosa.
 */
export function giocateInOrdine(stato: {
  tricks: { plays: { position: Position; card: Card }[] }[];
  currentTrick: { position: Position; card: Card }[];
}): { seat: Position; card: Card }[] {
  const fuori: { seat: Position; card: Card }[] = [];
  for (const t of stato.tricks) for (const p of t.plays) fuori.push({ seat: p.position, card: p.card });
  for (const p of stato.currentTrick) fuori.push({ seat: p.position, card: p.card });
  return fuori;
}
