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

/**
 * QUATTRO BUCHI IN UN GIORNO, tutti nel rilevatore e non nel codice sorvegliato.
 *
 * La prima versione cercava `reportError("` riga per riga, nei soli file che
 * contenessero la parola «supabase». Il 27/09/2026 è arrivata una
 * segnalazione da /gioca/torneo-licita che ci era passata in mezzo, e
 * cercandone la ragione sono saltati fuori quattro modi diversi di
 * nascondersi:
 *
 *  1. LO SCOPE È UNA VARIABILE — `reportError(scope, errore)` dentro un
 *     involucro come `segnalaSeNonEScaduta`. Era il caso di torneo-licita.
 *  2. GLI APICI SONO SINGOLI — `reportError('use-friends:realtime', …)`.
 *  3. LA CHIAMATA STA SU PIÙ RIGHE — `reportError(\n  "scope",`: guardando
 *     una riga per volta non si vede niente.
 *  4. IL FILE NON NOMINA MAI SUPABASE — `bbo-username.ts` riceve il client
 *     come parametro, e il filtro preliminare lo saltava per intero.
 *
 * Adesso si cerca `reportError(` su TUTTO il testo, in TUTTI i file, senza
 * pretendere niente sulla forma degli argomenti. Un rilevatore che si lascia
 * ingannare dalla punteggiatura dà una garanzia che non ha.
 */
const CHIAMATA_SUPABASE = /(await\s+\w+\s*\.\s*(from|rpc|auth)|\w+\s*\.\s*(from|rpc|channel)\s*\(|\.auth\s*\.)/;
const FINESTRA = 12;

/**
 * LE ROTTE `app/api/` SONO ESCLUSE, ed è una regola e non una svista.
 *
 * Lì gira il SERVER. Se una fetch verso Supabase fallisce dal server non è
 * il telefono di un allievo in galleria: è il nostro backend che non
 * raggiunge il database, e quello deve svegliare qualcuno. Il filtro di
 * rete serve a non farsi raccontare la qualità delle reti altrui, non a
 * smettere di guardare le proprie.
 */
const SERVER = "app/api/";

/** Punti in cui `reportError` accanto a Supabase è quello che si vuole. */
const ECCEZIONI: string[] = [
  // `segnala()` filtra già con eDiRete alla riga sopra: è la stessa regola
  // scritta a mano prima che esistesse segnalaSalvoRete.
  "hooks/use-friends.ts:32",
  // I due `protocolError` e i due `shouldReport` del Realtime non sono
  // errori di fetch: sono un canale che non si aggancia. `evaluateChannel`
  // decide già QUANDO vale la pena riportarli, una volta sola e dopo un
  // guasto persistente — vedi realtime-health.ts. Zittirli qui vorrebbe
  // dire perdere l'unico segnale che il Realtime non funziona.
  "hooks/use-friends.ts:496",
  "hooks/use-friends.ts:536",
  "hooks/use-challenges.ts:221",
  "hooks/use-challenges.ts:261",
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
      const righe = sorgente.split("\n");
      // Su tutto il testo, non riga per riga: una chiamata spezzata su più
      // righe è invisibile a chi guarda una riga per volta.
      const relativo = f.slice(RADICE.length + 1);
      if (relativo.startsWith(SERVER)) continue;
      for (const m of sorgente.matchAll(/\breportError\s*\(/g)) {
        const i = sorgente.slice(0, m.index).split("\n").length - 1;
        // Un commento che NOMINA `reportError(` non è una chiamata. Senza
        // questo, il guardiano segnalava la nota che spiega sé stesso.
        const inizio = righe[i].trim();
        if (inizio.startsWith("//") || inizio.startsWith("*")) continue;
        const intorno = righe.slice(Math.max(0, i - FINESTRA), i + 1).join("\n");
        if (!CHIAMATA_SUPABASE.test(intorno)) continue;
        const punto = `${relativo}:${i + 1}`;
        if (ECCEZIONI.includes(punto)) continue;
        colpevoli.push(punto);
      }
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
