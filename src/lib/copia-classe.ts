/**
 * Copiare compiti e materiali da una classe all'altra.
 *
 * Nasce da due casi raccontati dagli insegnanti dopo la demo del 14/11/2026:
 * lo stesso corso tenuto in due classi nello stesso anno (pomeriggio e sera),
 * e lo stesso corso rifatto l'anno dopo. In tutti e due l'insegnante rifaceva
 * a mano, compito per compito, quello che aveva già costruito.
 *
 * COSA SI COPIA E COSA NO. Si copia il lavoro dell'insegnante: le mani, gli
 * esercizi, le mani importate o generate, le impostazioni del compito, i link
 * dei materiali. Non si copia niente degli allievi: risultati, stelle,
 * commenti, domande restano nella classe in cui sono nati. Il programma del
 * corso non si copia perché è già lo stesso in ogni classe.
 *
 * UNA LEZIONE, UN COMPITO. Il database tiene un solo compito per lezione in
 * ogni classe (`assignments_una_lezione_per_classe`): è ciò che fa comparire
 * «Assegnato» nel programma. Se nella classe di arrivo quella lezione è già
 * assegnata, il compito NON si copia e lo si dice: due compiti della stessa
 * lezione sarebbero due liste di mani diverse con lo stesso nome.
 *
 * Passa dalle RLS come la creazione di un compito: l'insegnante scrive solo
 * nelle classi che sono sue, e la copia non ha bisogno di funzioni nuove.
 */

import { createClient } from "@/lib/supabase/client";
import type { Assignment } from "@/lib/instructors";
import type { MaterialeLezione } from "@/lib/materiali-lezione";
import { tabellaMancante } from "@/lib/materiali-lezione";

// ----------------------------------------------------------------------------
// Logica pura
// ----------------------------------------------------------------------------

/**
 * La scadenza da proporre nella copia: quella dell'originale se non è ancora
 * passata, altrimenti nessuna. Un compito copiato dall'anno scorso con la
 * scadenza dell'anno scorso nascerebbe già scaduto.
 */
export function scadenzaProposta(scadenza: string | null, adesso: Date = new Date()): string | null {
  if (!scadenza) return null;
  const t = Date.parse(scadenza);
  if (Number.isNaN(t) || t <= adesso.getTime()) return null;
  return scadenza;
}

/**
 * La riga da inserire per la copia di un compito.
 *
 * Le colonne facoltative (licita, stelle, solo obiettivo, mani importate)
 * si mandano solo se l'originale le ha: sono arrivate con script eseguiti a
 * mano, e mandarle sempre romperebbe la copia dove non ci sono — la stessa
 * regola di `createAssignment`.
 *
 * `link_video` NON si copia: è la stanza video di quella classe per quella
 * lezione, e nell'altra classe la stanza è un'altra. Vuoto vuol dire «quella
 * della classe», che è la cosa giusta.
 */
export function rigaCopiaCompito(
  a: Assignment,
  classeArrivo: string,
  scadenza: string | null,
): Record<string, unknown> {
  const riga: Record<string, unknown> = {
    class_id: classeArrivo,
    title: a.title,
    instructor_note: a.instructor_note,
    smazzata_ids: [...a.smazzata_ids],
    due_date: scadenza,
    mode: a.mode,
    unlock_mode: a.unlock_mode,
    soluzioni: a.soluzioni,
    minibridge: a.minibridge,
    esercizio_ids: [...(a.esercizio_ids ?? [])],
    lesson_id: a.lesson_id ?? null,
  };
  if (a.licita) riga.licita = true;
  if (a.licita && a.licita_gioca === false) riga.licita_gioca = false;
  if (a.licita && a.stelle_insegnante) riga.stelle_insegnante = true;
  if (typeof a.solo_obiettivo === "boolean") riga.solo_obiettivo = a.solo_obiettivo;
  if (a.custom_hands && a.custom_hands.length > 0) riga.custom_hands = a.custom_hands;
  return riga;
}

/**
 * I link interni che portano dentro la classe di partenza vanno girati sulla
 * classe di arrivo: un materiale «/classi/<vecchia>/compito/<vecchio>» nella
 * classe nuova porterebbe gli allievi in una classe che non è la loro.
 * Ogni identificativo che compare nella mappa (la classe e i compiti già
 * copiati) si sostituisce; i link esterni non si toccano.
 */
export function riscriviLink(url: string, mappa: ReadonlyMap<string, string>): string {
  if (!url.startsWith("/") || url.startsWith("//") || mappa.size === 0) return url;
  return url.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, (id) => mappa.get(id.toLowerCase()) ?? id);
}

/** Come si comportano nella copia i materiali già usciti nella classe di partenza. */
export type MaterialiUsciti = "pubblicati" | "nascosti";

