import { createClient } from "@/lib/supabase/client";
import { reportError } from "@/lib/report-error";

/**
 * Le segnalazioni, con il contesto raccolto da sole.
 *
 * PERCHÉ. «Non funziona» via email è inutilizzabile, e non è colpa di chi
 * scrive: la descrizione che serve a chi ripara — quale mano, quale compito,
 * quante carte erano state giocate — non è quella che viene in mente a chi sta
 * facendo lezione e vuole solo tornare alla classe. Quindi si chiede una frase
 * e il resto lo si prende da soli.
 *
 * COSA NON SI PRENDE. Nel contesto vanno solo dati tecnici e di gioco. Niente
 * email, niente nome, niente contenuto della chat di classe: l'identità sta
 * nell'`user_id`, che è una chiave, non un nome sotto gli occhi di chi apre
 * l'elenco. Lo screenshot è un caso a sé — può contenere qualunque cosa fosse
 * sullo schermo — e per questo chi segnala lo vede prima di mandarlo e può
 * togliere la spunta.
 */

export interface ContestoSegnalazione {
  /** Dove si trovava, senza parametri: possono contenere identificativi. */
  percorso: string;
  /** Cosa stava facendo, in termini nostri: `compito`, `lavagna`, `tavolo`… */
  zona?: string;
  smazzataId?: string | null;
  assignmentId?: string | null;
  classId?: string | null;
  /** Lo stato della partita, se ce n'era una. */
  contratto?: string | null;
  dichiarante?: string | null;
  carteGiocate?: number;
  fase?: string | null;
  /** L'ambiente. Serve a distinguere «rotto» da «rotto su quel telefono lì». */
  browser: string;
  schermo: string;
  lingua: string;
  /** Gli ultimi errori usciti in console, che quasi sempre bastano. */
  errori: string[];
}

/**
 * Gli ultimi errori di console.
 *
 * Si aggancia una volta sola e tiene un anello di venti: chi segnala lo fa
 * dopo che il difetto è successo, quindi l'errore utile è già passato e senza
 * questo non ci sarebbe più. Venti perché una pagina rotta ne produce a
 * raffica e i primi sono quelli buoni.
 */
const ANELLO: string[] = [];
const MASSIMO = 20;
let agganciato = false;

export function raccogliErroriDiConsole(): void {
  if (agganciato || typeof window === "undefined") return;
  agganciato = true;

  const originale = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    try {
      ANELLO.push(args.map((a) => (a instanceof Error ? a.message : String(a))).join(" ").slice(0, 300));
      if (ANELLO.length > MASSIMO) ANELLO.shift();
    } catch {
      // Un difetto nella raccolta degli errori non deve produrre errori.
    }
    originale(...args);
  };

  window.addEventListener("error", (e) => {
    ANELLO.push(`${e.message} @ ${e.filename}:${e.lineno}`.slice(0, 300));
    if (ANELLO.length > MASSIMO) ANELLO.shift();
  });
  window.addEventListener("unhandledrejection", (e) => {
    ANELLO.push(`promessa non gestita: ${String(e.reason)}`.slice(0, 300));
    if (ANELLO.length > MASSIMO) ANELLO.shift();
  });
}

export function erroriRaccolti(): string[] {
  return [...ANELLO];
}

/**
 * Il contesto d'ambiente, quello che si sa sempre.
 *
 * Il percorso arriva SENZA la stringa di ricerca: `?token=` e simili non hanno
 * niente da fare in una tabella che si guarda a mano.
 */
export function contestoAmbiente(): Pick<
  ContestoSegnalazione,
  "percorso" | "browser" | "schermo" | "lingua" | "errori"
> {
  return {
    percorso: typeof window === "undefined" ? "" : window.location.pathname,
    browser: typeof navigator === "undefined" ? "" : navigator.userAgent.slice(0, 300),
    schermo:
      typeof window === "undefined"
        ? ""
        : `${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio ?? 1}x`,
    lingua: typeof document === "undefined" ? "" : document.documentElement.lang || "it",
    errori: erroriRaccolti(),
  };
}

export interface EsitoInvio {
  ok: boolean;
  errore?: string;
}

/**
 * Manda la segnalazione.
 *
 * Lo screenshot viaggia per primo e in un bucket privato. Se il caricamento
 * fallisce la segnalazione parte lo stesso, senza immagine: perdere la
 * descrizione perché non è andata su una PNG sarebbe il modo peggiore di
 * gestire l'errore.
 */
export async function inviaSegnalazione(params: {
  testo: string;
  contesto: ContestoSegnalazione;
  screenshot?: Blob | null;
}): Promise<EsitoInvio> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, errore: "Serve essere collegati per segnalare." };

  let percorsoImmagine: string | null = null;
  if (params.screenshot) {
    // La cartella è l'id di chi carica: è la condizione che la policy dello
    // spazio di archiviazione controlla.
    const nome = `${user.id}/${Date.now()}.png`;
    const { error } = await supabase.storage
      .from("segnalazioni")
      .upload(nome, params.screenshot, { contentType: "image/png", upsert: false });
    if (error) reportError("segnalazioni:screenshot", error);
    else percorsoImmagine = nome;
  }

  const { error } = await supabase.from("segnalazioni").insert({
    user_id: user.id,
    testo: params.testo.trim().slice(0, 4000),
    contesto: params.contesto,
    screenshot_path: percorsoImmagine,
  });

  if (error) {
    reportError("segnalazioni:invio", error);
    return { ok: false, errore: "Non sono riuscito a mandarla. Riprova fra un attimo." };
  }
  return { ok: true };
}
