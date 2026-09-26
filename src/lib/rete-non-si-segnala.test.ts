import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { segnalaSalvoRete } from "./report-error";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

/**
 * La rete caduta non arriva a Sentry, e non perché ci si ricordi di scriverlo.
 *
 * COSA È SUCCESSO. Il rimedio era `if (!eDiRete(e)) reportError(...)`, scritto
 * a mano punto per punto. Funziona dove c'è. Una scansione del 26/09/2026 ha
 * trovato CENTOVENTI chiamate a `reportError` sull'errore di una chiamata
 * Supabase senza quella guardia — e infatti in un giorno solo sono arrivate
 * quattro segnalazioni da /admin, /gioca/sfida-imp, /login e prima ancora
 * licita-amico, tutte con dentro «Load failed» e nessun difetto.
 *
 * Una regola che va ricordata centoventi volte non è una regola, è una
 * probabilità. Ora c'è `segnalaSalvoRete`, e questo test è quello che la
 * rende una regola.
 *
 * COSA CONTROLLA. Che nessuna chiamata a `reportError` stia entro dodici righe
 * da una chiamata a Supabase. Dodici righe è una euristica, non una prova: può
 * lasciar passare qualcosa e può segnalare un caso legittimo. Per il secondo
 * c'è l'elenco delle eccezioni qui sotto, che va allungato con un motivo
 * scritto accanto.
 */
const RADICE = join(__dirname, "..");
const CHIAMATA_SUPABASE = /(await\s+supabase|supabase\s*\.\s*(from|rpc|auth|channel)|\.rpc\()/;
const FINESTRA = 12;

/** Punti in cui `reportError` accanto a Supabase è quello che si vuole. */
const ECCEZIONI: string[] = [
  // Nessuna, per ora. Chi ne aggiunge una scriva qui perché quell'errore
  // deve arrivare a Sentry anche quando è la rete.
];

function sorgenti(dir: string): string[] {
  const trovati: string[] = [];
  for (const voce of readdirSync(dir, { withFileTypes: true })) {
    const percorso = join(dir, voce.name);
    if (voce.isDirectory()) trovati.push(...sorgenti(percorso));
    else if (/\.tsx?$/.test(voce.name) && !/\.test\.tsx?$/.test(voce.name)) trovati.push(percorso);
  }
  return trovati;
}

describe("gli errori di rete non si segnalano a Sentry", () => {
  it("nessun reportError nudo su una chiamata Supabase", () => {
    const colpevoli: string[] = [];
    for (const f of sorgenti(RADICE)) {
      if (f.endsWith("report-error.ts")) continue;
      const sorgente = readFileSync(f, "utf8");
      if (!sorgente.includes("supabase") && !sorgente.includes("createClient")) continue;
      const righe = sorgente.split("\n");
      righe.forEach((riga, i) => {
        if (!/reportError\(\s*"/.test(riga)) return;
        const intorno = righe.slice(Math.max(0, i - FINESTRA), i + 1).join("\n");
        if (!CHIAMATA_SUPABASE.test(intorno)) return;
        const punto = `${f.slice(RADICE.length + 1)}:${i + 1}`;
        if (ECCEZIONI.includes(punto)) return;
        colpevoli.push(punto);
      });
    }
    expect(
      colpevoli,
      "Su un errore che può venire dalla rete si usa segnalaSalvoRete(), non " +
        "reportError(): la console la vede lo stesso, Sentry no. Se l'errore " +
        "deve arrivare comunque, aggiungi il punto a ECCEZIONI con il motivo.",
    ).toEqual([]);
  });

  it("segnalaSalvoRete lascia passare un errore del database", () => {
    const spia = vi.spyOn(console, "error").mockImplementation(() => {});
    segnalaSalvoRete("prova:db", { message: "permission denied for table profiles" });
    expect(spia).toHaveBeenCalled();
    spia.mockRestore();
  });

  it("segnalaSalvoRete ferma la rete, ma la scrive in console", () => {
    const errori = vi.spyOn(console, "error").mockImplementation(() => {});
    const avvisi = vi.spyOn(console, "warn").mockImplementation(() => {});
    segnalaSalvoRete("prova:rete", { message: "TypeError: Load failed" });
    expect(errori).not.toHaveBeenCalled();
    expect(avvisi).toHaveBeenCalled();
    errori.mockRestore();
    avvisi.mockRestore();
  });
});
