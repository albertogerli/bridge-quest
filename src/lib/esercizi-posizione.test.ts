import { describe, expect, it } from "vitest";
import { normalizzaRisposta, rispostaGiusta } from "./esercizi-posizione";

describe("la risposta dell'allievo", () => {
  /**
   * La stessa dichiarazione si scrive in cinque modi. Segnare errore per la
   * notazione vorrebbe dire insegnare l'ortografia invece del bridge — e
   * l'allievo impara che il programma è capriccioso, non che ha sbagliato.
   */
  it("la notazione non fa differenza", () => {
    for (const scritto of ["3SA", "3sa", "3NT", "3 nt", " 3Sa "]) {
      expect(rispostaGiusta(scritto, ["3SA"]), scritto).toBe(true);
    }
  });

  it("i semi valgono col simbolo, con la lettera e col nome", () => {
    for (const scritto of ["4♠", "4S", "4 picche", "4PICCHE"]) {
      expect(rispostaGiusta(scritto, ["4♠"]), scritto).toBe(true);
    }
  });

  /**
   * Al bridge quasi sempre ci sono due risposte difendibili: segnare errore la
   * seconda insegnerebbe una regola che non esiste.
   */
  it("più risposte accettabili sono tutte giuste", () => {
    expect(rispostaGiusta("4♠", ["3SA", "4♠"])).toBe(true);
    expect(rispostaGiusta("3SA", ["3SA", "4♠"])).toBe(true);
    expect(rispostaGiusta("5♣", ["3SA", "4♠"])).toBe(false);
  });

  it("senza risposte attese è una domanda aperta e va sempre bene", () => {
    // «Come pianifichi il gioco?» non ha una risposta che si possa confrontare
    // con una stringa: la corregge l'insegnante leggendola.
    expect(rispostaGiusta("taglio in mano e poi atout", [])).toBe(true);
  });

  it("normalizza in modo stabile", () => {
    expect(normalizzaRisposta(" 3 nt ")).toBe("3SA");
    expect(normalizzaRisposta("2♥")).toBe("2H");
  });
});
