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
    text: async () => JSON.stringify(corpo),
  })));
}

/** Una risposta che NON è JSON: il caso che produceva «server (HTTP 502)». */
function rispondiGrezzo(status: number, corpo: string) {
  vi.stubGlobal("fetch", vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => corpo,
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

  it("il numero di BEN resta in chiaro nel dettaglio", async () => {
    // Il dettaglio è quello che rende una segnalazione leggibile: senza, il
    // solo «server» copre il modello spento e il segreto sbagliato insieme.
    rispondi(502, { fallback: true, error: "BEN returned 500" });
    const r = await chiedi();
    expect(r.dettaglio).toBe("BEN returned 500");
    // 500 è un 5xx: transitorio, quindi riprovare va offerto.
    expect(r.motivo).toBe("attesa");
  });

  it("«ben unavailable» e «ben timeout» sono ATTESE, non guasti del motore", async () => {
    // Sono i due messaggi della guardia davanti a BEN. Arrivano con 502/504,
    // e leggerli come «errore del server» toglieva il pulsante Riprova —
    // proprio nel caso in cui riprovare funziona, cioè al risveglio del
    // contenitore: subito dopo le stesse richieste rispondono in mezzo secondo.
    rispondi(502, { fallback: true, error: "BEN returned 502: {\"error\":\"ben unavailable\"}" });
    let r = await chiedi();
    expect(r.motivo).toBe("attesa");
    expect(riprovareServe(r.motivo!)).toBe(true);

    rispondi(502, { fallback: true, error: "BEN returned 504: {\"error\":\"ben timeout\"}" });
    r = await chiedi();
    expect(r.motivo).toBe("attesa");
    expect(riprovareServe(r.motivo!)).toBe(true);
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

  it("un corpo che non è JSON non si butta via: diventa il dettaglio", async () => {
    // Prima finiva tutto in un «HTTP 502» che non diceva niente, e ha portato
    // a tre giri di indagine su una causa che il corpo aveva già scritta.
    rispondiGrezzo(502, "<html><body>An error occurred with your deployment</body></html>");
    const r = await chiedi();
    expect(r.dettaglio).toContain("An error occurred");
    expect(r.motivo).toBe("attesa");
  });

  it("un 502 che non sappiamo spiegare offre comunque di riprovare", async () => {
    // IL DANNO NON È SIMMETRICO: un «riprova» inutile costa un tocco, un
    // «riprova» mancante lascia la mano bloccata e l'esercizio finito lì.
    rispondiGrezzo(502, "");
    const r = await chiedi();
    expect(r.motivo).toBe("attesa");
    expect(riprovareServe(r.motivo!)).toBe(true);
    expect(r.dettaglio).toBe("HTTP 502 senza corpo");
  });

  it("un 5xx del motore è transitorio, non un guasto da arrendersi", async () => {
    rispondi(502, { fallback: true, error: "BEN returned 503: service unavailable" });
    const r = await chiedi();
    expect(r.motivo).toBe("attesa");
    expect(riprovareServe(r.motivo!)).toBe(true);
  });

  it("ma un 4xx del motore resta un errore che riprovare non risolve", async () => {
    rispondi(502, { fallback: true, error: "BEN returned 400: auction and seat do not match" });
    const r = await chiedi();
    expect(r.motivo).toBe("server");
    expect(riprovareServe(r.motivo!)).toBe(false);
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
