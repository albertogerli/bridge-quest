import { describe, it, expect } from "vitest";
import { authErrorMessage, isAlreadyRegistered } from "./auth-errors";

describe("authErrorMessage — password compromessa", () => {
  it("traduce il messaggio reale restituito dalla produzione", () => {
    // Testo verificato sul progetto l'11/08/2026 tentando la registrazione con
    // "Password123!" dopo l'attivazione della protezione HaveIBeenPwned.
    const reale = "Password is known to be weak and easy to guess, please choose a different one.";
    const tradotto = authErrorMessage(reale);
    expect(tradotto).toContain("password rubate");
    expect(tradotto).toContain("Scegline un'altra");
  });

  it("dice cosa fare, non solo che è andata male", () => {
    // Il messaggio deve contenere un'istruzione: un utente che legge solo
    // "password non valida" riprova con una variante altrettanto compromessa.
    const msg = authErrorMessage("Password is known to be weak and easy to guess");
    expect(msg.length).toBeGreaterThan(60);
  });

  it("regge formulazioni alternative dello stesso rifiuto", () => {
    // I testi di Supabase cambiano fra versioni: il confronto è per
    // sottostringa proprio per sopravvivere a un ritocco.
    for (const variante of [
      "This password is a leaked password",
      "Password found in pwned passwords database",
      "password is too easy to guess",
    ]) {
      expect(authErrorMessage(variante)).toContain("password rubate");
    }
  });
});

describe("authErrorMessage — altri casi", () => {
  it.each([
    ["Invalid login credentials", "Email o password errati."],
    ["Email not confirmed", "Devi confermare la tua email prima di accedere. Controlla la casella di posta."],
    ["New password should be different from the old password.", "La nuova password deve essere diversa da quella attuale."],
    ["Password should be at least 6 characters.", "La password è troppo corta. Usane una di almeno 6 caratteri."],
    ["Email rate limit exceeded", "Troppi tentativi. Attendi qualche minuto e riprova."],
  ])("traduce %s", (raw, atteso) => {
    expect(authErrorMessage(raw)).toBe(atteso);
  });

  it("non distingue maiuscole e minuscole", () => {
    expect(authErrorMessage("INVALID LOGIN CREDENTIALS")).toBe("Email o password errati.");
  });
});

describe("authErrorMessage — non mostra mai l'inglese grezzo", () => {
  it("usa un messaggio generico per un errore sconosciuto", () => {
    const msg = authErrorMessage("Some brand new failure nobody mapped yet");
    expect(msg).toBe("Si è verificato un errore. Riprova fra qualche istante.");
    expect(msg).not.toContain("brand new failure");
  });

  it("regge input vuoto, null e undefined", () => {
    for (const input of ["", null, undefined]) {
      expect(authErrorMessage(input)).toBe("Si è verificato un errore. Riprova fra qualche istante.");
    }
  });

  it("nessun messaggio tradotto contiene parole inglesi di servizio", () => {
    const campioni = [
      "Password is known to be weak and easy to guess",
      "Invalid login credentials",
      "Email not confirmed",
      "qualcosa di ignoto",
    ];
    for (const c of campioni) {
      expect(authErrorMessage(c)).not.toMatch(/\b(password is|error|invalid|please)\b/i);
    }
  });
});

describe("isAlreadyRegistered", () => {
  it("riconosce l'account già esistente, che la UI tratta a parte", () => {
    expect(isAlreadyRegistered("User already registered")).toBe(true);
    expect(isAlreadyRegistered("ALREADY REGISTERED")).toBe(true);
  });

  it("è falso per gli altri errori e per input vuoti", () => {
    expect(isAlreadyRegistered("Invalid login credentials")).toBe(false);
    expect(isAlreadyRegistered(null)).toBe(false);
    expect(isAlreadyRegistered("")).toBe(false);
  });
});
