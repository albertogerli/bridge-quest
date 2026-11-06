/**
 * Le domande a scelta multipla dell'insegnante: i test della Commissione
 * e quelli che scrive lui, da mettere nei compiti.
 *
 * Una domanda è un esercizio di posizione con consegna «scelta» e senza mano:
 * così eredita tutto quello che gli esercizi già fanno — correzione lato
 * server, risposta registrata, griglia dell'insegnante, divisione delle
 * risposte, classifica della classe (Trevissoi, 02/11/2026: «funzionalità
 * essenziale del Bridge 5.0»).
 */
import type { NuovoEsercizio } from "./esercizi-posizione";

export interface BozzaDomanda {
  titolo: string;
  gruppo: string;
  domanda: string;
  opzioni: string[];
  /** Le opzioni giuste, con lo stesso testo delle opzioni. */
  giuste: string[];
  soluzione: string;
}

/** Che cosa non va in una domanda, detto per esteso. Vuoto = si può salvare. */
export function problemiDomanda(d: BozzaDomanda): string[] {
  const opzioni = d.opzioni.map((o) => o.trim()).filter(Boolean);
  const problemi: string[] = [];
  if (!d.domanda.trim()) problemi.push("Manca il testo della domanda.");
  if (opzioni.length < 2) problemi.push("Servono almeno due risposte fra cui scegliere.");
  if (new Set(opzioni.map((o) => o.toLowerCase())).size !== opzioni.length) problemi.push("Due risposte sono uguali.");
  const giuste = d.giuste.map((g) => g.trim()).filter(Boolean);
  if (giuste.length === 0) problemi.push("Indica almeno una risposta giusta.");
  if (giuste.some((g) => !opzioni.includes(g))) problemi.push("Una risposta giusta non è fra le opzioni.");
  return problemi;
}

/** La riga da salvare: un esercizio «scelta» senza mano. */
export function esercizioDaDomanda(d: BozzaDomanda): NuovoEsercizio {
  const opzioni = d.opzioni.map((o) => o.trim()).filter(Boolean);
  return {
    titolo: d.titolo.trim() || d.domanda.trim().slice(0, 60),
    consegna: "scelta",
    domanda: d.domanda.trim(),
    hands: {} as NuovoEsercizio["hands"],
    dealer: "south",
    vulnerability: "none",
    bids: [],
    played: [],
    posizione: "south",
    contract: null,
    declarer: null,
    risposte: d.giuste.map((g) => g.trim()).filter((g) => opzioni.includes(g)),
    soluzione: d.soluzione.trim() || null,
    gruppo: d.gruppo.trim() || null,
    class_id: null,
    opzioni,
  };
}

/**
 * Un test incollato come JSON: `{ titolo, domande: [{ numero, testo, opzioni,
 * giuste | giusta | risposta }] }` — il formato in cui sono trascritti gli
 * esercizi della Commissione. Le domande senza risposta giusta si scartano e si contano: un
 * test caricato senza le soluzioni direbbe «giusto» a qualunque risposta.
 */
export function domandeDaTest(testo: string): { domande: BozzaDomanda[]; scartate: number; errore: string | null } {
  let dati: unknown;
  try {
    dati = JSON.parse(testo);
  } catch {
    return { domande: [], scartate: 0, errore: "Il testo incollato non è un JSON valido." };
  }
  const test = dati as { titolo?: unknown; domande?: unknown };
  if (!Array.isArray(test.domande)) return { domande: [], scartate: 0, errore: "Manca l'elenco «domande»." };
  const gruppo = typeof test.titolo === "string" ? test.titolo.trim() : "";
  const domande: BozzaDomanda[] = [];
  let scartate = 0;
  for (const grezza of test.domande as Record<string, unknown>[]) {
    const opzioni = Array.isArray(grezza.opzioni) ? grezza.opzioni.filter((o): o is string => typeof o === "string") : [];
    const giuste = Array.isArray(grezza.giuste)
      ? grezza.giuste.filter((g): g is string => typeof g === "string")
      : typeof grezza.giusta === "string"
        ? [grezza.giusta]
        : typeof grezza.risposta === "string"
          ? [grezza.risposta]
          : [];
    const bozza: BozzaDomanda = {
      titolo: [gruppo, typeof grezza.numero === "string" ? grezza.numero : ""].filter(Boolean).join(" · "),
      gruppo,
      domanda: typeof grezza.testo === "string" ? grezza.testo : "",
      opzioni,
      giuste,
      soluzione: typeof grezza.soluzione === "string" ? grezza.soluzione : "",
    };
    if (problemiDomanda(bozza).length > 0) scartate++;
    else domande.push(bozza);
  }
  return { domande, scartate, errore: null };
}
