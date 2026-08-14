import { describe, expect, it } from "vitest";
import { valutaLicita } from "./stelle-licita";

/**
 * Il voto della licita è la cosa che l'allievo guarda per prima: se è
 * generoso non impara niente, se è severo smette di provarci.
 */
describe("valutaLicita", () => {
  it("dà tre stelle a chi raggiunge il par", () => {
    const e = valutaLicita(620, 620);
    expect(e.stelle).toBe(3);
    expect(e.differenza).toBe(0);
    expect(e.commento).toContain("par");
  });

  it("dà tre stelle anche a chi fa MEGLIO del par", () => {
    // Succede: il par presuppone la difesa perfetta, al tavolo non sempre lo è.
    const e = valutaLicita(680, 620);
    expect(e.stelle).toBe(3);
    expect(e.differenza).toBe(0);
    expect(e.commento).toContain("Meglio del par");
  });

  it("due stelle per un parziale al posto di un altro", () => {
    // 140 invece di 170: si è scelto il colore meno redditizio.
    expect(valutaLicita(140, 170).stelle).toBe(2);
    expect(valutaLicita(420, 620).stelle).toBe(2);
  });

  it("una stella quando si perde una manche", () => {
    // 170 invece di 620: parziale al posto della manche.
    const e = valutaLicita(170, 620);
    expect(e.stelle).toBe(1);
    expect(e.differenza).toBe(450);
  });

  it("nessuna stella per uno scarto grosso", () => {
    // Slam mancato, o contratto caduto pesantemente.
    expect(valutaLicita(-200, 1430).stelle).toBe(0);
    expect(valutaLicita(90, 1430).stelle).toBe(0);
  });

  it("i confini stanno dove dice la regola", () => {
    expect(valutaLicita(100, 300).stelle).toBe(2);   // esattamente 200
    expect(valutaLicita(99, 300).stelle).toBe(1);    // 201
    expect(valutaLicita(100, 600).stelle).toBe(1);   // esattamente 500
    expect(valutaLicita(99, 600).stelle).toBe(0);    // 501
  });

  it("regge i punteggi negativi da entrambe le parti", () => {
    // Par negativo: la mano è degli avversari e si tratta di limitare i danni.
    const e = valutaLicita(-100, -50);
    expect(e.differenza).toBe(50);
    expect(e.stelle).toBe(2);
  });
});

describe("il metro atteso", () => {
  it("dà lo stesso voto: cambia il riferimento, non la scala", () => {
    expect(valutaLicita(420, 620, "atteso").stelle).toBe(valutaLicita(420, 620).stelle);
  });

  it("non parla di par quando il riferimento è il valore atteso", () => {
    // Dire «sotto il par» quando si sta confrontando col contratto migliore in
    // media è una bugia piccola che confonde chi sta imparando i termini.
    const atteso = valutaLicita(140, 620, "atteso");
    expect(atteso.commento).toContain("contratto migliore");
    expect(atteso.commento).not.toContain("par");

    expect(valutaLicita(140, 620).commento).toContain("par");
  });

  it("riconosce la scelta migliore, non solo il par", () => {
    expect(valutaLicita(620, 620, "atteso").commento).toContain("La scelta migliore");
    expect(valutaLicita(620, 620).commento).toContain("Contratto par");
  });
});
