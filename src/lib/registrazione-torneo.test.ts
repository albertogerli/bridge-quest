import { describe, expect, it } from "vitest";
import {
  contatoreCresce,
  manoArchiviata,
  type EsitoRegistrazione,
} from "./mani-condivise";

/**
 * Quando la schermata può considerare la mano ARCHIVIATA.
 *
 * IL GUASTO CHE QUESTE REGOLE IMPEDISCONO è quello che non si vede: prima il
 * contatore delle mani cresceva comunque, quindi con la sessione scaduta o un
 * errore di scrittura la mano risultava fatta a schermo e non esisteva da
 * nessuna parte. L'utente lo scopriva solo dalla classifica, giorni dopo, e
 * non c'era modo di rimediare perché la mano era già passata.
 *
 * Le due decisioni sono DIVERSE e vanno tenute separate:
 *   · si può passare alla mano dopo?  (la riga c'è nel database?)
 *   · il contatore va incrementato?   (l'abbiamo scritta NOI adesso?)
 *
 * Il secondo caso è il doppio tocco: la riga c'è, ma l'ha messa il primo
 * tocco. Contarla di nuovo farebbe saltare una mano del torneo.
 */

describe("quando la mano si può considerare fatta", () => {
  it("salvata adesso: si avanza e si conta", () => {
    expect(manoArchiviata("salvato")).toBe(true);
    expect(contatoreCresce("salvato")).toBe(true);
  });

  it("doppio tocco: si avanza ma NON si conta due volte", () => {
    // La riga c'è già, messa dal primo tocco. Contarla di nuovo farebbe
    // saltare una mano: il torneo ne crederebbe fatte due.
    expect(manoArchiviata("gia-presente")).toBe(true);
    expect(contatoreCresce("gia-presente")).toBe(false);
  });

  it("sessione scaduta: NON si avanza, niente è stato scritto", () => {
    expect(manoArchiviata("sessione-scaduta")).toBe(false);
    expect(contatoreCresce("sessione-scaduta")).toBe(false);
  });

  it("errore di scrittura: NON si avanza", () => {
    expect(manoArchiviata("errore")).toBe(false);
    expect(contatoreCresce("errore")).toBe(false);
  });

  it("ogni esito è coperto: nessuno resta senza decisione", () => {
    // Se domani si aggiunge un esito, TypeScript non lo segnalerebbe qui —
    // le due funzioni tornano `false` in silenzio, e il silenzio significa
    // «non avanzare», che è la scelta prudente ma va notata.
    const tutti: EsitoRegistrazione[] = [
      "salvato",
      "gia-presente",
      "sessione-scaduta",
      "errore",
    ];
    expect(tutti.filter(manoArchiviata)).toEqual(["salvato", "gia-presente"]);
    expect(tutti.filter(contatoreCresce)).toEqual(["salvato"]);
  });
});
