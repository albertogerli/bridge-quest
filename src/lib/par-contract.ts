/**
 * Lettura del contratto par restituito dal double dummy solver.
 *
 * PERCHÉ SERVE
 * Il generatore assegnava a ogni mano «il contratto più alto mantenibile».
 * È un criterio sbagliato: su una mano il cui par è 4♠ proporrebbe 5♠, perché
 * a carte scoperte undici prese ci sono. Nessuno dichiarerebbe mai quel 5♠, e
 * un compito costruito così insegna ad allungare i contratti.
 *
 * Il par è la risposta corretta alla domanda «in cosa va giocata questa mano»:
 * tiene conto del punteggio, della vulnerabilità e del fatto che a volte la
 * cosa giusta è lasciar dichiarare gli avversari o sacrificarsi.
 *
 * FORMATO
 * La libreria restituisce stringhe come `4S-NS+1`, `3N-E`, `3C*-EW-1`:
 *   livello, seme (S H D C N), `*` se contrato, poi la linea o il posto,
 *   infine lo scarto rispetto al contratto.
 */

import type { Card, Position } from "./bridge-engine";
import { fitFor, FIT_MINIMO, type TableStrain } from "./dds-table";

const STRAIN_SYMBOL: Record<string, string> = {
  S: "♠",
  H: "♥",
  D: "♦",
  C: "♣",
  N: "SA",
};

const STRAIN_KEY: Record<string, TableStrain> = {
  S: "spade",
  H: "heart",
  D: "diamond",
  C: "club",
  N: "notrump",
};

const SEAT: Record<string, Position> = {
  N: "north",
  E: "east",
  S: "south",
  W: "west",
};

export interface ParContract {
  /** 1-7. */
  level: number;
  /** Contratto pronto da mostrare, es. `4♠` o `3SA`. */
  contract: string;
  /** Seme d'atout, per leggere la tabella delle prese. */
  strain: TableStrain;
  /** Linea che dichiara. */
  side: "ns" | "ew";
  /** Posto preciso, se il par lo indica; altrimenti `null` e lo sceglie il chiamante. */
  declarer: Position | null;
  /** Vero se il par prevede il contro. */
  doubled: boolean;
  /** Prese sopra (+) o sotto (−) il contratto; 0 se esatto. */
  result: number;
}

/**
 * Interpreta una stringa di par. Restituisce `null` se non è riconoscibile:
 * meglio nessuna proposta che una proposta inventata.
 */
export function parseParContract(raw: string): ParContract | null {
  const m = raw
    .trim()
    .toUpperCase()
    .match(/^([1-7])([SHDCN])(\*+)?-(NS|EW|[NESW])([+-]\d+)?$/);
  if (!m) return null;

  const [, livello, seme, contro, chi, scarto] = m;

  // `NS`/`EW` indicano la linea senza precisare il posto; una lettera sola è
  // un posto, e la linea si deduce.
  const isSide = chi === "NS" || chi === "EW";
  const side: "ns" | "ew" = isSide
    ? (chi.toLowerCase() as "ns" | "ew")
    : chi === "N" || chi === "S"
      ? "ns"
      : "ew";

  return {
    level: Number(livello),
    contract: `${livello}${STRAIN_SYMBOL[seme]}`,
    strain: STRAIN_KEY[seme],
    side,
    declarer: isSide ? null : SEAT[chi],
    doubled: Boolean(contro),
    result: scarto ? Number(scarto) : 0,
  };
}

/**
 * Contratto par da assegnare, con un dichiarante concreto.
 *
 * Quando il par indica solo la linea, si sceglie il posto che realizza più
 * prese secondo la tabella: a double dummy i due compagni ottengono lo stesso
 * risultato, quindi la scelta è indifferente al risultato e si fissa solo per
 * avere un valore.
 */
export function parAssignment(
  par: ParContract,
  tricksBySeat: Record<Position, number>
): { contract: string; declarer: Position } {
  if (par.declarer) return { contract: par.contract, declarer: par.declarer };
  const seats: Position[] = par.side === "ns" ? ["north", "south"] : ["east", "west"];
  const declarer = tricksBySeat[seats[0]] >= tricksBySeat[seats[1]] ? seats[0] : seats[1];
  return { contract: par.contract, declarer };
}

/**
 * Contratto da assegnare a una mano, partendo dai par restituiti dal solver.
 *
 * `contracts` può contenerne più d'uno quando sono equivalenti a punteggio
 * (es. `1♣` e `1SA`, entrambi 90). A quel punto il punteggio non distingue, ma
 * la classe sì: fra due par che valgono uguale si preferisce quello con un fit
 * dichiarabile, perché un contratto a colore su sei carte in due nessuno lo
 * dichiara e assegnarlo insegnerebbe il contrario. Serve passare `hands`; senza
 * si prende il primo leggibile.
 *
 * Restituisce `null` se nessuno è interpretabile: in quel caso la mano ricade
 * sul contratto di riserva scelto dall'insegnante.
 */
export function parAssignmentFromContracts(
  contracts: readonly string[],
  table: { tricks: Record<TableStrain, Record<Position, number>> },
  hands?: Record<Position, Card[]>
): { contract: string; declarer: Position; par: ParContract } | null {
  const letti = contracts
    .map(parseParContract)
    .filter((p): p is ParContract => p !== null);
  if (letti.length === 0) return null;

  const dichiarabile = (p: ParContract) => {
    if (!hands) return true;
    const fit = fitFor(hands, p.side, p.strain);
    return fit === null || fit >= FIT_MINIMO;
  };

  const par = letti.find(dichiarabile) ?? letti[0];
  const { contract, declarer } = parAssignment(par, table.tricks[par.strain]);
  return { contract, declarer, par };
}

/**
 * Descrizione del par in italiano, per l'insegnante.
 * Il par può essere un contratto degli AVVERSARI o un sacrificio in perdita:
 * dirlo esplicitamente evita che sembri un errore del programma.
 */
export function describePar(par: ParContract, score: number): string {
  const linea = par.side === "ns" ? "Nord-Sud" : "Est-Ovest";
  const esito =
    par.result > 0
      ? `con ${par.result} presa${par.result > 1 ? "" : ""} in più`
      : par.result < 0
        ? `sotto di ${Math.abs(par.result)}`
        : "esatto";
  const contro = par.doubled ? " contrato" : "";
  const punti = score > 0 ? `+${score}` : `${score}`;
  return `${par.contract}${contro} di ${linea}, ${esito} (${punti} per Nord-Sud)`;
}
