/**
 * Cosa valeva ogni contratto su questa smazzata.
 *
 * PERCHÉ SERVE A FINE MANO
 * «Una stella, 482 punti sotto il contratto migliore» dice che hai sbagliato,
 * non che cosa dovevi fare. La domanda che uno si fa davvero è «e allora dove
 * si doveva arrivare?»: la risposta è l'elenco delle denominazioni con quante
 * prese reggono, quanto valgono e quante stelle avrebbero preso. Lì si vede in
 * un colpo che 4♥ erano tre stelle e 5♥ una, che è la lezione della mano.
 *
 * UN CONTRATTO PER DENOMINAZIONE, al livello che le prese consentono. Elencare
 * tutti e trentacinque i contratti sarebbe un muro di numeri in cui la cosa da
 * imparare si perde; e i livelli sotto quello massimo valgono sempre meno,
 * quindi non aggiungono niente.
 *
 * SI GUARDA LA PROPRIA LINEA. Per i contratti PROPOSTI le prese sono quelle
 * del dichiarante migliore fra i due compagni: a carte scoperte la differenza
 * fra Nord e Sud dipende solo da chi attacca, e per «dove si doveva arrivare»
 * conta il contratto, non da che parte del tavolo si siede.
 * Per il contratto che avete DICHIARATO, invece, il dichiarante è quello vero:
 * il numero accanto al vostro contratto dev'essere il vostro, e non un altro
 * punteggio diverso da quello del voto qui sopra.
 *
 * QUANDO LA MANO È DEGLI AVVERSARI l'elenco resta quello della tua linea, ma
 * il riferimento delle stelle è già negativo (vedi `riferimento` in
 * mani-condivise): un parziale tuo che li tiene fuori può valere più stelle
 * della manche che avrebbero fatto loro, ed è giusto così.
 */

import type { Position } from "./bridge-engine";
import type { DdsTable, TableStrain } from "./dds-table";
import type { Strain } from "./minibridge";
import type { Vulnerability } from "./catalog";
import { scoreContract } from "./scoring";
import { valutaLicita, type Metro } from "./stelle-licita";

const DENOMINAZIONI: { chiave: TableStrain; strain: Strain; etichetta: string }[] = [
  { chiave: "notrump", strain: "nt", etichetta: "SA" },
  { chiave: "spade", strain: "spade", etichetta: "♠" },
  { chiave: "heart", strain: "heart", etichetta: "♥" },
  { chiave: "diamond", strain: "diamond", etichetta: "♦" },
  { chiave: "club", strain: "club", etichetta: "♣" },
];

export interface ContrattoValutato {
  /** Come si scrive: "4♥", "3SA". */
  etichetta: string;
  level: number;
  strain: Strain;
  /** Chi lo dichiara: quello vero per il contratto giocato, il migliore per gli altri. */
  declarer: Position;
  prese: number;
  punteggio: number;
  stelle: number;
  /** Vero se è il contratto a cui siete arrivati. */
  tuo: boolean;
}

/**
 * L'elenco dei contratti da rivedere, dal migliore al peggiore.
 *
 * `giocato` serve solo a segnare quale avete dichiarato: se il vostro non è
 * fra i massimi per la sua denominazione — un 5♥ dove ne reggevano dieci —
 * compare comunque, perché è il confronto che interessa.
 */
export function contrattiDaRivedere(opzioni: {
  table: DdsTable;
  lato: "ns" | "ew";
  vulnerability: Vulnerability;
  /** Il punteggio di riferimento per le stelle, visto dalla propria linea. */
  riferimento: number;
  metro: Metro;
  giocato?: { level: number; strain: Strain; declarer?: Position } | null;
}): ContrattoValutato[] {
  const { table, lato, vulnerability, riferimento, metro, giocato } = opzioni;
  const posti: Position[] = lato === "ns" ? ["north", "south"] : ["east", "west"];
  const inZona = vulnerability === "both" || vulnerability === lato;

  const valuta = (
    level: number,
    strain: Strain,
    chiave: TableStrain,
    /**
     * Per il contratto che avete DAVVERO dichiarato conta chi l'ha dichiarato
     * davvero, non chi l'avrebbe giocato meglio: le prese cambiano con il
     * dichiarante, e mostrare quelle dell'altro compagno vorrebbe dire
     * scrivere accanto al vostro contratto un punteggio che non è il vostro —
     * diverso, per giunta, da quello del voto qui sopra.
     */
    dichiaranteVero?: Position
  ): ContrattoValutato => {
    const declarer =
      dichiaranteVero ??
      posti.reduce((a, b) => (table.tricks[chiave][a] >= table.tricks[chiave][b] ? a : b));
    const prese = table.tricks[chiave][declarer];
    const punteggio = scoreContract({
      level,
      strain,
      tricksMade: prese,
      vulnerable: inZona,
    }).score;
    const etichetta = `${level}${DENOMINAZIONI.find((d) => d.strain === strain)!.etichetta}`;
    return {
      etichetta,
      level,
      strain,
      declarer,
      prese,
      punteggio,
      stelle: valutaLicita(punteggio, riferimento, metro).stelle,
      tuo: giocato?.level === level && giocato?.strain === strain,
    };
  };

  const righe: ContrattoValutato[] = [];
  for (const d of DENOMINAZIONI) {
    const prese = Math.max(...posti.map((p) => table.tricks[d.chiave][p]));
    // Sotto le sette prese non esiste nessun contratto mantenibile in quella
    // denominazione: si lascia fuori invece di mostrare un 1♣ che cade.
    if (prese < 7) continue;
    righe.push(
      valuta(
        Math.min(7, prese - 6),
        d.strain,
        d.chiave,
        // Se la denominazione è quella che avete dichiarato, la riga è la
        // vostra: va col vostro dichiarante, altrimenti ne nascerebbero due.
        giocato?.strain === d.strain && giocato.level === Math.min(7, prese - 6)
          ? giocato.declarer
          : undefined
      )
    );
  }

  // Il contratto giocato compare sempre, anche quando è più alto di quello che
  // le prese reggono: è il caso in cui l'elenco serve di più.
  if (giocato && !righe.some((r) => r.tuo)) {
    const d = DENOMINAZIONI.find((x) => x.strain === giocato.strain);
    if (d) righe.push(valuta(giocato.level, giocato.strain, d.chiave, giocato.declarer));
  }

  return righe.sort((a, b) => b.punteggio - a.punteggio);
}
