/**
 * Le mani della scorta condivisa, e il confronto col campo.
 *
 * PERCHÉ NON SI GENERA PIÙ NEL BROWSER
 * Una mano generata al volo è tua e basta: nessuno l'ha mai vista, quindi non
 * esiste nessun «il 63% ha dichiarato manche» da metterci accanto. Le mani
 * della scorta invece le fanno tutti, e il confronto col campo — che è la cosa
 * che fa capire un voto molto più di tre stelline — diventa possibile.
 *
 * In più il conto costoso (par, tabella double dummy, valore atteso) è già
 * stato pagato in fase di generazione: qui si legge e basta.
 *
 * Le regole di accesso stanno nel database
 * (`scripts/sql/scenari-e-mani-2026-08.sql`): qui non si decide niente.
 */

import { createClient } from "@/lib/supabase/client";
import type { Card, Position } from "./bridge-engine";
import type { Strain } from "./minibridge";
import type { Vulnerability } from "./catalog";
import { reportError } from "./report-error";

export interface ContrattoAttesoDb {
  level: number;
  strain: Strain;
  declarer: Position;
  ev: number;
  mantenuto: number;
}

export interface ManoCondivisa {
  id: string;
  hands: Record<Position, Card[]>;
  dealer: Position;
  vulnerability: Vulnerability;
  par_contracts: string[] | null;
  par_score: number | null;
  dd_table: Record<string, Record<Position, number>> | null;
  valore_atteso: { ns: ContrattoAttesoDb; ew: ContrattoAttesoDb; prove: number } | null;
  scenario: { id: string; nome: string; descrizione: string | null; slug: string | null } | null;
}

export interface ConfrontoCampo {
  totale: number;
  mio: { contratto: string | null; punteggio: number; stelle: number } | null;
  /** Percentuale di chi ha fatto peggio. Null se sei il primo. */
  percentile: number | null;
  contratti: {
    contratto: string;
    quanti: number;
    punteggioMedio: number;
    stelleMedie: number;
  }[];
}

/**
 * Una mano che non hai ancora dichiarato, dallo scenario chiesto o da tutti.
 *
 * Torna `null` anche quando la scorta è finita, non solo in caso di errore: chi
 * chiama deve distinguere «non c'è più niente da fare» da «è andato storto
 * qualcosa», e per questo il caso di errore passa da `reportError`.
 */
export async function manoDaFare(slug?: string): Promise<ManoCondivisa | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("mano_da_fare", { p_slug: slug ?? null });
    if (error) {
      reportError("mani-condivise:pesca", error);
      return null;
    }
    return (data as ManoCondivisa | null) ?? null;
  } catch (err) {
    reportError("mani-condivise:pesca", err);
    return null;
  }
}

/**
 * Registra come è andata. Una mano si dichiara una volta sola: il secondo
 * tentativo viene rifiutato dal database, e va bene così — è la condizione che
 * tiene onesto il confronto col campo.
 */
export async function registraRisultato(r: {
  manoId: string;
  contratto: string | null;
  dichiarante: string | null;
  punteggio: number;
  stelle: number;
  partnerId?: string | null;
}): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: sessione } = await supabase.auth.getUser();
    const uid = sessione.user?.id;
    if (!uid) return false;
    const { error } = await supabase.from("risultati_mano").insert({
      mano_id: r.manoId,
      user_id: uid,
      partner_id: r.partnerId ?? null,
      contratto: r.contratto,
      dichiarante: r.dichiarante,
      punteggio: r.punteggio,
      stelle: r.stelle,
    });
    if (error) {
      reportError("mani-condivise:registra", error);
      return false;
    }
    return true;
  } catch (err) {
    reportError("mani-condivise:registra", err);
    return false;
  }
}

/**
 * Con chi ci si confronta.
 *
 * `tutti` è il campo; `amici` sono le persone che hai accettato — ed è l'unico
 * filtro in cui escono i nomi, perché l'amicizia è già un consenso reciproco;
 * `classe` sono i compagni di corso, `asd` i soci del tuo circolo.
 */
export type FiltroCampo = "tutti" | "amici" | "classe" | "asd";

export interface PersonaConfronto {
  nome: string | null;
  contratto: string;
  punteggio: number;
  stelle: number;
}

/**
 * Come è andata a un gruppo di persone sulla stessa mano.
 *
 * Il paragone col campo intero mette insieme chi gioca da vent'anni e chi ha
 * cominciato a marzo: per un allievo il numero che significa qualcosa è
 * rispetto ai suoi compagni di classe.
 */
export async function confrontoFiltrato(
  manoId: string,
  filtro: FiltroCampo
): Promise<(ConfrontoCampo & { persone: PersonaConfronto[] | null }) | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("confronto_campo_filtrato", {
      p_mano_id: manoId,
      p_filtro: filtro,
    });
    if (error) {
      reportError("mani-condivise:confronto-filtrato", error);
      return null;
    }
    return (data as (ConfrontoCampo & { persone: PersonaConfronto[] | null }) | null) ?? null;
  } catch (err) {
    reportError("mani-condivise:confronto-filtrato", err);
    return null;
  }
}

