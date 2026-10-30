/**
 * Gli esercizi dell'eserciziario della Commissione Insegnamento, da fare a
 * schermo: la consegna, le figure disegnate dai dati e, a richiesta, la
 * soluzione della Commissione.
 *
 * Non sono quiz a scelta multipla. Le domande sono aperte («quante prese
 * siete destinati a perdere?») e trasformarle in quattro risposte di cui tre
 * sbagliate vorrebbe dire scrivere noi le tre sbagliate: l'allievo risponde
 * da sé, poi apre la soluzione. Testi e soluzioni sono quelli dei PDF
 * (`public/materiali/gioco-della-carta/esercizi-*.pdf`), trascritti.
 *
 * Le figure si controllano in `esercizi-commissione.test.ts`: una carta non
 * compare due volte nella stessa figura e nessuna mano supera le 13 carte.
 */
import vincenti from "@/data/esercizi-commissione/vincenti-e-affrancabili.json";
import difensori from "@/data/esercizi-commissione/punto-di-vista-dei-difensori.json";
import affrancamenti from "@/data/esercizi-commissione/affrancamenti-di-lunga-e-di-posizione.json";
import pianoSenza from "@/data/esercizi-commissione/piano-di-gioco-a-senza-atout.json";
import atout from "@/data/esercizi-commissione/gioco-ad-atout.json";

/** I semi di una mano; `X` è un seme non specificato («A9753 / KQ642»). */
export type SemeFigura = "S" | "H" | "D" | "C" | "X";

/**
 * Una mano, o la parte che l'esercizio mostra. Un seme assente non si
 * disegna; una stringa vuota è un vuoto («—»). Ranghi: A K Q J 10 9…2 e x
 * per una cartina qualunque; «…» davanti vuol dire «e altre carte», come
 * «…A» quando si sa solo che Sud ha l'asso.
 */
export type ManoFigura = Partial<Record<SemeFigura, string>>;

export interface Figura {
  /** «1», «a», «Mano 2»: come la chiama la consegna. */
  etichetta?: string;
  nord?: ManoFigura;
  ovest?: ManoFigura;
  est?: ManoFigura;
  sud?: ManoFigura;
  /** «Contratto: 4♠», «Attacco: K♦», o altro scritto sotto la figura. */
  nota?: string;
  /**
   * Un errore della figura stampata (una carta in due mani, una mano di 14
   * carte), lasciato com'è e segnalato agli autori: correggerlo spetta a loro.
   */
  errataOriginale?: string;
}

export interface EsercizioCommissione {
  numero: number;
  /** La domanda; i semi come simboli ♠ ♥ ♦ ♣. Può avere più righe (a, b, c…). */
  consegna: string;
  figure?: Figura[];
  /** La soluzione della Commissione per questo esercizio. */
  soluzione: string;
}

export interface TemaCommissione {
  /** «Tema 1», come lo numera l'eserciziario. */
  tema: string;
  titolo: string;
  esercizi: EsercizioCommissione[];
}

export interface SchedaEsercizi {
  slug: string;
  titolo: string;
  /** Le lezioni BridgeLab che la scheda accompagna. */
  lezioni: number[];
  temi: TemaCommissione[];
}

export const SCHEDE_ESERCIZI: SchedaEsercizi[] = [vincenti, difensori, affrancamenti, pianoSenza, atout] as SchedaEsercizi[];

export function schedaEsercizi(slug: string): SchedaEsercizi | null {
  return SCHEDE_ESERCIZI.find((s) => s.slug === slug) ?? null;
}

const RANGHI = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

/**
 * I ranghi di un seme, in ordine di scrittura: «KQ1098x» → K, Q, 10, 9, 8, x.
 * «…2» (altre carte non mostrate, poi il 2) dà solo il 2.
 */
export function ranghiSeme(testo: string): string[] {
  testo = testo.replace(/^(…|\.\.\.)/, "");
  const out: string[] = [];
  for (let i = 0; i < testo.length; i++) {
    if (testo[i] === "1" && testo[i + 1] === "0") {
      out.push("10");
      i++;
    } else if (testo[i] === "T") out.push("10");
    else out.push(testo[i].toUpperCase() === "X" ? "x" : testo[i].toUpperCase());
  }
  return out;
}

/** I problemi di una figura, in italiano: vuoto se è a posto. */
export function problemiFigura(f: Figura): string[] {
  const problemi: string[] = [];
  const viste = new Set<string>();
  for (const posto of ["nord", "ovest", "est", "sud"] as const) {
    const mano = f[posto];
    if (!mano) continue;
    let carte = 0;
    for (const [seme, testo] of Object.entries(mano) as [SemeFigura, string][]) {
      for (const r of ranghiSeme(testo)) {
        carte++;
        if (r === "x") continue;
        if (!RANGHI.includes(r)) problemi.push(`${posto}: carta sconosciuta «${r}» in ${seme}`);
        // Il seme X non si confronta con gli altri: è un seme a parte.
        const chiave = seme + r;
        if (viste.has(chiave)) problemi.push(`${posto}: ${r} di ${seme} compare due volte`);
        viste.add(chiave);
      }
    }
    if (carte > 13) problemi.push(`${posto}: ${carte} carte`);
  }
  return problemi;
}
