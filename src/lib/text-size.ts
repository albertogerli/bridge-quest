/**
 * Dimensione del testo scelta dall'utente.
 *
 * PERCHÉ ESISTE
 * L'impostazione c'era già in `/impostazioni`, veniva salvata in localStorage e
 * perfino sincronizzata su Supabase — ma non era applicata da nessuna parte.
 * Chi sceglieva «Grande» non vedeva cambiare niente.
 *
 * Non è un dettaglio: il pubblico di BridgeLab sono giocatori FIGB fra i 45 e i
 * 65 anni, età in cui la presbiopia è la norma, e l'interfaccia usa oltre 600
 * misure di testo sotto i 12 pixel. È plausibile che quel comando sia la prima
 * cosa che hanno provato.
 *
 * PERCHÉ NON BASTAVA IL TEMA «SENIOR»
 * Un tema che ingrandisce tutto esiste già, ma è legato al profilo anagrafico
 * «55+ anni». Chi ha 52 anni sceglie «adulto» e resta col testo minuscolo:
 * l'etichetta chiede di dichiarare un'identità, non una preferenza, e le due
 * cose non coincidono. Questa impostazione è indipendente dall'età.
 *
 * COME FUNZIONA
 * Si scala la radice del documento: tutte le misure in `rem` seguono, mentre
 * quelle in pixel restano ferme. Non è perfetto — le misure in pixel sono
 * proprio quelle problematiche — ma agisce su titoli, corpo e spaziature senza
 * toccare una per una centinaia di classi, e si combina con l'innalzamento
 * della soglia minima.
 */

export const TEXT_SIZES = ["piccolo", "medio", "grande"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

export const TEXT_SIZE_KEY = "bq_text_size";

/** Scala applicata alla radice. 100% = 16px, il valore predefinito del browser. */
const SCALE: Record<TextSize, string> = {
  piccolo: "93.75%", // 15px
  medio: "100%", // 16px
  grande: "112.5%", // 18px
};

export function isTextSize(value: unknown): value is TextSize {
  return typeof value === "string" && (TEXT_SIZES as readonly string[]).includes(value);
}

/** Valore salvato, o "medio" se assente o corrotto. */
export function parseTextSize(raw: string | null | undefined): TextSize {
  return isTextSize(raw) ? raw : "medio";
}

export function scaleFor(size: TextSize): string {
  return SCALE[size];
}

/**
 * Applica la scala al documento.
 *
 * Agisce su `<html>` e non su un contenitore interno perché i riquadri modali e
 * le notifiche vengono montati fuori dall'albero dell'applicazione: scalando un
 * contenitore resterebbero della dimensione sbagliata proprio gli avvisi.
 */
export function applyTextSize(size: TextSize): void {
  if (typeof document === "undefined") return;
  document.documentElement.style.fontSize = scaleFor(size);
}
