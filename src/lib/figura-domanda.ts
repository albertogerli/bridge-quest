/**
 * La figura di una domanda a scelta: quello che nei test della Commissione sta
 * fra il testo e le risposte (Trevissoi, 04/11/2026).
 *
 * NON SONO MANI DA GIOCARE. Uno schema di un seme ai quattro posti, le due mani
 * A e B da confrontare, «Ovest ha attaccato col 2 e altre carte che non si
 * vedono»: nessuna di queste è una mano di tredici carte, e farle passare per
 * `hands` vorrebbe dire inventare le carte mancanti. Si salvano come le
 * disegna il test, e si disegnano così.
 *
 * Le carte di un seme sono una stringa in ordine decrescente: `AKQJT98765432`,
 * `x` per una cartina qualunque, `…` davanti quando il test ne mostra solo
 * alcune («…2» = il 2 e altre che non si vedono).
 */

export type SemeFigura = "S" | "H" | "D" | "C";
export type PostoFigura = "N" | "E" | "S" | "W";
export type ManoFigura = Record<SemeFigura, string>;

export type Figura =
  | { tipo: "mano"; mano: ManoFigura }
  | { tipo: "smazzata"; N?: ManoFigura | null; E?: ManoFigura | null; S?: ManoFigura | null; W?: ManoFigura | null }
  | { tipo: "colore"; seme?: SemeFigura; N?: string; E?: string; S?: string; W?: string }
  | { tipo: "colori"; figure: { N?: string; S?: string }[] }
  | { tipo: "confronto"; A: ManoFigura; B: ManoFigura };

export const SEMI_FIGURA: SemeFigura[] = ["S", "H", "D", "C"];
export const POSTI_FIGURA: PostoFigura[] = ["N", "E", "S", "W"];
export const SIMBOLO: Record<SemeFigura, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };

const CARTE = /^…?[AKQJT98765432x]*$/;

function carteValide(v: unknown): v is string {
  return typeof v === "string" && v.length <= 13 && CARTE.test(v);
}

function manoValida(v: unknown): v is ManoFigura {
  if (!v || typeof v !== "object") return false;
  const m = v as Record<string, unknown>;
  return SEMI_FIGURA.every((s) => carteValide(m[s]));
}

/**
 * La figura letta dal database, o `null` se non è una figura: la colonna è un
 * jsonb qualunque, e una figura rotta non deve rompere la domanda — l'allievo
 * vede il testo e le risposte, come prima che le figure esistessero.
 */
export function leggiFigura(v: unknown): Figura | null {
  if (!v || typeof v !== "object") return null;
  const f = v as Record<string, unknown>;
  switch (f.tipo) {
    case "mano":
      return manoValida(f.mano) ? { tipo: "mano", mano: f.mano } : null;
    case "smazzata": {
      const mani = POSTI_FIGURA.filter((p) => f[p] != null);
      if (mani.length === 0 || !mani.every((p) => manoValida(f[p]))) return null;
      return Object.fromEntries([["tipo", "smazzata"], ...mani.map((p) => [p, f[p]])]) as Figura;
    }
    case "colore": {
      const posti = POSTI_FIGURA.filter((p) => f[p] != null);
      if (posti.length === 0 || !posti.every((p) => carteValide(f[p]))) return null;
      if (f.seme != null && !SEMI_FIGURA.includes(f.seme as SemeFigura)) return null;
      return Object.fromEntries([
        ["tipo", "colore"],
        ...(f.seme ? [["seme", f.seme]] : []),
        ...posti.map((p) => [p, f[p]]),
      ]) as Figura;
    }
    case "colori": {
      if (!Array.isArray(f.figure) || f.figure.length === 0) return null;
      const ok = f.figure.every(
        (x: unknown) => !!x && typeof x === "object" && ["N", "S"].every((p) => (x as Record<string, unknown>)[p] == null || carteValide((x as Record<string, unknown>)[p])),
      );
      return ok ? { tipo: "colori", figure: f.figure as { N?: string; S?: string }[] } : null;
    }
    case "confronto":
      return manoValida(f.A) && manoValida(f.B) ? { tipo: "confronto", A: f.A, B: f.B } : null;
    default:
      return null;
  }
}

/** «AKT2» → «A K 10 2»: il 10 si scrive per intero, come sulle carte. */
export function carteLeggibili(s: string): string {
  if (s === "") return "—";
  return [...s].map((c) => (c === "T" ? "10" : c)).join(" ");
}

/**
 * I semi da disegnare in una smazzata: tutti e quattro se almeno una mano è
 * completa, altrimenti solo quelli che il test mostra. Una figura con due soli
 * semi («Nord ♠KQ43 ♦65») disegnata con quattro righe direbbe che gli altri
 * due sono vuoti, e non lo sono: non si vedono.
 */
export function semiDaMostrare(mani: ManoFigura[]): SemeFigura[] {
  if (mani.some((m) => SEMI_FIGURA.reduce((n, s) => n + m[s].replace("…", "").length, 0) === 13)) return SEMI_FIGURA;
  return SEMI_FIGURA.filter((s) => mani.some((m) => m[s] !== ""));
}

const NOMI_POSTI: Record<PostoFigura, string> = { N: "Nord", E: "Est", S: "Sud", W: "Ovest" };

function manoInTesto(m: ManoFigura, semi: SemeFigura[] = SEMI_FIGURA): string {
  return semi.map((s) => `${SIMBOLO[s]} ${carteLeggibili(m[s])}`).join(", ");
}

/**
 * La figura in una riga di testo: per chi legge con lo screen reader e per
 * l'elenco delle domande dell'insegnante, dove il disegno sarebbe troppo.
 */
export function descriviFigura(f: Figura, tr: (s: string) => string = (s) => s): string {
  const nome = (p: PostoFigura) => tr(NOMI_POSTI[p]);
  switch (f.tipo) {
    case "mano":
      return manoInTesto(f.mano);
    case "smazzata": {
      const posti = POSTI_FIGURA.filter((p) => f[p]);
      const semi = semiDaMostrare(posti.map((p) => f[p]!));
      return posti.map((p) => `${nome(p)}: ${manoInTesto(f[p]!, semi)}`).join(" · ");
    }
    case "colore": {
      const posti = POSTI_FIGURA.filter((p) => f[p] != null);
      const seme = f.seme ? `${SIMBOLO[f.seme]} ` : "";
      return posti.map((p) => `${nome(p)}: ${seme}${carteLeggibili(f[p]!)}`).join(" · ");
    }
    case "colori":
      return f.figure.map((x, i) => `${i + 1}) ${nome("N")} ${carteLeggibili(x.N ?? "")} / ${nome("S")} ${carteLeggibili(x.S ?? "")}`).join(" · ");
    case "confronto":
      return `A: ${manoInTesto(f.A)} · B: ${manoInTesto(f.B)}`;
  }
}
