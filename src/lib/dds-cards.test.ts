import { describe, expect, it } from "vitest";
import type { Position } from "./bridge-engine";
import { getValidCards, nextPlayer } from "./bridge-engine";
import { generateDeals } from "./deal-generator";
import { calcTableAndPar, cardOptions } from "./dds-table";

/**
 * Le valutazioni per singola carta sono la base del tavolo di studio: se
 * sbagliano, a lezione si insegna il contrario di quello che si voleva.
 *
 * La verifica forte è incrociata: il massimo fra le carte deve coincidere con
 * la tabella double dummy, che la libreria calcola per un'altra strada. Due
 * conti indipendenti che tornano uguali.
 */
describe("cardOptions — ogni carta con il suo esito", () => {
  it("il meglio fra le carte coincide con la tabella double dummy", async () => {
    const { deals } = generateDeals({}, { count: 3, seed: 99 });
    for (const deal of deals) {
      const { table } = await calcTableAndPar(deal, "north", "none");
      // Sud dichiara a picche: apre Ovest, alla sua sinistra.
      const leader: Position = "west";
      const opzioni = await cardOptions(deal, "spade", leader);
      const meglioPerLaDifesa = Math.max(...opzioni.map((o) => o.tricks));
      // `score` è riferito a chi gioca (Ovest, difensore): le prese del
      // dichiarante sono il complemento sulle tredici.
      expect(13 - meglioPerLaDifesa).toBe(table.tricks.spade.south);
    }
  }, 200000);

  it("valuta TUTTE le carte giocabili, comprese le equivalenti", async () => {
    // La libreria comprime le carte equivalenti (K con la Q sotto è una carta
    // sola): senza espanderle, metà della mano resterebbe senza valutazione e
    // sembrerebbe un difetto.
    const { deals } = generateDeals({}, { count: 1, seed: 7 });
    const opzioni = await cardOptions(deals[0], null, "west");
    const valutate = new Set(opzioni.map((o) => `${o.card.suit}${o.card.rank}`));
    for (const c of deals[0].west) {
      expect(valutate.has(`${c.suit}${c.rank}`), `${c.rank} di ${c.suit} non valutata`).toBe(true);
    }
  }, 200000);

  it("a presa iniziata valuta solo chi deve giocare, e solo carte legali", async () => {
    const { deals } = generateDeals({}, { count: 1, seed: 11 });
    const leader: Position = "west";
    const attacco = deals[0].west[0];
    const restanti = { ...deals[0], west: deals[0].west.filter((c) => c !== attacco) };
    const tocca = nextPlayer(leader);

    const opzioni = await cardOptions(restanti, "spade", leader, [attacco]);
    const legali = getValidCards(restanti[tocca], [{ position: leader, card: attacco }]);
    const valutate = new Set(opzioni.map((o) => `${o.card.suit}${o.card.rank}`));

    expect(opzioni.length).toBeGreaterThan(0);
    for (const c of legali) {
      expect(valutate.has(`${c.suit}${c.rank}`), `${c.rank} di ${c.suit} manca`).toBe(true);
    }
    // Nessuna carta di un altro giocatore fra le opzioni.
    const inMano = new Set(restanti[tocca].map((c) => `${c.suit}${c.rank}`));
    for (const o of opzioni) {
      expect(inMano.has(`${o.card.suit}${o.card.rank}`), `${o.card.rank} non è in mano`).toBe(true);
    }
  }, 200000);
});
