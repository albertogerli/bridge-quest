import { describe, it } from "vitest";
import type { Card, Position } from "./bridge-engine";
import { getValidCards, type GameState } from "./bridge-engine";
import { aiSelectExpertCard, aiSelectWithDifficulty } from "./ai-difficulty";
import {
  benSeatParams,
  biddingToCTX,
  gameStateToPBNPlayed,
  pbnCardToCard,
  positionToBEN,
} from "./ben-format";
import { formatta, misura, type Scelta } from "./robot-quality-harness";

/**
 * BEN è più bravo, o solo più lento?
 *
 * PERCHÉ SERVE
 * Sappiamo che BEN costa circa un secondo per carta (misurato su Railway,
 * regione europea). Non sappiamo se quel secondo compri qualcosa: le misure
 * fatte finora confrontano euristica e double dummy, che girano in locale, e
 * BEN non è mai passato dallo stesso metro. Se giocasse come il double dummy,
 * la scelta giusta sarebbe tenersi il double dummy — istantaneo e gratis.
 *
 * Stesse mani, stesso metro, stesso ripiego: l'unica variabile è il motore.
 *
 *   BEN_API_URL=https://…up.railway.app \
 *   BEN_API_TOKEN=… \
 *   MISURA_BEN=1 npx vitest run src/lib/robot-quality-ben.test.ts --disable-console-intercept
 *
 * Poche mani per volta: sono ~52 chiamate di rete a mano.
 *
 * ESITO del 13/08/2026 — 10 mani (seme 4242), prese buttate per mano:
 *
 *   euristica       2,20 dichiarante + 2,00 difesa = 4,20   0 mani perfette
 *   double dummy    1,20 + 1,50 = 2,70                      0 mani perfette
 *   BEN             0,60 + 0,70 = 1,30                      4 mani su 10
 *
 * BEN dimezza il double dummy, e in quattro mani su dieci non lascia nulla
 * per strada. Il secondo per carta è quindi speso bene.
 *
 * ATTENZIONE: questi valori NON si confrontano con quelli di
 * `robot-quality.test.ts`, che misura 30 mani. Stesso metro, campione diverso.
 *
 * Le tre misure valgono solo con `ripieghi=0`: se BEN non risponde, quella
 * riga è l'euristica travestita. È già successo due volte — mani accorciate e
 * carte del morto — e in entrambi i casi il numero sembrava plausibile.
 */

const QUANTE = Number(process.env.MISURA_BEN_MANI ?? 10);
const SEED = 4242;

const URL = process.env.BEN_API_URL ?? "";
const TOKEN = process.env.BEN_API_TOKEN ?? "";

/** Il ripiego vero del prodotto: euristica, come in `use-bridge-game`. */
const ripiego = (state: GameState, chi: Position): Card =>
  aiSelectWithDifficulty(state, chi, "intermedio");

/**
 * Licita sintetica coerente col contratto: il dichiarante apre direttamente al
 * livello finale e gli altri passano.
 *
 * BEN rifiuta le posizioni incoerenti («Not this player to lead», «Cardplay
 * order is not correct»), quindi la licita non può essere inventata a caso:
 * dev'essere una in cui QUEL posto dichiara QUEL contratto.
 */
function licitaPer(contract: string): string {
  const bid = contract.replace("SA", "NT");
  return biddingToCTX({ bids: [bid, "P", "P", "P"] } as Parameters<typeof biddingToCTX>[0]);
}

async function chiediABen(state: GameState, chi: Position): Promise<Card | null> {
  const primaCarta = state.tricks.length === 0 && state.currentTrick.length === 0;
  const { hand, dummy, seat } = benSeatParams(state, chi);
  const params = new URLSearchParams({
    hand,
    seat,
    // Il dichiarante è anche il mazziere nella licita sintetica: così il posto
    // che deve attaccare è quello giusto.
    dealer: positionToBEN(state.declarer),
    vul: "None",
    ctx: licitaPer(state.contract),
  });
  if (!primaCarta) {
    params.set("dummy", dummy);
    params.set("played", gameStateToPBNPlayed(state));
  }

  const res = await fetch(`${URL}/${primaCarta ? "lead" : "play"}?${params}`, {
    headers: { "X-BEN-Token": TOKEN },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { card?: string };
  if (!data.card) return null;
  try {
    return pbnCardToCard(data.card);
  } catch {
    return null;
  }
}

const conBen: Scelta = (state, chi) => chiediABen(state, chi);

const conDoubleDummy: Scelta = async (state, chi) => {
  const dd = await aiSelectExpertCard(state, chi);
  return dd ?? aiSelectWithDifficulty(state, chi, "esperto");
};

const conEuristica: Scelta = async (state, chi) =>
  aiSelectWithDifficulty(state, chi, "intermedio");

/** Le carte obbligate non dicono nulla su un motore: le sceglie la regola. */
function soloSeCScelta(scelta: Scelta): Scelta {
  return async (state, chi) => {
    const valide = getValidCards(state.hands[chi], state.currentTrick);
    if (valide.length === 1) return valide[0];
    return scelta(state, chi);
  };
}

const attivo = Boolean(process.env.MISURA_BEN && URL && TOKEN);

describe.skipIf(!attivo)("BEN è più bravo o solo più lento?", () => {
  it(
    "stesse mani, stesso metro, tre motori",
    async () => {
      const opz = { quante: QUANTE, seed: SEED };
      // Le carte obbligate non si chiedono a BEN: sarebbero mezzo secondo di
      // rete per una decisione che non esiste.
      console.log(formatta("euristica", await misura(conEuristica, ripiego, opz)));
      console.log(formatta("double dummy", await misura(soloSeCScelta(conDoubleDummy), ripiego, opz)));
      console.log(formatta("BEN", await misura(soloSeCScelta(conBen), ripiego, opz)));
    },
    3_600_000
  );
});
