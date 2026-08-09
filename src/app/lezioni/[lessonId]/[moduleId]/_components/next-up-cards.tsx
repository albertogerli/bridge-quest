"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getLessonDisplayNumber } from "@/data/lesson-meta";
import type { Lesson, LessonModule } from "@/lib/catalog";

/**
 * Cosa viene dopo il modulo appena finito: il modulo successivo, la lezione
 * successiva quando la lezione è completa, o il messaggio di fine corso.
 */
export function NextUpCards({
  lessonId,
  moduleIndex,
  nextModule,
  nextLesson,
  isLessonComplete,
}: {
  lessonId: string;
  moduleIndex: number;
  nextModule: LessonModule | null;
  nextLesson: Lesson | null;
  isLessonComplete: boolean;
}) {
  return (
    <>
      {/* Next module / lesson preview card */}
      {nextModule && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Link href={`/lezioni/${lessonId}/${nextModule.id}`}>
            <div className="group card-clean card-interactive rounded-2xl bg-card p-4 cursor-pointer">
              <p className="text-[10px] font-bold text-emerald uppercase tracking-wider mb-2">
                Prossimo modulo
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald text-white text-lg">
                  {moduleIndex + 2}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-foreground text-[15px]">{nextModule.title}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className="text-[10px] font-bold border-0 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                      {nextModule.type === "theory" ? "Teoria" : nextModule.type === "quiz" ? "Quiz" : nextModule.type === "exercise" ? "Esercizio" : "Pratica"}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">{nextModule.duration} min · +{nextModule.xpReward} XP</span>
                  </div>
                </div>
                <svg className="h-5 w-5 text-muted-foreground/50 group-hover:text-emerald group-hover:translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <polyline points="9,6 15,12 9,18" />
                </svg>
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Next lesson card (if all modules in lesson done) */}
      {isLessonComplete && nextLesson && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Link href={`/lezioni/${nextLesson.id}`}>
            <div className="group card-clean card-interactive rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-900 p-4 cursor-pointer">
              <p className="text-[10px] font-bold text-emerald-dark dark:text-emerald-300 uppercase tracking-wider mb-2">
                Prossima lezione
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald to-emerald-dark text-white text-xl font-bold shadow-md shadow-emerald/30">
                  {nextLesson.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-foreground text-[15px]">
                    Lezione {getLessonDisplayNumber(nextLesson.id)}: {nextLesson.title}
                  </h4>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {nextLesson.modules.length} moduli · {nextLesson.subtitle}
                  </p>
                </div>
                <svg className="h-5 w-5 text-emerald-dark/50 dark:text-emerald-300/50 group-hover:text-emerald-dark dark:group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <polyline points="9,6 15,12 9,18" />
                </svg>
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* All lessons done */}
      {isLessonComplete && !nextLesson && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-900 p-5 text-center"
        >
          <span className="text-3xl">🎓</span>
          <h4 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mt-2">Corso Fiori Completato!</h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Sei pronto per il circolo FIGB!</p>
        </motion.div>
      )}
    </>
  );
}
