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
 * UN CONTRATTO PER DENOMINAZIONE, AL LIVELLO CHE RENDE DI PIÙ. Elencare tutti e
 * trentacinque i contratti sarebbe un muro di numeri in cui la cosa da imparare
 * si perde.
 *
 * «Quello che rende di più» e non «il più alto che le prese reggono»: con dieci
 * prese a senza atout la seconda regola proponeva 4SA, che vale esattamente
 * quanto 3SA e che al tavolo non dichiara nessuno. Il bridge si dichiara per
 * traguardi — manche a 3SA, 4♥, 4♠, 5♣, 5♦ — e un elenco che li salta insegna
 * a contare le prese invece che a scegliere il contratto. A parità vince il
 * livello più basso, che è quello che si raggiunge davvero.
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
  /** Quanto rende in media, quando la mano porta le distribuzioni. */
  ev: number | null;
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
  /**
   * Il valore atteso di un contratto, quando la mano lo permette.
   *
   * SE C'È, LE STELLE VENGONO DA QUI e non dal punteggio di questa smazzata:
   * il riferimento è anche lui un valore atteso, e confrontare un risultato
   * reale con una media è il difetto che riempiva di stelle le mani fortunate.
   * Il punteggio reale resta in tabella, perché «in media rende 175, qui ha
   * fatto 420» è proprio la cosa da imparare.
   */
  ev?: (c: { level: number; strain: Strain; declarer: Position }) => number | null;
  /**
   * Mostra una denominazione anche quando nessun contratto ci regge.
   *
   * Per la propria linea non serve: un 1♣ che cade non è un contratto da
   * proporre. Per gli AVVERSARI sì, ed è la cosa più utile della sezione:
   * «al massimo facevano 2♥, giù di uno» dice che la mano era vostra, e senza
   * quella riga la sezione sparirebbe proprio nelle mani in cui la risposta è
   * più interessante.
   */
  ancheSenzaContratto?: boolean;
}): ContrattoValutato[] {
  const { table, lato, vulnerability, riferimento, metro, ev } = opzioni;
  const posti: Position[] = lato === "ns" ? ["north", "south"] : ["east", "west"];
  const inZona = vulnerability === "both" || vulnerability === lato;

  /**
   * Il contratto giocato entra in questa tabella SOLO se è di questa linea.
   *
   * Quando il contratto finale è degli avversari, la riga finiva qui dentro
   * lo stesso: marcata «il vostro», col punteggio dal punto di vista di chi
   * dichiarava (−400 per loro) e il valore atteso dal punto di vista di
   * Nord-Sud (+195) sulla stessa riga. Due numeri con due segni opposti, e un
   * contratto che nessuno dei due aveva dichiarato attribuito a chi guarda.
   * Visto in produzione il 15/08/2026 sul torneo.
   *
   * Il controllo sta qui e non nelle pagine: è la funzione a sapere di quale
   * linea sta parlando.
   */
  const giocato =
    opzioni.giocato &&
    (opzioni.giocato.declarer === undefined ||
      posti.includes(opzioni.giocato.declarer))
      ? opzioni.giocato
      : null;

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
    // `ev` risponde sempre dal punto di vista di Nord-Sud, come il par; qui
    // dentro tutto è dal punto di vista di `lato`, punteggio compreso.
    // Mescolare i due segni farebbe apparire i contratti avversari come
    // disastri per chi li dichiara.
    const grezzo = ev?.({ level, strain, declarer }) ?? null;
    const atteso = grezzo === null ? null : lato === "ns" ? grezzo : -grezzo;
    return {
      etichetta,
      level,
      strain,
      declarer,
      prese,
      punteggio,
      ev: atteso,
      stelle: valutaLicita(atteso ?? punteggio, riferimento, metro).stelle,
      // Il dichiarante conta: con lo stesso contratto giocato dall'altra parte
      // del tavolo le righe diventano due, e devono essere distinguibili.
      tuo:
        giocato?.level === level &&
        giocato?.strain === strain &&
        (giocato.declarer === undefined || giocato.declarer === declarer),
    };
  };

  const righe: ContrattoValutato[] = [];
  for (const d of DENOMINAZIONI) {
    const prese = Math.max(...posti.map((p) => table.tricks[d.chiave][p]));
    // Sotto le sette prese non esiste nessun contratto mantenibile in quella
    // denominazione: si lascia fuori invece di mostrare un 1♣ che cade.
    if (prese < 7 && !opzioni.ancheSenzaContratto) continue;

    // Il livello migliore: quello col valore atteso più alto quando c'è —
    // perché è il metro delle stelle — altrimenti quello che rende di più su
    // questa smazzata. Il confronto è stretto, quindi a parità resta il primo
    // trovato, cioè il livello più basso.
    let migliore: ContrattoValutato | null = null;
    for (let level = 1; level <= 7; level++) {
      const riga = valuta(
        level,
        d.strain,
        d.chiave,
        // Se è il contratto che avete dichiarato, la riga è la vostra: va col
        // vostro dichiarante, altrimenti ne nascerebbe una che non è la vostra.
        giocato?.strain === d.strain && giocato.level === level
          ? giocato.declarer
          : undefined
      );
      const metrica = (r: ContrattoValutato) => r.ev ?? r.punteggio;
      if (!migliore || metrica(riga) > metrica(migliore)) migliore = riga;
    }
    if (migliore) righe.push(migliore);
  }

  // Il contratto giocato compare sempre, anche quando è più alto di quello che
  // le prese reggono: è il caso in cui l'elenco serve di più.
  if (giocato && !righe.some((r) => r.tuo)) {
    const d = DENOMINAZIONI.find((x) => x.strain === giocato.strain);
    if (d) righe.push(valuta(giocato.level, giocato.strain, d.chiave, giocato.declarer));
  }

  /**
   * LO STESSO CONTRATTO DALL'ALTRA PARTE DEL TAVOLO, quando cambia il conto.
   *
   * A carte scoperte le prese dipendono da CHI dichiara: l'attacco arriva
   * dalla sinistra del dichiarante, e una carta in meno da girare può valere
   * due prese. Se avete dichiarato 4♠ da Sud e da Nord ne facevano due di più,
   * vederlo scritto è metà della lezione — mentre vedere un numero solo fa
   * pensare che il conto sia ballerino, ed è la domanda che si sono fatti tutti
   * quelli a cui è capitato.
   */
  const mia = righe.find((r) => r.tuo);
  if (mia) {
    const altro = posti.find((p) => p !== mia.declarer);
    const chiave = DENOMINAZIONI.find((d) => d.strain === mia.strain)?.chiave;
    if (altro && chiave && table.tricks[chiave][altro] !== mia.prese) {
      const gemella = valuta(mia.level, mia.strain, chiave, altro);
      if (!righe.some((r) => r.etichetta === gemella.etichetta && r.declarer === altro)) {
        righe.push(gemella);
      }
    }
  }

  return righe.sort((a, b) => b.punteggio - a.punteggio);
}