/**
 * Quando esce il materiale copiato.
 *
 * - nascosto resta nascosto;
 * - programmato per una data futura resta programmato alla stessa data;
 * - già uscito: «pubblicati» lo lascia uscito (le due classi vanno di pari
 *   passo, come pomeriggio e sera), «nascosti» lo rimette da pubblicare (il
 *   corso ricomincia, e i materiali escono lezione per lezione).
 */
export function pubblicazioneCopia(
  pubblicaDal: string | null,
  usciti: MaterialiUsciti,
  adesso: Date = new Date(),
): string | null {
  if (!pubblicaDal) return null;
  const t = Date.parse(pubblicaDal);
  if (Number.isNaN(t)) return null;
  if (t > adesso.getTime()) return pubblicaDal;
  return usciti === "pubblicati" ? pubblicaDal : null;
}

/**
 * Lo stesso compito: stesso titolo, stesse mani, stessi esercizi. Serve a
 * ripetere una copia interrotta a metà senza raddoppiare i compiti su misura,
 * che a differenza di quelli di lezione il database lascia duplicare.
 */
export function chiaveCompito(a: Pick<Assignment, "title" | "smazzata_ids" | "esercizio_ids">): string {
  return `${a.title.trim().toLowerCase()}|${a.smazzata_ids.join(",")}|${(a.esercizio_ids ?? []).join(",")}`;
}

/** Lo stesso materiale, per non copiarlo due volte se la copia si ripete. */
export function chiaveMateriale(m: Pick<MaterialeLezione, "lezione" | "tipo" | "url">): string {
  return `${m.lezione.trim().toLowerCase()}|${m.tipo}|${m.url.trim()}`;
}

// ----------------------------------------------------------------------------
// Database
// ----------------------------------------------------------------------------

export type EsitoCopiaCompito =
  | { esito: "copiato"; id: string }
  /** Nella classe di arrivo quella lezione ha già il suo compito. */
  | { esito: "lezione-gia-assegnata"; id: string | null }
  /** Nella classe di arrivo c'è già lo stesso compito (vedi `chiaveCompito`). */
  | { esito: "gia-presente"; id: string };

function eDoppione(error: { code?: string; message?: string } | null): boolean {
  return error?.code === "23505";
}

/** Copia un compito in un'altra classe dell'insegnante. */
export async function copiaCompito(
  a: Assignment,
  classeArrivo: string,
  scadenza: string | null,
): Promise<EsitoCopiaCompito> {
  const supabase = createClient();
  // Lo stesso compito già nella classe di arrivo — copiato prima, o con la
  // copia di tutta la classe — non si raddoppia: si dice dov'è.
  const { data: esistenti, error: errEsistenti } = await supabase
    .from("assignments")
    .select("id, title, smazzata_ids, esercizio_ids")
    .eq("class_id", classeArrivo);
  if (errEsistenti) throw errEsistenti;
  const chiave = chiaveCompito(a);
  const doppio = ((esistenti ?? []) as Pick<Assignment, "id" | "title" | "smazzata_ids" | "esercizio_ids">[]).find(
    (e) => chiaveCompito(e) === chiave,
  );
  if (doppio) return { esito: "gia-presente", id: doppio.id };
  const riga = rigaCopiaCompito(a, classeArrivo, scadenza);
  let { data, error } = await supabase.from("assignments").insert(riga).select("id").single();
  // Come in `createAssignment`: senza lo script della colonna, il compito si
  // copia lo stesso e decide la lezione.
  if (error?.code === "PGRST204" && "solo_obiettivo" in riga) {
    delete riga.solo_obiettivo;
    ({ data, error } = await supabase.from("assignments").insert(riga).select("id").single());
  }
  if (eDoppione(error) && a.lesson_id != null) {
    const { data: gia } = await supabase
      .from("assignments")
      .select("id")
      .eq("class_id", classeArrivo)
      .eq("lesson_id", a.lesson_id)
      .maybeSingle();
    return { esito: "lezione-gia-assegnata", id: (gia as { id: string } | null)?.id ?? null };
  }
  if (error) throw error;
  return { esito: "copiato", id: (data as { id: string }).id };
}

export interface RiepilogoCopia {
  compitiCopiati: number;
  /** I titoli dei compiti lasciati fuori perché nell'altra classe c'erano già. */
  compitiSaltati: string[];
  materialiCopiati: number;
  /** I materiali che nella classe di arrivo c'erano già. */
  materialiGiaPresenti: number;
}

/**
 * Copia tutti i compiti e tutti i materiali di una classe in un'altra.
 *
 * I compiti vanno dal più vecchio al più nuovo, così nella classe di arrivo
 * compaiono nello stesso ordine. Le scadenze passate si tolgono (vedi
 * `scadenzaProposta`). Si può ripetere: i compiti e i materiali che nella
 * classe di arrivo ci sono già (vedi `chiaveCompito`, `chiaveMateriale`, e la
 * regola di una lezione per classe) si saltano.
 */
