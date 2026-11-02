import { describe, expect, it } from "vitest";
import { domandeDaTest, esercizioDaDomanda, problemiDomanda, type BozzaDomanda } from "./domande-scelta";

const base: BozzaDomanda = {
  titolo: "",
  gruppo: "Test 1",
  domanda: "Quand'è che il primo di mano scarta?",
  opzioni: ["Mai", "Quando non ha più carte del seme", "Quando vuole"],
  giuste: ["Mai"],
  soluzione: "",
};

describe("problemiDomanda", () => {
  it("una domanda completa si può salvare", () => {
    expect(problemiDomanda(base)).toEqual([]);
  });
  it("senza risposta giusta no: direbbe «giusto» a tutto", () => {
    expect(problemiDomanda({ ...base, giuste: [] })).toContain("Indica almeno una risposta giusta.");
  });
  it("la risposta giusta deve essere una delle opzioni", () => {
    expect(problemiDomanda({ ...base, giuste: ["Sempre"] })).toContain("Una risposta giusta non è fra le opzioni.");
  });
  it("servono due opzioni diverse", () => {
    expect(problemiDomanda({ ...base, opzioni: ["Mai", " "] })).toContain("Servono almeno due risposte fra cui scegliere.");
    expect(problemiDomanda({ ...base, opzioni: ["Mai", "mai"] })).toContain("Due risposte sono uguali.");
  });
});

describe("esercizioDaDomanda", () => {
  it("è un esercizio «scelta» senza mano, con le opzioni e le giuste", () => {
    const e = esercizioDaDomanda({ ...base, opzioni: [...base.opzioni, ""] });
    expect(e.consegna).toBe("scelta");
    expect(e.hands).toEqual({});
    expect(e.opzioni).toEqual(base.opzioni);
    expect(e.risposte).toEqual(["Mai"]);
    expect(e.titolo).toBe("Quand'è che il primo di mano scarta?");
  });
});

describe("domandeDaTest", () => {
  it("legge un test trascritto e scarta le domande senza soluzione", () => {
    const r = domandeDaTest(JSON.stringify({
      titolo: "Test 1",
      domande: [
        { numero: "1.1", testo: "Domanda uno?", opzioni: ["A", "B"], giusta: "B" },
        { numero: "1.2", testo: "Domanda due?", opzioni: ["A", "B"] },
      ],
    }));
    expect(r.errore).toBeNull();
    expect(r.scartate).toBe(1);
    expect(r.domande).toHaveLength(1);
    expect(r.domande[0]).toMatchObject({ titolo: "Test 1 · 1.1", gruppo: "Test 1", giuste: ["B"] });
  });
  it("dice che cosa non va nel testo incollato", () => {
    expect(domandeDaTest("non json").errore).toBe("Il testo incollato non è un JSON valido.");
    expect(domandeDaTest("{}").errore).toBe("Manca l'elenco «domande».");
  });
});
