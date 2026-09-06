// ============================================================================
// Instructor Portal — Data Access Layer
//
// Thin wrappers around the Supabase client for the ASD B2B "classi" feature.
// All query complexity (joins, RLS-aware reads, RPC calls) lives here so the
// pages/stores stay declarative. Mirrors the style of the existing data layer.
//
// Backing schema: scripts/sql/instructor_portal.sql
// ============================================================================

import { createClient } from "@/lib/supabase/client";
import type { Smazzata } from "@/lib/catalog";
import type { AccessoLibero, Gruppo } from "@/lib/permessi-allievo";

// ----------------------------------------------------------------------------
// Types (mirror the SQL tables)
// ----------------------------------------------------------------------------

export type AssignmentMode = "homework" | "live";
export type UnlockMode = "free" | "sequential";
/**
 * Lo stato di un'iscrizione. Vedi `class_members.status`.
 *
 * `rejected` e `removed` sembrano la stessa cosa e non lo sono: il primo è
 * l'insegnante che ha detto di no, il secondo è l'allievo che se n'è andato.
 * La differenza serve a `join_class_by_code`, che lascia rientrare il secondo
 * e non il primo — altrimenti «respinto» durerebbe finché l'allievo non
 * ridigita il codice.
 */
export type MemberStatus = "active" | "removed" | "pending" | "rejected";

export interface ClassRoom {
  id: string;
  instructor_id: string;
  asd_code: string | null;
  name: string;
  description: string | null;
  invite_code: string;
  invite_active: boolean;
  /** Vedi `classes.stato`: bozza | aperta | chiusa | archiviata. */
  stato: StatoClasse;
  /** Falso = ogni iscrizione resta in attesa finché l'insegnante non decide. */
  approvazione_automatica: boolean;
  /** Quando il codice smette di funzionare. `null` = non scade. */
  invite_expires_at: string | null;
  /**
   * Falso = nel confronto fra allievi i nomi non compaiono.
   *
   * Default falso, ed è una scelta didattica: il confronto serve a capire se
   * la mano era difficile o l'ho sbagliata io, e quella risposta non ha bisogno
   * dei nomi. Con i nomi diventa una classifica, e una classifica in una classe
   * di principianti fa smettere di provare proprio quelli che avrebbero più da
   * guadagnare.
   */
  risultati_nominativi: boolean;
  /**
   * La stanza di videoconferenza del corso.
   *
   * Non costruiamo video e audio nel portale, ma la lezione online si fa su
   * Zoom o Meet e ignorarlo vuol dire che l'insegnante incolla il link in chat
   * a mano ogni volta. Qui sta accanto al materiale, e finisce da solo nel
   * promemoria e nel messaggio da mandare sul gruppo.
   */
  link_video: string | null;
  /** Livello del corso, testo libero: «Primo livello», «Approfondimento». */
  livello: string | null;
  /** Quanto l'insegnante ha aperto. Vedi `permessi-allievo.ts`. */
  accesso_libero: AccessoLibero;
  /** Eccezioni per gruppo. Vuoto = vale il cursore. */
  permessi: Partial<Record<Gruppo, boolean>>;
  /** Prima lezione. Diversa da `created_at`. */
  inizio_corso: string | null;
  fine_corso: string | null;
  created_at: string;
}

/**
 * La vita di una classe.
 *
 * `chiusa` e `archiviata` non cancellano niente: sono transizioni di stato, e
 * iscrizioni e compiti restano tutti dove sono. La differenza fra le due è
 * solo dove compare la classe — `chiusa` sta ancora nell'elenco di lavoro,
 * `archiviata` no.
 */
export type StatoClasse = "bozza" | "aperta" | "chiusa" | "archiviata";

export const ETICHETTE_STATO: Record<StatoClasse, string> = {
  bozza: "Bozza",
  aperta: "Aperta",
  chiusa: "Chiusa",
  archiviata: "Archiviata",
};

export interface ClassMember {
  class_id: string;
  student_id: string;
  status: MemberStatus;
  joined_at: string;
  // Joined from profiles (when fetched via getClassDetail)
  display_name?: string | null;
  avatar_url?: string | null;
}

/** Vedi `assignments.soluzioni`. */
export type VisibilitaSoluzioni = "subito" | "dopo-il-gioco" | "dopo-la-scadenza";

