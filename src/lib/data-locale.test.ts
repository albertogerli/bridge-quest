import { describe, it, expect } from "vitest";
import { oggiInItalia } from "./data-locale";

describe("la data di oggi in Italia", () => {
  it("ha la forma AAAA-MM-GG", () => {
    expect(oggiInItalia()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  // Il difetto vero: mezzanotte e mezza UTC è l'una e mezza di notte in Italia
  // (ora legale), quindi è GIÀ il giorno dopo. Con toISOString() si contava il
  // giorno prima.
  it("dopo la mezzanotte italiana conta il giorno nuovo", () => {
    const istante = new Date("2026-06-26T23:30:00.000Z"); // 01:30 del 27 in Italia
    expect(oggiInItalia(istante)).toBe("2026-06-27");
    expect(istante.toISOString().slice(0, 10)).toBe("2026-06-26"); // quello che faceva prima
  });

  it("vale anche d'inverno, quando lo scarto è di un'ora sola", () => {
    const istante = new Date("2026-01-15T23:30:00.000Z"); // 00:30 del 16 in Italia
    expect(oggiInItalia(istante)).toBe("2026-01-16");
  });

  it("una sera qualunque resta nel suo giorno", () => {
    expect(oggiInItalia(new Date("2026-09-26T19:00:00.000Z"))).toBe("2026-09-26");
  });
});
