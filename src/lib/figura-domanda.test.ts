import { describe, expect, it } from "vitest";
import { carteLeggibili, descriviFigura, leggiFigura, semiDaMostrare } from "./figura-domanda";

describe("la figura di una domanda a scelta", () => {
  it("legge i cinque tipi dei test della Commissione", () => {
    expect(leggiFigura({ tipo: "mano", mano: { S: "J3", H: "QT8732", D: "3", C: "9742" } })?.tipo).toBe("mano");
    expect(leggiFigura({ tipo: "smazzata", N: { S: "KQ43", H: "", D: "65", C: "" }, S: { S: "AJ72", H: "", D: "975", C: "" } })?.tipo).toBe("smazzata");
    expect(leggiFigura({ tipo: "colore", seme: "H", N: "865", W: "…2", E: "KJ4" })).toEqual({ tipo: "colore", seme: "H", N: "865", E: "KJ4", W: "…2" });
    expect(leggiFigura({ tipo: "colori", figure: [{ N: "KJT93", S: "AQ" }] })?.tipo).toBe("colori");
    expect(leggiFigura({ tipo: "confronto", A: { S: "A", H: "KJ54", D: "AKQ", C: "J8763" }, B: { S: "5", H: "AKJ4", D: "A76", C: "KQJ82" } })?.tipo).toBe("confronto");
  });

  it("una figura rotta non rompe la domanda: si legge come nessuna figura", () => {
    expect(leggiFigura(null)).toBeNull();
    expect(leggiFigura({ tipo: "mano", mano: { S: "AK" } })).toBeNull();
    expect(leggiFigura({ tipo: "colore", seme: "Z", N: "AK" })).toBeNull();
    expect(leggiFigura({ tipo: "colore", N: "A<script>" })).toBeNull();
    expect(leggiFigura({ tipo: "smazzata" })).toBeNull();
    expect(leggiFigura({ tipo: "altro" })).toBeNull();
  });

  it("il 10 si scrive per intero e il seme vuoto è un trattino", () => {
    expect(carteLeggibili("AKT2")).toBe("A K 10 2");
    expect(carteLeggibili("…2")).toBe("… 2");
    expect(carteLeggibili("")).toBe("—");
  });

  it("di una smazzata parziale si mostrano solo i semi che il test mostra", () => {
    const n = { S: "KQ43", H: "", D: "9832", C: "" };
    const s = { S: "AJ72", H: "", D: "", C: "" };
    expect(semiDaMostrare([n, s])).toEqual(["S", "D"]);
    expect(semiDaMostrare([{ S: "AJ7", H: "KQT9", D: "K53", C: "QJT8" }, s])).toEqual(["S", "H", "D", "C"]);
  });

  it("si descrive in una riga, con i nomi dei posti tradotti", () => {
    const f = leggiFigura({ tipo: "colore", seme: "H", N: "J43", S: "A8" })!;
    expect(descriviFigura(f)).toBe("Nord: ♥ J 4 3 · Sud: ♥ A 8");
    expect(descriviFigura(f, (s) => ({ Nord: "North", Sud: "South" })[s] ?? s)).toBe("North: ♥ J 4 3 · South: ♥ A 8");
  });
});
