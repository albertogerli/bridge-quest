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

/**
 * L'esercizio come arriva all'ALLIEVO: senza le risposte, senza la soluzione,
 * e con le sole mani che si vedrebbero al tavolo.
 *
 * È un tipo diverso e non un `Partial` apposta: sono due cose diverse. Un
 * campo opzionale invita a scriverlo «se c'è»; qui non c'è mai, e il compilatore
 * deve dirlo a chi prova a leggerlo.
 */
export interface EsercizioPerAllievo
  extends Omit<EsercizioPosizione, "hands" | "risposte" | "soluzione"> {
  /** Solo la propria, più il morto se il gioco è cominciato e il morto non sei tu. */
  hands: Partial<Record<Position, Card[]>>;
  /** Quante risposte attese ci sono — non quali. Zero vuol dire domanda aperta. */
  quante_risposte: number;
}

/** Il responso, che arriva solo dopo aver risposto. */
export interface EsitoEsercizio {
  giusta: boolean;
  risposte: string[];
  soluzione: string | null;
}

export async function salvaEsercizio(e: NuovoEsercizio): Promise<{ id: string } | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // `risposte_norm` si scrive QUI, con la stessa funzione che normalizzerà
  // quello che l'allievo digita. È il motivo per cui il confronto può stare
  // nel database senza che il database sappia normalizzare: due
  // implementazioni della stessa regola sarebbero due regole, e il giorno che
  // divergono un allievo si vede dare sbagliata una risposta giusta.
  const { data, error } = await supabase
    .from("esercizi_posizione")
    .insert({
      ...e,
      autore_id: user.id,
      risposte_norm: e.risposte.map(normalizzaRisposta),
    })
    // Solo `id`: le altre colonne l'insegnante le ha già in mano, e `hands`,
    // `risposte` e `soluzione` non sono più leggibili dal browser nemmeno a
    // lui — `RETURNING` vuole il privilegio di lettura come ogni select.
    .select("id")
    .single();
  if (error) {
    reportError("esercizi:salva", error);
    return null;
  }
  return data as { id: string };
}

export async function elencaMieiEsercizi(): Promise<EsercizioPosizione[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  // Via RPC e non `select("*")`: le colonne con dentro la soluzione non sono
  // leggibili dal browser, nemmeno da chi le ha scritte, perché il privilegio
  // è per ruolo e l'insegnante è `authenticated` come l'allievo. La funzione
  // filtra per autore e restituisce la riga intera solo a lui.
  const { data, error } = await supabase.rpc("i_miei_esercizi");
  if (error) {
    reportError("esercizi:elenca", error);
    return [];
  }
  return (data ?? []) as EsercizioPosizione[];
}

export async function leggiEsercizi(ids: string[]): Promise<EsercizioPerAllievo[]> {
  if (ids.length === 0) return [];
  const supabase = createClient();
  const esiti = await Promise.all(
    ids.map((id) => supabase.rpc("esercizio_per_allievo", { p_id: id })),
  );
  const primoErrore = esiti.find((e) => e.error)?.error;
  if (primoErrore) {
    reportError("esercizi:leggi", primoErrore);
    return [];
  }
  const data = esiti.map((e) => e.data).filter(Boolean);
  // Nell'ordine in cui li ha messi l'insegnante, non in quello del database:
  // un esercizio che introduce e uno che verifica non sono intercambiabili.
  const per = new Map(data.map((r) => [(r as EsercizioPerAllievo).id, r as EsercizioPerAllievo]));
  return ids.map((i) => per.get(i)).filter((x): x is EsercizioPerAllievo => x !== undefined);
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
 * Il responso, chiesto al database.
 *
 * PERCHÉ NON SI CORREGGE PIÙ NEL BROWSER. Correggere qui voleva dire avere qui
 * le risposte attese, e averle qui vuol dire che stanno nella scheda di rete
 * prima ancora che l'allievo legga la domanda. La correzione va dove stanno le
 * risposte, e le risposte devono stare dove l'allievo non arriva.
 *
 * SI MANDA LA RISPOSTA GIÀ NORMALIZZATA, con la stessa `normalizzaRisposta`
 * che ha normalizzato le attese quando l'insegnante le ha scritte: una regola
 * sola, in un punto solo, invece di una copia in SQL che col tempo diverge.
 *
 * Che si possa sbagliare apposta per farsi dire la soluzione è vero ed è
 * voluto: l'esercizio chiede di impegnarsi, non di rendere impossibile
 * barare. Quello che è cambiato è che adesso impegnarsi è necessario.
 */
export async function verificaEsercizio(
  id: string,
  risposta: string,
): Promise<EsitoEsercizio | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("verifica_esercizio", {
    p_id: id,
    p_risposta_norm: normalizzaRisposta(risposta),
  });
  if (error) {
    reportError("esercizi:verifica", error);
    return null;
  }
  return (data as EsitoEsercizio | null) ?? null;
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