export interface Assignment {
  id: string;
  class_id: string;
  title: string;
  instructor_note: string | null;
  smazzata_ids: string[];
  due_date: string | null;
  mode: AssignmentMode;
  unlock_mode: UnlockMode;
  /**
   * Quando l'allievo può leggere il commento delle mani di questo compito.
   * La regola è applicata dal database, non da qui: vedi
   * `scripts/sql/soluzioni-dopo-il-gioco-2026-08.sql`.
   */
  soluzioni: VisibilitaSoluzioni;
  /**
   * Si gioca senza dichiarazione, con le regole del minibridge. Le prime
   * lezioni del Corso Fiori si fanno così, e un compito assegnato lì non deve
   * mettere davanti all'allievo una cassetta che non gli è stata spiegata.
   */
  minibridge: boolean;
  /** Esercizi di posizione assegnati insieme alle smazzate. */
  esercizio_ids: string[];
  /**
   * La lezione da cui il compito è nato, se è stato assegnato in blocco.
   * `null` per i compiti su misura. La colonna c'è da sempre — la valorizza
   * `assegna_lezione` — ma non era dichiarata qui, e le query fanno
   * `select("*")`: arrivava e nessuno poteva usarla senza che il tipo mentisse.
   */
  lesson_id: number | null;
  /** Il link della singola lezione, quando cambia. Vuoto = quello della classe. */
  link_video: string | null;
  live_active_index: number | null;
  created_at: string;
  /** Hands imported from PBN, referenced by ids in smazzata_ids (pbn_import.sql) */
  custom_hands?: Smazzata[] | null;
}

/** One latest result per (student, smazzata) for an assignment — heatmap source. */
export interface AssignmentResultRow {
  student_id: string;
  student_name: string | null;
  smazzata_id: string;
  score: number;
  details: Record<string, unknown> | null;
  played_at: string;
}

export interface ClassDetail {
  /** Chi ha chiesto di entrare e aspetta una risposta. Vuoto se l'approvazione è automatica. */
  inAttesa: ClassMember[];
  classRoom: ClassRoom;
  members: ClassMember[];
  assignments: Assignment[];
}

// ----------------------------------------------------------------------------
// Instructor: classes
// ----------------------------------------------------------------------------

/** Create a class owned by the current (instructor-role) user. invite_code is
 *  generated server-side by the table DEFAULT (generate_invite_code()). */
