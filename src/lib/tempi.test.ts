import { describe, expect, it } from "vitest";
import { Cronometro, difficolta, formattaDurata, ripulisci, TETTO_PER_DECISIONE_MS } from "./tempi";

describe("il cronometro", () => {
  it("misura l'intervallo fra un gesto e il precedente", () => {
    const c = new Cronometro(1000);
    expect(c.segna(3000)).toBe(2000);
    expect(c.segna(3500)).toBe(500);
    expect(c.grezzi()).toEqual([2000, 500]);
  });

  it("un orologio che va indietro non produce tempi negativi", () => {
    // Succede: cambio di ora, sincronizzazione dell'orologio di sistema.
    const c = new Cronometro(5000);
    expect(c.segna(4000)).toBe(0);
  });
});

describe("la pulizia dei tempi", () => {
  /**
   * IL CASO PER CUI ESISTE. Il tempo lo misura il browser, e un browser può
   * stare fermo per mille motivi che non c'entrano col pensare: scheda in
   * secondo piano, telefono in tasca, portatile chiuso a metà mano. Un allievo
   * che risulta aver pensato quaranta minuti su una carta falsa la media di
   * tutta la classe.
   */
  it("toglie i valori fuori scala invece di schiacciarli al tetto", () => {
    const t = ripulisci([1000, 40 * 60 * 1000, 2000]);
    expect(t.decisioni).toEqual([1000, 2000]);
    expect(t.scartate).toBe(1);
    // Schiacciandolo al tetto il totale sarebbe stato 303_000: la media di
    // classe si sposterebbe comunque, ed è proprio quello che si vuole evitare.
    expect(t.totaleMs).toBe(3000);
  });

  it("il tetto è incluso, appena sopra si scarta", () => {
    expect(ripulisci([TETTO_PER_DECISIONE_MS]).decisioni).toHaveLength(1);
    expect(ripulisci([TETTO_PER_DECISIONE_MS + 1]).scartate).toBe(1);
  });

  it("scarta anche NaN e valori negativi", () => {
    const t = ripulisci([NaN, -5, Infinity, 100]);
    expect(t.decisioni).toEqual([100]);
    expect(t.scartate).toBe(3);
  });

  it("senza decisioni valide i conti sono zero, non NaN", () => {
    const t = ripulisci([NaN]);
    expect(t.totaleMs).toBe(0);
    expect(t.massimoMs).toBe(0);
  });
});

describe("i due casi che l'insegnante deve vedere", () => {
  it("chi mantiene non è mai un segnale, per quanto ci abbia messo", () => {
    expect(difficolta(ripulisci([60_000, 60_000]), true)).toBe("normale");
  });

  it("molto tempo su una carta ed errore: non sapeva come fare", () => {
    expect(difficolta(ripulisci([2000, 45_000, 1000]), false)).toBe("lento-e-sbagliato");
  });

  it("tempo quasi nullo ed errore: non si è accorto che c'era una scelta", () => {
    expect(difficolta(ripulisci([800, 700, 900, 600]), false)).toBe("veloce-e-sbagliato");
  });

  it("poche decisioni veloci non bastano a dire «non ha guardato»", () => {
    // Con due sole carte giocate in fretta non si può concludere niente.
    expect(difficolta(ripulisci([800, 700]), false)).toBe("normale");
  });
});

describe("la durata scritta", () => {
  it("sotto il minuto sono secondi", () => {
    expect(formattaDurata(8400)).toBe("8s");
  });
  it("sopra il minuto si separa", () => {
    expect(formattaDurata(72_000)).toBe("1m 12s");
    expect(formattaDurata(65_000)).toBe("1m 05s");
  });
});
