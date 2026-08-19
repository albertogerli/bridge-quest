import { describe, expect, it } from "vitest";
import { espandiSemi } from "./note-smazzate";

describe("le scorciatoie dei semi", () => {
  /**
   * Sulla tastiera italiana i simboli dei semi non ci sono, e un insegnante
   * che scrive «picche» dieci volte per riga smette di scrivere note.
   */
  it("trasformano due caratteri in un simbolo", () => {
    expect(espandiSemi("Attacco !s A")).toBe("Attacco ♠ A");
    expect(espandiSemi("!h !d !c")).toBe("♥ ♦ ♣");
  });

  it("valgono anche con le iniziali italiane", () => {
    expect(espandiSemi("!p !q !f")).toBe("♠ ♦ ♣");
  });

  it("più occorrenze nella stessa riga", () => {
    expect(espandiSemi("!s poi !s")).toBe("♠ poi ♠");
  });

  it("un testo senza scorciatoie non cambia", () => {
    expect(espandiSemi("Taglia in mano e poi tira atout")).toBe(
      "Taglia in mano e poi tira atout",
    );
  });
});