export async function createClass(input: {
  name: string;
  description?: string | null;
  asdCode?: string | null;
}): Promise<ClassRoom> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autenticato");

  const { data, error } = await supabase
    .from("classes")
    .insert({
      instructor_id: user.id,
      name: input.name,
      description: input.description ?? null,
      asd_code: input.asdCode ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ClassRoom;
}

/** Classes owned by the current instructor (newest first). */
export async function getMyClasses(): Promise<ClassRoom[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autenticato");

  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ClassRoom[];
}

/** Full instructor view of one class: class + active members + assignments.
 *  RLS ensures only the owning instructor (or members, for the class row) read this. */
export async function getClassDetail(classId: string): Promise<ClassDetail> {
  const supabase = createClient();

  // NOTE: we don't PostgREST-embed profiles here. class_members.student_id has a
  // FK to auth.users (not profiles), so the `profiles(...)` embed has no
  // discoverable relationship and errors. We fetch members, then their profiles
  // in a second query keyed by student_id (= profiles.id).
  const [classRes, membersRes, assignmentsRes] = await Promise.all([
    supabase.from("classes").select("*").eq("id", classId).single(),
    supabase
      .from("class_members")
      .select("class_id, student_id, status, joined_at")
      .eq("class_id", classId)
      // `active` e `pending` insieme, in una query sola: chi è in attesa va
      // mostrato all'insegnante, e sono le stesse righe con lo stesso profilo
      // da risolvere: separarle vorrebbe dire due query e due giri di nomi.
      .in("status", ["active", "pending"])
      .order("joined_at", { ascending: true }),
    supabase
      .from("assignments")
      .select("*")
      .eq("class_id", classId)
      .order("created_at", { ascending: false }),
  ]);

  if (classRes.error) throw classRes.error;
  if (membersRes.error) throw membersRes.error;
  if (assignmentsRes.error) throw assignmentsRes.error;

  const rawMembers = (membersRes.data ?? []) as {
    class_id: string;
    student_id: string;
    status: MemberStatus;
    joined_at: string;
  }[];

  // Resolve display names in one batched query.
  const profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
  const studentIds = rawMembers.map((m) => m.student_id);
  if (studentIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", studentIds);
    if (profilesError) throw profilesError;
    for (const p of profiles ?? []) {
      const row = p as { id: string; display_name: string | null; avatar_url: string | null };
      profileMap.set(row.id, { display_name: row.display_name, avatar_url: row.avatar_url });
    }
  }

  const tutti: ClassMember[] = rawMembers.map((m) => ({
    class_id: m.class_id,
    student_id: m.student_id,
    status: m.status,
    joined_at: m.joined_at,
    display_name: profileMap.get(m.student_id)?.display_name ?? null,
    avatar_url: profileMap.get(m.student_id)?.avatar_url ?? null,
  }));

  return {
    classRoom: classRes.data as ClassRoom,
    members: tutti.filter((m) => m.status === "active"),
    inAttesa: tutti.filter((m) => m.status === "pending"),
    assignments: (assignmentsRes.data ?? []) as Assignment[],
  };
}

// ----------------------------------------------------------------------------
// Iscrizioni: approvare, respingere, e le impostazioni che le governano
// ----------------------------------------------------------------------------

/**
 * Approva o respinge una richiesta di iscrizione.
 *
 * Passa dalle RLS, non da una RPC: la policy di `class_members` lascia già
 * scrivere all'insegnante della classe, e il `with check` aggiunto in
 * `iscrizioni-e-ciclo-classe-2026-08.sql` impedisce all'allievo di fare la
 * stessa cosa su di sé. Una funzione in più qui non aggiungerebbe controlli,
 * aggiungerebbe solo un posto in cui sbagliarli.
 *
 * `rejected` è diverso da `removed`: chi è stato respinto non rientra
 * ridigitando il codice, chi se n'è andato da solo sì.
 */
export async function decidiIscrizione(
  classId: string,
  studentId: string,
  decisione: "approva" | "respingi",
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("class_members")
    .update({ status: decisione === "approva" ? "active" : "rejected" })
    .eq("class_id", classId)
    .eq("student_id", studentId);
  if (error) throw error;
}

/**
 * Approva o respinge PIÙ richieste insieme.
 *
 * PERCHÉ UNA SOLA ISTRUZIONE E NON UN CICLO. Con venti chiamate in fila, se la
 * decima fallisce restano nove approvate e undici in attesa, e chi guarda la
 * schermata non sa a che punto è: dovrebbe ricontrollare a mano. Una `UPDATE`
 * con `IN` è un'operazione sola per il database — o le tocca tutte o nessuna —
 * e il problema di lasciare uno stato ambiguo non si presenta.
 *
 * Il caso vero: un corso con quaranta aderenti, l'insegnante apre la pagina la
 * sera prima e deve smaltire venti richieste. Venti clic sono venti occasioni
 * di sbagliarne uno.
 *
 * RESTITUISCE CHI È PASSATO DAVVERO. Le RLS potrebbero rifiutare qualche riga
 * — un allievo che nel frattempo è uscito, una classe che non è più tua — e in
 * quel caso l'istruzione riesce ma tocca meno righe di quelle chieste. Senza
 * rileggere non ce ne accorgeremmo, e la schermata direbbe «fatto» per gente
 * che è rimasta in attesa.
 */
export async function decidiIscrizioni(
  classId: string,
  studentIds: string[],
  decisione: "approva" | "respingi",
): Promise<{ decisi: string[]; nonDecisi: string[] }> {
  if (studentIds.length === 0) return { decisi: [], nonDecisi: [] };
  const supabase = createClient();
  const { data, error } = await supabase
    .from("class_members")
    .update({ status: decisione === "approva" ? "active" : "rejected" })
    .eq("class_id", classId)
    .in("student_id", studentIds)
    .select("student_id");
  if (error) throw error;
  const decisi = (data ?? []).map((r) => r.student_id as string);
  return { decisi, nonDecisi: studentIds.filter((id) => !decisi.includes(id)) };
}

/** Le impostazioni della classe che riguardano chi entra e quando. */
export async function aggiornaImpostazioniClasse(
  classId: string,
  campi: {
    stato?: StatoClasse;
    approvazione_automatica?: boolean;
    /** ISO, oppure `null` per «non scade». */
    invite_expires_at?: string | null;
    invite_active?: boolean;
    risultati_nominativi?: boolean;
    link_video?: string | null;
    livello?: string | null;
    inizio_corso?: string | null;
    fine_corso?: string | null;
    /**
     * Il rubinetto. NON interrompe niente a chi sta usando il portale in quel
     * momento: le funzioni della famiglia ludica non sono mai vietate, quindi
     * chiuderlo cambia solo cosa viene PROPOSTO, e dalla visita successiva.
     * Vedi `permessi-allievo.ts`.
     */
    accesso_libero?: AccessoLibero;
    permessi?: Partial<Record<Gruppo, boolean>>;
  },
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("classes").update(campi).eq("id", classId);
  if (error) throw error;
}

/**
 * Lo stato dell'iscrizione di chi guarda, per una classe.
 *
 * Serve subito dopo aver digitato il codice: `join_class_by_code` restituisce
 * la classe ma non dice se si è entrati o si sta aspettando, e cambiarle il
 * tipo di ritorno avrebbe rotto il sito nella finestra fra l'esecuzione dello
 * script SQL e il deploy.
 */
export async function statoMiaIscrizione(classId: string): Promise<MemberStatus | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("class_members")
    .select("status")
    .eq("class_id", classId)
    .eq("student_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return (data?.status as MemberStatus | undefined) ?? null;
}

/** Generate a fresh invite code for a class (e.g. the old one leaked). */
export async function regenerateInviteCode(classId: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("generate_invite_code");
  if (error) throw error;
  const code = data as string;

  const { error: updateError } = await supabase
    .from("classes")
    .update({ invite_code: code, invite_active: true })
    .eq("id", classId);
  if (updateError) throw updateError;
  return code;
}

/** Enable/disable joining via the current invite code without changing it. */
export async function setInviteActive(classId: string, active: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("classes")
    .update({ invite_active: active })
    .eq("id", classId);
  if (error) throw error;
}

// ----------------------------------------------------------------------------
// Student: joining / leaving / listing classes
// ----------------------------------------------------------------------------

/** Join a class by its invite code via a SECURITY DEFINER RPC. A direct SELECT
 *  on classes would be hidden by RLS (the student isn't a member yet), so the
 *  RPC does the lookup + self-join atomically. Returns the joined class. */
export async function joinClass(inviteCode: string): Promise<ClassRoom> {
  const supabase = createClient();
  const code = inviteCode.trim().toUpperCase();

  const { data, error } = await supabase.rpc("join_class_by_code", { p_code: code });
  if (error) {
    // P0002 (no_data_found) => bad/closed code; anything else is unexpected.
    throw new Error("Codice non valido o classe chiusa alle iscrizioni");
  }
  // RETURNS classes: supabase gives the row object (or array on some versions).
  const row = Array.isArray(data) ? data[0] : data;
  return row as ClassRoom;
}

/** Leave a class (soft: status -> removed). */
export async function leaveClass(classId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autenticato");

  const { error } = await supabase
    .from("class_members")
    .update({ status: "removed" })
    .eq("class_id", classId)
    .eq("student_id", user.id);
  if (error) throw error;
}

/** Classes the current student is an active member of. */
export async function getMyEnrolledClasses(): Promise<ClassRoom[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autenticato");

  const { data, error } = await supabase
    .from("class_members")
    .select("classes(*)")
    .eq("student_id", user.id)
    .eq("status", "active");

  if (error) throw error;
  return (data ?? [])
    .map((row) => {
      // to-one join may come back as an array; take the first.
      const rel = (row as unknown as { classes: ClassRoom | ClassRoom[] | null }).classes;
      return Array.isArray(rel) ? rel[0] ?? null : rel;
    })
    .filter((c): c is ClassRoom => c != null);
}

// ----------------------------------------------------------------------------
// Assignments
// ----------------------------------------------------------------------------

export async function createAssignment(input: {
  classId: string;
  title: string;
  smazzataIds: string[];
  dueDate?: string | null;
  instructorNote?: string | null;
  mode?: AssignmentMode;
  unlockMode?: UnlockMode;
  soluzioni?: VisibilitaSoluzioni;
  minibridge?: boolean;
  esercizioIds?: string[];
  /** Hands imported from PBN; their ids must also appear in smazzataIds */
  customHands?: Smazzata[] | null;
}): Promise<Assignment> {
  const supabase = createClient();
  const row: Record<string, unknown> = {
    class_id: input.classId,
    title: input.title,
    smazzata_ids: input.smazzataIds,
    due_date: input.dueDate ?? null,
    instructor_note: input.instructorNote ?? null,
    mode: input.mode ?? "homework",
    unlock_mode: input.unlockMode ?? "free",
    // Il default del database è lo stesso: qui è esplicito perché è la scelta
    // che gli insegnanti hanno chiesto, e vederla scritta nel form di
    // creazione vale più di un default nascosto in una colonna.
    soluzioni: input.soluzioni ?? "dopo-il-gioco",
    minibridge: input.minibridge ?? false,
    esercizio_ids: input.esercizioIds ?? [],
  };
  // Only send the column when used, so DBs without pbn_import.sql keep working
  if (input.customHands && input.customHands.length > 0) {
    row.custom_hands = input.customHands;
  }
  const { data, error } = await supabase
    .from("assignments")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data as Assignment;
}

/**
 * Il compito come deve vederlo chi lo apre.
 *
 * NON È PIÙ UN `select *`, e il motivo sta tutto in `custom_hands`: le mani
 * importate da PBN o generate dall'insegnante si portano dentro il proprio
 * commento, e con la lettura diretta arrivavano intere al browser dell'allievo
 * prima che giocasse. Chiudere il catalogo e lasciare aperte quelle avrebbe
 * scoperto proprio i compiti costruiti a mano.
 *
 * `compito_per_allievo` toglie il commento dalle mani che non spettano ancora,
 * e all'insegnante restituisce tutto. Il controllo di appartenenza alla classe
 * è rifatto dentro la funzione, perché una SECURITY DEFINER scavalca le RLS.
 */
export async function getAssignment(assignmentId: string): Promise<Assignment> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("compito_per_allievo", {
    p_assignment_id: assignmentId,
  });
  if (error) throw error;
  return data as Assignment;
}

