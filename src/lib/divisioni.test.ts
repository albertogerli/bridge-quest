import { describe, expect, it } from "vitest";
import { divisioniAlTavolo, divisioniPossibili, etichettaDivisione } from "./divisioni";
import type { Card, Position } from "./bridge-engine";

const pct = (p: number) => Math.round(p * 1000) / 10;

describe("le divisioni dei semi", () => {
  /**
   * I numeri del manuale. Se questi cambiano, è cambiata la formula — e la
   * formula non deve cambiare: sono le probabilità che ogni giocatore di
   * bridge conosce a memoria, e vederle diverse sullo schermo distruggerebbe
   * la fiducia in tutto il resto del pannello.
   */
  it("a inizio mano dà i valori dei manuali", () => {
    const cinque = divisioniPossibili(5, 13, 13).divisioni;
    expect(pct(cinque.find((d) => d.sinistra === 3)!.probabilita)).toBe(67.8);
    expect(pct(cinque.find((d) => d.sinistra === 4)!.probabilita)).toBe(28.3);
    expect(pct(cinque.find((d) => d.sinistra === 5)!.probabilita)).toBe(3.9);

    const quattro = divisioniPossibili(4, 13, 13).divisioni;
    expect(pct(quattro.find((d) => d.sinistra === 2)!.probabilita)).toBe(40.7);
    expect(pct(quattro.find((d) => d.sinistra === 3)!.probabilita)).toBe(49.7);
    expect(pct(quattro.find((d) => d.sinistra === 4)!.probabilita)).toBe(9.6);

    const tre = divisioniPossibili(3, 13, 13).divisioni;
    expect(pct(tre.find((d) => d.sinistra === 2)!.probabilita)).toBe(78);
    expect(pct(tre.find((d) => d.sinistra === 3)!.probabilita)).toBe(22);
  });

  it("le probabilità sommano a uno", () => {
    for (let m = 0; m <= 8; m++) {
      const somma = divisioniPossibili(m, 13, 13).divisioni.reduce((a, d) => a + d.probabilita, 0);
      expect(somma, `${m} mancanti`).toBeCloseTo(1, 10);
    }
  });

  it("con zero carte mancanti c'è una divisione sola, certa", () => {
    const d = divisioniPossibili(0, 13, 13).divisioni;
    expect(d).toHaveLength(1);
    expect(d[0]).toMatchObject({ sinistra: 0, destra: 0, probabilita: 1 });
  });

  /**
   * IL MOTIVO PER CUI NON BASTA LA TABELLA. Se un avversario ha meno posti
   * liberi degli altri — perché ha già giocato di più, o perché si è scoperto
   * corto altrove — la distribuzione si sbilancia, e la tabella del manuale
   * non lo sa.
   */
  it("i posti liberi diversi spostano le probabilità", () => {
    const pari = divisioniPossibili(3, 13, 13);
    const sbilanciato = divisioniPossibili(3, 4, 13);
    // A posti pari «3-0» è una riga sola che comprende le due orientazioni.
    expect(pari.divisioni.find((d) => d.sinistra === 3 && d.destra === 0)!.simmetrica).toBe(true);

    // A posti diversi restano separate, ed è il punto: con quattro posti a
    // sinistra e tredici a destra, tre carte a sinistra sono molto meno
    // probabili di tre a destra.
    const treASinistra = sbilanciato.divisioni.find((d) => d.sinistra === 3)!;
    const treADestra = sbilanciato.divisioni.find((d) => d.destra === 3)!;
    expect(treASinistra.simmetrica).toBe(false);
    expect(treASinistra.probabilita).toBeLessThan(treADestra.probabilita);
    expect(sbilanciato.divisioni.reduce((a, d) => a + d.probabilita, 0)).toBeCloseTo(1, 10);
  });

  it("se un avversario non ha più posti, tutto va all'altro — e si vede da che parte", () => {
    const d = divisioniPossibili(2, 0, 13).divisioni;
    expect(d).toHaveLength(1);
    expect(d[0].probabilita).toBe(1);
    // «0-2», non «2-0»: le due mani hanno posti diversi, quindi l'orientazione
    // conta ed è quella l'informazione.
    expect(etichettaDivisione(d[0])).toBe("0-2");
  });

  it("l'etichetta mette prima il numero più alto, quando le due speculari sono unite", () => {
    expect(etichettaDivisione({ sinistra: 1, destra: 4, probabilita: 0, simmetrica: true })).toBe("4-1");
    expect(etichettaDivisione({ sinistra: 4, destra: 1, probabilita: 0, simmetrica: true })).toBe("4-1");
  });

  it("ma se sono distinte tiene l'ordine vero, o non si capirebbe da che parte", () => {
    expect(etichettaDivisione({ sinistra: 1, destra: 4, probabilita: 0, simmetrica: false })).toBe("1-4");
    expect(etichettaDivisione({ sinistra: 4, destra: 1, probabilita: 0, simmetrica: false })).toBe("4-1");
  });
});

describe("le divisioni nella posizione del tavolo", () => {
  const c = (rank: string): Card => ({ suit: "spade", rank } as Card);

  it("conta solo le carte che non si vedono", () => {
    // Sud e Nord hanno otto picche fra tutti e due: ne mancano cinque.
    const d = divisioniAlTavolo({
      colore: "spade",
      noti: {
        south: [c("A"), c("K"), c("Q"), c("J"), c("10")],
        north: [c("9"), c("8"), c("7")],
      },
      avversari: ["east", "west"] as [Position, Position],
    });
    expect(d.mancanti).toBe(5);
    expect(pct(d.divisioni[0].probabilita)).toBe(67.8);
  });

  it("una carta caduta cambia il conto", () => {
    const d = divisioniAlTavolo({
      colore: "spade",
      noti: { south: [c("A"), c("K"), c("Q"), c("J"), c("10")], north: [c("9"), c("8"), c("7")] },
      giocate: [
        { seat: "east", card: c("2") },
        { seat: "south", card: c("A") },
        { seat: "west", card: c("3") },
        { seat: "north", card: c("7") },
      ],
      avversari: ["east", "west"] as [Position, Position],
    });
    // Delle cinque mancanti ne sono cadute due: ne restano tre.
    expect(d.mancanti).toBe(3);
    // E ciascun avversario ha un posto in meno.
    expect(d.postiSinistra).toBe(12);
    expect(d.postiDestra).toBe(12);
  });

  /**
   * La mano di un avversario, se per caso è nota — all'insegnante lo è
   * sempre — non deve entrare nel conto delle carte viste: è proprio quella
   * di cui si vuole mostrare la divisione probabile alla classe.
   */
  it("le mani degli avversari non contano come viste", () => {
    const d = divisioniAlTavolo({
      colore: "spade",
      noti: {
        south: [c("A"), c("K"), c("Q"), c("J"), c("10")],
        north: [c("9"), c("8"), c("7")],
        east: [c("6"), c("5"), c("4")],
        west: [c("3"), c("2")],
      },
      avversari: ["east", "west"] as [Position, Position],
    });
    expect(d.mancanti).toBe(5);
  });
});
