import { describe, expect, it } from "vitest";
import { richiestaDaMostrare } from "./richiesta-home";

const nessuna = {
  nonAvviato: false, ospiteDaSalvare: false, senzaCircolo: false, autenticato: false,
};

describe("una richiesta alla volta nella home", () => {
  it("un visitatore che non ha ancora fatto niente non riceve richieste", () => {
    expect(richiestaDaMostrare(nessuna)).toBeNull();
  });

  /**
   * IL CASO CHE HA FATTO NASCERE LA REGOLA: registrato, avviato, senza ASD.
   * Prima vedeva «attiva i promemoria» E «trova un circolo», in fila, più il
   * consenso sovrapposto. Adesso ne vede una, e la più urgente delle due.
   */
  it("registrato e senza circolo: il circolo, non i promemoria", () => {
    expect(richiestaDaMostrare({ ...nessuna, autenticato: true, senzaCircolo: true }))
      .toBe("trova-asd");
  });

  it("registrato e con un circolo: allora i promemoria", () => {
    expect(richiestaDaMostrare({ ...nessuna, autenticato: true })).toBe("notifiche");
  });

  it("chi non ha fatto l'introduzione viene prima di tutto", () => {
    expect(richiestaDaMostrare({
      nonAvviato: true, ospiteDaSalvare: true, senzaCircolo: true, autenticato: true,
    })).toBe("prima-mano");
  });

  it("l'ospite che sta per perdere i progressi viene prima del circolo", () => {
    expect(richiestaDaMostrare({ ...nessuna, ospiteDaSalvare: true, senzaCircolo: true }))
      .toBe("ospite");
  });

  // La prova che conta davvero: qualunque stato, una risposta sola.
  it("non esiste uno stato che ne restituisca due", () => {
    for (let i = 0; i < 16; i++) {
      const esito = richiestaDaMostrare({
        nonAvviato: !!(i & 1), ospiteDaSalvare: !!(i & 2),
        senzaCircolo: !!(i & 4), autenticato: !!(i & 8),
      });
      expect(typeof esito === "string" || esito === null).toBe(true);
    }
  });
});