/** Come è andata agli altri sulla stessa mano. Mai nomi: solo numeri. */
export async function confrontoCampo(manoId: string): Promise<ConfrontoCampo | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("confronto_campo", { p_mano_id: manoId });
    if (error) {
      reportError("mani-condivise:confronto", error);
      return null;
    }
    return (data as ConfrontoCampo | null) ?? null;
  } catch (err) {
    reportError("mani-condivise:confronto", err);
    return null;
  }
}

/**
 * Il riferimento con cui si danno le stelle, dal punto di vista di `lato`.
 *
 * QUANDO LA MANO NON È TUA. Il valore atteso dice qual era il contratto
 * migliore per ciascuna delle due linee, ma su una smazzata sola a giocare è
 * una linea sola. Se gli avversari hanno di più, il meglio che potevi fare non
 * è il tuo miglior contratto — è lasciarli giocare il loro: il riferimento
 * diventa il loro valore atteso col segno cambiato. Altrimenti si darebbero
 * zero stelle a chi ha passato correttamente su una mano che non era sua.
 *
 * COSA QUESTA APPROSSIMAZIONE NON VEDE: il sacrificio. Il par vero tiene conto
 * anche di 5♥ contrato che perde meno di quanto avrebbero fatto loro; qui no,
 * e chi sacrifica bene prende meno stelle di quante ne meriti. È una
 * situazione rara e il rimedio costerebbe una ricerca di equilibrio: quando
 * varrà la pena si farà, e intanto è meglio saperlo che ignorarlo.
 *
 * Se la mano non porta il valore atteso — mani vecchie, o generate col conto
 * secco — si ripiega sul par, dicendolo, perché il commento cambia.
 */
export function riferimento(
  mano: ManoCondivisa,
  lato: "ns" | "ew"
): { punteggio: number; metro: "atteso" | "esatto" } {
  const va = mano.valore_atteso;
  if (va) {
    const nostro = va[lato].ev;
    const loro = va[lato === "ns" ? "ew" : "ns"].ev;
    return { punteggio: nostro >= loro ? nostro : -loro, metro: "atteso" };
  }
  // Il par è già dal punto di vista di Nord-Sud.
  const par = mano.par_score ?? 0;
  return { punteggio: lato === "ns" ? par : -par, metro: "esatto" };
}

/**
 * Pubblica uno scenario e le sue mani nella scorta condivisa.
 *
 * Serve agli insegnanti: le mani generate per una lezione diventano un
 * esercizio che tutta la classe incontra, e su cui ci si può confrontare. Una
 * mano che vede una persona sola non ha percentuale di campo.
 *
 * SENZA VALORE ATTESO. Il calcolo costa una quarantina di risoluzioni double
 * dummy a mano: mezzo minuto per mano in un browser, cioè dieci minuti per
 * venti mani con la pagina bloccata. Qui si salvano par e tabella double
 * dummy, che sono già stati calcolati per l'anteprima; le stelle useranno il
 * par, come prima delle mani condivise. `scripts/genera-scorta.ts` può
 * completarle dopo, senza fretta e senza far aspettare nessuno.
 *
 * Chi non insegna non passa: il controllo è nelle policy, non qui.
 */
export async function pubblicaScenario(
  scenario: { nome: string; descrizione?: string; vincoli: unknown; pubblico?: boolean },
  mani: {
    hands: Record<Position, Card[]>;
    dealer: Position;
    vulnerability: Vulnerability;
    parScore: number;
    parContracts: string[];
    ddTable: Record<string, Record<Position, number>>;
  }[]
): Promise<{ id: string; quante: number } | { errore: string }> {
  try {
    const supabase = createClient();
    const { data: sessione } = await supabase.auth.getUser();
    const uid = sessione.user?.id;
    if (!uid) return { errore: "Serve l'accesso." };

    const { data: sc, error: eSc } = await supabase
      .from("scenari")
      .insert({
        nome: scenario.nome,
        descrizione: scenario.descrizione ?? null,
        vincoli: scenario.vincoli,
        autore_id: uid,
        pubblico: scenario.pubblico ?? true,
      })
      .select("id")
      .single();
    if (eSc || !sc) {
      reportError("mani-condivise:pubblica-scenario", eSc);
      return { errore: "Solo chi insegna può pubblicare uno scenario." };
    }

    const { error: eM } = await supabase.from("mani_generate").insert(
      mani.map((m) => ({
        scenario_id: sc.id,
        hands: m.hands,
        dealer: m.dealer,
        vulnerability: m.vulnerability,
        par_contracts: m.parContracts,
        par_score: m.parScore,
        dd_table: m.ddTable,
      }))
    );
    if (eM) {
      // Uno scenario senza mani è peggio di nessuno scenario: si ritira.
      await supabase.from("scenari").delete().eq("id", sc.id);
      reportError("mani-condivise:pubblica-mani", eM);
      return { errore: "Le mani non sono state salvate: scenario annullato." };
    }

    return { id: sc.id, quante: mani.length };
  } catch (err) {
    reportError("mani-condivise:pubblica", err);
    return { errore: "Non è stato possibile pubblicare." };
  }
}
