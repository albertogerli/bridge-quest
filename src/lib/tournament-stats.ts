/**
 * Funzioni pure del torneo settimanale (settimana corrente, selezione mani,
 * punteggi, ripresa di un torneo interrotto).
 *
 * Estratte da `src/app/gioca/torneo/page.tsx` senza cambi di comportamento: la
 * logica è identica riga per riga, qui è solo testabile in isolamento
 * (`src/lib/tournament-stats.test.ts`). Le letture di `localStorage` e l'orologio
 * di sistema restano nel chiamante e vengono passati come argomenti.
 */

import {
  EPOCH_MS,
  EPOCH_START,
  type HandResult,
  type TournamentHistoryEntry,
  type TournamentProgress,
} from "@/app/gioca/torneo/_types";
import { parseContract } from "@/lib/bridge-engine";
import type { Smazzata } from "@/lib/catalog";

// ─── Settimana di torneo ────────────────────────────────────────────────────

/** Numero della settimana di torneo che contiene l'istante `nowMs`. */
export function getWeekNum(nowMs: number): number {
  return Math.floor((nowMs - EPOCH_START) / EPOCH_MS);
}

/** Primo e ultimo istante (incluso) della settimana `weekNum`. */
export function getWeekDates(weekNum: number): { start: Date; end: Date } {
  const startMs = EPOCH_START + weekNum * EPOCH_MS;
  const start = new Date(startMs);
  const end = new Date(startMs + EPOCH_MS - 1);
  return { start, end };
}

/** Data in forma breve italiana ("5 Ago"). */
export function formatDateShort(d: Date): string {
  const day = d.getDate();
  const months = [
    "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
    "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
  ];
  return `${day} ${months[d.getMonth()]}`;
}

/** Tempo mancante alla fine della settimana ("2g 3h 4m", "01:02:03", "Scaduto"). */
export function formatCountdown(diffMs: number): string {
  if (diffMs <= 0) {
    return "Scaduto";
  }
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) {
    return `${days}g ${hours}h ${minutes}m`;
  }
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// ─── Selezione delle mani ───────────────────────────────────────────────────

/**
 * Deterministic selection of tournament hands using the week number as seed.
 * Same week = same 5 hands for all users.
 */
export function getTournamentHands(
  pool: Smazzata[],
  weekNum: number,
  count: number,
): Smazzata[] {
  if (pool.length === 0) return [];
  const selected: number[] = [];
  const used = new Set<number>();
  let seed = weekNum * 2654435761; // large prime for spreading

  for (let i = 0; i < count && i < pool.length; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    let idx = seed % pool.length;
    // Avoid duplicates
    let attempts = 0;
    while (used.has(idx) && attempts < pool.length) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      idx = seed % pool.length;
      attempts++;
    }
    used.add(idx);
    selected.push(idx);
  }

  return selected.map((i) => pool[i]);
}

/** Prese necessarie per mantenere tutti i contratti dell'elenco. */
export function sumTricksNeeded(hands: { contract: string }[]): number {
  return hands.reduce((sum, h) => sum + parseContract(h.contract).tricksNeeded, 0);
}

// ─── Punteggi ───────────────────────────────────────────────────────────────

/** Stelle assegnate in base al bilancio prese fatte − necessarie. */
export function calcStars(totalResult: number): number {
  if (totalResult >= 3) return 3;
  if (totalResult >= 0) return 2;
  return 1;
}

/** Prese fatte e necessarie di un torneo (anche parziale). */
export function computeHandTotals(handResults: HandResult[]): {
  totalTricks: number;
  totalNeeded: number;
} {
  return {
    totalTricks: handResults.reduce((s, r) => s + r.tricksMade, 0),
    totalNeeded: handResults.reduce((s, r) => s + r.tricksNeeded, 0),
  };
}

/**
 * XP del torneo: 30 base per mano + 20 se il contratto è mantenuto + 10 per
 * ogni surlevée + 150 di bonus torneo (solo alla prima volta della settimana).
 */
export function computeTournamentXp(
  handResults: HandResult[],
  alreadyPlayed: boolean,
): { handXp: number; tournamentBonus: number; xpEarned: number } {
  // Calculate XP: 30 base per hand + 20 if made + 10 per overtrick + 150 tournament bonus
  const handXp = handResults.reduce((sum, r) => {
    return sum + 30 + (r.result >= 0 ? 20 : 0) + Math.max(0, r.result) * 10;
  }, 0);
  const tournamentBonus = alreadyPlayed ? 0 : 150;
  return { handXp, tournamentBonus, xpEarned: handXp + tournamentBonus };
}

