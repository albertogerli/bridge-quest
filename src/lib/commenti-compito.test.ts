import { describe, expect, it } from "vitest";
import { commentiPerMano, type CommentoCompito } from "./commenti-compito";

const c = (smazzataId: string, studentId: string | null, testo: string): CommentoCompito => ({
  smazzataId,
  studentId,
  testo,
  aggiornato: "2026-10-23T00:00:00Z",
});

describe("commentiPerMano", () => {
  const commenti = [c("m1", null, "per tutti"), c("m1", "a", "per A"), c("m1", "b", "per B"), c("m2", "a", "altra mano")];

  it("dà a ogni allievo il suo commento e quello per tutti", () => {
    expect(commentiPerMano(commenti, "m1", "a")).toEqual({ perTe: "per A", perTutti: "per tutti" });
    expect(commentiPerMano(commenti, "m1", "b")).toEqual({ perTe: "per B", perTutti: "per tutti" });
  });

  it("non mescola le mani", () => {
    expect(commentiPerMano(commenti, "m2", "a")).toEqual({ perTe: "altra mano", perTutti: null });
  });

  it("senza commenti torna null", () => {
    expect(commentiPerMano(commenti, "m1", "c")).toEqual({ perTe: null, perTutti: "per tutti" });
    expect(commentiPerMano([], "m1", "a")).toEqual({ perTe: null, perTutti: null });
  });
});
