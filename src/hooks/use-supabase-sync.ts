"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "./use-auth";
import { createClient } from "@/lib/supabase/client";

const LS_KEYS = {
  xp: "bq_xp",
  streak: "bq_streak",
  lastLogin: "bq_last_login",
  completedModules: "bq_completed_modules",
  handsPlayed: "bq_hands_played",
  badges: "bq_badges",
  profile: "bq_profile",
  memoryBest: "bq_memory_best",
  textSize: "bq_text_size",
  animSpeed: "bq_anim_speed",
  sound: "bq_sound",
  reviewItems: "bq_review_items",
} as const;

/** Snapshot of last-synced values to skip unnecessary pushes */
let lastSyncedSnapshot = "";

function getLocalSnapshot(): string {
  try {
    return JSON.stringify({
      xp: localStorage.getItem(LS_KEYS.xp) || "0",
      streak: localStorage.getItem(LS_KEYS.streak) || "0",
      handsPlayed: localStorage.getItem(LS_KEYS.handsPlayed) || "0",
      profile: localStorage.getItem(LS_KEYS.profile) || "adulto",
      memoryBest: localStorage.getItem(LS_KEYS.memoryBest) || "",
      textSize: localStorage.getItem(LS_KEYS.textSize) || "medio",
      animSpeed: localStorage.getItem(LS_KEYS.animSpeed) || "normale",
      sound: localStorage.getItem(LS_KEYS.sound) ?? "true",
      completedModules: localStorage.getItem(LS_KEYS.completedModules) || "{}",
      badges: localStorage.getItem(LS_KEYS.badges) || "[]",
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
  const { user, profile } = useAuth();
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

        const xp = parseInt(localStorage.getItem(LS_KEYS.xp) || "0", 10);
        const streak = parseInt(localStorage.getItem(LS_KEYS.streak) || "0", 10);
        const handsPlayed = parseInt(localStorage.getItem(LS_KEYS.handsPlayed) || "0", 10);
        const profileType = localStorage.getItem(LS_KEYS.profile) || "adulto";
        const memoryBest = localStorage.getItem(LS_KEYS.memoryBest);
        const textSize = localStorage.getItem(LS_KEYS.textSize) || "medio";
        const animSpeed = localStorage.getItem(LS_KEYS.animSpeed) || "normale";
        const sound = localStorage.getItem(LS_KEYS.sound);

        // Push profile data
        await supabase
          .from("profiles")
          .update({
            xp,
            streak,
            hands_played: handsPlayed,
            profile_type: profileType as "giovane" | "adulto" | "senior",
            memory_best: memoryBest ? parseInt(memoryBest, 10) : null,
            text_size: textSize,
            anim_speed: animSpeed,
            sound_on: sound !== "false",
            last_login: new Date().toISOString().split("T")[0],
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        // Push completed modules (stored as Record<string, boolean>)
        const completedRaw = localStorage.getItem(LS_KEYS.completedModules);
        if (completedRaw) {
          try {
            const parsed = JSON.parse(completedRaw);
            // Handle both object {"1-1": true} and legacy array ["1-1"] formats
            const keys: string[] = Array.isArray(parsed)
              ? parsed
              : typeof parsed === "object"
                ? Object.keys(parsed)
                : [];

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
        }

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
        if (profile.xp > 0) {
          // Supabase has data → pull to localStorage
          syncToLocalStorage(profile);

          // Also pull completed modules from Supabase
          const { data: modules } = await supabase
            .from("completed_modules")
            .select("lesson_id, module_id")
            .eq("user_id", user.id);

          if (modules && modules.length > 0) {
            const map: Record<string, boolean> = {};
            for (const m of modules) {
              map[`${m.lesson_id}-${m.module_id}`] = true;
            }
            localStorage.setItem(LS_KEYS.completedModules, JSON.stringify(map));
          }

          // Pull badges
          const { data: badges } = await supabase
            .from("badges")
            .select("badge_id")
            .eq("user_id", user.id);

          if (badges && badges.length > 0) {
            localStorage.setItem(
              LS_KEYS.badges,
              JSON.stringify(badges.map((b) => b.badge_id))
            );
          }

          // Pull review items
          const { data: reviews } = await supabase
            .from("review_items")
            .select("*")
            .eq("user_id", user.id);

          if (reviews && reviews.length > 0) {
            const items = reviews.map((r) => ({
              lessonId: r.lesson_id,
              moduleId: r.module_id,
              question: r.question,
              wrongCount: r.wrong_count,
              lastReview: r.last_review,
              nextReview: r.next_review,
            }));
            localStorage.setItem(LS_KEYS.reviewItems, JSON.stringify(items));
          }

          lastSyncedSnapshot = getLocalSnapshot();
          return;
        }

        // Supabase is empty → push localStorage up (first-time migration)
        await pushToSupabase(user.id, true);
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

function syncToLocalStorage(profile: {
  xp: number;
  streak: number;
  hands_played: number;
  profile_type: string;
  memory_best: number | null;
  text_size: string;
  anim_speed: string;
  sound_on: boolean;
}) {
  try {
    localStorage.setItem(LS_KEYS.xp, String(profile.xp));
    localStorage.setItem(LS_KEYS.streak, String(profile.streak));
    localStorage.setItem(LS_KEYS.handsPlayed, String(profile.hands_played));
    localStorage.setItem(LS_KEYS.profile, profile.profile_type);
    if (profile.memory_best !== null) {
      localStorage.setItem(LS_KEYS.memoryBest, String(profile.memory_best));
    }
    localStorage.setItem(LS_KEYS.textSize, profile.text_size);
    localStorage.setItem(LS_KEYS.animSpeed, profile.anim_speed);
    localStorage.setItem(LS_KEYS.sound, profile.sound_on ? "true" : "false");
  } catch {}
}