export async function copiaClasse(
  classePartenza: string,
  classeArrivo: string,
  opzioni: { compiti: boolean; materiali: boolean; usciti: MaterialiUsciti },
): Promise<RiepilogoCopia> {
  const supabase = createClient();
  const riepilogo: RiepilogoCopia = { compitiCopiati: 0, compitiSaltati: [], materialiCopiati: 0, materialiGiaPresenti: 0 };
  const mappa = new Map<string, string>([[classePartenza.toLowerCase(), classeArrivo]]);

  if (opzioni.compiti) {
    const [partenza, arrivo] = await Promise.all([
      supabase.from("assignments").select("*").eq("class_id", classePartenza).order("created_at", { ascending: true }),
      supabase.from("assignments").select("id, title, smazzata_ids, esercizio_ids").eq("class_id", classeArrivo),
    ]);
    if (partenza.error) throw partenza.error;
    if (arrivo.error) throw arrivo.error;
    const gia = new Map(
      ((arrivo.data ?? []) as Pick<Assignment, "id" | "title" | "smazzata_ids" | "esercizio_ids">[]).map((a) => [chiaveCompito(a), a.id]),
    );
    for (const a of (partenza.data ?? []) as Assignment[]) {
      const doppio = gia.get(chiaveCompito(a));
      if (doppio) {
        riepilogo.compitiSaltati.push(a.title);
        mappa.set(a.id.toLowerCase(), doppio);
        continue;
      }
      const esito = await copiaCompito(a, classeArrivo, scadenzaProposta(a.due_date));
      if (esito.esito === "copiato") {
        riepilogo.compitiCopiati++;
        mappa.set(a.id.toLowerCase(), esito.id);
      } else {
        // Non succede (i doppioni sono già saltati sopra), ma vale lo stesso.
        riepilogo.compitiSaltati.push(a.title);
        if (esito.id) mappa.set(a.id.toLowerCase(), esito.id);
      }
    }
  }

  if (opzioni.materiali) {
    const colonne = "lesson_id, lezione, tipo, titolo, url, ordine, pubblica_dal";
    const [partenza, arrivo] = await Promise.all([
      supabase.from("materiali_lezione").select(colonne).eq("class_id", classePartenza).order("created_at", { ascending: true }),
      supabase.from("materiali_lezione").select(colonne).eq("class_id", classeArrivo),
    ]);
    // Senza la tabella dei materiali non c'è niente da copiare: non è un guasto.
    if (partenza.error && !tabellaMancante(partenza.error)) throw partenza.error;
    if (arrivo.error && !tabellaMancante(arrivo.error)) throw arrivo.error;
    const gia = new Set(((arrivo.data ?? []) as MaterialeLezione[]).map(chiaveMateriale));
    const nuove: Record<string, unknown>[] = [];
    for (const m of (partenza.data ?? []) as MaterialeLezione[]) {
      const url = riscriviLink(m.url, mappa);
      const chiave = chiaveMateriale({ ...m, url });
      if (gia.has(chiave)) {
        riepilogo.materialiGiaPresenti++;
        continue;
      }
      gia.add(chiave);
      nuove.push({
        class_id: classeArrivo,
        lesson_id: m.lesson_id,
        lezione: m.lezione,
        tipo: m.tipo,
        titolo: m.titolo,
        url,
        ordine: m.ordine,
        pubblica_dal: pubblicazioneCopia(m.pubblica_dal, opzioni.usciti),
      });
    }
    if (nuove.length > 0) {
      const { error } = await supabase.from("materiali_lezione").insert(nuove);
      if (error) throw error;
      riepilogo.materialiCopiati = nuove.length;
    }
  }

  return riepilogo;
}

/**
 * Le impostazioni di una classe che passano alla classe nuova creata «da una
 * esistente». Restano fuori ciò che appartiene solo a quella classe: codice
 * e scadenza dell'invito, date del corso, locandina (ha date e orari), stato.
 */
export const IMPOSTAZIONI_DA_COPIARE = [
  "approvazione_automatica",
  "risultati_nominativi",
  "posti_liberi",
  "livello",
  "soluzioni_predefinite",
  "accesso_libero",
  "permessi",
  "video_tavolo",
] as const;

export function impostazioniDaCopiare(classe: Record<string, unknown>): Record<string, unknown> {
  const campi: Record<string, unknown> = {};
  for (const k of IMPOSTAZIONI_DA_COPIARE) {
    if (classe[k] !== undefined) campi[k] = classe[k];
  }
  return campi;
}
