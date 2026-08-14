import { describe, expect, it } from "vitest";
import {
  confrontaPunteggi, leggiContratto, punteggioDelContratto, valutaBoard,
  valutaSfida, type TabellaPrese,
} from "./sfida-coppie";

/**
 * L'esito di una sfida è la cosa che le due coppie si scambiano al bar il
 * giorno dopo: se il conto è sbagliato, se ne accorgono loro prima di noi.
 */

/** Tabella comoda: dieci prese a picche, nove a senza atout, poco altro. */
const tricks: TabellaPrese = {
  spade:   { north: 10, east: 3, south: 10, west: 3 },
  heart:   { north: 7, east: 6, south: 7, west: 6 },
  diamond: { north: 8, east: 5, south: 8, west: 5 },
  club:    { north: 6, east: 7, south: 6, west: 7 },
  nt:      { north: 9, east: 4, south: 9, west: 4 },
};

describe("leggiContratto", () => {
  it("legge livello e denominazione", () => {
    expect(leggiContratto("4♠")).toEqual({ level: 4, strain: "spade" });
    expect(leggiContratto("3SA")).toEqual({ level: 3, strain: "nt" });
  });
  it("restituisce null su ciò che non è un contratto", () => {
    expect(leggiContratto(null)).toBeNull();
    expect(leggiContratto("P")).toBeNull();
    expect(leggiContratto("8♠")).toBeNull();
  });
});

describe("punteggioDelContratto", () => {
  it("un 4♠ che fa dieci prese vale la manche", () => {
    expect(punteggioDelContratto("4♠", tricks)).toBe(420);
  });
  it("un contratto troppo alto cade e vale negativo", () => {
    expect(punteggioDelContratto("6♠", tricks)).toBeLessThan(0);
  });
  it("il passo generale vale zero", () => {
    expect(punteggioDelContratto(null, tricks)).toBe(0);
  });
});

describe("valutaBoard", () => {
  it("assegna l'IMP alla coppia col punteggio migliore", () => {
    // A dichiara la manche, B si ferma al parziale.
    const e = valutaBoard({ tricks, parScore: 420, contrattoA: "4♠", contrattoB: "2♠" });
    expect(e.punteggioA).toBe(420);
    expect(e.aFavoreDi).toBe("A");
    expect(e.imp).toBeGreaterThan(0);
  });

  it("stesse dichiarazioni: nessun IMP, stesse stelle", () => {
    const e = valutaBoard({ tricks, parScore: 420, contrattoA: "4♠", contrattoB: "4♠" });
    expect(e.imp).toBe(0);
    expect(e.aFavoreDi).toBe("pari");
    expect(e.stelleA).toBe(e.stelleB);
  });

  it("SI PUÒ VINCERE DICHIARANDO MALE, e le stelle lo dicono", () => {
    // È il caso che giustifica i due punteggi insieme: A vince l'IMP ma
    // entrambe hanno mancato la manche a picche, e nessuna prende tre stelle.
    // (Nota: fra parziali non vince sempre il contratto più alto — 1♠ con tre
    // surlevée batte 3♠ con una. Per questo l'esempio usa 3SA, che è manche.)
    const e = valutaBoard({ tricks, parScore: 420, contrattoA: "3SA", contrattoB: "2♠" });
    expect(e.aFavoreDi).toBe("A");
    expect(e.stelleA).toBeLessThan(3);
    expect(e.stelleB).toBeLessThan(3);
  });
});

describe("valutaSfida", () => {
  it("somma gli IMP e dichiara il vincitore", () => {
    const esito = valutaSfida([
      { tricks, parScore: 420, contrattoA: "4♠", contrattoB: "2♠" },
      { tricks, parScore: 420, contrattoA: "4♠", contrattoB: "4♠" },
    ]);
    expect(esito.impA).toBeGreaterThan(0);
    expect(esito.impB).toBe(0);
    expect(esito.vincitore).toBe("A");
    expect(esito.boards).toHaveLength(2);
  });

  it("pareggio quando le due coppie dichiarano uguale", () => {
    const esito = valutaSfida([
      { tricks, parScore: 420, contrattoA: "4♠", contrattoB: "4♠" },
    ]);
    expect(esito.vincitore).toBe("pari");
    expect(esito.stelleA).toBe(esito.stelleB);
  });

  it("una sfida senza board non rompe niente", () => {
    const esito = valutaSfida([]);
    expect(esito.vincitore).toBe("pari");
    expect(esito.stelleA).toBe(0);
  });
});

describe("confrontaPunteggi", () => {
  it("conta gli IMP solo sulle board che hanno finito entrambe", () => {
    const c = confrontaPunteggi([
      { mio: 620, altro: 170, riferimento: 620 },
      { mio: 140, altro: null, riferimento: 620 },
    ]);
    expect(c.confrontate).toBe(1);
    // 450 di differenza: 10 IMP.
    expect(c.impMiei).toBe(10);
    expect(c.impAltri).toBe(0);
  });

  it("le stelle si danno anche senza avversario, perché non dipendono da lui", () => {
    const c = confrontaPunteggi([{ mio: 620, altro: null, riferimento: 620 }]);
    expect(c.stelle).toBe(3);
    expect(c.confrontate).toBe(0);
  });

  it("si può perdere l'incontro dichiarando bene", () => {
    // Tre stelle su tutte e due le board, ma l'altra coppia ha fatto meglio.
    const c = confrontaPunteggi([
      { mio: 620, altro: 650, riferimento: 620 },
      { mio: 420, altro: 450, riferimento: 420 },
    ]);
    expect(c.stelle).toBe(6);
    expect(c.impAltri).toBeGreaterThan(c.impMiei);
  });
});
