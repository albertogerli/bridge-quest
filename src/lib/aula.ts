import { createClient } from "@/lib/supabase/client";
import { eDiRete } from "@/lib/errore-di-rete";
import { reportError } from "@/lib/report-error";
import type { Card, Position } from "@/lib/bridge-engine";

/**
 * L'aula multi-tavolo: una lezione con tre-sei tavoli e una console sola.
 *
 * PERCHÉ NON BASTAVANO I TAVOLI CHE C'ERANO. Il tavolo condiviso è uno, e
 * l'insegnante lo governa guardandolo. In circolo la lezione ha dodici-ventiquattro
 * allievi su più tavoli: senza il concetto di aula, l'insegnante dovrebbe aprire
 * sei tavoli scollegati e ricordarsi a che punto è ognuno.
 *
 * ----------------------------------------------------------------------------
 * QUELLO CHE HO MISURATO, E QUELLO CHE NON HO POTUTO MISURARE
 * ----------------------------------------------------------------------------
 *
 * Misurato sul database di produzione, il 19/08/2026:
 *
 *   aprire una sessione da 40 tavoli          13 ms
 *   distribuire la stessa mano a 40 tavoli     3 ms
 *   leggere lo stato di 40 tavoli              2 ms
 *   160 letture di `live_table_view`          30 ms in tutto, 0,19 ms l'una
 *
 * Sono numeri comodi, e il motivo è che la distribuzione è UNA sola `update`
 * su quaranta righe invece di quaranta chiamate dal client. Fatta dal browser,
 * sarebbero quaranta andate e ritorni — cioè la differenza fra «la classe vede
 * la mano insieme» e «la vede a scaglioni».
 *
 * MISURATO IL 07/09/2026, la parte che mancava — e non erano le connessioni.
 *
 * Ogni tavolo aperto in un browser, a OGNI aggiornamento, richiama la lettura
 * del tavolo; e in più la richiama da solo ogni cinque secondi. Centosessanta
 * persone sono quindi 32 letture al secondo a vuoto, più una raffica di 160
 * ogni volta che l'insegnante distribuisce. È quello il carico vero:
 *
 *   raffica di 160 letture insieme        538 ms in tutto, nessun errore
 *   regime di 32/s per trenta secondi     p50 93 ms, p95 111, nessun errore
 *   raffica DURANTE il regime             393 ms, p95 del regime 273 ms
 *   160 abbonamenti Realtime insieme      159 connessi in 965 ms
 *
 * Il server regge. Il primo tentativo però è fallito per il resolver DNS della
 * macchina che lanciava la prova, non per Supabase: senza accorgersene si
 * sarebbe scambiato per «non regge». Vedi `scripts/carico-aula.mjs`.
 *
 * UNO SU CENTOSESSANTA NON SI È ABBONATO, e non è un difetto da inseguire: è
 * la ragione per cui il polling di riserva ogni cinque secondi deve restare.
 * Con quaranta tavoli veri, che a qualcuno non arrivi il canale è la norma.
 *
 * QUELLO CHE RESTA NON MISURATO è la sala: centosessanta dispositivi sul wi-fi
 * di un circolo, ognuno con la sua stretta di mano TLS. Qui le connessioni
 * erano riusate e la rete era una sola. Il polling di riserva
 * messa lì apposta per quel giorno.
 */

export interface StatoTavolo {
  tavolo_id: string;
  numero: number;
  titolo: string | null;
  carte_giocate: number;
  posti_assegnati: number;
  aggiornato: string;
}

export async function apriAula(
  classId: string,
  tavoli: number,
  titolo?: string,
): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("aula_apri", {
    p_class_id: classId,
    p_tavoli: tavoli,
    p_titolo: titolo ?? null,
  });
  if (error) {
    reportError("aula:apri", error);
    return null;
  }
  return data as string;
}

