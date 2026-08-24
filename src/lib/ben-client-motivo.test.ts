import { afterEach, describe, expect, it, vi } from "vitest";
import { benBid, riprovareServe } from "./ben-client";
import type { Card } from "./bridge-engine";

/**
 * Il MOTIVO per cui il motore non ha dichiarato.
 *
 * Prima usciva un `fallback: true` identico per otto cause diverse, e la
 * schermata ne concludeva sempre «non ha risposto in tempo». Nel torneo di
 * licita questo produceva un blocco con un pulsante «Riprova» che, per metà
 * delle cause, non poteva funzionare — e nel caso del limite di richieste era
 * proprio il riprovare a causare l'errore successivo.
 *
 * Questi test fissano la sola cosa che conta per chi legge la schermata: da
 * quale risposta del server nasce quale motivo, e quali motivi rendono
 * sensato riprovare.
 */

const MANO: Card[] = [
  { suit: "spade", rank: "A" }, { suit: "spade", rank: "K" }, { suit: "spade", rank: "Q" },
  { suit: "heart", rank: "J" }, { suit: "heart", rank: "10" }, { suit: "heart", rank: "9" },
  { suit: "diamond", rank: "8" }, { suit: "diamond", rank: "7" }, { suit: "diamond", rank: "6" },
  { suit: "club", rank: "5" }, { suit: "club", rank: "4" }, { suit: "club", rank: "3" },
  { suit: "club", rank: "2" },
];

function rispondi(status: number, corpo: unknown) {
  vi.stubGlobal("fetch", vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => corpo,
  })));
}

const chiedi = () =>
  benBid({ hand: MANO, seat: "north", dealer: "north", vulnerability: "none" });

afterEach(() => vi.unstubAllGlobals());

describe("benBid: da che cosa nasce il motivo", () => {
  it("401 è la sessione scaduta, non un'attesa", async () => {
    rispondi(401, { fallback: true, error: "Non autenticato" });
    expect(await chiedi()).toMatchObject({ fallback: true, motivo: "sessione" });
  });

  it("429 è il limite di richieste", async () => {
    // Il caso peggiore da confondere con un'attesa: qui è il RIPROVA stesso
    // ad averlo causato, e riproporlo peggiora la situazione.
    rispondi(429, { fallback: true, error: "Troppe richieste" });
    expect(await chiedi()).toMatchObject({ fallback: true, motivo: "limite" });
  });

  it("400 è un difetto nostro, non del motore", async () => {
    rispondi(400, { fallback: true, error: "Parametri non validi" });
    expect(await chiedi()).toMatchObject({ fallback: true, motivo: "richiesta" });
  });

  it("distingue l'attesa scaduta dal server spento", async () => {
    rispondi(502, { fallback: true, error: "BEN timeout" });
    expect((await chiedi()).motivo).toBe("attesa");
    rispondi(502, { fallback: true, error: "BEN non raggiungibile" });
    expect((await chiedi()).motivo).toBe("irraggiungibile");
  });

  it("BEN che risponde con un errore suo è «server», col numero in chiaro", async () => {
    rispondi(502, { fallback: true, error: "BEN returned 500" });
    const r = await chiedi();
    expect(r.motivo).toBe("server");
    // Il dettaglio è quello che rende una segnalazione leggibile: senza, il
    // solo «server» copre il modello spento e il segreto sbagliato insieme.
    expect(r.dettaglio).toBe("BEN returned 500");
  });

  it("il 404 della guardia è configurazione, non un guasto di BEN", async () => {
    // `deploy/ben-railway/guard.py` risponde 404 — non 401 — a chi non ha il
    // segreto giusto, per non confermare che ci sia qualcosa da indovinare.
    // Confonderlo con «BEN sta male» manda a cercare nel posto sbagliato.
    rispondi(502, { fallback: true, error: "BEN returned 404" });
    const r = await chiedi();
    expect(r.motivo).toBe("autorizzazione");
    expect(riprovareServe(r.motivo!)).toBe(false);
  });

  it("una risposta che non è una dichiarazione è «risposta»", async () => {
    rispondi(502, { fallback: true, error: "Risposta di BEN non valida" });
    expect((await chiedi()).motivo).toBe("risposta");
  });

  it("la rete caduta nel browser è «rete»", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    expect(await chiedi()).toMatchObject({ fallback: true, motivo: "rete" });
  });

  it("una dichiarazione buona non ha motivo e arriva in italiano", async () => {
    rispondi(200, { bid: "1S", fallback: false });
    expect(await chiedi()).toEqual({ bid: "1♠", fallback: false });
  });

  it("regge un corpo che non è JSON", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: false,
      status: 502,
      json: async () => { throw new SyntaxError("Unexpected token"); },
    })));
    expect(await chiedi()).toMatchObject({ fallback: true, motivo: "server" });
  });
});

describe("riprovareServe", () => {
  it("sì dove la causa può cambiare da sola", () => {
    expect(riprovareServe("attesa")).toBe(true);
    expect(riprovareServe("rete")).toBe(true);
    expect(riprovareServe("irraggiungibile")).toBe(true);
  });

  it("no dove riprovare darebbe lo stesso errore — o lo peggiorerebbe", () => {
    expect(riprovareServe("limite")).toBe(false);
    expect(riprovareServe("sessione")).toBe(false);
    expect(riprovareServe("richiesta")).toBe(false);
    expect(riprovareServe("server")).toBe(false);
    expect(riprovareServe("risposta")).toBe(false);
  });
});