/** Assignments for a single class (RLS: member or owning instructor). */
export async function getClassAssignments(classId: string): Promise<Assignment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("class_id", classId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Assignment[];
}

/** The current student's own progress: assignmentId -> set of completed smazzata ids.
 *  An assignment is "done" when every smazzata in it has at least one result. */
export async function getMyAssignmentProgress(
  assignmentIds: string[]
): Promise<Map<string, Set<string>>> {
  const result = new Map<string, Set<string>>();
  if (assignmentIds.length === 0) return result;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autenticato");

  const { data, error } = await supabase
    .from("game_results")
    .select("assignment_id, details")
    .eq("user_id", user.id)
    .in("assignment_id", assignmentIds);
  if (error) throw error;

  for (const row of data ?? []) {
    const aId = (row as { assignment_id: string | null }).assignment_id;
    const details = (row as { details: Record<string, unknown> | null }).details;
    const smazzataId = details && typeof details.smazzata_id === "string" ? details.smazzata_id : null;
    if (!aId || !smazzataId) continue;
    if (!result.has(aId)) result.set(aId, new Set());
    result.get(aId)!.add(smazzataId);
  }
  return result;
}

export interface HandResult {
  made: boolean;
  result: number;
}

export interface LeaderboardRow {
  student_id: string;
  student_name: string | null;
  hands_made: number;
  hands_played: number;
  total_tricks: number;
  total_ms: number;
}

