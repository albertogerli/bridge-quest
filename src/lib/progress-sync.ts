import type { SupabaseClient } from "@supabase/supabase-js";

export interface ReviewProgress {
  lessonId: string | number; moduleId: string; question?: string | null;
  wrongCount: number; box?: number; lastReview?: string | null; nextReview?: string | null;
}
export interface ProgressSnapshot {
  xp: number; streak: number; handsPlayed: number; completedModules: Record<string, boolean>;
  profile: string; memoryBest: number | null; textSize: string; animSpeed: string;
  sound: boolean; totalMinutes: number; badges: string[]; reviewItems: ReviewProgress[];
}
export type SyncOutcome = { status: "saved"; reviewRevision: string } | { status: "unchanged" } | { status: "error" };

export class SyncWriteError extends Error {
  constructor(public readonly code: string, operation: string) {
    super(`Sync ${operation} rejected (${code})`);
  }
}

/** Local review UI uses numeric lesson IDs and calendar dates, not SQL timestamps. */
export function normalizeReview(item: ReviewProgress) {
  const lessonId = Number(item.lessonId);
  if (!Number.isInteger(lessonId) || !item.moduleId) throw new Error("Invalid review identity");
  return { ...item, lessonId, question: item.question ?? undefined,
    lastReview: item.lastReview?.slice(0, 10), nextReview: item.nextReview?.slice(0, 10) };
}

/** Only codes, never row values or database details, may reach telemetry. */
export function assertSyncResult(result: { error: { code?: string } | null }, operation: string): void {
  if (result.error) throw new SyncWriteError(result.error.code ?? "database", operation);
}

export async function writeProgress(db: SupabaseClient, owner: string, snapshot: ProgressSnapshot, reviewRevision: string): Promise<string> {
  const auth = await db.auth.getUser();
  if (auth.error || auth.data.user?.id !== owner) throw new Error("Sync session changed");
  const profile = await db.from("profiles").update({
    xp: snapshot.xp, streak: snapshot.streak, hands_played: snapshot.handsPlayed,
    profile_type: snapshot.profile, memory_best: snapshot.memoryBest,
    text_size: snapshot.textSize, anim_speed: snapshot.animSpeed, sound_on: snapshot.sound,
    total_minutes: snapshot.totalMinutes, last_login: new Date().toISOString(), updated_at: new Date().toISOString(),
  }, { count: "exact" }).eq("id", owner);
  assertSyncResult(profile, "profile");
  if (profile.count !== 1) throw new Error("Sync profile not updated");

  // Preserve existing composite encoding until a separate data migration is approved.
  const modules = Object.entries(snapshot.completedModules).filter(([, done]) => done).map(([key]) => {
    const split = key.lastIndexOf("-");
    return { user_id: owner, lesson_id: key.slice(0, split), module_id: key.slice(split + 1) };
  });
  if (modules.length) assertSyncResult(await db.from("completed_modules").upsert(modules, {
    onConflict: "user_id,lesson_id,module_id", ignoreDuplicates: true,
  }), "modules");
  if (snapshot.badges.length) assertSyncResult(await db.from("badges").upsert(
    snapshot.badges.map((badge_id) => ({ user_id: owner, badge_id })),
    { onConflict: "user_id,badge_id", ignoreDuplicates: true },
  ), "badges");

  // One transaction, optimistic revision check, and authenticated owner derived in SQL.
  const reviews = await db.rpc("sync_review_items", { p_items: snapshot.reviewItems, p_expected_revision: reviewRevision });
  assertSyncResult(reviews, "reviews");
  if (typeof reviews.data !== "string") throw new Error("Sync review revision missing");
  return reviews.data;
}

/** Per-hook/per-account acknowledgement. Failures never advance the saved snapshot. */
export function createProgressWriter(write: (owner: string, snapshot: ProgressSnapshot, revision: string) => Promise<string>) {
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
      if (active) { await active; return { status: "unchanged" }; }
      const serialized = JSON.stringify(snapshot);
      if (!force && serialized === acknowledged) return { status: "unchanged" };
      const epoch = generation;
      const job = write(userId, snapshot, revision).then((next) => {
        if (epoch === generation) { revision = next; acknowledged = serialized; }
        return { status: "saved", reviewRevision: next } as const;
      });
      active = job;
      try { return await job; } finally { if (epoch === generation) active = null; }
    },
  };
}
