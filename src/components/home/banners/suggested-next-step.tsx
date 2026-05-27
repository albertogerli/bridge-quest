"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Gamepad2, GraduationCap } from "lucide-react";

interface NextModule {
  lessonId: number;
  moduleId: string;
  moduleTitle: string;
  lessonIcon: string;
}

interface SuggestedNextStepProps {
  nextModule: NextModule | null;
}

export function SuggestedNextStep({ nextModule }: SuggestedNextStepProps) {
  return (
    <section className="px-4 sm:px-5 mt-2 lg:hidden">
      <div className="mx-auto max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          {(() => {
            // Alternate between lesson and play based on last activity
            const lastLesson = localStorage.getItem("bq_last_lesson_ts");
            const lastHand = localStorage.getItem("bq_last_hand_ts");
            const lastLessonTs = lastLesson ? parseInt(lastLesson) : 0;
            const lastHandTs = lastHand ? parseInt(lastHand) : 0;
            const suggestPlay = lastLessonTs > lastHandTs;

            if (suggestPlay) {
              return (
                <Link href="/gioca/smazzata?random=1">
                  <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 border border-violet-200">
                        <Gamepad2 className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">Prossimo passo</p>
                        <p className="text-sm font-bold text-gray-900">Metti in pratica!</p>
                        <p className="text-xs text-gray-500">Gioca una mano per consolidare la teoria</p>
                      </div>
                      <svg className="w-4 h-4 text-violet-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M9 18l6-6-6-6" /></svg>
                    </div>
                  </div>
                </Link>
              );
            }

            if (nextModule) {
              return (
                <Link href={`/lezioni/${nextModule.lessonId}/${nextModule.moduleId}`}>
                  <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 border border-emerald-200">
                        <GraduationCap className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Prossimo passo</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{nextModule.moduleTitle}</p>
                        <p className="text-xs text-gray-500">Continua il percorso di apprendimento</p>
                      </div>
                      <svg className="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M9 18l6-6-6-6" /></svg>
                    </div>
                  </div>
                </Link>
              );
            }

            return null;
          })()}
        </motion.div>
      </div>
    </section>
  );
}
