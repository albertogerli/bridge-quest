"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { Compass, BookOpen, Target, Brain, X } from "lucide-react";

interface LostCardProps {
  /** Next incomplete module info (from home page) */
  nextModule?: {
    lessonId: number;
    moduleId: string;
    moduleTitle: string;
  } | null;
}

export function LostCard({ nextModule }: LostCardProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const today = new Date().toISOString().slice(0, 10);
      return localStorage.getItem(`bq_lost_dismissed_${today}`) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(`bq_lost_dismissed_${today}`, "1");
    } catch {}
  };

  const nextLessonHref = nextModule
    ? `/lezioni/${nextModule.lessonId}/${nextModule.moduleId}`
    : "/lezioni";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[22px] border border-[#c8a44e]/30 bg-gradient-to-br from-[#fffdf5] to-[#fff8e1] p-4 shadow-sm relative"
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-lg p-1.5 text-[#8f6b16]/40 hover:bg-[#c8a44e]/10 hover:text-[#8f6b16] transition-colors"
        aria-label="Chiudi"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3 pr-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c8a44e]/15">
          <Compass className="h-5 w-5 text-[#8f6b16]" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#12305f]">Non sai da dove ricominciare?</p>
          <p className="text-[11px] text-[#5c677d]">Ecco qualche idea per riprendere</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid gap-2">
        <Link href="/prima-mano">
          <div className="flex items-center gap-3 rounded-2xl border border-[#e5e0d5] bg-white px-3.5 py-2.5 transition-all hover:border-[#c8a44e]/30 hover:shadow-sm">
            <BookOpen className="h-4 w-4 shrink-0 text-blue-500" />
            <span className="text-sm font-medium text-[#12305f]">Rivedi Prima Mano</span>
          </div>
        </Link>
        <Link href={nextLessonHref}>
          <div className="flex items-center gap-3 rounded-2xl border border-[#e5e0d5] bg-white px-3.5 py-2.5 transition-all hover:border-[#c8a44e]/30 hover:shadow-sm">
            <Target className="h-4 w-4 shrink-0 text-purple-500" />
            <span className="text-sm font-medium text-[#12305f]">
              {nextModule ? `Continua: ${nextModule.moduleTitle}` : "Vai alle lezioni"}
            </span>
          </div>
        </Link>
        <Link href="/ripasso">
          <div className="flex items-center gap-3 rounded-2xl border border-[#e5e0d5] bg-white px-3.5 py-2.5 transition-all hover:border-[#c8a44e]/30 hover:shadow-sm">
            <Brain className="h-4 w-4 shrink-0 text-amber-500" />
            <span className="text-sm font-medium text-[#12305f]">Fai un ripasso</span>
          </div>
        </Link>
      </div>
    </motion.div>
  );
}
