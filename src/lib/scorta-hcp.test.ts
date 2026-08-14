import { describe, expect, it } from "vitest";
import { bersaglio, intervalloBersagli, mediaRealizzata, pesiBersagli } from "./scorta-hcp";

describe("i bersagli di punti per Nord-Sud", () => {
  it("l'intervallo è simmetrico attorno alla media", () => {
    expect(intervalloBersagli(23, 20)).toEqual([20, 26]);
    expect(intervalloBersagli(23, 17)).toEqual([17, 29]);
  });

  it("la media chiesta è quella che esce", () => {
    // È la proprietà per cui l'intervallo è simmetrico: se si scartassero le
    // mani sotto il minimo invece di costruire l'intervallo così, la media
    // salirebbe di nascosto.
    expect(mediaRealizzata(23, 20)).toBeCloseTo(23, 10);
    expect(mediaRealizzata(23, 17)).toBeCloseTo(23, 10);
    expect(mediaRealizzata(25, 25)).toBeCloseTo(25, 10);
  });

  it("il centro è più probabile degli estremi", () => {
    const pesi = pesiBersagli(23, 20);
    const centro = pesi.find((p) => p.valore === 23)!;
    expect(centro.peso).toBeGreaterThan(pesi[0].peso);
    expect(centro.peso).toBeGreaterThan(pesi[pesi.length - 1].peso);
  });

  it("il minimo si rispetta sempre", () => {
    for (let i = 0; i < 200; i++) {
      expect(bersaglio(23, 20, i / 200)).toBeGreaterThanOrEqual(20);
    }
  });

  it("resta simmetrico anche quando il tetto dei 37 taglia l'intervallo", () => {
    // Media 30 e minimo 20 vorrebbe arrivare a 40: si ferma a 37, e i pesi si
    // ricentrano — la media realizzata non è più 30, e va saputo.
    const [da, a] = intervalloBersagli(30, 20);
    expect(a).toBe(37);
    const pesi = pesiBersagli(30, 20);
    const primo = pesi[0].peso;
    const ultimo = pesi[pesi.length - 1].peso;
    expect(primo).toBe(ultimo);
    expect(mediaRealizzata(30, 20)).toBeCloseTo((da + a) / 2, 10);
  });

  it("un minimo sopra la media è un errore, non un silenzio", () => {
    expect(() => intervalloBersagli(23, 25)).toThrow();
  });

  it("media e minimo uguali danno un solo valore", () => {
    expect(intervalloBersagli(24, 24)).toEqual([24, 24]);
    expect(bersaglio(24, 24, 0.7)).toBe(24);
  });
});
