import { describe, expect, it } from "vitest";
import { linkInvito, messaggioInvito, normalizzaCodice } from "./codice-amico";

/**
 * Il codice viene DETTATO e TRASCRITTO da persone che non stanno guardando lo
 * schermo. Tutto quello che si può perdonare a chi lo scrive, va perdonato.
 */
describe("normalizzaCodice", () => {
  it("perdona spazi, minuscole e trattini", () => {
    expect(normalizzaCodice(" a b-c d e f ")).toBe("ABCDEF");
    expect(normalizzaCodice("abc-def")).toBe("ABCDEF");
  });

  it("taglia a sei caratteri", () => {
    expect(normalizzaCodice("ABCDEFGHIJ")).toBe("ABCDEF");
  });

  it("scarta la punteggiatura che il correttore aggiunge", () => {
    expect(normalizzaCodice("ABC.DEF!")).toBe("ABCDEF");
  });

  it("su una stringa vuota non esplode", () => {
    expect(normalizzaCodice("")).toBe("");
    expect(normalizzaCodice("   ")).toBe("");
  });
});

describe("linkInvito", () => {
  it("usa l'origine passata, non un dominio scritto a mano", () => {
    // In anteprima e in locale il dominio è diverso: un link fisso manderebbe
    // chi prova la piattaforma sul sito di produzione.
    expect(linkInvito("https://bridgelab.it", "ABC234")).toBe(
      "https://bridgelab.it/amici?codice=ABC234"
    );
    expect(linkInvito("http://localhost:3000", "ABC234")).toContain("localhost:3000");
  });
});

describe("messaggioInvito", () => {
  it("nomina chi invita, quando lo si conosce", () => {
    const m = messaggioInvito("Mario", "https://x/y");
    expect(m).toContain("Mario ti invita");
    expect(m).toContain("https://x/y");
  });

  it("regge un profilo senza nome", () => {
    expect(messaggioInvito(null, "https://x/y")).toContain("Ti invito");
  });
});