/**
 * Un punteggio degli avversari, scritto come lo segnereste voi.
 *
 * Dentro `contrattiDaRivedere` con `lato: "ew"` tutto è nel sistema di
 * riferimento LORO — punteggio positivo quando il contratto rende a loro —
 * perché è così che le stelle misurano quanto era buona la mano per loro.
 * Ma chi legge il riepilogo è l'allievo, che siede in Nord-Sud: «1SA di Est …
 * 90» si legge come novanta punti guadagnati, quando sono novanta punti
 * PRESI. Al tavolo quel numero si scrive −90, ed è l'unica scrittura che un
 * giocatore non deve tradurre.
 *
 * Il segno è una questione di presentazione, non di calcolo: le stelle
 * confrontano il contratto col migliore della loro linea, e negare entrambi i
 * termini non cambia la distanza fra i due. Per questo qui si gira solo quello
 * che si mostra.
 *
 * Vale anche il rovescio: se un loro contratto cade, per voi è un guadagno e
 * il numero diventa positivo — con il «+» davanti, come sul tabellone.
 */
export function dalVostroLato(valore: number | null | undefined): string {
  if (valore === null || valore === undefined) return "—";
  const nostro = -valore;
  if (nostro === 0) return "0";
  return nostro > 0 ? `+${nostro}` : `${nostro}`;
}