// ─── Ripresa di un torneo interrotto ────────────────────────────────────────

/**
 * Decisione sul progresso salvato: nessun progresso da usare, progresso da
 * azzerare (mani cambiate o torneo di fatto già concluso) o mani da ripristinare.
 */
export type ProgressRestoreDecision =
  | { action: "none" }
  | { action: "clear" }
  | { action: "restore"; handResults: HandResult[] };

/**
 * Il progresso salvato è utilizzabile con le mani correnti?
 *
 * `alreadyPlayed` = torneo della settimana già concluso: il rigioco è "senza
 * punti" e non lascia traccia, quindi non riprende (e non salva) nessun
 * progresso — altrimenti al rientro ripartirebbe da metà senza che la CTA lo
 * dica.
 */
export function decideProgressRestore(
  saved: TournamentProgress | null,
  hands: { id: string }[],
  alreadyPlayed = false,
): ProgressRestoreDecision {
  if (alreadyPlayed) return { action: "none" };
  if (!saved || hands.length === 0) return { action: "none" };
  const sameHands = saved.handIds.join(",") === hands.map((h) => h.id).join(",");
  if (!sameHands || saved.handResults.length >= hands.length) {
    return { action: "clear" };
  }
  return { action: "restore", handResults: saved.handResults };
}

/**
 * Mani davvero riprendibili di un torneo interrotto.
 *
 * Stessa decisione che applica la play view: contare le mani salvate senza
 * validarle faceva annunciare alla CTA una ripresa ("mano 3/5") che poi
 * ripartiva da capo, perché il progresso veniva scartato all'avvio.
 */
export function restorableHandCount(
  saved: TournamentProgress | null,
  hands: { id: string }[],
  alreadyPlayed = false,
): number {
  const decision = decideProgressRestore(saved, hands, alreadyPlayed);
  return decision.action === "restore" ? decision.handResults.length : 0;
}

/**
 * Esito di una mano specifica, accoppiato per `smazzataId`.
 *
 * Accoppiare per indice fa slittare gli esiti mostrati se il set di mani della
 * settimana cambia dopo che il torneo è stato giocato.
 */
export function handResultFor(
  handResults: HandResult[] | undefined,
  smazzataId: string,
): HandResult | undefined {
  return handResults?.find((r) => r.smazzataId === smazzataId);
}

/** Etichetta della CTA principale: avvio o ripresa alla mano successiva. */
export function tournamentCtaLabel(
  inProgressCount: number,
  handCount: number,
): string {
  return inProgressCount > 0
    ? `Riprendi il Torneo (mano ${inProgressCount + 1}/${handCount})`
    : "Gioca il Torneo";
}

/**
 * Unisce lo storico locale con quello del server, una riga per settimana.
 *
 * Le due sorgenti dicono cose diverse e non sostituibili: il localStorage
 * copre chi ha giocato prima che il salvataggio remoto esistesse o da un altro
 * dispositivo scollegato; il server è l'unico a sapere quanti hanno giocato
 * quella settimana, e quindi l'unico a poter dire «5º su 49».
 *
 * Per il punteggio vince il SERVER: è la riga che ha prodotto la classifica in
 * cui l'utente si vede, e mostrare accanto un numero diverso letto dal
 * dispositivo farebbe sembrare sbagliata la classifica.
 * La posizione, quando il server non ce l'ha, resta nulla: «1º su 1» calcolato
 * su una sola riga locale sarebbe una bugia gentile, che è comunque una bugia.
 */
export function mergeHistory(
  locali: readonly TournamentHistoryEntry[],
  remoti: readonly TournamentHistoryEntry[],
): TournamentHistoryEntry[] {
  const perSettimana = new Map<number, TournamentHistoryEntry>();
  for (const e of locali) perSettimana.set(e.weekNum, e);
  for (const e of remoti) {
    const locale = perSettimana.get(e.weekNum);
    perSettimana.set(e.weekNum, {
      ...e,
      // L'unico dato che il server non ha mai: quando è stato concluso, se la
      // riga remota fosse stata scritta senza data.
      completedAt: e.completedAt ?? locale?.completedAt ?? null,
    });
  }
  return [...perSettimana.values()].sort((a, b) => b.weekNum - a.weekNum);
}