/** Class-wide leaderboard: hands kept (1st attempt) → tricks → speed.
 *  Visible to class members and the instructor. */
export async function getClassLeaderboard(classId: string): Promise<LeaderboardRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_class_leaderboard", { p_class_id: classId });
  if (error) throw error;
  return (data ?? []).map((r: LeaderboardRow) => ({
    ...r,
    hands_made: Number(r.hands_made),
    hands_played: Number(r.hands_played),
    total_tricks: Number(r.total_tricks),
    total_ms: Number(r.total_ms),
  }));
}

/** The current student's per-hand result for one or more assignments:
 *  assignmentId -> (smazzataId -> latest result). Used to mark made/down hands. */
export async function getMyAssignmentResults(
  assignmentIds: string[]
): Promise<Map<string, Map<string, HandResult>>> {
  const out = new Map<string, Map<string, HandResult>>();
  if (assignmentIds.length === 0) return out;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autenticato");

  const { data, error } = await supabase
    .from("game_results")
    .select("assignment_id, details, score, created_at")
    .eq("user_id", user.id)
    .in("assignment_id", assignmentIds)
    .order("created_at", { ascending: true }); // earliest first → later rows overwrite = latest wins
  if (error) throw error;

  for (const row of data ?? []) {
    const aId = (row as { assignment_id: string | null }).assignment_id;
    const details = (row as { details: Record<string, unknown> | null }).details;
    const score = (row as { score: number | null }).score ?? 0;
    const sId = details && typeof details.smazzata_id === "string" ? details.smazzata_id : null;
    if (!aId || !sId) continue;
    const made = details && typeof details.made === "boolean" ? details.made : score >= 0;
    if (!out.has(aId)) out.set(aId, new Map());
    out.get(aId)!.set(sId, { made, result: score });
  }
  return out;
}

