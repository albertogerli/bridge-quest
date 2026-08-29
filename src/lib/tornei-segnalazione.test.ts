import { describe, expect, it } from "vitest";
import { vaSegnalato } from "./mani-condivise";

/**
 * Quali errori dei tornei meritano un allarme.
 *
 * Le funzioni dei tornei sono concesse al solo ruolo `authenticated`: chi non
 * ha più l'accesso — la sessione scade mentre la pagina resta aperta — riceve
 * «permission denied for function torneo_corrente». È il comportamento voluto,
 * e finiva in Sentry come errore.
 *
 * IL CONFINE DA NON SBAGLIARE. Zittire i «permission denied» in blocco sarebbe
 * comodo e pericoloso: il 20/08/2026 uno di quelli era un difetto vero — il
 * profilo non si salvava per un privilegio mancante — e nasconderlo sarebbe
 * costato giorni. La differenza la fa la sessione.
 */
describe("vaSegnalato", () => {
  const rifiuto = { message: "permission denied for function torneo_corrente" };

  it("tace quando il rifiuto arriva a chi non ha l'accesso", () => {
    expect(vaSegnalato(rifiuto, false)).toBe(false);
  });

  it("PARLA quando il rifiuto arriva a chi la sessione ce l'ha", () => {
    // Questo è il caso che non va perso: privilegi configurati male.
    expect(vaSegnalato(rifiuto, true)).toBe(true);
  });

  it("parla per qualunque altro errore, con o senza sessione", () => {
    const altro = { message: "duplicate key value violates unique constraint" };
    expect(vaSegnalato(altro, false)).toBe(true);
    expect(vaSegnalato(altro, true)).toBe(true);
  });

  it("regge errori che non sono oggetti con messaggio", () => {
    expect(vaSegnalato("permission denied for function x", false)).toBe(false);
    expect(vaSegnalato(new Error("permission denied"), false)).toBe(false);
    expect(vaSegnalato(null, false)).toBe(true);
    expect(vaSegnalato(undefined, true)).toBe(true);
  });
});
