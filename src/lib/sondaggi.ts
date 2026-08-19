import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/report-error";
import type { Card, Suit } from "@/lib/bridge-engine";

/**
 * I sondaggi in aula: «cosa dichiarate?», e si vedono le risposte.
 *
 * PERCHÉ È IL MODO PIÙ SEMPLICE DI FAR PARTECIPARE TUTTI. In una lezione
 * frontale rispondono sempre i due che parlano; gli altri annuiscono e
 * l'insegnante non sa se hanno capito. Una domanda a cui si risponde dal
 * telefono la vedono tutti e rispondono tutti — e la distribuzione delle
 * risposte sbagliate dice quale spiegazione è mancata, che è un'informazione
 * che a voce non si ottiene.
 *
 * LE OPZIONI SE LE COSTRUISCE DA SOLO quando c'è un contesto: sulla
 * dichiarazione propone le dichiarazioni possibili, sul gioco le carte
 * giocabili. Digitarle a mano davanti a una classe che aspetta è la ragione per
 * cui uno strumento del genere non si usa.
 *
 * ANONIMO PER GLI ALLIEVI, NOMINATIVO PER L'INSEGNANTE. Lo stesso principio del
 * confronto sulle mani: sapere che in sei hanno detto 3SA serve a tutti, sapere
 * CHI serve solo a chi deve rispiegare.
 */

export interface Sondaggio {
  id: string;
  class_id: string;
  autore_id: string | null;
  domanda: string;
  opzioni: string[];
  risposta_giusta: string | null;
  smazzata_id: string | null;
  aperto: boolean;
  mostra_risultati: boolean;
  mostra_risposta: boolean;
  riusabile: boolean;
  created_at: string;
}

export interface VoceDistribuzione {
  opzione: string;
  quante: number;
  /** Solo per l'insegnante; agli allievi arriva vuoto. */
  nomi: string[];
}

/** I livelli e le denominazioni, in notazione italiana. */
const DENOMINAZIONI = ["♣", "♦", "♥", "♠", "SA"];

/**
 * Le dichiarazioni possibili dopo una certa asta.
 *
 * Non tutte le 35: solo quelle SUFFICIENTI, cioè più alte dell'ultima detta,
 * più passo e contro. Un sondaggio che propone 1♣ dopo un 3SA non è una
 * domanda, è un errore stampato.
 */
export function dichiarazioniPossibili(bids: readonly string[]): string[] {
  const ultima = [...bids].reverse().find((b) => /^[1-7]/.test(b));
  let livelloMin = 1;
  let indiceMin = 0;
  if (ultima) {
    livelloMin = Number(ultima[0]);
    indiceMin = DENOMINAZIONI.indexOf(ultima.slice(1)) + 1;
    if (indiceMin >= DENOMINAZIONI.length) {
      livelloMin += 1;
      indiceMin = 0;
    }
  }

  const fuori: string[] = ["Passo"];
  if (ultima) fuori.push("Contro");
  for (let l = livelloMin; l <= 7; l++) {
    for (let d = l === livelloMin ? indiceMin : 0; d < DENOMINAZIONI.length; d++) {
      fuori.push(`${l}${DENOMINAZIONI[d]}`);
      // Oltre una dozzina di opzioni il sondaggio non si legge su un telefono:
      // le dichiarazioni interessanti sono comunque le prime, cioè le più
      // vicine a quella detta.
      if (fuori.length >= 14) return fuori;
    }
  }
  return fuori;
}

const SIMBOLO: Record<Suit, string> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
};

/** Le carte giocabili, scritte come le legge un giocatore. */
export function carteComeOpzioni(carte: readonly Card[]): string[] {
  return carte.map((c) => `${SIMBOLO[c.suit]}${c.rank}`);
}

export async function lanciaSondaggio(input: {
  classId: string;
  domanda: string;
  opzioni: string[];
  rispostaGiusta?: string | null;
  smazzataId?: string | null;
  riusabile?: boolean;
}): Promise<Sondaggio | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("sondaggi")
    .insert({
      class_id: input.classId,
      autore_id: user.id,
      domanda: input.domanda.trim().slice(0, 300),
      opzioni: input.opzioni.slice(0, 14),
      risposta_giusta: input.rispostaGiusta ?? null,
      smazzata_id: input.smazzataId ?? null,
      riusabile: input.riusabile ?? false,
    })
    .select()
    .single();
  if (error) {
    reportError("sondaggi:lancia", error);
    return null;
  }
  return data as Sondaggio;
}

export async function sondaggioAperto(classId: string): Promise<Sondaggio | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sondaggi")
    .select("*")
    .eq("class_id", classId)
    .eq("aperto", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    reportError("sondaggi:aperto", error);
    return null;
  }
  return (data as Sondaggio) ?? null;
}

export async function rispondi(sondaggioId: string, risposta: string): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  // `upsert` e non `insert`: cambiare idea prima della chiusura fa parte del
  // ragionare, e un errore di scrittura per «hai già risposto» sembrerebbe un
  // guasto.
  const { error } = await supabase
    .from("risposte_sondaggio")
    .upsert({ sondaggio_id: sondaggioId, user_id: user.id, risposta });
  if (error) reportError("sondaggi:rispondi", error);
  return !error;
}

export async function distribuzione(sondaggioId: string): Promise<VoceDistribuzione[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("distribuzione_sondaggio", { p_id: sondaggioId });
  if (error) {
    reportError("sondaggi:distribuzione", error);
    return [];
  }
  return (data ?? []) as VoceDistribuzione[];
}

export async function aggiornaSondaggio(
  id: string,
  campi: Partial<Pick<Sondaggio, "aperto" | "mostra_risultati" | "mostra_risposta">>,
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("sondaggi").update(campi).eq("id", id);
  if (error) reportError("sondaggi:aggiorna", error);
  return !error;
}

/** I sondaggi salvati per riusarli, propri o della classe. */
export async function sondaggiRiusabili(): Promise<Sondaggio[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("sondaggi")
    .select("*")
    .eq("autore_id", user.id)
    .eq("riusabile", true)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    reportError("sondaggi:riusabili", error);
    return [];
  }
  return (data ?? []) as Sondaggio[];
}
