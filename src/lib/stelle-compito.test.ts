import { describe, expect, it } from "vitest";
import { stelleAssegnate, votoMano, type StelleAssegnate } from "./stelle-compito";

describe("votoMano", () => {
  it("il voto dell'insegnante vince su quello del programma", () => {
    expect(votoMano({ automatiche: 1, insegnante: 3, soloInsegnante: false })).toEqual({
      stelle: 3,
      dallInsegnante: true,
      riuscita: true,
    });
    expect(votoMano({ automatiche: 3, insegnante: 1, soloInsegnante: false })).toEqual({
      stelle: 1,
      dallInsegnante: true,
      riuscita: false,
    });
  });

  it("zero stelle dell'insegnante sono un voto, non un'assenza", () => {
    expect(votoMano({ automatiche: 3, insegnante: 0, soloInsegnante: true })).toEqual({
      stelle: 0,
      dallInsegnante: true,
      riuscita: false,
    });
  });

  it("con «le assegno io» e nessun voto si aspetta l'insegnante", () => {
    expect(votoMano({ automatiche: 3, insegnante: null, soloInsegnante: true })).toEqual({
      stelle: null,
      dallInsegnante: false,
      riuscita: null,
    });
  });

  it("altrimenti vale il programma, riuscita da due stelle", () => {
    expect(votoMano({ automatiche: 2, insegnante: null, soloInsegnante: false }).riuscita).toBe(true);
    expect(votoMano({ automatiche: 1.5, insegnante: null, soloInsegnante: false }).riuscita).toBe(false);
  });
});

describe("stelleAssegnate", () => {
  const elenco: StelleAssegnate[] = [
    { smazzataId: "m1", studentId: "a", stelle: 2.5 },
    { smazzataId: "m2", studentId: "a", stelle: 0 },
  ];

  it("trova le stelle dell'allievo su quella mano", () => {
    expect(stelleAssegnate(elenco, "m1", "a")).toBe(2.5);
    expect(stelleAssegnate(elenco, "m2", "a")).toBe(0);
  });

  it("null se non ci sono, se manca la tabella o l'allievo", () => {
    expect(stelleAssegnate(elenco, "m1", "b")).toBeNull();
    expect(stelleAssegnate(null, "m1", "a")).toBeNull();
    expect(stelleAssegnate(elenco, "m1", null)).toBeNull();
  });
});