/** Assignments visible to the current student across all enrolled classes. */
export async function getStudentAssignments(): Promise<Assignment[]> {
  const supabase = createClient();
  const enrolled = await getMyEnrolledClasses();
  if (enrolled.length === 0) return [];

  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .in(
      "class_id",
      enrolled.map((c) => c.id)
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Assignment[];
}

// ----------------------------------------------------------------------------
// Results (dashboard / heatmap)
// ----------------------------------------------------------------------------

/** Latest result per (student, smazzata) for an assignment. Server-side the RPC
 *  re-checks instructor ownership, so a non-owner gets an authorization error. */
export async function getAssignmentResults(
  assignmentId: string
): Promise<AssignmentResultRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_class_results", {
    p_assignment_id: assignmentId,
  });
  if (error) throw error;
  return (data ?? []) as AssignmentResultRow[];
}

/** Record a student's result for one hand of an assignment. Writes to the shared
 *  game_results table with game_type='compito' and assignment_id set; the
 *  smazzata_id (and any diagnostic data) goes into details for the heatmap. */
export async function recordAssignmentResult(input: {
  assignmentId: string;
  smazzataId: string;
  score: number;
  details?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autenticato");

  const { error } = await supabase.from("game_results").insert({
    user_id: user.id,
    game_type: "compito",
    assignment_id: input.assignmentId,
    score: input.score,
    details: { smazzata_id: input.smazzataId, ...(input.details ?? {}) },
  });
  if (error) throw error;
}

// ----------------------------------------------------------------------------
// Instructor application & approval
// ----------------------------------------------------------------------------

export type InstructorRequestStatus = "pending" | "approved" | "rejected";

export interface InstructorRequest {
  id: string;
  user_id: string;
  status: InstructorRequestStatus;
  message: string | null;
  asd_code: string | null;
  created_at: string;
  review_message: string | null;
}

/** Admin-facing row (joined with name + email). */
export interface InstructorRequestAdminRow extends InstructorRequest {
  display_name: string | null;
  email: string | null;
}

/** Submit (or resubmit) a request to become an instructor. Goes through an API
 *  route so the server can also email the admin (Resend, if configured). */
export async function submitInstructorRequest(input: {
  message?: string;
  asdCode?: string | null;
}): Promise<void> {
  const res = await fetch("/api/instructor-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: input.message ?? "", asdCode: input.asdCode ?? null }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || "Invio della richiesta non riuscito");
  }
}

/** The current user's own instructor request, if any. */
export async function getMyInstructorRequest(): Promise<InstructorRequest | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("instructor_requests")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return (data as InstructorRequest) ?? null;
}

/** Admin: list instructor requests, optionally filtered by status. */
export async function listInstructorRequests(
  status?: InstructorRequestStatus
): Promise<InstructorRequestAdminRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("list_instructor_requests", {
    p_status: status ?? null,
  });
  if (error) throw error;
  return (data ?? []) as InstructorRequestAdminRow[];
}

/** Admin: approve or reject a request (approval flips the user's role).
 *  An optional message is shown to the applicant on their request page. */
export async function reviewInstructorRequest(
  requestId: string,
  approve: boolean,
  message?: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("review_instructor_request", {
    p_request_id: requestId,
    p_approve: approve,
    p_message: message?.trim() || null,
  });
  if (error) throw error;
}

// ----------------------------------------------------------------------------
// Admin: oversight of all classes
// ----------------------------------------------------------------------------

export interface AdminClassRow {
  id: string;
  name: string;
  asd_code: string | null;
  invite_code: string;
  invite_active: boolean;
  instructor_id: string;
  instructor_name: string | null;
  instructor_email: string | null;
  member_count: number;
  assignment_count: number;
  created_at: string;
}

export interface AdminClassDetail {
  members: { id: string; name: string | null; joined_at: string }[];
  assignments: { id: string; title: string; created_at: string; hands: number }[];
}

/** Admin: list every class with instructor + counts (RPC is is_admin-guarded). */
export async function adminListClasses(): Promise<AdminClassRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("admin_list_classes");
  if (error) throw error;
  return (data ?? []).map((r: AdminClassRow) => ({
    ...r,
    member_count: Number(r.member_count),
    assignment_count: Number(r.assignment_count),
  }));
}

