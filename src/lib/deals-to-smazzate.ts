/**
 * Converte le mani generate in `Smazzata`, il formato che i compiti già
 * conoscono.
 *
 * PERCHÉ
 * `createAssignment` accetta da tempo `customHands: Smazzata[]` — è la strada
 * che usa l'import PBN. Il generatore produce solo la distribuzione delle
 * carte, quindi manca ciò che serve per giocarla: contratto, dichiarante,
 * attacco e vulnerabilità.
 *
 * Contratto e dichiarante NON vengono indovinati. Calcolare il contratto
 * ottimale richiederebbe venti risoluzioni double dummy per mano — lente — e
 * soprattutto sceglierebbe al posto dell'insegnante: in un esercizio didattico
 * il contratto è la cornice dell'esercizio, non un dato della mano. Li decide
 * chi assegna il compito.
 *
 * L'attacco invece si ricava: è la carta di uscita naturale del giocatore alla
 * sinistra del dichiarante, con la stessa funzione usata dall'import PBN, così
 * mani importate e mani generate si comportano allo stesso modo.
 */

import type { Card, Position } from "./bridge-engine";
import { nextPlayer } from "./bridge-engine";
import { aperturaConsigliata } from "./apertura";
import type { BiddingData, Smazzata, Vulnerability } from "./catalog";
import { defaultOpeningLead } from "./pbn";

/** Rotazione standard della vulnerabilità sui board di torneo. */
const VULNERABILITY_CYCLE: Vulnerability[] = [
  "none", "ns", "ew", "both",
  "ns", "ew", "both", "none",
  "ew", "both", "none", "ns",
  "both", "none", "ns", "ew",
];

/** Lettera del seme di atout in un contratto, o `null` a senza atout. */
function trumpLetterOf(contract: string): string | null {
  const normalized = contract.trim().toUpperCase();
  if (/^[1-7]\s*(NT|SA)/.test(normalized)) return null;
  const symbol = normalized.match(/^[1-7]\s*([SHDC♠♥♦♣])/)?.[1];
  if (!symbol) return null;
  // L'import PBN ragiona in lettere: qui si traduce, così una sola funzione
  // decide l'attacco per entrambe le strade.
  return { "♠": "S", "♥": "H", "♦": "D", "♣": "C", S: "S", H: "H", D: "D", C: "C" }[symbol] ?? null;
}

export interface ToSmazzateOptions {
  /** Prefisso degli id, deve essere stabile dentro un compito. */
  idPrefix: string;
  /** Contratto applicato a tutte le mani, es. "3NT" o "4♠". */
  contract: string;
  declarer: Position;
  /** Compare come titolo di ogni mano ("Apertura di 1NT — mano 3"). */
  title: string;
  /** Nota didattica ripetuta su ogni mano; di norma la descrizione del modello. */
  commentary?: string;
  /**
   * Contratto e dichiarante per singola mano, nell'ordine delle smazzate.
   *
   * Quando il par è stato calcolato si usa questo: un contratto unico per
   * tutte le mani è per forza sbagliato su alcune — impossibile su quelle
   * deboli e troppo timido su quelle forti. Le voci mancanti o nulle
   * ricadono su `contract`/`declarer`.
   */
  perHand?: (({ contract: string; declarer: Position }) | null)[];
  /**
   * Aggiunge a ogni mano una licita che porta al contratto assegnato.
   *
   * Serve ai compiti di SOLO GIOCO DELLA CARTA: senza dichiarazione l'allievo
   * vede un contratto piovuto dal nulla e non sa cosa la sua linea ha
   * promesso.
   */
  conLicita?: boolean;
}

/**
 * Trasforma le distribuzioni in smazzate assegnabili.
 * Non lancia: un contratto malformato produce comunque mani giocabili, con
 * l'attacco calcolato come se fosse a senza atout.
 */
export function dealsToSmazzate(
  deals: readonly Record<Position, Card[]>[],
  options: ToSmazzateOptions
): Smazzata[] {
  return deals.map((hands, index) => {
    const perHand = options.perHand?.[index];
    const contract = perHand?.contract ?? options.contract;
    const declarer = perHand?.declarer ?? options.declarer;
    const trump = trumpLetterOf(contract);
    const leader = nextPlayer(declarer);
    return {
      id: `${options.idPrefix}-${index + 1}`,
      // 0 = non appartiene a nessuna lezione del catalogo: sono mani del
      // compito, non contenuto federale.
      lesson: 0,
      board: index + 1,
      title: `${options.title} — mano ${index + 1}`,
      contract,
      declarer,
      openingLead: defaultOpeningLead(hands[leader], trump),
      vulnerability: VULNERABILITY_CYCLE[index % VULNERABILITY_CYCLE.length],
      hands: {
        north: hands.north,
        south: hands.south,
        east: hands.east,
        west: hands.west,
      },
      ...(options.conLicita
        ? { bidding: licitaVersoIlContratto(hands, contract, declarer) }
        : {}),
      commentary: options.commentary ?? "",
    };
  });
}

/**
 * Una licita che porta a quel contratto, per i compiti di solo gioco.
 *
 * PERCHÉ SERVE
 * Un compito in cui l'allievo deve solo giocare la carta ha bisogno che la
 * dichiarazione ci sia già: senza, l'allievo vede un contratto piovuto dal
 * nulla e non sa cosa la sua linea ha promesso.
 *
 * QUANTO È ONESTA
 * L'apertura è quella vera, calcolata dalla mano con la regola del sistema
 * (`aperturaConsigliata`). Il resto è la forma più semplice possibile: il
 * compagno alza direttamente al contratto finale e tutti passano. È una
 * sequenza plausibile e comunissima, non una ricostruzione di come QUELLA
 * mano andrebbe dichiarata davvero — e per un esercizio di gioco della carta
 * è esattamente quello che serve.
 *
 * Quando l'apertura calcolata non porta da nessuna parte (mano fuori
 * programma, o apertura in un colore diverso dal contratto finale) si ripiega
 * sulla forma minima: il dichiarante nomina il contratto e gli altri passano.
 * Meglio una licita spoglia che una inventata.
 */
export function licitaVersoIlContratto(
  hands: Record<Position, Card[]>,
  contract: string,
  declarer: Position
): BiddingData {
  const finale = contract.replace("SA", "NT").replace("♠", "S").replace("♥", "H")
    .replace("♦", "D").replace("♣", "C");
  const apertura = aperturaConsigliata(hands[declarer]);
  const semeFinale = finale.slice(1);
  const semeApertura = apertura ? apertura.bid.replace("SA", "NT")
    .replace("♠", "S").replace("♥", "H").replace("♦", "D").replace("♣", "C").slice(1) : null;

  // L'apertura si usa solo se è nello stesso colore del contratto finale e
  // più bassa: altrimenti la sequenza non sta in piedi.
  const usabile =
    apertura !== null &&
    semeApertura === semeFinale &&
    Number(apertura.bid[0]) < Number(finale[0]);

  const bids = usabile
    ? [
        apertura!.bid.replace("SA", "NT").replace("♠", "S").replace("♥", "H")
          .replace("♦", "D").replace("♣", "C"),
        "P", finale, "P", "P", "P",
      ]
    : [finale, "P", "P", "P"];

  return { dealer: declarer, bids };
}
