"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSharedAuth } from "@/contexts/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useGameStore } from "@/store/use-game-store";
import { reportError } from "@/lib/report-error";
import { assertSyncResult, createProgressWriter, readProgress, writeProgress, normalizeReview, SyncSessionChangedError, SyncWriteError, type ProgressSnapshot, type ReviewProgress } from "@/lib/progress-sync";
import { activateProgressOwner } from "@/lib/progress-owner";

// Keys that still live in plain localStorage (not yet in the game store).
const LS_KEYS = {
  badges: "bq_badges",
  profile: "bq_profile",
  memoryBest: "bq_memory_best",
  textSize: "bq_text_size",
  animSpeed: "bq_anim_speed",
  sound: "bq_sound",
  reviewItems: "bq_review_items",
  totalMinutes: "bq_total_minutes",
} as const;

/** Captures every synchronized field once, including review-only changes. */
export function getProgressSnapshot(): ProgressSnapshot {
  const { xp, streak, handsPlayed, completedModules } = useGameStore.getState();
  const badges: unknown = JSON.parse(localStorage.getItem(LS_KEYS.badges) || "[]");
  const reviewItems: unknown = JSON.parse(localStorage.getItem(LS_KEYS.reviewItems) || "[]");
  if (!Array.isArray(badges) || !badges.every((b) => typeof b === "string") || !Array.isArray(reviewItems)) {
    throw new Error("Invalid local progress");
  }
  const memoryBest = localStorage.getItem(LS_KEYS.memoryBest);
  return {
    xp, streak, handsPlayed, completedModules: { ...completedModules },
    profile: localStorage.getItem(LS_KEYS.profile) || "adulto",
    memoryBest: memoryBest ? Number(memoryBest) : null,
    textSize: localStorage.getItem(LS_KEYS.textSize) || "medio",
    animSpeed: localStorage.getItem(LS_KEYS.animSpeed) || "normale",
    sound: localStorage.getItem(LS_KEYS.sound) !== "false",
    badges: badges as string[], reviewItems: reviewItems as ReviewProgress[],
    totalMinutes: Math.round(Number(localStorage.getItem(LS_KEYS.totalMinutes) || "0")),
  };
}

/**
 * Continuous Supabase sync.
 *
 * - On first login: bidirectional sync (Supabase wins if it has data, else localStorage migrates up)
 * - Every 30 seconds: push localStorage changes to Supabase (only if something changed)
 * - On tab focus: immediate push
 * - On page close: best-effort push
 */
