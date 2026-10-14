/**
 * I materiali che l'insegnante manda alla classe dopo ogni lezione: la
 * videolezione, la dispensa, l'esercizio. Qui solo la logica pura — l'accesso
 * al database sta in `materiali-lezione-db.ts`.
 *
 * Nasce dalla richiesta di Giuseppe Trevissoi del 14/10/2026: dopo ogni
 * lezione partono tre link, in quell'ordine, ma non sempre tutti e tre, a
 * volte più d'uno dello stesso tipo, e ciascuno esce quando lo decide
 * l'insegnante. Schema e regole di visibilità: `scripts/sql/materiali-lezione-2026-10.sql`.
 */

export type TipoMateriale = "video" | "dispensa" | "esercizio";

/** L'ordine in cui si usano: prima si guarda, poi si legge, poi ci si esercita. */
export const ORDINE_TIPI: readonly TipoMateriale[] = ["video", "dispensa", "esercizio"];

export interface MaterialeLezione {
  id: string;
  class_id: string;
  /** La lezione del catalogo, se il materiale ne fa parte. */
  lesson_id: string | null;
  /** L'etichetta che vede l'allievo, ed è anche ciò che raggruppa. */
  lezione: string;
  tipo: TipoMateriale;
  titolo: string;
  url: string;
  ordine: number;
  /** null = nascosto, passato = pubblicato, futuro = programmato. */
  pubblica_dal: string | null;
  created_at: string;
}

export type StatoMateriale = "nascosto" | "programmato" | "pubblicato";

/**
 * Lo stato visto da adesso. Lo stesso confronto lo fa la policy del database
 * con `now()`: qui serve solo a scrivere l'etichetta giusta all'insegnante.
 */
export function statoMateriale(m: Pick<MaterialeLezione, "pubblica_dal">, adesso: Date = new Date()): StatoMateriale {
  if (!m.pubblica_dal) return "nascosto";
  const quando = new Date(m.pubblica_dal).getTime();
  if (Number.isNaN(quando)) return "nascosto";
  return quando <= adesso.getTime() ? "pubblicato" : "programmato";
}

/**
 * Indirizzo accettabile: http(s) oppure un percorso interno al sito.
 *
 * È lo STESSO vincolo del database (`materiali_lezione_url`): controllarlo qui
 * serve a dire all'insegnante cosa non va prima di premere, invece di
 * restituirgli un errore incomprensibile. Il percorso interno comincia con UNA
 * sola barra: con due (`//altro-sito`) il browser lo apre come sito esterno.
 */
export function urlValido(url: string): boolean {
  const u = url.trim();
  if (u.length === 0 || u.length > 2000) return false;
  return /^https?:\/\/\S+$/i.test(u) || /^\/([^/\s]\S*)?$/.test(u);
}

/** Vero per i percorsi del sito: si aprono nella stessa scheda e conservano la lingua. */
export function eInterno(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

/** Video, dispensa, esercizio; dentro lo stesso tipo, l'ordine scelto e poi la data. */
export function ordinaMateriali<T extends Pick<MaterialeLezione, "tipo" | "ordine" | "created_at">>(lista: readonly T[]): T[] {
  return [...lista].sort(
    (a, b) =>
      ORDINE_TIPI.indexOf(a.tipo) - ORDINE_TIPI.indexOf(b.tipo) ||
      a.ordine - b.ordine ||
      a.created_at.localeCompare(b.created_at),
  );
}

export interface GruppoLezione<T> {
  lezione: string;
  materiali: T[];
}

/**
 * Per lezione, la più recente in cima.
 *
 * «Recente» dipende da chi guarda. L'allievo legge per data di uscita: la
 * lezione di cui ha appena ricevuto il materiale è quella di ieri sera.
 * L'insegnante legge per data di creazione: in cima c'è quella su cui sta
 * lavorando, anche se non è ancora uscito niente.
 */
export function raggruppaPerLezione<
  T extends Pick<MaterialeLezione, "lezione" | "tipo" | "ordine" | "created_at" | "pubblica_dal">,
>(lista: readonly T[], criterio: "creazione" | "pubblicazione"): GruppoLezione<T>[] {
  const gruppi = new Map<string, T[]>();
  for (const m of lista) {
    const g = gruppi.get(m.lezione);
    if (g) g.push(m);
    else gruppi.set(m.lezione, [m]);
  }
  const data = (m: T) => (criterio === "pubblicazione" ? (m.pubblica_dal ?? "") : m.created_at);
  const piuRecente = (ms: T[]) => ms.reduce((max, m) => (data(m) > max ? data(m) : max), "");
  return [...gruppi.entries()]
    .map(([lezione, materiali]) => ({ lezione, materiali: ordinaMateriali(materiali), chiave: piuRecente(materiali) }))
    .sort((a, b) => b.chiave.localeCompare(a.chiave) || a.lezione.localeCompare(b.lezione))
    .map(({ lezione, materiali }) => ({ lezione, materiali }));
}

/**
 * La tabella non c'è ancora: lo script SQL si esegue a mano e può arrivare
 * dopo il codice. Non è un difetto da mandare a Sentry, è un'attesa.
 */
export function tabellaMancante(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /Could not find the table|relation .* does not exist/i.test(error.message ?? "")
  );
}

/** Da `<input type="datetime-local">` (ora locale, senza fuso) a ISO. null se non valido. */
export function daDatetimeLocale(valore: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(valore)) return null;
  const d = new Date(valore);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Da ISO al formato di `<input type="datetime-local">`, nell'ora locale di chi guarda. */
export function aDatetimeLocale(iso: string): string {
  const d = new Date(iso);
  const due = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}T${due(d.getHours())}:${due(d.getMinutes())}`;
}
