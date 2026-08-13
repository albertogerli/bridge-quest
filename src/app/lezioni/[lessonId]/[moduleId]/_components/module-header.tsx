"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ProfileConfig } from "@/hooks/use-profile";

/**
 * Barra superiore del modulo: ritorno alla lezione, barra di avanzamento,
 * contatore dei passi e XP guadagnati finora.
 */
export function ModuleHeader({
  lessonId,
  progress,
  currentStep,
  totalSteps,
  isLastStep,
  correctStreak,
  xpEarned,
  lessonNumber,
  moduleTitle,
  profile,
}: {
  lessonId: string;
  progress: number;
  currentStep: number;
  totalSteps: number;
  isLastStep: boolean;
  correctStreak: number;
  xpEarned: number;
  lessonNumber: number;
  moduleTitle: string;
  profile: ProfileConfig;
}) {
  return (
    <>
      {/* Top bar with progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 mb-5"
      >
        <Link
          href={`/lezioni/${lessonId}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/70 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </Link>
        <div className="flex-1 relative">
          <div className={`rounded-full bg-muted overflow-hidden ${profile.profile === "giovane" ? "h-3" : "h-2.5"}`}>
            <motion.div
              className={`h-full rounded-full ${
                profile.profile === "giovane"
                  ? "bg-gradient-to-r from-orange-400 via-amber-400 to-amber-300"
                  : "bg-gradient-to-r from-emerald to-emerald-light"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          {/* Giovane: fire on progress bar */}
          {profile.profile === "giovane" && correctStreak >= 2 && (
            <motion.span
              className="absolute -top-3 text-sm"
              style={{ left: `${Math.max(progress - 3, 0)}%` }}
              animate={{ y: [0, -3, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              🔥
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Giovane: speed multiplier badge */}
          {profile.profile === "giovane" && correctStreak >= 2 && (
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              className="flex items-center gap-0.5 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full px-2 py-0.5 shadow-lg shadow-orange-200"
            >
              <span className="text-[12px] text-white font-bold">{correctStreak}x</span>
              <span className="text-[12px]">🔥</span>
            </motion.div>
          )}
          <span className={`font-bold text-muted-foreground ${profile.profile === "senior" ? "text-sm" : "text-xs"}`}>
            {currentStep + 1}/{totalSteps}
          </span>
          {xpEarned > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-950/40 rounded-full px-2 py-0.5"
            >
              <span className="text-[12px]">⚡</span>
              <span className="text-[12px] font-bold text-amber-600 dark:text-amber-400">{xpEarned} {profile.xpLabel}</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Senior: friendly step indicator */}
      {profile.profile === "senior" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 px-4 py-2.5 flex items-center gap-3"
        >
          <span className="text-xl">📖</span>
          <div>
            <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
              Passo {currentStep + 1} di {totalSteps}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              {isLastStep ? "Ultimo passo! Quasi finito." : "Prosegui al tuo ritmo, senza fretta."}
            </p>
          </div>
        </motion.div>
      )}

      {/* Module badge */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 flex items-center gap-2"
      >
        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[12px] font-bold border-0">
          Lezione {lessonNumber}
        </Badge>
        <span className="text-xs text-muted-foreground font-medium">{moduleTitle}</span>
      </motion.div>
    </>
  );
}
