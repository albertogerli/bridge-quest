"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  Target,
  CheckCircle2,
  Gift,
  FileText,
  Spade,
  Star,
  BookOpen,
  Flame,
  Gamepad2,
  CalendarDays,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWeeklyObjectives } from "@/hooks/use-weekly-objectives";

// Map weekly objective IDs to Lucide icons
const objectiveIcons: Record<string, React.ReactNode> = {
  quiz: <FileText className="w-4 h-4 text-indigo-500" />,
  hands: <Spade className="w-4 h-4 text-gray-700" />,
  xp: <Star className="w-4 h-4 text-amber-500" />,
  modules: <BookOpen className="w-4 h-4 text-blue-500" />,
  streak: <Flame className="w-4 h-4 text-orange-500" />,
  minigames: <Gamepad2 className="w-4 h-4 text-purple-500" />,
  daily: <CalendarDays className="w-4 h-4 text-teal-500" />,
  perfect: <Target className="w-4 h-4 text-rose-500" />,
};

export function WeeklyObjectivesSection() {
  const { objectives, allCompleted, bonusClaimed, claimBonus } = useWeeklyObjectives();
  const [showBonus, setShowBonus] = useState(false);

  if (objectives.length === 0) return null;

  const completedCount = objectives.filter((o) => o.completed).length;

  const handleClaimBonus = () => {
    const bonus = claimBonus();
    if (bonus) {
      setShowBonus(true);
      setTimeout(() => setShowBonus(false), 3000);
    }
  };

  return (
    <section className="px-4 sm:px-5 pt-5">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1B5E3B]/10">
              <Target className="w-4 h-4 text-[#1B5E3B]" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Obiettivi settimanali
            </h2>
            <Badge className={`text-[10px] font-bold border-0 ${
              completedCount === 3
                ? "bg-[#1B5E3B]/10 text-[#1B5E3B]"
                : "bg-[#1B5E3B]/8 text-[#1B5E3B]"
            }`}>
              {completedCount}/3
            </Badge>
          </div>
          <Link href="/obiettivi">
            <Badge
              variant="outline"
              className="text-[10px] font-semibold text-[#1B5E3B] border-[#1B5E3B]/20 cursor-pointer hover:bg-[#1B5E3B]/5 transition-colors"
            >
              Vedi tutti →
            </Badge>
          </Link>
        </div>

        <div className={`rounded-2xl p-4 border transition-all ${
          completedCount === 3
            ? "bg-gradient-to-br from-[#1B5E3B]/5 to-white dark:from-[#1B5E3B]/10 dark:to-[#1a1f2e] border-[#1B5E3B]/20"
            : "bg-white dark:bg-[#1a1f2e] border-[#E8E4DC] dark:border-[#2a3040]"
        }`}>
          <div className="space-y-2.5">
            {objectives.map((obj) => {
              const objLinks: Record<string, string> = {
                quiz: "/gioca/quiz-lampo",
                hands: "/gioca/smazzata",
                xp: "/lezioni",
                modules: "/lezioni",
                streak: "/lezioni",
                minigames: "/gioca",
                daily: "/gioca/smazzata",
                perfect: "/gioca/quiz-lampo",
              };
              const href = objLinks[obj.id] || "/lezioni";
              return (
              <Link
                href={href}
                key={obj.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] ${
                  obj.completed ? "bg-[#1B5E3B]/5 border border-[#1B5E3B]/15" : "bg-gray-50 dark:bg-gray-800/50 border border-[#E8E4DC] dark:border-gray-700 hover:border-[#1B5E3B]/30"
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${
                  obj.completed ? "bg-[#1B5E3B]/10" : "bg-white dark:bg-[#1a1f2e]"
                }`}>
                  {obj.completed ? <CheckCircle2 className="w-5 h-5 text-[#1B5E3B]" /> : (objectiveIcons[obj.id] || obj.emoji)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${
                    obj.completed ? "text-[#1B5E3B] dark:text-emerald-400 line-through" : "text-gray-900 dark:text-gray-100"
                  }`}>
                    {obj.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden max-w-[100px]">
                      <div
                        className={`h-full rounded-full transition-all ${
                          obj.completed ? "bg-[#1B5E3B]" : "bg-[#1B5E3B]"
                        }`}
                        style={{ width: `${Math.min((obj.current / obj.target) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500">
                      {obj.current}/{obj.target}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  obj.completed ? "bg-[#1B5E3B]/10 text-[#1B5E3B]" : "bg-[#c8a44e]/10 text-[#c8a44e]"
                }`}>
                  +{obj.xpReward} XP
                </span>
              </Link>
              );
            })}
          </div>

          {/* Bonus bar */}
          {allCompleted && !bonusClaimed && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleClaimBonus}
              className="mt-3 w-full py-3 rounded-xl bg-[#c8a44e] text-white font-bold text-sm shadow-lg shadow-[#c8a44e]/20 active:scale-[0.98] transition-transform"
            >
              <Gift className="w-4 h-4 inline mr-1" /> Riscuoti bonus +100 XP!
            </motion.button>
          )}

          {bonusClaimed && (
            <div className="mt-3 py-2.5 rounded-xl bg-[#c8a44e]/8 text-center">
              <p className="text-xs font-bold text-[#c8a44e] flex items-center justify-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Bonus riscosso! Torna la prossima settimana</p>
            </div>
          )}
        </div>

        {/* Bonus awarded toast */}
        <AnimatePresence>
          {showBonus && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
            >
              <div className="flex items-center gap-2 bg-[#c8a44e] text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-xl">
                <Gift className="w-4 h-4" /> +100 XP Bonus settimanale!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
