import { describe, expect, it } from "vitest";
import {
  conLingua,
  fuoriDallaTraduzione,
  linguaDaPercorso,
  senzaLingua,
  LINGUA_PREDEFINITA,
} from "./lingua";

describe("linguaDaPercorso", () => {
  it("senza prefisso è italiano", () => {
    for (const p of ["/", "/lezioni", "/gioca/licita", "/profilo"]) {
      expect(linguaDaPercorso(p)).toBe("it");
    }
  });

  it("con /en è inglese", () => {
    for (const p of ["/en", "/en/", "/en/lezioni", "/en/gioca/licita"]) {
      expect(linguaDaPercorso(p)).toBe("en");
    }
  });

  it("una parola che comincia per «en» non è la lingua inglese", () => {
    // `/energia` non è inglese, ed è il difetto che si prende chi confronta
    // con `startsWith("/en")` invece di guardare il primo pezzo.
    expect(linguaDaPercorso("/energia")).toBe("it");
    expect(linguaDaPercorso("/enigmi/1")).toBe("it");
  });

  it("una lingua che non conosciamo resta italiano", () => {
    expect(linguaDaPercorso("/fr/lezioni")).toBe("it");
  });
});

describe("senzaLingua — quello che il router deve vedere", () => {
  it("toglie il prefisso inglese", () => {
    expect(senzaLingua("/en/lezioni")).toBe("/lezioni");
    expect(senzaLingua("/en/gioca/licita")).toBe("/gioca/licita");
  });

  it("«/en» da solo porta alla home, non a un percorso vuoto", () => {
    // Una stringa vuota non è un indirizzo: farebbe fallire la riscrittura.
    expect(senzaLingua("/en")).toBe("/");
    expect(senzaLingua("/en/")).toBe("/");
  });

  it("l'italiano resta com'è", () => {
    expect(senzaLingua("/lezioni")).toBe("/lezioni");
    expect(senzaLingua("/")).toBe("/");
  });
});

describe("conLingua — cambiare lingua restando dove si è", () => {
  it("porta in inglese l'indirizzo corrente", () => {
    expect(conLingua("/gioca/licita", "en")).toBe("/en/gioca/licita");
    expect(conLingua("/", "en")).toBe("/en");
  });

  it("riporta in italiano togliendo il prefisso", () => {
    expect(conLingua("/en/gioca/licita", "it")).toBe("/gioca/licita");
    expect(conLingua("/en", "it")).toBe("/");
  });

  it("chiedere la lingua in cui si è già non cambia niente", () => {
    expect(conLingua("/en/profilo", "en")).toBe("/en/profilo");
    expect(conLingua("/profilo", "it")).toBe("/profilo");
  });

  it("andata e ritorno riportano esattamente al punto di partenza", () => {
    for (const p of ["/", "/lezioni", "/gioca/licita", "/classifica"]) {
      expect(conLingua(conLingua(p, "en"), LINGUA_PREDEFINITA)).toBe(p);
    }
  });
});

describe("fuoriDallaTraduzione", () => {
  it("le API e i file dell'applicazione non prendono la lingua", () => {
    for (const p of ["/api/ben/bid", "/sw.js", "/manifest.json", "/sitemap.xml"]) {
      expect(fuoriDallaTraduzione(p)).toBe(true);
    }
  });

  it("le pagine invece sì", () => {
    for (const p of ["/", "/lezioni", "/glossario", "/gioca"]) {
      expect(fuoriDallaTraduzione(p)).toBe(false);
    }
  });

  it("una pagina che si chiama come un file non viene esclusa per sbaglio", () => {
    // `/apinsegnanti` comincia per «api» ma non è una API.
    expect(fuoriDallaTraduzione("/apinsegnanti")).toBe(false);
  });
});
