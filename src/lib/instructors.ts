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

// ----------------------------------------------------------------------------
// Types (mirror the SQL tables)
// ----------------------------------------------------------------------------

export type AssignmentMode = "homework" | "live";
export type UnlockMode = "free" | "sequential";
export type MemberStatus = "active" | "removed";

export interface ClassRoom {
  id: string;
  instructor_id: string;
  asd_code: string | null;
  name: string;
  description: string | null;
  invite_code: string;
  invite_active: boolean;
  created_at: string;
}

export interface ClassMember {
  class_id: string;
  student_id: string;
  status: MemberStatus;
  joined_at: string;
  // Joined from profiles (when fetched via getClassDetail)
  display_name?: string | null;
  avatar_url?: string | null;
}

export interface Assignment {
  id: string;
  class_id: string;
  title: string;
  instructor_note: string | null;
  smazzata_ids: string[];
  due_date: string | null;
  mode: AssignmentMode;
  unlock_mode: UnlockMode;
  live_active_index: number | null;
  created_at: string;
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
      .eq("status", "active")
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

  const members: ClassMember[] = rawMembers.map((m) => ({
    class_id: m.class_id,
    student_id: m.student_id,
    status: m.status,
    joined_at: m.joined_at,
    display_name: profileMap.get(m.student_id)?.display_name ?? null,
    avatar_url: profileMap.get(m.student_id)?.avatar_url ?? null,
  }));

  return {
    classRoom: classRes.data as ClassRoom,
    members,
    assignments: (assignmentsRes.data ?? []) as Assignment[],
  };
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
}): Promise<Assignment> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assignments")
    .insert({
      class_id: input.classId,
      title: input.title,
      smazzata_ids: input.smazzataIds,
      due_date: input.dueDate ?? null,
      instructor_note: input.instructorNote ?? null,
      mode: input.mode ?? "homework",
      unlock_mode: input.unlockMode ?? "free",
    })
    .select()
    .single();

  if (error) throw error;
  return data as Assignment;
}

export async function getAssignment(assignmentId: string): Promise<Assignment> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("id", assignmentId)
    .single();
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

/** Admin: approve or reject a request (approval flips the user's role). */
export async function reviewInstructorRequest(
  requestId: string,
  approve: boolean
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("review_instructor_request", {
    p_request_id: requestId,
    p_approve: approve,
  });
  if (error) throw error;
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