export function useSupabaseSync() {
  const { user, profile, loading } = useSharedAuth();
  const hasDoneInitialSync = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const generation = useRef(0);
  const supabase = createClient();
  const writer = useRef(createProgressWriter((owner, snapshot, revision, isCurrent) => writeProgress(
    supabase, owner, snapshot, revision,
    () => isCurrent() && userIdRef.current === owner && localStorage.getItem("bq_progress_owner") === owner,
  )));

  // Keep user id in ref for event handlers
  useEffect(() => {
    if (loading) return;
    const epoch = ++generation.current;
    const currentWriter = writer.current;
    userIdRef.current = user?.id ?? null;
    hasDoneInitialSync.current = false;
    currentWriter.initialize(userIdRef.current);
    try {
      const { xp, streak, handsPlayed, completedModules, lastLogin } = useGameStore.getState();
      const restored = activateProgressOwner(localStorage, userIdRef.current,
        { xp, streak, handsPlayed, completedModules, lastLogin },
        { xp: 0, streak: 0, handsPlayed: 0, completedModules: {}, lastLogin: null }, Object.values(LS_KEYS));
      if (restored) useGameStore.setState(restored);
    } catch {
      userIdRef.current = null; // Do not upload possibly mixed local state.
      reportError("sync:account", new Error("Impossibile isolare i progressi locali"));
    }
    return () => {
      generation.current = epoch + 1;
      userIdRef.current = null;
      hasDoneInitialSync.current = false;
      currentWriter.initialize(null);
    };
  }, [user?.id, loading]);

  const pushToSupabase = useCallback(async (userId: string, force = false) => {
    if (userIdRef.current !== userId || localStorage.getItem("bq_progress_owner") !== userId || (!force && !hasDoneInitialSync.current)) return;
    const epoch = generation.current;
    const isCurrent = () => epoch === generation.current && userIdRef.current === userId && localStorage.getItem("bq_progress_owner") === userId;
    try {
      const outcome = await writer.current.push(userId, getProgressSnapshot(), force);
      if (!isCurrent()) return;
      if (outcome.status === "saved") {
        window.dispatchEvent(new CustomEvent("bq_sync_status", { detail: "saved" }));
      } else if (outcome.status === "cancelled") {
        // L'interfaccia può ancora mostrare l'utente mentre l'auth si aggiorna.
        // Non dichiarare salvati i progressi rimasti locali; nessun falso allarme.
        window.dispatchEvent(new CustomEvent("bq_sync_status", { detail: "error" }));
      }
    } catch (error) {
      if (!isCurrent()) return;
      // Re-read and merge on the next initial-sync attempt; never overwrite a newer revision.
      if (error instanceof SyncWriteError && error.code === "40001") hasDoneInitialSync.current = false;
      reportError("sync:push", error);
      window.dispatchEvent(new CustomEvent("bq_sync_status", { detail: "error" }));
    }
  }, []);

  // Initial bidirectional sync (once per session)
  useEffect(() => {
    if (loading || !user || !profile || profile.id !== user.id || userIdRef.current !== user.id) return;
    let cancelled = false;
    let initializing = false;

    const initialSync = async () => {
      if (cancelled || initializing || hasDoneInitialSync.current) return;
      initializing = true;
      try {
        const { moduleResult, badgeResult, reviewResult } = await readProgress(supabase, user.id,
          () => !cancelled && userIdRef.current === user.id && localStorage.getItem("bq_progress_owner") === user.id);
        assertSyncResult(moduleResult, "read-modules");
        assertSyncResult(badgeResult, "read-badges");
        assertSyncResult(reviewResult, "read-reviews");
        if (cancelled || userIdRef.current !== user.id || localStorage.getItem("bq_progress_owner") !== user.id) return;
        // Read local values BEFORE any overwrite — game stats from the store,
        // AFTER the network request, so activity during the request is not lost.
        const { xp: localXp, streak: localStreak, handsPlayed: localHands, completedModules: localModules } =
          useGameStore.getState();
        const localMinutes = Math.round(parseFloat(localStorage.getItem(LS_KEYS.totalMinutes) || "0"));
        const localMemoryBest = localStorage.getItem(LS_KEYS.memoryBest);
        const localMemoryBestNum = localMemoryBest ? parseInt(localMemoryBest, 10) : null;

        let localBadges: string[] = [];
        try {
          const raw = localStorage.getItem(LS_KEYS.badges);
          if (raw) localBadges = JSON.parse(raw);
        } catch {}

        let localReviewItems: Array<{
          lessonId: number;
          moduleId: string;
          question?: string;
          wrongCount: number;
          box?: number;
          lastReview?: string;
          nextReview?: string;
        }> = [];
        try {
          const raw = localStorage.getItem(LS_KEYS.reviewItems);
          if (raw) localReviewItems = (JSON.parse(raw) as ReviewProgress[]).map(normalizeReview);
        } catch {}

        const hasLocalData = localXp > 0 || localHands > 0 || Object.keys(localModules).length > 0;

        if (profile.xp >= 0 || hasLocalData) {
          const modules = moduleResult.data;
          const badges = badgeResult.data;
          const reviewState = reviewResult.data as { items: ReviewProgress[]; revision: string };
          if (!reviewState || !Array.isArray(reviewState.items) || typeof reviewState.revision !== "string") {
            throw new Error("Invalid remote review state");
          }
          writer.current.initialize(user.id, reviewState.revision);
          const reviews = reviewState.items.map(normalizeReview);

          // MERGE numeric values: take the MAX
          const mergedXp = Math.max(profile.xp, localXp);
          const mergedStreak = Math.max(profile.streak, localStreak);
          const mergedHands = Math.max(profile.hands_played, localHands);
          const mergedMinutes = Math.max(profile.total_minutes || 0, localMinutes);
          const remoteMemoryBest = profile.memory_best;
          const mergedMemoryBest = (remoteMemoryBest !== null && localMemoryBestNum !== null)
            ? Math.min(remoteMemoryBest, localMemoryBestNum) // lower is better for memory game
            : remoteMemoryBest ?? localMemoryBestNum;

          // MERGE completed modules: union of both sets
          const mergedModules: Record<string, boolean> = { ...localModules };
          if (modules && modules.length > 0) {
            for (const m of modules) {
              mergedModules[`${m.lesson_id}-${m.module_id}`] = true;
            }
          }

          // MERGE badges: union of both sets
          const remoteBadgeIds = badges ? badges.map((b) => b.badge_id) : [];
          const mergedBadges = [...new Set([...localBadges, ...remoteBadgeIds])];

          // MERGE review items: union by key, keep the one with latest lastReview
          const reviewMap = new Map<string, typeof localReviewItems[number]>();
          for (const item of localReviewItems) {
            reviewMap.set(`${item.lessonId}-${item.moduleId}-${item.question || ""}`, item);
          }
          if (reviews && reviews.length > 0) {
            for (const r of reviews) {
              const key = `${r.lessonId}-${r.moduleId}-${r.question || ""}`;
              const existing = reviewMap.get(key);
              const remoteItem = {
                lessonId: r.lessonId,
                moduleId: r.moduleId,
                question: r.question ?? undefined,
                wrongCount: r.wrongCount,
                box: r.box ?? 1,
                lastReview: r.lastReview ?? undefined,
                nextReview: r.nextReview ?? undefined,
              };
              if (!existing || (r.lastReview && (!existing.lastReview || r.lastReview > existing.lastReview))) {
                reviewMap.set(key, remoteItem);
              }
            }
          }
          const mergedReviewItems = [...reviewMap.values()];

          // Write merged values: game stats into the store, everything else to localStorage.
          if (profile.xp > 0) {
            localStorage.setItem(LS_KEYS.profile, profile.profile_type);
            localStorage.setItem(LS_KEYS.textSize, profile.text_size);
            localStorage.setItem(LS_KEYS.animSpeed, profile.anim_speed);
            localStorage.setItem(LS_KEYS.sound, profile.sound_on ? "true" : "false");
          }
          useGameStore.setState({
            xp: mergedXp,
            streak: mergedStreak,
            handsPlayed: mergedHands,
            completedModules: mergedModules,
          });
          localStorage.setItem(LS_KEYS.totalMinutes, String(mergedMinutes));
          if (mergedMemoryBest !== null) {
            localStorage.setItem(LS_KEYS.memoryBest, String(mergedMemoryBest));
          }
          localStorage.setItem(LS_KEYS.badges, JSON.stringify(mergedBadges));
          if (mergedReviewItems.length > 0) {
            localStorage.setItem(LS_KEYS.reviewItems, JSON.stringify(mergedReviewItems));
          }

          hasDoneInitialSync.current = true;

          // Push merged state back to Supabase so both sides are in sync
          await pushToSupabase(user.id, true);

          // Notify components
          if (cancelled || userIdRef.current !== user.id) return;
          window.dispatchEvent(new Event("bq_stats_updated"));
          return;
        }

        // Both sides empty — nothing to do
      } catch (err) {
        if (cancelled || userIdRef.current !== user.id || localStorage.getItem("bq_progress_owner") !== user.id) return;
        if (!(err instanceof SyncSessionChangedError)) reportError("sync:initial", err);
        window.dispatchEvent(new CustomEvent("bq_sync_status", { detail: "error" }));
      } finally {
        initializing = false;
      }
    };

    void initialSync();
    const retryInitial = setInterval(() => { void initialSync(); }, 30_000);
    const retry = () => { if (!hasDoneInitialSync.current) void initialSync(); else void pushToSupabase(user.id); };
    window.addEventListener("bq_sync_retry", retry);
    window.addEventListener("online", retry);
    return () => { cancelled = true; clearInterval(retryInitial); window.removeEventListener("bq_sync_retry", retry); window.removeEventListener("online", retry); };
  }, [user, profile, loading, supabase, pushToSupabase]);

  // Continuous sync: periodic push + visibility change + beforeunload
  useEffect(() => {
    if (!user) return;

    const userId = user.id;

    // Push every 30 seconds if there are changes
    const intervalId = setInterval(() => {
      pushToSupabase(userId);
    }, 30_000);

    // Push when tab becomes visible again
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        pushToSupabase(userId);
      }
    };

    // Best-effort push on page close
    const handleBeforeUnload = () => {
      pushToSupabase(userId);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [user, pushToSupabase]);
}
