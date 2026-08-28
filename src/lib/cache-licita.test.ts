import { beforeEach, describe, expect, it } from "vitest";
import {
  dichiarazioneNota,
  quanteInCache,
  ricordaDichiarazione,
  svuotaCacheLicita,
} from "./cache-licita";

/**
 * La cache delle dichiarazioni serve a due cose insieme: togliere richieste
 * lunghe (quelle in cui BEN simula, fino a nove secondi, ed è su quelle che
 * Cloudflare ha restituito 502) e dare a tutti lo stesso compagno sulla stessa
 * asta, cosa che in un torneo con un voto è una questione di equità.
 *
 * Le due proprietà da non perdere: non deve crescere all'infinito dentro una
 * funzione che vive a lungo, e non deve MAI ricordare un fallimento — un
 * errore memorizzato diventerebbe un guasto che non passa più.
 */

beforeEach(() => svuotaCacheLicita());

describe("cache delle dichiarazioni", () => {
  it("restituisce quello che ha imparato", () => {
    ricordaDichiarazione("hand=AKQ&seat=N&ctx=", "1N");
    expect(dichiarazioneNota("hand=AKQ&seat=N&ctx=")).toBe("1N");
  });

  it("non inventa niente per una richiesta mai vista", () => {
    expect(dichiarazioneNota("hand=AKQ&seat=N&ctx=1H")).toBeUndefined();
  });

  it("distingue le richieste che differiscono di un solo carattere", () => {
    // `ctx` è la chiave che cambia a ogni dichiarazione: confonderne due
    // vorrebbe dire far dichiarare il compagno sull'asta di un altro.
    ricordaDichiarazione("hand=AKQ&seat=N&ctx=1H--", "2H");
    ricordaDichiarazione("hand=AKQ&seat=N&ctx=1H", "1S");
    expect(dichiarazioneNota("hand=AKQ&seat=N&ctx=1H--")).toBe("2H");
    expect(dichiarazioneNota("hand=AKQ&seat=N&ctx=1H")).toBe("1S");
  });

  it("non ricorda un fallimento", () => {
    ricordaDichiarazione("x", "");
    ricordaDichiarazione("", "1N");
    expect(quanteInCache()).toBe(0);
  });

  it("non cresce oltre la capienza", () => {
    for (let i = 0; i < 900; i++) ricordaDichiarazione(`chiave-${i}`, "P");
    expect(quanteInCache()).toBe(500);
    // Le prime sono state buttate, le ultime ci sono.
    expect(dichiarazioneNota("chiave-0")).toBeUndefined();
    expect(dichiarazioneNota("chiave-899")).toBe("P");
  });

  it("tiene le chiavi richieste spesso e butta quelle dimenticate", () => {
    // Il caso che conta davvero: l'apertura della mano del giorno viene
    // chiesta da tutti, e non deve sparire perché nel frattempo sono passate
    // cinquecento aste diverse.
    ricordaDichiarazione("apertura-del-giorno", "1N");
    for (let i = 0; i < 499; i++) {
      ricordaDichiarazione(`riempitivo-${i}`, "P");
      // Ogni tanto qualcuno ripassa dall'apertura, come in produzione.
      if (i % 50 === 0) expect(dichiarazioneNota("apertura-del-giorno")).toBe("1N");
    }
    for (let i = 499; i < 900; i++) ricordaDichiarazione(`riempitivo-${i}`, "P");
    expect(dichiarazioneNota("apertura-del-giorno")).toBe("1N");
  });

  it("una risposta aggiornata sostituisce la precedente", () => {
    ricordaDichiarazione("k", "1N");
    ricordaDichiarazione("k", "2N");
    expect(dichiarazioneNota("k")).toBe("2N");
    expect(quanteInCache()).toBe(1);
  });
});
