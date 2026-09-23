import { isAuthSessionMissingError, type AuthError, type SupabaseClient } from "@supabase/supabase-js";

export interface ReviewProgress {
  lessonId: string | number; moduleId: string; question?: string | null;
  wrongCount: number; box?: number; lastReview?: string | null; nextReview?: string | null;
}
export interface ProgressSnapshot {
  xp: number; streak: number; handsPlayed: number; completedModules: Record<string, boolean>;
  profile: string; memoryBest: number | null; textSize: string; animSpeed: string;
  sound: boolean; totalMinutes: number; badges: string[]; reviewItems: ReviewProgress[];
}
export type SyncOutcome = { status: "saved"; reviewRevision: string } | { status: "unchanged" } | { status: "cancelled" };

/** Expected interruption, not a network or permissions error. Never acknowledge it. */
export class SyncSessionChangedError extends Error {
  constructor() {
    super("Sync interrupted: session unavailable or changed");
    this.name = "SyncSessionChangedError";
  }
}

/** Preserve diagnostic codes/status, never auth payloads, tokens or user data. */
export class SyncAuthError extends Error {
  readonly code: string;
  constructor(error: AuthError) {
    const code = error.code || error.name || "auth_error";
    const safeCode = /^[a-zA-Z0-9_-]{1,80}$/.test(code) ? code : "auth_error";
    super(`Sync authentication failed (${safeCode})`);
    this.name = "SyncAuthError";
    this.code = safeCode;
    this.status = error.status;
  }
  readonly status: number | undefined;
}

function assertAuthResult(error: AuthError | null) {
  if (!error) return;
  if (isAuthSessionMissingError(error) || error.code === "session_not_found") throw new SyncSessionChangedError();
  throw new SyncAuthError(error);
}

function assertCurrent(isCurrent: () => boolean) {
  if (!isCurrent()) throw new SyncSessionChangedError();
}

/** Capture a token, validate THAT token server-side, then bind each request to it. */
async function progressAuthorization(db: SupabaseClient, owner: string): Promise<string> {
  const session = await db.auth.getSession();
  assertAuthResult(session.error);
  const token = session.data.session?.access_token;
  if (!token) throw new SyncSessionChangedError();
  const auth = await db.auth.getUser(token);
  assertAuthResult(auth.error);
  if (!auth.data.user || auth.data.user.id !== owner) throw new SyncSessionChangedError();
  return `Bearer ${token}`;
}

export async function readProgress(db: SupabaseClient, owner: string, isCurrent: () => boolean = () => true) {
  assertCurrent(isCurrent);
  const authorization = await progressAuthorization(db, owner);
  assertCurrent(isCurrent);
  const [moduleResult, badgeResult, reviewResult] = await Promise.all([
    db.from("completed_modules").select("lesson_id, module_id").eq("user_id", owner).setHeader("Authorization", authorization),
    db.from("badges").select("badge_id").eq("user_id", owner).setHeader("Authorization", authorization),
    db.rpc("get_review_items_state").setHeader("Authorization", authorization),
  ]);
  assertCurrent(isCurrent);
  return { moduleResult, badgeResult, reviewResult };
}

type SyncOperation = "profile" | "modules" | "badges" | "reviews" | "read-modules" | "read-badges" | "read-reviews";
type SyncResult = { error: { code?: string; message?: string } | null; status?: number };
const DATABASE_CODE = /^(?:[A-Z0-9]{5}|PGRST[0-9]{3})$/;
const CLIENT_CODES = new Set(["network_error", "request_aborted", "client_error", "http_error", "invalid_response", "unknown_error"]);

function responseStatus(status: number | undefined): number | undefined {
  return status === 0 || (status !== undefined && Number.isInteger(status) && status >= 100 && status <= 599) ? status : undefined;
}

export class SyncWriteError extends Error {
  readonly code: string;
  readonly status: number | undefined;
  constructor(code: string, operation: SyncOperation, status?: number) {
    const safeCode = DATABASE_CODE.test(code) || CLIENT_CODES.has(code) ? code : "unknown_error";
    const safeStatus = responseStatus(status);
    super(`Sync ${operation} failed (${safeCode}; status ${safeStatus ?? "unknown"})`);
    this.name = "SyncWriteError";
    this.code = safeCode;
    this.status = safeStatus;
  }
}

function syncFailureCode(result: SyncResult): string {
  const code = result.error?.code;
  if (code && DATABASE_CODE.test(code)) return code;
  const status = responseStatus(result.status);
  if (status === 0) {
    // PostgREST wraps client exceptions as { code: "", message: "Name: message" }.
    // Inspect only to classify: never retain the raw message, stack, URL or cause.
    const message = result.error?.message ?? "";
    if (/^AbortError:/.test(message)) return "request_aborted";
    if (/^TypeError: (Failed to fetch|Load failed|NetworkError when attempting to fetch resource\.?)$/.test(message)) return "network_error";
    return "client_error"; // An arbitrary TypeError is not proof of a network fault.
  }
  if (status !== undefined && status >= 400) return "http_error";
  if (status !== undefined && status >= 200 && status < 300) return "invalid_response";
  return "unknown_error";
}