/** Admin: members + assignments of one class. */
export async function adminClassDetail(classId: string): Promise<AdminClassDetail> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("admin_class_detail", { p_class_id: classId });
  if (error) throw error;
  return (data ?? { members: [], assignments: [] }) as AdminClassDetail;
}

export interface AdminSchoolStats {
  classes: number;
  students: number;
  assignments: number;
  completionPct: number;
  bestStudent: { name: string | null; completed: number } | null;
  bestTeacher: { name: string | null; students: number; classes: number } | null;
}

/** Admin: school-wide aggregate stats for the dashboard boxes. */
export async function adminSchoolStats(): Promise<AdminSchoolStats> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("admin_school_stats");
  if (error) throw error;
  return data as AdminSchoolStats;
}

// ----------------------------------------------------------------------------
// Class chat
// ----------------------------------------------------------------------------

export interface ClassMessage {
  id: string;
  class_id: string;
  user_id: string;
  body: string;
  created_at: string;
  display_name: string | null;
}

/** Load the chat history for a class (oldest first), with sender names resolved. */
export async function getClassMessages(classId: string): Promise<ClassMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("class_messages")
    .select("id, class_id, user_id, body, created_at")
    .eq("class_id", classId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = (data ?? []) as Omit<ClassMessage, "display_name">[];
  const names = await resolveNames(rows.map((r) => r.user_id));
  return rows.map((r) => ({ ...r, display_name: names.get(r.user_id) ?? null }));
}

/** Send a message to a class. RLS enforces membership + self-authorship. */
export async function sendClassMessage(classId: string, body: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autenticato");
  const trimmed = body.trim();
  if (!trimmed) return;

  const { error } = await supabase
    .from("class_messages")
    .insert({ class_id: classId, user_id: user.id, body: trimmed.slice(0, 2000) });
  if (error) throw error;
}

/** Resolve display names for a set of user ids (profiles are world-readable). */
export async function resolveNames(userIds: string[]): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  const unique = Array.from(new Set(userIds));
  if (unique.length === 0) return map;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", unique);
  if (error) throw error;
  for (const p of data ?? []) {
    const row = p as { id: string; display_name: string | null };
    map.set(row.id, row.display_name);
  }
  return map;
}

/** Subscribe to new chat messages for a class (Supabase Realtime). Returns an
 *  unsubscribe function. The payload has no display_name — resolve it caller-side. */
