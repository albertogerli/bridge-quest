import { describe, it, expect } from "vitest";
import { describeError, toError } from "./describe-error";

describe("describeError — il caso che ha motivato il file", () => {
  it("legge un errore Supabase, che non è un Error", () => {
    // Evento reale in Sentry l'11/08/2026 dallo scope login:verifica-bbo:
    // arrivò intitolato "Error: [object Object]", senza alcuna informazione.
    const supabase = {
      message: "Failed to fetch",
      code: "PGRST301",
      details: null,
      hint: "Check network",
    };
    const d = describeError(supabase);
    expect(d.message).toBe("Failed to fetch");
    expect(d.context).toMatchObject({ code: "PGRST301", hint: "Check network" });
  });

  it("non produce mai '[object Object]'", () => {
    // La regressione da impedire, su ogni forma di input.
    const campioni: unknown[] = [
      { message: "x" },
      { code: 500 },
      {},
      { a: 1, b: [2, 3] },
      [1, 2, 3],
      new Error("boom"),
      "stringa",
      null,
      undefined,
      42,
      true,
      Symbol("s"),
    ];
    for (const c of campioni) {
      expect(describeError(c).message).not.toContain("[object Object]");
      expect(toError(c).message).not.toContain("[object Object]");
    }
  });
});

describe("describeError — Error veri", () => {
  it("usa il messaggio", () => {
    expect(describeError(new Error("qualcosa è andato storto")).message).toBe(
      "qualcosa è andato storto"
    );
  });

  it("ripiega sul nome se il messaggio è vuoto", () => {
    expect(describeError(new TypeError()).message).toBe("TypeError");
  });

  it("conserva lo stack originale invece di ricrearlo", () => {
    // Ricreare l'Error qui farebbe puntare lo stack a describe-error.ts,
    // nascondendo il punto in cui il problema è nato davvero.
    const originale = new Error("boom");
    expect(toError(originale)).toBe(originale);
  });
});

describe("describeError — oggetti senza messaggio", () => {
  it("serializza l'oggetto invece di arrendersi", () => {
    expect(describeError({ code: 42, stato: "rotto" }).message).toContain("stato");
  });

  it("regge i riferimenti circolari", () => {
    const circolare: Record<string, unknown> = { code: "X" };
    circolare.self = circolare;
    const d = describeError(circolare);
    expect(d.message).toContain("non serializzabile");
    expect(d.context).toMatchObject({ code: "X" });
  });

  it("dice qualcosa di sensato per un oggetto vuoto", () => {
    expect(describeError({}).message).toBe("Errore sconosciuto (oggetto vuoto)");
  });
});

describe("describeError — valori limite", () => {
  it.each([
    [null, "Errore sconosciuto (nessun dettaglio)"],
    [undefined, "Errore sconosciuto (nessun dettaglio)"],
    ["", "Errore senza messaggio"],
  ])("gestisce %s", (input, atteso) => {
    expect(describeError(input).message).toBe(atteso);
  });

  it("tronca i messaggi lunghissimi", () => {
    // Un messaggio enorme in Sentry rende illeggibile l'elenco degli eventi.
    const d = describeError("x".repeat(5000));
    expect(d.message.length).toBeLessThanOrEqual(301);
    expect(d.message.endsWith("…")).toBe(true);
  });

  it("non allega un contesto vuoto", () => {
    expect(describeError(new Error("semplice")).context).toBeUndefined();
    expect(describeError("stringa").context).toBeUndefined();
  });

  it("scarta i campi di contesto vuoti o nulli", () => {
    const d = describeError({ message: "m", code: "C", details: null, hint: "" });
    expect(d.context).toEqual({ code: "C" });
  });
});