/** Local review UI uses numeric lesson IDs and calendar dates, not SQL timestamps. */
export function normalizeReview(item: ReviewProgress) {
  const lessonId = Number(item.lessonId);
  if (!Number.isInteger(lessonId) || !item.moduleId) throw new Error("Invalid review identity");
  return { ...item, lessonId, question: item.question ?? undefined,
    lastReview: item.lastReview?.slice(0, 10), nextReview: item.nextReview?.slice(0, 10) };
}

/** Preserve codes/status and a bounded failure category, never row values or raw details. */
export function assertSyncResult(result: SyncResult, operation: SyncOperation): void {
  if (result.error) throw new SyncWriteError(syncFailureCode(result), operation, result.status);
}

export async function writeProgress(db: SupabaseClient, owner: string, snapshot: ProgressSnapshot, reviewRevision: string, isCurrent: () => boolean = () => true): Promise<string> {
  assertCurrent(isCurrent);
  const authorization = await progressAuthorization(db, owner);
  assertCurrent(isCurrent);
  const profile = await db.from("profiles").update({
    xp: snapshot.xp, streak: snapshot.streak, hands_played: snapshot.handsPlayed,
    profile_type: snapshot.profile, memory_best: snapshot.memoryBest,
    text_size: snapshot.textSize, anim_speed: snapshot.animSpeed, sound_on: snapshot.sound,
    total_minutes: snapshot.totalMinutes, last_login: new Date().toISOString(), updated_at: new Date().toISOString(),
  }, { count: "exact" }).eq("id", owner).setHeader("Authorization", authorization);
  assertCurrent(isCurrent);
  assertSyncResult(profile, "profile");
  if (profile.count !== 1) throw new Error("Sync profile not updated");

  // Preserve existing composite encoding until a separate data migration is approved.
  const modules = Object.entries(snapshot.completedModules).filter(([, done]) => done).map(([key]) => {
    const split = key.lastIndexOf("-");
    return { user_id: owner, lesson_id: key.slice(0, split), module_id: key.slice(split + 1) };
  });
  if (modules.length) assertSyncResult(await db.from("completed_modules").upsert(modules, {
    onConflict: "user_id,lesson_id,module_id", ignoreDuplicates: true,
  }).setHeader("Authorization", authorization), "modules");
  assertCurrent(isCurrent);
  if (snapshot.badges.length) assertSyncResult(await db.from("badges").upsert(
    snapshot.badges.map((badge_id) => ({ user_id: owner, badge_id })),
    { onConflict: "user_id,badge_id", ignoreDuplicates: true },
  ).setHeader("Authorization", authorization), "badges");
  assertCurrent(isCurrent);

  // One transaction, optimistic revision check, and authenticated owner derived in SQL.
  const reviews = await db.rpc("sync_review_items", { p_items: snapshot.reviewItems, p_expected_revision: reviewRevision }).setHeader("Authorization", authorization);
  assertCurrent(isCurrent);
  assertSyncResult(reviews, "reviews");
  if (typeof reviews.data !== "string") throw new Error("Sync review revision missing");
  return reviews.data;
}

/** Per-hook/per-account acknowledgement. Failures never advance the saved snapshot. */
export function createProgressWriter(write: (owner: string, snapshot: ProgressSnapshot, revision: string, isCurrent: () => boolean) => Promise<string>) {
  let acknowledged = "";
  let revision = "";
  let owner: string | null = null;
  let generation = 0;
  let active: Promise<SyncOutcome> | null = null;
  return {
    initialize(nextOwner: string | null, nextRevision = "") {
      generation++; owner = nextOwner; revision = nextRevision; acknowledged = ""; active = null;
    },
    async push(userId: string, snapshot: ProgressSnapshot, force = false): Promise<SyncOutcome> {
      if (owner !== userId || !revision) throw new Error("Sync not initialized for this account");
      if (active) { const outcome = await active; return outcome.status === "cancelled" ? outcome : { status: "unchanged" }; }
      const serialized = JSON.stringify(snapshot);
      if (!force && serialized === acknowledged) return { status: "unchanged" };
      const epoch = generation;
      const isCurrent = () => epoch === generation && owner === userId;
      const job = write(userId, snapshot, revision, isCurrent).then((next) => {
        if (!isCurrent()) return { status: "cancelled" } as const;
        revision = next; acknowledged = serialized;
        return { status: "saved", reviewRevision: next } as const;
      }).catch((error: unknown) => {
        if (!isCurrent() || error instanceof SyncSessionChangedError) return { status: "cancelled" } as const;
        throw error;
      });
      active = job;
      try { return await job; } finally { if (epoch === generation) active = null; }
    },
  };
}
