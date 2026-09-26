import { describe, expect, it } from "vitest";
import { DEAL_TEMPLATES, generateDeals, satisfiesDeal, handHcp } from "@/lib/deal-generator";

/**
 * Ogni argomento deve produrre mani che rispettano il proprio vincolo.
 *
 * PERCHÉ ESISTE QUESTO FILE. Il 26/09/2026, in una prova dal vivo, il Tavolo
 * condiviso ha mostrato «Apertura di 1NT» con Sud a nove punti. Il generatore
 * non c'entrava — la mano veniva dallo stato del tavolo aperto, rimasto lì da
 * un argomento precedente — ma la diagnosi iniziale è stata «il generatore usa
 * un seme diverso», e ci è voluto mezz'ora per escluderlo.
 *
 * Questi test tolgono per sempre quel sospetto: se un giorno una mano esce
 * fuori tema, si sa subito che non è qui.
 */

describe("i modelli didattici producono quello che promettono", () => {
  for (const modello of DEAL_TEMPLATES) {
    const vincolato = Object.keys(modello.constraints).length > 0;
    if (!vincolato) continue;

    it(`«${modello.label}» — cento mani, tutte in tema`, () => {
      const { deals, exhausted } = generateDeals(modello.constraints, { count: 100, seed: 12345 });
      // Se il vincolo fosse impossibile ne uscirebbero meno di cento: anche
      // quello va saputo, perché in lezione si presenterebbe come «non trovo
      // mani» senza spiegazione.
      expect(exhausted, `«${modello.label}» non riesce a produrne cento`).toBe(false);
      expect(deals).toHaveLength(100);
      for (const d of deals) {
        expect(satisfiesDeal(d, modello.constraints), `mano fuori tema in «${modello.label}»`).toBe(true);
      }
    });
  }
});

describe("il caso visto in lezione", () => {
  it("«Apertura di 1NT» dà sempre a Sud una mano da 15-17 bilanciata", () => {
    // È la mano che era sbagliata sullo schermo: Sud con nove punti.
    const modello = DEAL_TEMPLATES.find((t) => t.id === "apertura-1nt");
    expect(modello, "il modello «apertura-1nt» non esiste più").toBeDefined();
    const { deals } = generateDeals(modello!.constraints, { count: 50, seed: 777 });
    expect(deals).toHaveLength(50);
    for (const d of deals) {
      const punti = handHcp(d.south);
      expect(punti).toBeGreaterThanOrEqual(15);
      expect(punti).toBeLessThanOrEqual(17);
    }
  });

  it("una mano di un ALTRO argomento viene riconosciuta come fuori tema", () => {
    // È il controllo che ora l'interfaccia fa sul tavolo aperto: senza, il
    // disallineamento resta invisibile e si spiega davanti alla mano sbagliata.
    const unNt = DEAL_TEMPLATES.find((t) => t.id === "apertura-1nt")!;
    const altro = DEAL_TEMPLATES.find(
      (t) => t.id !== "apertura-1nt" && Object.keys(t.constraints).length > 0,
    )!;
    const { deals } = generateDeals(altro.constraints, { count: 30, seed: 4242 });
    // Almeno una delle trenta deve violare il vincolo di 1NT: se le
    // rispettassero tutte, i due argomenti sarebbero lo stesso argomento.
    expect(deals.some((d) => !satisfiesDeal(d, unNt.constraints))).toBe(true);
  });
});
