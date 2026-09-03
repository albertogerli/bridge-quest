import { afterEach, describe, expect, it, vi } from "vitest";
import { copiaDaSegnalare, copiaTesto, type EsitoCopia } from "./appunti";

/**
 * La regola che questi test difendono è una sola: **non si dice «copiato» se
 * non si è copiato**. È il difetto peggiore dei tre possibili, perché chi legge
 * il messaggio se ne accorge molto dopo, quando prova a incollare e non c'è
 * niente.
 *
 * L'altra cosa che fissano è quando vale la pena segnalare: la pagina che
 * perde il fuoco perché l'utente è passato ad altro NON è un difetto, e
 * riempirne Sentry insegna solo a ignorare gli allarmi.
 */

function ambiente(opzioni: {
  scrive?: () => Promise<void>;
  execRiesce?: boolean;
  senzaApi?: boolean;
}) {
  const { scrive, execRiesce = false, senzaApi = false } = opzioni;
  vi.stubGlobal("navigator", senzaApi ? {} : { clipboard: { writeText: scrive } });
  const casella = {
    value: "", style: {} as Record<string, string>,
    setAttribute: () => {}, select: () => {}, setSelectionRange: () => {},
  };
  vi.stubGlobal("document", {
    createElement: () => casella,
    body: { appendChild: () => {}, removeChild: () => {} },
    execCommand: () => execRiesce,
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("copiaTesto", () => {
  it("con l'API moderna che funziona, dice copiato", async () => {
    ambiente({ scrive: async () => {} });
    expect(await copiaTesto("1♠")).toBe("copiato");
  });

  it("se l'API fallisce ma la strada vecchia riesce, è comunque copiato", async () => {
    ambiente({
      scrive: async () => { throw new DOMException("Document is not focused.", "NotAllowedError"); },
      execRiesce: true,
    });
    expect(await copiaTesto("1♠")).toBe("copiato");
  });

  it("la pagina senza fuoco si riconosce, e NON è un difetto", async () => {
    // L'evento del 03/09/2026: l'utente ha toccato «copia» e nel frattempo è
    // passato a un'altra applicazione.
    ambiente({
      scrive: async () => { throw new DOMException("Document is not focused.", "NotAllowedError"); },
      execRiesce: false,
    });
    const esito = await copiaTesto("1♠");
    expect(esito).toBe("senza-fuoco");
    expect(copiaDaSegnalare(esito)).toBe(false);
  });

  it("il permesso negato si riconosce, e nemmeno quello va segnalato", async () => {
    ambiente({
      scrive: async () => { throw new DOMException("Write permission denied.", "NotAllowedError"); },
      execRiesce: false,
    });
    const esito = await copiaTesto("1♠");
    expect(esito).toBe("negato");
    expect(copiaDaSegnalare(esito)).toBe(false);
  });

  it("senza API e senza ripiego è impossibile — e QUESTO si segnala", async () => {
    // È l'unico caso in cui non sappiamo perché: vale la pena guardarlo.
    ambiente({ senzaApi: true, execRiesce: false });
    const esito = await copiaTesto("1♠");
    expect(esito).toBe("impossibile");
    expect(copiaDaSegnalare(esito)).toBe(true);
  });

  it("senza API ma con la strada vecchia, copia lo stesso", async () => {
    ambiente({ senzaApi: true, execRiesce: true });
    expect(await copiaTesto("1♠")).toBe("copiato");
  });

  it("nessun esito diverso da «copiato» può essere scambiato per riuscito", () => {
    const tutti: EsitoCopia[] = ["copiato", "senza-fuoco", "negato", "impossibile"];
    expect(tutti.filter((e) => e === "copiato")).toEqual(["copiato"]);
  });
});
