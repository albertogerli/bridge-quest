"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSharedAuth } from "@/contexts/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useGameStore } from "@/store/use-game-store";

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

/** Snapshot of last-synced values to skip unnecessary pushes */
let lastSyncedSnapshot = "";

function getLocalSnapshot(): string {
  try {
    const { xp, streak, handsPlayed, completedModules } = useGameStore.getState();
    return JSON.stringify({
      xp: String(xp),
      streak: String(streak),
      handsPlayed: String(handsPlayed),
      profile: localStorage.getItem(LS_KEYS.profile) || "adulto",
      memoryBest: localStorage.getItem(LS_KEYS.memoryBest) || "",
      textSize: localStorage.getItem(LS_KEYS.textSize) || "medio",
      animSpeed: localStorage.getItem(LS_KEYS.animSpeed) || "normale",
      sound: localStorage.getItem(LS_KEYS.sound) ?? "true",
      completedModules: JSON.stringify(completedModules),
      badges: localStorage.getItem(LS_KEYS.badges) || "[]",
      totalMinutes: localStorage.getItem(LS_KEYS.totalMinutes) || "0",
    });
  } catch {
    return "";
  }
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
  const { user, profile } = useSharedAuth();
  const hasDoneInitialSync = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const supabase = createClient();

  // Keep user id in ref for event handlers
  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user]);

  // Push current localStorage state to Supabase
  const pushToSupabase = useCallback(
    async (userId: string, force = false) => {
      try {
        const snapshot = getLocalSnapshot();
        if (!force && snapshot === lastSyncedSnapshot) return;

        const { xp, streak, handsPlayed, completedModules } = useGameStore.getState();
        const profileType = localStorage.getItem(LS_KEYS.profile) || "adulto";
        const memoryBest = localStorage.getItem(LS_KEYS.memoryBest);
        const textSize = localStorage.getItem(LS_KEYS.textSize) || "medio";
        const animSpeed = localStorage.getItem(LS_KEYS.animSpeed) || "normale";
        const sound = localStorage.getItem(LS_KEYS.sound);
        const totalMinutes = Math.round(parseFloat(localStorage.getItem(LS_KEYS.totalMinutes) || "0"));

        // Push profile data
        await supabase
          .from("profiles")
          .update({
            xp,
            streak,
            hands_played: handsPlayed,
            profile_type: profileType as "junior" | "giovane" | "adulto" | "senior",
            memory_best: memoryBest ? parseInt(memoryBest, 10) : null,
            text_size: textSize,
            anim_speed: animSpeed,
            sound_on: sound !== "false",
            total_minutes: totalMinutes,
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        // Push completed modules from the store
        try {
          const keys = Object.keys(completedModules);
          const rows = keys.map((moduleKey: string) => {
            const parts = moduleKey.split("-");
            const lessonId = parts.slice(0, -1).join("-");
            const moduleId = parts[parts.length - 1];
            return { user_id: userId, lesson_id: lessonId, module_id: moduleId };
          });
          if (rows.length > 0) {
            await supabase.from("completed_modules").upsert(rows, {
              onConflict: "user_id,lesson_id,module_id",
            });
          }
        } catch {}

        // Push badges
        const badgesRaw = localStorage.getItem(LS_KEYS.badges);
        if (badgesRaw) {
          try {
            const badges: string[] = JSON.parse(badgesRaw);
            const rows = badges.map((badgeId) => ({
              user_id: userId,
              badge_id: badgeId,
            }));
            if (rows.length > 0) {
              await supabase.from("badges").upsert(rows, {
                onConflict: "user_id,badge_id",
              });
            }
          } catch {}
        }

        // Push review items
        const reviewRaw = localStorage.getItem(LS_KEYS.reviewItems);
        if (reviewRaw) {
          try {
            const items: Array<{
              lessonId: string;
              moduleId: string;
              question?: string;
              wrongCount: number;
              lastReview?: string;
              nextReview?: string;
            }> = JSON.parse(reviewRaw);

            // Delete old items and re-insert (simpler than diffing)
            await supabase.from("review_items").delete().eq("user_id", userId);

            if (items.length > 0) {
              const rows = items.map((item) => ({
                user_id: userId,
                lesson_id: item.lessonId,
                module_id: item.moduleId,
                question: item.question || null,
                wrong_count: item.wrongCount,
                last_review: item.lastReview || null,
                next_review: item.nextReview || null,
              }));
              await supabase.from("review_items").insert(rows);
            }
          } catch {}
        }

        lastSyncedSnapshot = snapshot;
      } catch (err) {
        console.error("[Sync] Push error:", err);
      }
    },
    [supabase]
  );

  // Initial bidirectional sync (once per session)
  useEffect(() => {
    if (!user || !profile || hasDoneInitialSync.current) return;
    hasDoneInitialSync.current = true;

    const initialSync = async () => {
      try {
        // Read local values BEFORE any overwrite — game stats from the store,
        // everything else still from plain localStorage.
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
          lessonId: string;
          moduleId: string;
          question?: string;
          wrongCount: number;
          lastReview?: string;
          nextReview?: string;
        }> = [];
        try {
          const raw = localStorage.getItem(LS_KEYS.reviewItems);
          if (raw) localReviewItems = JSON.parse(raw);
        } catch {}

        const hasLocalData = localXp > 0 || localHands > 0 || Object.keys(localModules).length > 0;

        if (profile.xp > 0 || hasLocalData) {
          // Fetch remote collections
          const [{ data: modules }, { data: badges }, { data: reviews }] = await Promise.all([
            supabase.from("completed_modules").select("lesson_id, module_id").eq("user_id", user.id),
            supabase.from("badges").select("badge_id").eq("user_id", user.id),
            supabase.from("review_items").select("*").eq("user_id", user.id),
          ]);

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
              const key = `${r.lesson_id}-${r.module_id}-${r.question || ""}`;
              const existing = reviewMap.get(key);
              const remoteItem = {
                lessonId: r.lesson_id,
                moduleId: r.module_id,
                question: r.question,
                wrongCount: r.wrong_count,
                lastReview: r.last_review,
                nextReview: r.next_review,
              };
              if (!existing || (r.last_review && (!existing.lastReview || r.last_review > existing.lastReview))) {
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

          lastSyncedSnapshot = getLocalSnapshot();

          // Push merged state back to Supabase so both sides are in sync
          await pushToSupabase(user.id, true);

          // Notify components
          window.dispatchEvent(new Event("bq_stats_updated"));
          return;
        }

        // Both sides empty — nothing to do
      } catch (err) {
        console.error("[Sync] Initial sync error:", err);
      }
    };

    initialSync();
  }, [user, profile, supabase, pushToSupabase]);

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
