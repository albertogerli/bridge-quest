import { describe, expect, it } from "vitest";
import { destinazioneIndietro } from "./navigazione-indietro";

/**
 * Il ritorno deve portare dove la persona si aspetta, e la trappola è una
 * sola: sotto `/istruttori` convivono le classi (`/istruttori/<uuid>`) e gli
 * strumenti (`/istruttori/studio`), che nell'indirizzo si somigliano. Se uno
 * strumento nuovo non viene aggiunto all'elenco, finisce fra le classi e il
 * ritorno porta al posto sbagliato — senza che niente si rompa, che è il modo
 * peggiore di sbagliare.
 */

const CLASSE = "3f9a2c10-5b7e-4d21-9c33-0a1b2c3d4e5f";

describe("destinazioneIndietro — area insegnante", () => {
  it("dalle pagine di una classe si torna alla classe", () => {
    for (const sotto of ["allievi", "aula", "locandina", "nuovo-compito", "tagliandi"]) {
      expect(destinazioneIndietro(`/istruttori/${CLASSE}/${sotto}`)).toEqual({
        href: `/istruttori/${CLASSE}`,
        etichetta: "Torna alla classe",
      });
    }
  });

  it("dal compito di una classe si torna alla classe, non all'elenco dei compiti", () => {
    expect(destinazioneIndietro(`/istruttori/${CLASSE}/compito/abc-123`)?.href).toBe(
      `/istruttori/${CLASSE}`,
    );
  });

  it("dalla classe si torna alle classi", () => {
    expect(destinazioneIndietro(`/istruttori/${CLASSE}`)).toEqual({
      href: "/istruttori",
      etichetta: "Torna alle classi",
    });
  });

  it("dagli strumenti si torna al portale, non a una classe inesistente", () => {
    // La trappola: «studio» ha la stessa forma di un identificativo di classe.
    for (const strumento of [
      "archivio", "combinazione", "dispensa", "genera-mani",
      "lavagna", "libreria", "studio", "tavolo",
    ]) {
      expect(destinazioneIndietro(`/istruttori/${strumento}`)).toEqual({
        href: "/istruttori",
        etichetta: "Torna al portale",
      });
    }
  });

  it("il portale non ha un ritorno: è la radice dell'area", () => {
    expect(destinazioneIndietro("/istruttori")).toBeNull();
  });

  it("la proiezione non ha ritorno: sta sul videoproiettore", () => {
    // Un pulsante lì è solo qualcosa da premere per sbaglio mentre si spiega.
    expect(destinazioneIndietro("/istruttori/proiezione")).toBeNull();
  });
});

describe("destinazioneIndietro — area allievo", () => {
  it("dalle pagine di una classe si torna alla classe", () => {
    expect(destinazioneIndietro(`/classi/${CLASSE}/tavolo`)?.href).toBe(`/classi/${CLASSE}`);
    expect(destinazioneIndietro(`/classi/${CLASSE}/compito/x`)?.href).toBe(`/classi/${CLASSE}`);
    expect(destinazioneIndietro(`/classi/${CLASSE}/esercizio/y`)?.href).toBe(`/classi/${CLASSE}`);
  });

  it("dalla classe si torna alle proprie classi", () => {
    expect(destinazioneIndietro(`/classi/${CLASSE}`)).toEqual({
      href: "/classi",
      etichetta: "Torna alle mie classi",
    });
  });

  it("l'elenco delle classi non ha ritorno", () => {
    expect(destinazioneIndietro("/classi")).toBeNull();
  });
});

describe("destinazioneIndietro — il resto del portale non è toccato", () => {
  it("fuori dalle classi non compare niente", () => {
    for (const p of ["/", "/gioca", "/gioca/torneo-licita", "/impara", "/profilo", "/lezioni/3"]) {
      expect(destinazioneIndietro(p)).toBeNull();
    }
  });

  it("regge barre finali e parametri", () => {
    expect(destinazioneIndietro(`/istruttori/${CLASSE}/allievi/`)?.href).toBe(
      `/istruttori/${CLASSE}`,
    );
    expect(destinazioneIndietro("/istruttori/dispensa?compito=abc")?.href).toBe("/istruttori");
  });

  it("non esplode su percorsi vuoti o strani", () => {
    expect(destinazioneIndietro("")).toBeNull();
    expect(destinazioneIndietro("/")).toBeNull();
    expect(destinazioneIndietro("///")).toBeNull();
  });
});
