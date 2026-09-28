import { describe, expect, it } from "vitest";
import { statisticheRisposte } from "./statistiche-risposte";

const r = (student: string, risposta: string, es = "e1") => ({ student_id: student, smazzata_id: es, details: { risposta } });

describe("statistiche delle risposte", () => {
  it("raggruppa le scritture diverse della stessa dichiarazione", () => {
    const s = statisticheRisposte([r("a", "3SA"), r("b", "3sa"), r("c", "3NT"), r("d", "3♥"), r("e", "2SA")], "e1", ["3SA"]);
    expect(s.totale).toBe(5);
    expect(s.giuste).toBe(3);
    expect(s.voci[0]).toMatchObject({ n: 3, giusta: true });
    expect(s.voci[0].quota).toBeCloseTo(0.6);
    expect(s.voci.map((v) => v.giusta)).toEqual([true, false, false]);
  });

  it("conta la prima risposta di ogni allievo, non i tentativi dopo", () => {
    const s = statisticheRisposte([r("a", "2SA"), r("a", "3SA")], "e1", ["3SA"]);
    expect(s.totale).toBe(1);
    expect(s.giuste).toBe(0);
  });

  it("ignora gli altri esercizi e le righe senza risposta", () => {
    const s = statisticheRisposte([r("a", "3SA", "e2"), { student_id: "b", smazzata_id: "e1", details: null }], "e1", ["3SA"]);
    expect(s).toEqual({ totale: 0, giuste: 0, voci: [] });
  });

  it("domanda aperta: nessuna risposta attesa, nessuna è sbagliata", () => {
    const s = statisticheRisposte([r("a", "passo"), r("b", "contro")], "e1", []);
    expect(s.giuste).toBe(2);
  });
});
