import { describe, it } from "vitest";
import type { Card, Position, Suit } from "./bridge-engine";
import { createGame, parseContract, playCard } from "./bridge-engine";
import { aiSelectExpertCard, aiSelectWithDifficulty, type AILevel } from "./ai-difficulty";
import { generateDeals } from "./deal-generator";
import { calcTableAndPar } from "./dds-table";
import { parAssignmentFromContracts } from "./par-contract";
import { analyseReplay, type PlayedTrick } from "./dds-replay";

const MANI = 30;

/** Come sceglie il gioco vero: a «esperto» prova il double dummy nei finali. */
async function scegli(state: Parameters<typeof aiSelectWithDifficulty>[0], chi: Position, level: AILevel) {
  if (level === "esperto") {
    const dd = await aiSelectExpertCard(state, chi);
    if (dd) return dd;
  }
  return aiSelectWithDifficulty(state, chi, level);
}

async function misura(level: AILevel) {
  const { deals } = generateDeals({}, { count: MANI, seed: 4242 });
  const seats: Position[] = ["north", "east", "south", "west"];
  let regalateDaDichiarante = 0;
  let regalateDaDifesa = 0;
  let maniConErrori = 0;
  let usate = 0;

  for (const [i, deal] of deals.entries()) {
    const { table, par } = await calcTableAndPar(deal, seats[i % 4], "none");
    const scelta = parAssignmentFromContracts(par.contracts, table, deal);
    if (!scelta) continue;
    usate++;

    const { trumpSuit } = parseContract(scelta.contract);
    let state = createGame(deal, scelta.contract, scelta.declarer);
    const tricks: PlayedTrick[] = [];
    let corrente: { player: string; card: Card }[] = [];

    for (let n = 0; n < 52; n++) {
      const chi = state.currentPlayer;
      const carta = await scegli(state, chi, level);
      corrente.push({ player: chi, card: carta });
      const prima = state.tricks.length;
      state = playCard(state, chi, carta);
      if (state.tricks.length > prima) {
        tricks.push({ cards: corrente, winner: state.tricks[prima].winner ?? chi });
        corrente = [];
      }
    }

    const a = await analyseReplay(deal, tricks, trumpSuit as Suit | null, scelta.declarer);
    const perse = a.points.filter((p) => p.delta < 0).reduce((s, p) => s - p.delta, 0);
    const donate = a.points.filter((p) => p.delta > 0).reduce((s, p) => s + p.delta, 0);
    regalateDaDichiarante += perse;
    regalateDaDifesa += donate;
    if (perse + donate > 0) maniConErrori++;
  }

  console.log(
    `[${level}] mani=${usate} | prese buttate dal dichiarante=${regalateDaDichiarante}` +
    ` (${(regalateDaDichiarante / usate).toFixed(2)}/mano)` +
    ` | regalate dalla difesa=${regalateDaDifesa} (${(regalateDaDifesa / usate).toFixed(2)}/mano)` +
    ` | mani con almeno un errore=${maniConErrori}/${usate}`
  );
}

/**
 * Quanto sbagliano i robot, misurato in prese.
 *
 * PERCHÉ ESISTE
 * «I robot commettono errori banali e sconcertanti, così si vince anche
 * sbagliando»: una segnalazione del genere non si può né accettare né
 * respingere a parole. Qui si giocano delle mani con l'avversario vero del
 * prodotto e si conta, presa per presa, quanto viene buttato via rispetto al
 * gioco perfetto a carte scoperte.
 *
 * COME SI LEGGE IL NUMERO
 * Il double dummy vede tutte e 52 le carte: anche un ottimo giocatore umano
 * «perde» qualcosa con questo metro, quindi zero non è il livello atteso e il
 * valore assoluto va preso con prudenza. Il confronto FRA livelli invece è
 * pulito: stesse mani, stesso metro, stessa misura.
 *
 * Non gira con `npm test`: sono minuti di calcolo. Si lancia a mano quando si
 * tocca l'intelligenza artificiale, ed è il modo per sapere se una modifica ha
 * migliorato o peggiorato l'avversario invece di sperarlo.
 *
 *   MISURA_ROBOT=1 npx vitest run src/lib/robot-quality.test.ts --disable-console-intercept
 *
 * Misura del 13/08/2026 — 30 mani, ciascuna giocata nel proprio contratto par,
 * prese buttate per mano (dichiarante + difesa):
 *   intermedio (predefinito)   3.13 + 2.17
 *   base                       3.33 + 2.10   indistinguibile da intermedio
 *   esperto                    1.60 + 1.40   circa la metà
 */
describe.skipIf(!process.env.MISURA_ROBOT)("quanto sbagliano i robot", () => {
  it("livello intermedio (quello predefinito)", async () => { await misura("intermedio"); }, 900000);
  it("livello base", async () => { await misura("base"); }, 900000);
  it("livello esperto (double dummy negli ultimi 7)", async () => { await misura("esperto"); }, 900000);
});
