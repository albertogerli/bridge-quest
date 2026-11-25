import type { DdsTable, TableStrain } from "./dds-table";

/**
 * «Fin dove potete arrivare?» — quale scelta è giusta.
 *
 * PERCHÉ NON «IL LIVELLO PIÙ ALTO»
 * La prima versione premiava il livello più alto che le carte reggono in un
 * seme qualunque. Con 10 prese a cuori e 11 a quadri diceva «5♦/5♣», ma la
 * manche giusta è 4♥: si fanno più punti con una presa in meno. E con 10 prese
 * a senza e nessun fit nobile diceva «4♥/4♠», un contratto che non esiste.
 * Segnalato da un insegnante il 25/11/2026: la tabella delle prese sotto era
 * giusta, il bottone verde no.
 *
 * Ora ogni scelta vale il punteggio del miglior contratto che rappresenta,
 * giocato da Nord-Sud in prima, senza contro; giuste sono le scelte che
 * arrivano al massimo (con 10 punti di tolleranza: 3SA+1 contro 4♥ fatto è
 * lo stesso risultato a squadre, e a un principiante non si insegna il
 * mitchell).
 */

export type SceltaId = "parziale" | "3sa" | "nobile" | "minore" | "slam";

interface Contratto {
  strain: TableStrain;
  level: number;
}

const VALORE_PRESA: Record<TableStrain, number> = {
  club: 20,
  diamond: 20,
  heart: 30,
  spade: 30,
  notrump: 30,
};

/** Punteggio di Nord-Sud in prima, senza contro, con `prese` fatte. */
export function punteggio(strain: TableStrain, level: number, prese: number): number {
  const servono = level + 6;
  if (prese < servono) return -50 * (servono - prese);
  const v = VALORE_PRESA[strain];
  const contratto = v * level + (strain === "notrump" ? 10 : 0);
  const surlevee = v * (prese - servono);
  let premio = contratto >= 100 ? 300 : 50;
  if (level === 6) premio += 500;
  if (level === 7) premio += 1000;
  return contratto + surlevee + premio;
}

const TUTTI: TableStrain[] = ["spade", "heart", "diamond", "club", "notrump"];

function parziali(): Contratto[] {
  const out: Contratto[] = [];
  for (const strain of TUTTI) {
    for (let level = 1; level <= 5; level++) {
      const contratto = VALORE_PRESA[strain] * level + (strain === "notrump" ? 10 : 0);
      if (contratto < 100) out.push({ strain, level });
    }
  }
  return out;
}

/** I contratti che ogni bottone rappresenta. */
const CONTRATTI: Record<SceltaId, Contratto[]> = {
  parziale: parziali(),
  "3sa": [{ strain: "notrump", level: 3 }],
  nobile: [
    { strain: "heart", level: 4 },
    { strain: "spade", level: 4 },
  ],
  minore: [
    { strain: "diamond", level: 5 },
    { strain: "club", level: 5 },
  ],
  slam: TUTTI.flatMap((strain) => [
    { strain, level: 6 },
    { strain, level: 7 },
  ]),
};

export interface Valutazione {
  /** Punteggio del miglior contratto di ogni scelta. */
  valori: Record<SceltaId, number>;
  /** Le scelte giuste (più d'una se equivalenti). */
  giuste: SceltaId[];
  /** Il contratto che vale di più, es. «4H», «3N», «6S». */
  migliore: string;
}

const SIGLA: Record<TableStrain, string> = {
  spade: "S",
  heart: "H",
  diamond: "D",
  club: "C",
  notrump: "N",
};

/** Prese di Nord-Sud in un seme: le gioca chi delle due mani ne fa di più. */
export function preseNs(table: DdsTable, strain: TableStrain): number {
  const t = table.tricks[strain];
  return Math.max(t.north, t.south);
}

export function valutaScelte(table: DdsTable): Valutazione {
  let best = -Infinity;
  let migliore = "";
  const valori = {} as Record<SceltaId, number>;
  for (const id of Object.keys(CONTRATTI) as SceltaId[]) {
    let v = -Infinity;
    for (const c of CONTRATTI[id]) {
      const p = punteggio(c.strain, c.level, preseNs(table, c.strain));
      if (p > v) v = p;
      if (p > best) {
        best = p;
        migliore = `${c.level}${SIGLA[c.strain]}`;
      }
    }
    valori[id] = v;
  }
  const giuste = (Object.keys(valori) as SceltaId[]).filter((id) => valori[id] >= best - 10);
  return { valori, giuste, migliore };
}
