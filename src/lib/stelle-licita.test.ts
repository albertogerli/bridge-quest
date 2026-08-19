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
    // 420 invece di 620: la manche giusta nel colore sbagliato, 5 IMP.
    expect(valutaLicita(420, 620).stelle).toBe(2);
  });

  it("trenta punti di scarto in un parziale non sono un errore", () => {
    // 140 invece di 170 è un solo IMP: con le soglie in punti secchi prendeva
    // due stelle come una manche mancata di 200, il che non aveva senso.
    expect(valutaLicita(140, 170).stelle).toBe(3);
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

  it("i confini stanno dove dice la regola, e sono in IMP", () => {
    // 40 punti = 1 IMP (pieno), 50 = 2 IMP.
    expect(valutaLicita(160, 200).stelle).toBe(3);
    expect(valutaLicita(150, 200).stelle).toBe(2.5);
    // 260 = 6 IMP, 270 = 7.
    expect(valutaLicita(40, 300).stelle).toBe(2);
    expect(valutaLicita(30, 300).stelle).toBe(1.5);
    // 590 = 11 IMP, 600 = 12.
    expect(valutaLicita(10, 600).stelle).toBe(1);
    expect(valutaLicita(0, 600).stelle).toBe(0.5);
    // 4000 e oltre = 24 IMP: qui non c'è mezza stella che tenga.
    expect(valutaLicita(-3500, 600).stelle).toBe(0);
  });

  it("le mezze stelle esistono, e sono sette gradini in tutto", () => {
    const voti = new Set<number>();
    for (let d = 0; d <= 4000; d += 10) voti.add(valutaLicita(-d, 0).stelle);
    expect([...voti].sort((a, b) => a - b)).toEqual([0, 0.5, 1, 1.5, 2, 2.5, 3]);
  });

  it("il caso che ha fatto cambiare la scala", () => {
    // Mano da slam: il migliore rende 830, 3SA 668 e 5♣ 609. Con le soglie in
    // punti secchi erano due stelle e una, per cinquantanove punti di
    // differenza — un salto che nessuno saprebbe spiegare al tavolo.
    expect(valutaLicita(668, 830).stelle).toBe(2);
    expect(valutaLicita(609, 830).stelle).toBe(2);
    // E chi ha mancato di più resta sotto.
    expect(valutaLicita(482, 830).stelle).toBe(1.5);
  });

  it("regge i punteggi negativi da entrambe le parti", () => {
    // Par negativo: la mano è degli avversari e si tratta di limitare i danni.
    const e = valutaLicita(-100, -50);
    expect(e.differenza).toBe(50);
    expect(e.stelle).toBe(2.5);
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

describe("il commento descrive la distanza vera, non il voto", () => {
  it("225 punti sotto non sono «ci sei quasi»", () => {
    // Il difetto segnalato il 16/08/2026: due stelle coprono tutto ciò che sta
    // entro sei IMP, quindi lo stesso «di solito è un parziale al posto di un
    // altro» usciva anche per una manche mancata.
    const e = valutaLicita(108, 333, "atteso");
    expect(e.differenza).toBe(225);
    expect(e.commento).not.toMatch(/Ci sei quasi/);
    expect(e.commento).toMatch(/manche/);
  });

  it("sessanta punti sono davvero «ci sei quasi»", () => {
    // Venti punti no: quelli valgono ancora il pieno, e il commento diventa
    // «la scelta migliore». Il ramo del quasi comincia dove il voto scende.
    const e = valutaLicita(273, 333, "atteso");
    expect(e.differenza).toBe(60);
    expect(e.commento).toMatch(/Ci sei quasi/);
    expect(e.commento).toMatch(/parziale/);
  });

  it("una manche intera si chiama con il suo nome", () => {
    expect(valutaLicita(120, 620, "esatto").commento).toMatch(/manche intera/);
  });

  it("oltre i seicento si parla di slam o di caduta pesante", () => {
    expect(valutaLicita(0, 1430, "esatto").commento).toMatch(/slam|caduta pesante/);
  });
});

describe("tre stelle non vuol dire perfetto", () => {
  /**
   * Il caso visto in produzione il 19/08/2026: contratto raggiunto 67 di media,
   * contratto migliore 101. Trentaquattro punti sono un IMP, quindi tre stelle
   * — giusto — ma la frase diceva «nessun altro contratto rendeva di più»
   * mentre la tabella sotto ne mostrava uno che rendeva di più.
   */
  it("con uno scarto non dichiara di essere il migliore", () => {
    const e = valutaLicita(67, 101, "atteso");
    expect(e.stelle).toBe(3);
    expect(e.commento).not.toContain("nessun altro contratto rendeva di più");
    expect(e.commento).toContain("34 punti sotto il contratto migliore");
  });

  it("a scarto zero lo dichiara, perché è vero", () => {
    const e = valutaLicita(101, 101, "atteso");
    expect(e.stelle).toBe(3);
    expect(e.commento).toContain("nessun altro contratto rendeva di più");
  });

  it("sopra il riferimento resta il complimento pieno", () => {
    const e = valutaLicita(150, 101, "atteso");
    expect(e.commento).toContain("Meglio del contratto migliore");
  });

  it("vale anche col metro esatto", () => {
    expect(valutaLicita(60, 90, "esatto").commento).toContain("30 punti sotto il par");
    expect(valutaLicita(90, 90, "esatto").commento).toContain("non si poteva fare meglio");
  });
});