export async function distribuisciATutti(
  sessioneId: string,
  hands: Record<Position, Card[]>,
  opzioni?: { titolo?: string; contract?: string | null; declarer?: Position | null },
): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("aula_distribuisci", {
    p_sessione_id: sessioneId,
    p_hands: hands,
    p_titolo: opzioni?.titolo ?? null,
    p_contract: opzioni?.contract ?? null,
    p_declarer: opzioni?.declarer ?? null,
  });
  if (error) {
    reportError("aula:distribuisci", error);
    return 0;
  }
  return (data as number) ?? 0;
}

export async function statoAula(sessioneId: string): Promise<StatoTavolo[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("aula_stato", { p_sessione_id: sessioneId });
  if (error) {
    if (!eDiRete(error)) reportError("aula:stato", error);
    return [];
  }
  return (data ?? []) as StatoTavolo[];
}

export async function chiudiAula(sessioneId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.rpc("aula_chiudi", { p_sessione_id: sessioneId });
  if (error) reportError("aula:chiudi", error);
  return !error;
}

export interface SessioneAula {
  id: string;
  class_id: string;
  titolo: string | null;
  stato: "aperta" | "chiusa";
  created_at: string;
}

export async function sessioneAperta(classId: string): Promise<SessioneAula | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sessioni_aula")
    .select("id, class_id, titolo, stato, created_at")
    .eq("class_id", classId)
    .eq("stato", "aperta")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    if (!eDiRete(error)) reportError("aula:sessione", error);
    return null;
  }
  return (data as SessioneAula) ?? null;
}

/**
 * Chi è fermo, e da quanto.
 *
 * È l'unica informazione che serve davvero a chi gira fra i tavoli: un tavolo
 * che non tocca una carta da tre minuti è un tavolo dove qualcuno non sa cosa
 * fare, e va raggiunto prima degli altri. Il resto — quante carte, che mano —
 * lo si legge entrando.
 */
export function fermoDa(t: StatoTavolo): number {
  return Math.max(0, Date.now() - new Date(t.aggiornato).getTime());
}

/* ─────────────────────────────────────────────────────────────────────────
 * I POSTI
 * ───────────────────────────────────────────────────────────────────────── */

export type EsitoPosto =
  | { esito: "seduto"; posto: Position }
  | { esito: "occupato"; da: string }
  | { esito: "tavolo-chiuso" }
  | { esito: "non-della-classe" }
  | { esito: "posto-inesistente" }
  | { esito: "errore" };

/**
 * L'allievo prende un posto libero.
 *
 * L'ATOMICITÀ STA NEL DATABASE e non qui, perché due browser non si parlano.
 * In una sala dove venti persone entrano insieme, due che toccano lo stesso
 * posto nello stesso istante è la sera normale: `aula_siediti` blocca la riga,
 * decide, e al secondo risponde «occupato, c'è Maria».
 *
 * Che sia un'INFORMAZIONE e non un errore conta: «quel posto l'ha appena preso
 * Maria» si capisce e si risolve da soli; un errore fa alzare la mano e
 * chiamare l'insegnante, che è quello che stiamo cercando di evitare.
 */
export async function siediti(tavoloId: string, posto: Position): Promise<EsitoPosto> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("aula_siediti", {
    p_tavolo_id: tavoloId,
    p_posto: posto,
  });
  if (error) {
    reportError("aula:siediti", error);
    return { esito: "errore" };
  }
  return data as EsitoPosto;
}

/**
 * L'insegnante mette una persona su un posto.
 *
 * SOSTITUZIONE E SCAMBIO SONO LA STESSA OPERAZIONE: se il posto è occupato i
 * due si scambiano, se chi arriva non era seduto chi c'era esce. Trevissoi cura
 * gli accoppiamenti per età e carattere, e «dopo un po' ti rendi conto che ci
 * sono delle piccole incompatibilità»: deve poter spostare due persone senza
 * chiudere e riaprire l'aula.
 *
 * IL QUANDO LO DECIDE L'INTERFACCIA, non questa funzione: a metà mano lo
 * scambio cambierebbe proprietario alle carte già in mano, quindi si offre solo
 * a mano finita — che è anche il momento in cui l'insegnante se ne accorge.
 */
