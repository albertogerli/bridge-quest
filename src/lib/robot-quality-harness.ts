/**
 * Metro comune per misurare quanto sbaglia un avversario artificiale.
 *
 * Estratto perché la stessa misura serve a due banchi diversi — l'euristica e
 * il double dummy in locale, la rete neurale BEN via rete — e due misure
 * «quasi uguali» non si possono confrontare: la differenza fra i motori
 * finirebbe confusa con la differenza fra i due modi di contarla.
 *
 * Il metro: si gioca la mano nel suo contratto par e, dopo ogni presa, si
 * chiede al double dummy quante prese il dichiarante possa ancora fare. Se il
 * totale ottenibile scende, la linea del dichiarante ha buttato via qualcosa;
 * se sale, l'ha regalato la difesa.
 *
 * ATTENZIONE A COSA SIGNIFICA IL NUMERO
 * Il double dummy vede tutte e 52 le carte: anche un ottimo giocatore umano
 * «perde» qualcosa con questo metro, quindi zero non è il livello atteso. Il
 * valore assoluto va preso con prudenza; il confronto fra motori sulle STESSE
 * mani, invece, è pulito.
 */

import type { Card, Position, Suit } from "./bridge-engine";
import { createGame, getValidCards, parseContract, playCard, type GameState } from "./bridge-engine";
import { generateDeals } from "./deal-generator";
import { calcTableAndPar } from "./dds-table";
import { parAssignmentFromContracts } from "./par-contract";
import { analyseReplay, type PlayedTrick } from "./dds-replay";

/** Chi sceglie la carta. Può fallire: in quel caso decide il ripiego. */
export type Scelta = (state: GameState, chi: Position) => Promise<Card | null>;

export interface Misura {
  mani: number;
  /** Prese buttate via dalla linea del dichiarante, in totale. */
  dalDichiarante: number;
  /** Prese regalate dalla difesa, in totale. */
  dallaDifesa: number;
  maniConErrori: number;
  /** Quante volte il motore non ha risposto e ha deciso il ripiego. */
  ripieghi: number;
  /** Quante scelte sono state chieste in tutto (utile per leggere i ripieghi). */
  scelte: number;
}

export function formatta(nome: string, m: Misura): string {
  const perMano = (n: number) => (n / Math.max(m.mani, 1)).toFixed(2);
  return (
    `[${nome}] mani=${m.mani} | dichiarante=${m.dalDichiarante} (${perMano(m.dalDichiarante)}/mano)` +
    ` | difesa=${m.dallaDifesa} (${perMano(m.dallaDifesa)}/mano)` +
    ` | totale=${perMano(m.dalDichiarante + m.dallaDifesa)}/mano` +
    ` | mani con errori=${m.maniConErrori}/${m.mani}` +
    ` | ripieghi=${m.ripieghi}/${m.scelte}`
  );
}

/**
 * Gioca `quante` mani con il motore dato e conta le prese buttate.
 *
 * `ripiego` decide quando il motore non risponde: va passato quello vero del
 * prodotto, altrimenti si misurerebbe un avversario che al tavolo non esiste.
 */
export async function misura(
  scegli: Scelta,
  ripiego: (state: GameState, chi: Position) => Card,
  opzioni: { quante: number; seed: number }
): Promise<Misura> {
  const { deals } = generateDeals({}, { count: opzioni.quante, seed: opzioni.seed });
  const seats: Position[] = ["north", "east", "south", "west"];
  const m: Misura = {
    mani: 0, dalDichiarante: 0, dallaDifesa: 0, maniConErrori: 0, ripieghi: 0, scelte: 0,
  };

  for (const [i, deal] of deals.entries()) {
    const { table, par } = await calcTableAndPar(deal, seats[i % 4], "none");
    const scelta = parAssignmentFromContracts(par.contracts, table, deal);
    if (!scelta) continue;
    m.mani++;

    const { trumpSuit } = parseContract(scelta.contract);
    let state = createGame(deal, scelta.contract, scelta.declarer);
    const tricks: PlayedTrick[] = [];
    let corrente: { player: string; card: Card }[] = [];

    for (let n = 0; n < 52; n++) {
      const chi = state.currentPlayer;
      const valide = getValidCards(state.hands[chi], state.currentTrick);
      m.scelte++;

      let carta: Card | null = null;
      try {
        carta = await scegli(state, chi);
      } catch {
        carta = null;
      }
      // Una carta che non si può giocare vale come nessuna risposta: meglio
      // contarla fra i ripieghi che far vincere al motore una mano illegale.
      const legale = carta && valide.some((c) => c.suit === carta!.suit && c.rank === carta!.rank);
      if (!legale) {
        m.ripieghi++;
        carta = ripiego(state, chi);
      }

      corrente.push({ player: chi, card: carta! });
      const prima = state.tricks.length;
      state = playCard(state, chi, carta!);
      if (state.tricks.length > prima) {
        tricks.push({ cards: corrente, winner: state.tricks[prima].winner ?? chi });
        corrente = [];
      }
    }

    const a = await analyseReplay(deal, tricks, trumpSuit as Suit | null, scelta.declarer);
    const perse = a.points.filter((p) => p.delta < 0).reduce((s, p) => s - p.delta, 0);
    const donate = a.points.filter((p) => p.delta > 0).reduce((s, p) => s + p.delta, 0);
    m.dalDichiarante += perse;
    m.dallaDifesa += donate;
    if (perse + donate > 0) m.maniConErrori++;
  }

  return m;
}

/** Contratto e dichiarante della mano, per costruire una licita coerente. */
export async function contrattoDellaMano(
  deal: Record<Position, Card[]>,
  dealer: Position
): Promise<{ contract: string; declarer: Position } | null> {
  const { table, par } = await calcTableAndPar(deal, dealer, "none");
  const a = parAssignmentFromContracts(par.contracts, table, deal);
  return a ? { contract: a.contract, declarer: a.declarer } : null;
}
