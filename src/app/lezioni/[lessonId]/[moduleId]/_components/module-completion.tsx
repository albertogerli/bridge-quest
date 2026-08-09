"use client";

import { motion } from "motion/react";
import { ComprehensionQuiz } from "@/components/comprehension-quiz";
import type { ProfileConfig } from "@/hooks/use-profile";
import type { Lesson, LessonModule } from "@/lib/catalog";
import { CompletionCard } from "./completion-card";
import { LearnedRulesCard } from "./learned-rules-card";
import { NextUpCards } from "./next-up-cards";

/** Coda del modulo: riepilogo, regole imparate, quiz di comprensione e seguito. */
export function ModuleCompletion({
  lessonId,
  lesson,
  mod,
  moduleIndex,
  lessonNumber,
  nextModule,
  nextLesson,
  isLessonComplete,
  totalQuizzes,
  correctAnswers,
  bestStreak,
  lives,
  xpEarned,
  profile,
  showComprehension,
  onComprehensionComplete,
  onComprehensionSkip,
}: {
  lessonId: string;
  lesson: Lesson;
  mod: LessonModule;
  moduleIndex: number;
  lessonNumber: number;
  nextModule: LessonModule | null;
  nextLesson: Lesson | null;
  isLessonComplete: boolean;
  totalQuizzes: number;
  correctAnswers: number;
  bestStreak: number;
  lives: number;
  xpEarned: number;
  profile: ProfileConfig;
  showComprehension: boolean;
  onComprehensionComplete: (score: number, total: number) => void;
  onComprehensionSkip: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-6 space-y-4"
    >
      <CompletionCard
        isLessonComplete={isLessonComplete}
        lessonNumber={lessonNumber}
        totalQuizzes={totalQuizzes}
        correctAnswers={correctAnswers}
        bestStreak={bestStreak}
        lives={lives}
        xpEarned={xpEarned}
        xpReward={mod.xpReward}
        xpLabel={profile.xpLabel}
      />

      {/* "Cosa hai imparato" - rules summary card (shown for all profiles, senior-friendly) */}
      <LearnedRulesCard content={mod.content} isSenior={profile.profile === "senior"} />

      {/* Comprehension Quiz (for theory modules) */}
      {mod.type === "theory" && showComprehension && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <ComprehensionQuiz
            lessonId={lesson.id}
            onComplete={onComprehensionComplete}
            onSkip={onComprehensionSkip}
          />
        </motion.div>
      )}

      <NextUpCards
        lessonId={lessonId}
        moduleIndex={moduleIndex}
        nextModule={nextModule}
        nextLesson={nextLesson}
        isLessonComplete={isLessonComplete}
      />
    </motion.div>
  );
}
