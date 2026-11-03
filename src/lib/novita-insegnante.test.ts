import { beforeEach, describe, expect, it, vi } from "vitest";
import { maniConNovita, scrittiPerAllievo, segnaVisto, ultimoMomento, vistoFinoA } from "./novita-insegnante";

const IO = "allievo-1";

describe("scrittiPerAllievo", () => {
  it("tiene i commenti per me e per tutti, e solo le risposte dell'insegnante nel mio filo", () => {
    const s = scrittiPerAllievo(
      [
        { smazzataId: "a", studentId: IO, aggiornato: "2026-11-03T10:00:00+00:00" },
        { smazzataId: "b", studentId: null, aggiornato: "2026-11-03T10:01:00+00:00" },
        { smazzataId: "c", studentId: "altro", aggiornato: "2026-11-03T10:02:00+00:00" },
      ],
      [
        { smazzataId: "d", studentId: IO, dallInsegnante: true, creato: "2026-11-03T10:03:00+00:00" },
        { smazzataId: "e", studentId: IO, dallInsegnante: false, creato: "2026-11-03T10:04:00+00:00" },
        { smazzataId: "f", studentId: "altro", dallInsegnante: true, creato: "2026-11-03T10:05:00+00:00" },
      ],
      IO,
    );
    expect(s.map((x) => x.smazzataId)).toEqual(["a", "b", "d"]);
  });
});

describe("maniConNovita", () => {
  const scritti = [
    { smazzataId: "a", quando: "2026-11-03T10:00:00+00:00" },
    { smazzataId: "b", quando: "2026-11-03T11:00:00+00:00" },
    { smazzataId: "a", quando: "2026-11-03T12:00:00+00:00" },
  ];

  it("mai aperto da qui: tutto è nuovo, ogni mano una volta", () => {
    expect(maniConNovita(scritti, null)).toEqual(["a", "b"]);
  });

  it("solo quello scritto dopo l'ultima cosa vista", () => {
    expect(maniConNovita(scritti, "2026-11-03T11:00:00+00:00")).toEqual(["a"]);
    expect(maniConNovita(scritti, "2026-11-03T12:00:00+00:00")).toEqual([]);
  });

  it("i microsecondi accorciati da Postgres non ingannano il confronto", () => {
    // «.68306» è «.683060»: viene prima di «.683064».
    expect(maniConNovita([{ smazzataId: "a", quando: "2026-11-03T06:15:07.683064+00:00" }], "2026-11-03T06:15:07.68306+00:00")).toEqual(["a"]);
  });
});

describe("segnaVisto", () => {
  beforeEach(() => {
    const m = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
    });
  });

  it("salva l'ultima cosa vista e non torna indietro", () => {
    segnaVisto("c1", [{ smazzataId: "a", quando: "2026-11-03T12:00:00+00:00" }]);
    expect(vistoFinoA("c1")).toBe("2026-11-03T12:00:00+00:00");
    segnaVisto("c1", [{ smazzataId: "a", quando: "2026-11-03T09:00:00+00:00" }]);
    expect(vistoFinoA("c1")).toBe("2026-11-03T12:00:00+00:00");
  });

  it("senza niente da vedere non scrive", () => {
    segnaVisto("c2", []);
    expect(vistoFinoA("c2")).toBeNull();
    expect(ultimoMomento([])).toBeNull();
  });
});