export async function muovi(
  tavoloId: string,
  utente: string,
  posto: Position,
): Promise<{ esito: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("aula_muovi", {
    p_tavolo_id: tavoloId,
    p_utente: utente,
    p_posto: posto,
  });
  if (error) {
    reportError("aula:muovi", error);
    return { esito: "errore" };
  }
  return data as { esito: string };
}

/**
 * I nomi dei compagni, per far vedere chi è già seduto.
 *
 * PRIMA PASSAVA DALLA CLASSIFICA, ed era una scorciatoia che si è rivelata un
 * difetto. `get_class_leaderboard` adesso rispetta `risultati_nominativi` —
 * come deve, perché l'insegnante ha una casella che promette l'anonimato — e
 * continuare a prendere i nomi da lì avrebbe svuotato i posti al tavolo ogni
 * volta che una classe sceglie il confronto anonimo.
 *
 * Sono due domande diverse: «chi ha fatto meglio» può essere anonima, «chi è
 * seduto a nord» no — quella persona è nella stessa stanza, e il metodo cura
 * gli accoppiamenti per affinità. Ora c'è `nomi_della_classe`, che restituisce
 * solo nome e identificativo e nessun dato di prestazione.
 *
 * SERVE DAVVERO. Il metodo cura gli accoppiamenti per età e affinità, e una
 * parte del lavoro la fanno gli allievi stessi sedendosi vicino a chi
 * conoscono: con i posti anonimi l'insegnante ricomporrebbe i tavoli a mano
 * ogni sera.
 */
export async function nomiDellaClasse(classId: string): Promise<Map<string, string>> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("nomi_della_classe", { p_class_id: classId });
  if (error) {
    if (!eDiRete(error)) reportError("aula:nomi", error);
    return new Map();
  }
  const righe = (data ?? []) as { student_id: string; display_name: string | null }[];
  return new Map(righe.map((r) => [r.student_id, r.display_name ?? "Un compagno"]));
}

/**
 * Mettersi in coda quando i quattro posti sono presi.
 *
 * IL NONO ALLIEVO. Nove persone: due tavoli e uno fuori, che alla prima serata
 * è la norma. Lasciarlo a guardare è brutto; dargli un tavolo di soli robot è
 * peggio, ed è più umiliante che stare a guardare. In circolo si sta al tavolo
 * come quinto e si entra a turno: vede le mani vere e alla smazzata dopo gioca.
 */
export async function aspetta(tavoloId: string): Promise<{ esito: string; mancano?: number }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("aula_aspetta", { p_tavolo_id: tavoloId });
  if (error) {
    reportError("aula:aspetta", error);
    return { esito: "errore" };
  }
  return data as { esito: string; mancano?: number };
}

/**
 * Il giro di fine mano: si conta la mano giocata e cambia chi deve cambiare.
 *
 * ESCE CHI HA GIOCATO PIÙ MANI, non chi è entrato da più tempo. Sono la stessa
 * cosa finché nessuno arriva o se ne va, e diventano diverse esattamente nella
 * sera vera, dove qualcuno entra alla terza smazzata: contando le mani, chi è
 * appena arrivato non salta il turno di chi gioca da un'ora.
 *
 * Il conteggio si aggiorna anche quando non c'è nessuno in coda: se si
 * aspettasse il primo arrivo, i numeri sarebbero già falsi quando servono.
 */
export async function ruota(tavoloId: string): Promise<{ esito: string; esce?: string; entra?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("aula_ruota", { p_tavolo_id: tavoloId });
  if (error) {
    reportError("aula:ruota", error);
    return { esito: "errore" };
  }
  return data as { esito: string; esce?: string; entra?: string };
}

