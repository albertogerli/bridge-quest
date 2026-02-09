"use client";

import { useEffect, useRef } from "react";
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

/**
 * Syncs localStorage data to Supabase when user logs in for the first time.
 * After migration, Supabase becomes the source of truth for logged-in users.
 */
export function useSupabaseSync() {
  const { user, profile } = useAuth();
  const hasSynced = useRef(false);
  const supabase = createClient();

  useEffect(() => {
    if (!user || !profile || hasSynced.current) return;
    hasSynced.current = true;

    const syncToSupabase = async () => {
      try {
        // Check if user already has data in Supabase (xp > 0 means already migrated)
        if (profile.xp > 0) {
          // Supabase already has data, sync FROM Supabase TO localStorage
          syncToLocalStorage(profile);
          return;
        }

        // Migrate FROM localStorage TO Supabase
        const localXp = parseInt(localStorage.getItem(LS_KEYS.xp) || "0", 10);
        const localStreak = parseInt(localStorage.getItem(LS_KEYS.streak) || "0", 10);
        const localHandsPlayed = parseInt(localStorage.getItem(LS_KEYS.handsPlayed) || "0", 10);
        const localProfile = localStorage.getItem(LS_KEYS.profile) || "adulto";
        const localMemoryBest = localStorage.getItem(LS_KEYS.memoryBest);
        const localTextSize = localStorage.getItem(LS_KEYS.textSize) || "medio";
        const localAnimSpeed = localStorage.getItem(LS_KEYS.animSpeed) || "normale";
        const localSound = localStorage.getItem(LS_KEYS.sound);

        // Only migrate if there's actual data
        if (localXp > 0 || localStreak > 0 || localHandsPlayed > 0) {
          await supabase
            .from("profiles")
            .update({
              xp: localXp,
              streak: localStreak,
              hands_played: localHandsPlayed,
              profile_type: localProfile as "giovane" | "adulto" | "senior",
              memory_best: localMemoryBest ? parseInt(localMemoryBest, 10) : null,
              text_size: localTextSize,
              anim_speed: localAnimSpeed,
              sound_on: localSound !== "false",
              last_login: new Date().toISOString().split("T")[0],
            })
            .eq("id", user.id);
        }

        // Migrate completed modules
        const completedRaw = localStorage.getItem(LS_KEYS.completedModules);
        if (completedRaw) {
          try {
            const completed: string[] = JSON.parse(completedRaw);
            const rows = completed.map((moduleKey) => {
              const parts = moduleKey.split("-");
              const lessonId = parts.slice(0, -1).join("-");
              const moduleId = parts[parts.length - 1];
              return { user_id: user.id, lesson_id: lessonId, module_id: moduleId };
            });
            if (rows.length > 0) {
              await supabase.from("completed_modules").upsert(rows, {
                onConflict: "user_id,lesson_id,module_id",
              });
            }
          } catch {}
        }

        // Migrate badges
        const badgesRaw = localStorage.getItem(LS_KEYS.badges);
        if (badgesRaw) {
          try {
            const badges: string[] = JSON.parse(badgesRaw);
            const rows = badges.map((badgeId) => ({
              user_id: user.id,
              badge_id: badgeId,
            }));
            if (rows.length > 0) {
              await supabase.from("badges").upsert(rows, {
                onConflict: "user_id,badge_id",
              });
            }
          } catch {}
        }

        // Migrate review items
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
            const rows = items.map((item) => ({
              user_id: user.id,
              lesson_id: item.lessonId,
              module_id: item.moduleId,
              question: item.question || null,
              wrong_count: item.wrongCount,
              last_review: item.lastReview || null,
              next_review: item.nextReview || null,
            }));
            if (rows.length > 0) {
              await supabase.from("review_items").insert(rows);
            }
          } catch {}
        }
      } catch (err) {
        console.error("Sync error:", err);
      }
    };

    syncToSupabase();
  }, [user, profile, supabase]);
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
