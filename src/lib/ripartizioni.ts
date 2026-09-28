import type { Card, Position, Suit } from "@/lib/bridge-engine";

/**
 * Come si dividono fra i due avversari le carte che mancano in un seme.
 *
 * È il calcolo dei «posti vacanti»: le carte che non vediamo stanno in due
 * mani, e ciascuna ha un certo numero di posti ancora liberi. La probabilità
 * che Ovest abbia esattamente `k` delle `n` carte mancanti è
 *
 *     C(n, k) · C(U − n, postiOvest − k) / C(U, postiOvest)
 *
 * dove U è il totale dei posti liberi. A inizio mano i posti sono 13 e 13 e
 * ne escono le percentuali che si imparano a memoria (4 carte: 2-2 40,7%,
 * 3-1 49,7%, 4-0 9,6%). A metà mano i posti cambiano, e con loro le
 * percentuali: è esattamente la cosa che a lezione si vuole far VEDERE, invece
 * di recitarla.
 *
 * Idea presa dal tavolo di insegnamento di BridgeChamp (settembre 2026).
 */

export interface Ripartizione {
  /** Carte del seme nella prima mano avversaria (in senso orario dal dichiarante: la sua sinistra). */
  a: number;
  /** Carte del seme nella seconda mano avversaria. */
  b: number;
  probabilita: number;
}

function binomiale(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

/**
 * Tutte le divisioni possibili di `mancanti` carte, con i posti liberi dati.
 *
 * `vuotoA` / `vuotoB`: quella mano ha già mostrato di non averne (non ha
 * risposto al colore). Allora le carte sono tutte nell'altra, senza calcoli.
 */
export function ripartizioni(
  mancanti: number,
  postiA: number,
  postiB: number,
  vuoto: { a?: boolean; b?: boolean } = {},
): Ripartizione[] {
  if (mancanti <= 0) return [];
  if (vuoto.a && !vuoto.b) return [{ a: 0, b: mancanti, probabilita: 1 }];
  if (vuoto.b && !vuoto.a) return [{ a: mancanti, b: 0, probabilita: 1 }];
  const totale = postiA + postiB;
  const casi = binomiale(totale, postiA);
  const esito: Ripartizione[] = [];
  for (let k = 0; k <= mancanti; k++) {
    const p = (binomiale(mancanti, k) * binomiale(totale - mancanti, postiA - k)) / casi;
    if (p > 0) esito.push({ a: k, b: mancanti - k, probabilita: p });
  }
  return esito;
}

export interface RigaRaggruppata {
  /** «3-1»: il numero più alto prima, come nelle tabelle dei libri. */
  etichetta: string;
  probabilita: number;
  /** Le due metà, quando la divisione non è pari: chi ha il pezzo lungo. */
  lunghiA: number;
  lunghiB: number;
}

/**
 * Le divisioni come le scrivono i libri: 3-1 insieme a 1-3.
 * Il dettaglio per mano resta, perché con i posti vacanti le due metà
 * smettono di essere uguali — ed è proprio lì che si impara qualcosa.
 */
export function raggruppa(lista: Ripartizione[]): RigaRaggruppata[] {
  const perEtichetta = new Map<string, RigaRaggruppata>();
  for (const r of lista) {
    const alto = Math.max(r.a, r.b);
    const basso = Math.min(r.a, r.b);
    const etichetta = `${alto}-${basso}`;
    const riga = perEtichetta.get(etichetta) ?? { etichetta, probabilita: 0, lunghiA: 0, lunghiB: 0 };
    riga.probabilita += r.probabilita;
    if (r.a > r.b) riga.lunghiA += r.probabilita;
    else if (r.b > r.a) riga.lunghiB += r.probabilita;
    perEtichetta.set(etichetta, riga);
  }
  return [...perEtichetta.values()].sort((x, y) => {
    const [xa] = x.etichetta.split("-").map(Number);
    const [ya] = y.etichetta.split("-").map(Number);
    return xa - ya;
  });
}

const SEGUENTE: Record<Position, Position> = { north: "east", east: "south", south: "west", west: "north" };

/** I due avversari del dichiarante: prima quello alla sua sinistra. */
export function avversari(dichiarante: Position): [Position, Position] {
  const sinistra = SEGUENTE[dichiarante];
  return [sinistra, SEGUENTE[SEGUENTE[sinistra]]];
}

/**
 * I semi in cui ciascuno ha già mostrato di essere vuoto: ha giocato un altro
 * seme su una presa aperta in quel seme.
 */
export function vuotiMostrati(
  prese: { plays: { position: Position; card: Card }[] }[],
): Record<Position, Set<Suit>> {
  const vuoti: Record<Position, Set<Suit>> = {
    north: new Set(), east: new Set(), south: new Set(), west: new Set(),
  };
  for (const presa of prese) {
    const attacco = presa.plays[0]?.card.suit;
    if (!attacco) continue;
    for (const g of presa.plays.slice(1)) {
      if (g.card.suit !== attacco) vuoti[g.position].add(attacco);
    }
  }
  return vuoti;
}
