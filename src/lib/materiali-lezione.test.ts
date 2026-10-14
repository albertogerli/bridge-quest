import { describe, expect, it } from "vitest";
import {
  aDatetimeLocale,
  daDatetimeLocale,
  eInterno,
  ordinaMateriali,
  raggruppaPerLezione,
  statoMateriale,
  tabellaMancante,
  urlValido,
  type MaterialeLezione,
} from "./materiali-lezione";

function m(p: Partial<MaterialeLezione>): MaterialeLezione {
  return {
    id: p.id ?? "x",
    class_id: "c",
    lesson_id: null,
    lezione: "Lezione 1",
    tipo: "video",
    titolo: "t",
    url: "https://example.org",
    ordine: 0,
    pubblica_dal: null,
    created_at: "2026-10-01T10:00:00Z",
    ...p,
  };
}

describe("statoMateriale", () => {
  const adesso = new Date("2026-10-14T18:00:00Z");
  it("null è nascosto", () => {
    expect(statoMateriale({ pubblica_dal: null }, adesso)).toBe("nascosto");
  });
  it("passato o adesso è pubblicato", () => {
    expect(statoMateriale({ pubblica_dal: "2026-10-14T17:00:00Z" }, adesso)).toBe("pubblicato");
    expect(statoMateriale({ pubblica_dal: "2026-10-14T18:00:00Z" }, adesso)).toBe("pubblicato");
  });
  it("futuro è programmato", () => {
    expect(statoMateriale({ pubblica_dal: "2026-10-21T18:00:00Z" }, adesso)).toBe("programmato");
  });
  it("una data illeggibile non pubblica niente", () => {
    expect(statoMateriale({ pubblica_dal: "boh" }, adesso)).toBe("nascosto");
  });
});

describe("urlValido", () => {
  it("accetta http, https e percorsi interni", () => {
    expect(urlValido("https://www.youtube.com/watch?v=abc")).toBe(true);
    expect(urlValido("HTTP://esempio.it")).toBe(true);
    expect(urlValido("/dispense?corso=fiori")).toBe(true);
    expect(urlValido("/")).toBe(true);
    expect(urlValido("  https://esempio.it  ")).toBe(true);
  });
  it("rifiuta schemi pericolosi, protocollo relativo, spazi e vuoti", () => {
    expect(urlValido("javascript:alert(1)")).toBe(false);
    expect(urlValido("//altro-sito.example")).toBe(false);
    expect(urlValido("www.esempio.it")).toBe(false);
    expect(urlValido("https://esempio.it/a b")).toBe(false);
    expect(urlValido("")).toBe(false);
    expect(urlValido("https://" + "a".repeat(2000))).toBe(false);
  });
  it("eInterno distingue i percorsi del sito", () => {
    expect(eInterno("/dispense")).toBe(true);
    expect(eInterno("//x.it")).toBe(false);
    expect(eInterno("https://x.it")).toBe(false);
  });
});

describe("ordinaMateriali", () => {
  it("video, dispensa, esercizio; poi ordine; poi data", () => {
    const lista = [
      m({ id: "e", tipo: "esercizio" }),
      m({ id: "d2", tipo: "dispensa", ordine: 2 }),
      m({ id: "d1", tipo: "dispensa", ordine: 1 }),
      m({ id: "v2", tipo: "video", created_at: "2026-10-02T00:00:00Z" }),
      m({ id: "v1", tipo: "video", created_at: "2026-10-01T00:00:00Z" }),
    ];
    expect(ordinaMateriali(lista).map((x) => x.id)).toEqual(["v1", "v2", "d1", "d2", "e"]);
  });
});

describe("raggruppaPerLezione", () => {
  const lista = [
    m({ id: "a", lezione: "Lezione 1", tipo: "esercizio", created_at: "2026-10-01T00:00:00Z", pubblica_dal: "2026-10-08T00:00:00Z" }),
    m({ id: "b", lezione: "Lezione 1", tipo: "video", created_at: "2026-10-01T00:00:00Z", pubblica_dal: "2026-10-08T00:00:00Z" }),
    m({ id: "c", lezione: "Lezione 2", tipo: "dispensa", created_at: "2026-09-20T00:00:00Z", pubblica_dal: "2026-10-14T00:00:00Z" }),
  ];
  it("per pubblicazione: la lezione uscita per ultima in cima, materiali in ordine d'uso", () => {
    const g = raggruppaPerLezione(lista, "pubblicazione");
    expect(g.map((x) => x.lezione)).toEqual(["Lezione 2", "Lezione 1"]);
    expect(g[1].materiali.map((x) => x.id)).toEqual(["b", "a"]);
  });
  it("per creazione: in cima quella su cui si è lavorato per ultimi", () => {
    expect(raggruppaPerLezione(lista, "creazione").map((x) => x.lezione)).toEqual(["Lezione 1", "Lezione 2"]);
  });
  it("vuoto resta vuoto", () => {
    expect(raggruppaPerLezione([], "creazione")).toEqual([]);
  });
});

describe("tabellaMancante", () => {
  it("riconosce la tabella che non c'è ancora", () => {
    expect(tabellaMancante({ code: "PGRST205", message: "Could not find the table 'public.materiali_lezione'" })).toBe(true);
    expect(tabellaMancante({ code: "42P01" })).toBe(true);
  });
  it("non scambia per assenza un permesso negato o un vincolo", () => {
    expect(tabellaMancante({ code: "42501", message: "permission denied" })).toBe(false);
    expect(tabellaMancante({ code: "23514" })).toBe(false);
    expect(tabellaMancante(null)).toBe(false);
  });
});

describe("datetime-local", () => {
  it("andata e ritorno nell'ora locale", () => {
    const iso = daDatetimeLocale("2026-10-21T18:30");
    expect(iso).not.toBeNull();
    expect(aDatetimeLocale(iso!)).toBe("2026-10-21T18:30");
  });
  it("un valore vuoto o storto non diventa una data", () => {
    expect(daDatetimeLocale("")).toBeNull();
    expect(daDatetimeLocale("domani")).toBeNull();
  });
});
