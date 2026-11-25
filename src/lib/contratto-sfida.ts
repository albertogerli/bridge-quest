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
import { punteggio } from "./quale-contratto";

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

/** Il livello della manche in ogni denominazione. */
const LIVELLO_MANCHE: Record<TableStrain, number> = {
  notrump: 3,
  spade: 4,
  heart: 4,
  diamond: 5,
  club: 5,
};

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
 * Vince la denominazione che rende di più (in prima, senza contro), a
 * parità quella che viene prima in `DENOMINAZIONI`.
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
  let migliore: { sigla: string; prese: number; declarer: Position; punti: number; livello: number } | null = null;

  for (const d of DENOMINAZIONI) {
    const nord = table.tricks[d.chiave].north;
    const sud = table.tricks[d.chiave].south;
    const declarer: Position = sud >= nord ? "south" : "north";
    const prese = Math.max(nord, sud);
    // Si confronta il PUNTEGGIO, non le prese: 10 prese a fiori (4♣, 130)
    // valgono meno di 9 a senza (3SA, 400), e 11 a quadri (5♦, 400) meno di
    // 10 a cuori (4♥, 420). Fino al 26/11/2026 vinceva la denominazione con
    // più prese, lo stesso errore corretto in `quale-contratto.ts`.
    // Il livello: quello che le prese consentono, ma fra manche e slam si
    // ferma al più basso che rende lo stesso: con 11 prese a senza si gioca
    // 3SA (460), non 5SA (460) — nessuno al tavolo dichiara 5SA per questo.
    const massimo = Math.min(7, Math.max(1, prese - 6));
    const daQui = Math.min(massimo, LIVELLO_MANCHE[d.chiave]);
    let livello = massimo;
    let punti = punteggio(d.chiave, massimo, prese);
    for (let l = daQui; l < massimo; l++) {
      const p = punteggio(d.chiave, l, prese);
      if (p >= punti) {
        livello = l;
        punti = p;
        break;
      }
    }
    if (!migliore || punti > migliore.punti) {
      migliore = { sigla: d.sigla, prese, declarer, punti, livello };
    }
  }

  const scelta = migliore!;
  const livello = scelta.livello;
  return {
    contract: `${livello}${scelta.sigla}`,
    declarer: scelta.declarer,
    prese: scelta.prese,
  };
}