export function subscribeClassMessages(
  classId: string,
  onInsert: (row: { id: string; user_id: string; body: string; created_at: string }) => void
): () => void {
  const supabase = createClient();
  const channel = supabase
    .channel(`class-chat-${classId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "class_messages", filter: `class_id=eq.${classId}` },
      (payload) => onInsert(payload.new as { id: string; user_id: string; body: string; created_at: string })
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

// ----------------------------------------------------------------------------
// Live classroom mode (Phase 3)
// ----------------------------------------------------------------------------

/** Instructor sets which hand the class plays right now (live mode). */
export async function setLiveActiveHand(
  assignmentId: string,
  index: number | null
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("assignments")
    .update({ live_active_index: index })
    .eq("id", assignmentId);
  if (error) throw error;
}

/** Subscribe to live result inserts for an assignment (Supabase Realtime).
 *  Returns an unsubscribe function. */
export function subscribeLiveResults(
  assignmentId: string,
  onResult: (row: { user_id: string; score: number; details: Record<string, unknown> | null }) => void
): () => void {
  const supabase = createClient();
  const channel = supabase
    .channel(`live-assignment-${assignmentId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "game_results",
        filter: `assignment_id=eq.${assignmentId}`,
      },
      (payload) => {
        const row = payload.new as {
          user_id: string;
          score: number;
          details: Record<string, unknown> | null;
        };
        onResult(row);
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

// ----------------------------------------------------------------------------
// Assegnare una lezione intera
// ----------------------------------------------------------------------------

/** Una riga di `stato_compiti_classe`: a che punto è la classe su un compito. */
export interface StatoCompito {
  assignment_id: string;
  /** La lezione, se il compito è nato da un'assegnazione in blocco. */
  lesson_id: number | null;
  title: string;
  n_mani: number;
  n_allievi: number;
  /** Allievi che hanno giocato TUTTE le mani, non mani giocate in totale. */
  n_completi: number;
}

/**
 * Crea il compito con tutte le mani di una lezione.
 *
 * Premuto due volte non crea doppioni: il vincolo è nel database, su
 * (classe, lezione), e la funzione restituisce il compito che c'è già. Vedi
 * `scripts/sql/assegna-lezione-2026-08.sql` — controllarlo qui non basterebbe,
 * due schede aperte non si parlano.
 *
 * Le mani le sceglie il database: passare l'elenco da qui vorrebbe dire
 * assegnare il catalogo che questa scheda ha in memoria, che può essere di ieri.
 */

/** Le mani della lezione già dentro il compito, se il compito esiste. */
export async function maniGiaAssegnate(
  classId: string,
  lessonId: number,
): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assignments")
    .select("smazzata_ids")
    .eq("class_id", classId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (error) throw error;
  return (data?.smazzata_ids as string[] | undefined) ?? [];
}

/**
 * Assegna ALCUNE mani di una lezione, aggiungendole a quelle già assegnate.
 *
 * PERCHÉ IL COMPITO CRESCE INVECE DI MOLTIPLICARSI. Il vincolo
 * `assignments_una_lezione_per_classe` dice che di una lezione esiste un solo
 * compito per classe, e va bene così: tre compiti «Lezione 4» nell'elenco
 * dell'allievo sarebbero tre righe uguali fra cui indovinare. Quindi assegnare
 * in più momenti vuol dire far crescere lo stesso compito — che è anche il modo
 * in cui la vede l'insegnante: «la lezione di questa settimana», non «il terzo
 * pezzo della lezione di questa settimana».
 *
 * UNIONE, MAI SOSTITUZIONE. Rimandare una mano già assegnata non deve creare un
 * doppione né — peggio — togliere le altre. Chi ha già giocato non se ne accorge
 * nemmeno.
 *
 * LA CORSA È GESTITA. Fra la lettura e la scrittura un'altra scheda può creare
 * il compito: l'inserimento sbatte contro il vincolo (23505), e allora si
 * rilegge e si aggiorna. Senza questo ramo il secondo insegnante vedrebbe un
 * errore per una cosa che è andata a buon fine.
 */
export async function assegnaManiLezione(
  classId: string,
  lessonId: number,
  titolo: string,
  smazzataIds: string[],
  /** Dalla classe: `classes.soluzioni_predefinite`. Il compito può derogare. */
  soluzioni?: VisibilitaSoluzioni,
): Promise<{ totale: string[]; aggiunte: string[] }> {
  const supabase = createClient();
  const esistenti = await maniGiaAssegnate(classId, lessonId);
  const aggiunte = smazzataIds.filter((id) => !esistenti.includes(id));

  if (esistenti.length > 0) {
    if (aggiunte.length === 0) return { totale: esistenti, aggiunte: [] };
    const totale = [...esistenti, ...aggiunte];
    const { error } = await supabase
      .from("assignments")
      .update({ smazzata_ids: totale })
      .eq("class_id", classId)
      .eq("lesson_id", lessonId);
    if (error) throw error;
    return { totale, aggiunte };
  }

  // `soluzioni` si passa SEMPRE, come fanno gli altri due punti che creano un
  // compito. Lasciarlo al valore iniziale della colonna significherebbe che
  // «Assegna» e «Scegli le mani» — due pulsanti sulla stessa riga di lezione —
  // producono compiti che si comportano in modo diverso.
  const { error } = await supabase.from("assignments").insert({
    class_id: classId,
    lesson_id: lessonId,
    title: titolo,
    smazzata_ids: smazzataIds,
    soluzioni: soluzioni ?? "dopo-il-gioco",
  });
  if (!error) return { totale: smazzataIds, aggiunte: smazzataIds };

  // 23505: qualcun altro ha creato il compito nel frattempo. Non è un errore
  // da mostrare, è una corsa da chiudere unendo le mani a quelle sue.
  if ((error as { code?: string }).code !== "23505") throw error;
  return assegnaManiLezione(classId, lessonId, titolo, smazzataIds, soluzioni);
}

export async function assegnaLezione(
  classId: string,
  lessonId: number,
  opzioni?: { soluzioni?: VisibilitaSoluzioni; dueDate?: string | null },
): Promise<Assignment> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("assegna_lezione", {
    p_class_id: classId,
    p_lesson_id: lessonId,
    p_soluzioni: opzioni?.soluzioni ?? "dopo-il-gioco",
    p_due_date: opzioni?.dueDate ?? null,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row as Assignment;
}

/** Per ogni compito della classe: quante mani, quanti allievi, quanti hanno finito. */
export async function getStatoCompiti(classId: string): Promise<StatoCompito[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("stato_compiti_classe", {
    p_class_id: classId,
  });
  if (error) throw error;
  return (data ?? []) as StatoCompito[];
}
