import { describe, expect, it } from "vitest";
import { aspettaRisposta, domandeInAttesa, filoDellaMano, type MessaggioCompito } from "./messaggi-compito";

const m = (
  id: string,
  smazzataId: string,
  studentId: string,
  dallInsegnante: boolean,
  creato: string,
): MessaggioCompito => ({ id, smazzataId, studentId, dallInsegnante, testo: id, creato });

const messaggi = [
  m("a1", "m1", "anna", false, "2026-10-27T10:00:00Z"),
  m("a2", "m1", "anna", true, "2026-10-27T11:00:00Z"),
  m("b1", "m1", "bruno", false, "2026-10-27T09:00:00Z"),
  m("a3", "m2", "anna", false, "2026-10-27T12:00:00Z"),
];

describe("filoDellaMano", () => {
  it("prende solo i messaggi di quell'allievo su quella mano", () => {
    expect(filoDellaMano(messaggi, "m1", "anna").map((x) => x.id)).toEqual(["a1", "a2"]);
    expect(filoDellaMano(messaggi, "m1", "bruno").map((x) => x.id)).toEqual(["b1"]);
  });

  it("vuoto senza tabella o senza allievo", () => {
    expect(filoDellaMano(null, "m1", "anna")).toEqual([]);
    expect(filoDellaMano(messaggi, "m1", null)).toEqual([]);
  });
});

describe("aspettaRisposta", () => {
  it("sì se l'ultimo a scrivere è l'allievo", () => {
    expect(aspettaRisposta(filoDellaMano(messaggi, "m1", "bruno"))).toBe(true);
  });

  it("no se ha già risposto l'insegnante, o se il filo è vuoto", () => {
    expect(aspettaRisposta(filoDellaMano(messaggi, "m1", "anna"))).toBe(false);
    expect(aspettaRisposta([])).toBe(false);
  });
});

describe("domandeInAttesa", () => {
  it("una voce per filo senza risposta, la più vecchia prima", () => {
    expect(domandeInAttesa(messaggi).map((d) => d.ultima.id)).toEqual(["b1", "a3"]);
  });

  it("niente senza tabella", () => {
    expect(domandeInAttesa(null)).toEqual([]);
  });
});
