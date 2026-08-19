/**
 * Il contratto di una mano da giocare, scelto dalle CARTE.
 *
 * IL DIFETTO CHE QUESTO MODULO ESISTE PER CHIUDERE. La sfida IMP prendeva il
 * contratto da un elenco fisso, indicizzato con il primo carattere del seme
 * casuale: `contracts[seed.charCodeAt(0) % contracts.length]`. Le carte non
 * entravano nel conto. Il 19/08/2026 è uscito un 4♠ giocato da Sud con
 * 8 6 5 3 di picche e un fante come unico onore — una linea da quattordici
 * punti mandata a fare dieci prese. «Sono tutte così», ed era vero: su
 * diciassette contratti possibili, la probabilità che quello sorteggiato
 * c'entri qualcosa con la mano è quella che è.
 *
 * COSA SCEGLIE, e perché non il par. Il par è la risposta giusta alla domanda
 * «in cosa va giocata questa smazzata», e infatti lo usa il generatore delle
 * mani didattiche (vedi `par-contract.ts`). Ma qui la domanda è un'altra: chi
 * gioca la sfida siede in Nord-Sud e deve DICHIARARE. Se il par dice che la
 * mano è degli avversari, un par fedele produrrebbe una sfida in cui non c'è
 * niente da giocare. Si prende quindi il miglior contratto della linea che
 * gioca, che è sempre giocabile e sempre lo stesso per entrambi gli sfidanti.
 *
 * NON SI ALLUNGA IL CONTRATTO. Il livello è esattamente quello che le prese
 * consentono: dieci prese fanno 4♠, non 5♠. Il difetto opposto — «il contratto
 * più alto mantenibile» — è documentato in `par-contract.ts` e insegna a
 * strapagare le mani.
 */

import type { Position } from "./bridge-engine";
import type { DdsTable, TableStrain } from "./dds-table";

/** Le denominazioni nell'ordine in cui si preferiscono a parità di prese. */
const DENOMINAZIONI: { chiave: TableStrain; sigla: string }[] = [
  // A parità di prese si preferisce il senza atout, poi le nobili, poi le
  // minori: è l'ordine che segue chi dichiara davvero, perché a parità di
  // prese rende di più e si gioca a un livello più basso.
  { chiave: "notrump", sigla: "NT" },
  { chiave: "spade", sigla: "S" },
  { chiave: "heart", sigla: "H" },
  { chiave: "diamond", sigla: "D" },
  { chiave: "club", sigla: "C" },
];

export interface ContrattoSfida {
  /** Come `4S`, `3NT`: il formato che usa il motore di gioco. */
  contract: string;
  declarer: Position;
  /** Prese che il dichiarante fa a carte scoperte: serve per spiegare l'esito. */
  prese: number;
}

/**
 * Il contratto che la linea Nord-Sud può davvero giocare su questa mano.
 *
 * Il dichiarante è quello dei due compagni che fa più prese in quella
 * denominazione: l'attacco arriva dalla sua sinistra, e una carta in meno da
 * girare può valere due prese.
 *
 * Se nemmeno il migliore arriva a sette prese la mano non è di Nord-Sud. In
 * quel caso si dichiara comunque al livello uno — è l'unico contratto onesto,
 * e chi gioca vedrà che cade: meglio una mano difficile che una impossibile,
 * e comunque entrambi gli sfidanti hanno davanti la stessa.
 */
export function contrattoDallaMano(table: DdsTable): ContrattoSfida {
  let migliore: { sigla: string; prese: number; declarer: Position } | null = null;

  for (const d of DENOMINAZIONI) {
    const nord = table.tricks[d.chiave].north;
    const sud = table.tricks[d.chiave].south;
    const declarer: Position = sud >= nord ? "south" : "north";
    const prese = Math.max(nord, sud);
    if (!migliore || prese > migliore.prese) {
      migliore = { sigla: d.sigla, prese, declarer };
    }
  }

  const scelta = migliore!;
  const livello = Math.min(7, Math.max(1, scelta.prese - 6));
  return {
    contract: `${livello}${scelta.sigla}`,
    declarer: scelta.declarer,
    prese: scelta.prese,
  };
}
