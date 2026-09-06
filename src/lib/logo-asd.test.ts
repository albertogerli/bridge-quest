import { describe, expect, it } from "vitest";
import { altezzaLogo, valutaLogo } from "./logo-asd";

const png = (over: Partial<{ tipo: string; byte: number; larghezza: number; altezza: number }> = {}) => ({
  tipo: "image/png", byte: 120_000, larghezza: 600, altezza: 400, ...over,
});

describe("i file che le ASD caricheranno davvero", () => {
  it("un PNG normale passa", () => {
    expect(valutaLogo(png()).ok).toBe(true);
  });

  it("il JPEG grande con lo sfondo bianco passa: è brutto, non inservibile", () => {
    // Scartarlo vorrebbe dire rifiutare il caso più comune. Lo sfondo bianco
    // si nota poco su una locandina che è già bianca.
    expect(valutaLogo(png({ tipo: "image/jpeg", byte: 3_000_000 })).ok).toBe(true);
  });

  it("il ritaglio da Facebook a bassa risoluzione viene fermato PRIMA", () => {
    // Stampato in A4 e appeso in bacheca si vedrebbe sgranato, e chi l'ha
    // caricato lo scoprirebbe davanti alla stampante.
    const esito = valutaLogo(png({ larghezza: 120, altezza: 80 }));
    expect(esito.ok).toBe(false);
    if (!esito.ok) {
      expect(esito.motivo).toBe("troppo-piccolo");
      // La spiegazione dice le misure vere: «troppo piccola» da sola non fa
      // capire quanto ne serva una più grande.
      expect(esito.spiegazione).toContain("120×80");
    }
  });

  it("l'SVG è rifiutato, e non per pignoleria", () => {
    // Un SVG può contenere script e questo finisce dentro una pagina che poi
    // viene renderizzata in immagine.
    const esito = valutaLogo(png({ tipo: "image/svg+xml" }));
    expect(esito.ok).toBe(false);
    if (!esito.ok) expect(esito.motivo).toBe("formato");
  });

  it("il PDF del grafico non è un'immagine", () => {
    expect(valutaLogo(png({ tipo: "application/pdf" })).ok).toBe(false);
  });

  it("la fotografia da otto megabyte viene fermata", () => {
    expect(valutaLogo(png({ byte: 12 * 1024 * 1024 })).ok).toBe(false);
  });

  it("l'intestazione lunga e stretta non è un logo", () => {
    const esito = valutaLogo(png({ larghezza: 2000, altezza: 200 }));
    expect(esito.ok).toBe(false);
    if (!esito.ok) expect(esito.motivo).toBe("sproporzionato");
  });

  it("ogni rifiuto dice come rimediare, non solo che è sbagliato", () => {
    for (const caso of [
      png({ tipo: "image/svg+xml" }),
      png({ larghezza: 50, altezza: 50 }),
      png({ byte: 20 * 1024 * 1024 }),
      png({ larghezza: 3000, altezza: 100 }),
    ]) {
      const esito = valutaLogo(caso);
      expect(esito.ok).toBe(false);
      if (!esito.ok) expect(esito.spiegazione.length).toBeGreaterThan(30);
    }
  });
});

describe("come si mette nella testata", () => {
  it("comanda l'altezza: i tre loghi sembrano importanti allo stesso modo", () => {
    expect(altezzaLogo(600, 400, 64)).toEqual({ larghezza: 96, altezza: 64 });
  });

  it("un logo molto largo non mangia il titolo accanto", () => {
    const m = altezzaLogo(1600, 400, 64);
    expect(m.larghezza).toBeLessThanOrEqual(200);
    // Le proporzioni restano: si rimpicciolisce, non si schiaccia.
    expect(m.altezza / m.larghezza).toBeCloseTo(400 / 1600, 2);
  });

  it("non divide per zero su un'immagine senza altezza", () => {
    expect(() => altezzaLogo(100, 0)).not.toThrow();
  });
});
