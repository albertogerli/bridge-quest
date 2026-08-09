"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { CheckCircle2, BookOpen, Spade, Flame, Gift, Target } from "lucide-react";

interface DailyQuestsProps {
  modulesCompleted: number;
  handsPlayed: number;
  dailyDone: boolean;
}

export function DailyQuests({ modulesCompleted, handsPlayed, dailyDone }: DailyQuestsProps) {
  // Track daily progress in localStorage
  const [dailyModules, setDailyModules] = useState(0);
  const [dailyHands, setDailyHands] = useState(0);

  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const saved = localStorage.getItem("bq_daily_quests");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.date === today) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- stato client-only (localStorage) letto dopo il mount per evitare hydration mismatch SSR: pattern intenzionale
          setDailyModules(data.modules || 0);
          setDailyHands(data.hands || 0);
          return;
        }
      }
      // Reset for new day - save current counts as baseline
      localStorage.setItem("bq_daily_quests", JSON.stringify({
        date: today,
        baseModules: modulesCompleted,
        baseHands: handsPlayed,
        modules: 0,
        hands: 0,
      }));
    } catch {}
  }, [modulesCompleted, handsPlayed]);

  const quests = [
    {
      id: "study",
      icon: <BookOpen className="w-5 h-5 text-indigo-500" />,
      label: "Completa 2 moduli",
      progress: Math.min(dailyModules, 2),
      target: 2,
      xp: 30,
    },
    {
      id: "play",
      icon: <Spade className="w-5 h-5 text-foreground/80" />,
      label: "Gioca 1 mano",
      progress: Math.min(dailyHands, 1),
      target: 1,
      xp: 20,
    },
    {
      id: "challenge",
      icon: <Flame className="w-5 h-5 text-orange-500" />,
      label: "Sfida del giorno",
      progress: dailyDone ? 1 : 0,
      target: 1,
      xp: 40,
    },
  ];

  const allDone = quests.every((q) => q.progress >= q.target);

  return (
    <div className="space-y-2">
      {quests.map((quest, i) => {
        const done = quest.progress >= quest.target;
        return (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 + i * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
              done ? "bg-[#1B5E3B]/5 dark:bg-emerald-950/30 border border-[#1B5E3B]/15 dark:border-emerald-900" : "bg-card border border-border"
            }`}
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${
              done ? "bg-[#1B5E3B]/10 dark:bg-emerald-900/40" : "bg-muted"
            }`}>
              {done ? <CheckCircle2 className="w-5 h-5 text-[#1B5E3B] dark:text-emerald-400" /> : quest.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${done ? "text-[#1B5E3B] dark:text-emerald-400 line-through" : "text-foreground"}`}>
                {quest.label}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden max-w-[80px]">
                  <div
                    className={`h-full rounded-full ${done ? "bg-[#1B5E3B]" : "bg-[#c8a44e]"}`}
                    style={{ width: `${(quest.progress / quest.target) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {quest.progress}/{quest.target}
                </span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              done ? "bg-[#1B5E3B]/10 dark:bg-emerald-900/40 text-[#1B5E3B] dark:text-emerald-400" : "bg-[#c8a44e]/10 text-[#c8a44e]"
            }`}>
              +{quest.xp} XP
            </span>
          </motion.div>
        );
      })}

      {/* All quests bonus */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-center ${
          allDone
            ? "bg-gradient-to-r from-[#c8a44e]/10 to-[#c8a44e]/5 border border-[#c8a44e]/20"
            : "bg-muted border border-border"
        }`}
      >
        {allDone ? <Gift className="w-5 h-5 text-[#c8a44e]" /> : <Target className="w-5 h-5 text-muted-foreground" />}
        <p className={`text-xs font-bold ${allDone ? "text-[#c8a44e]" : "text-muted-foreground"}`}>
          {allDone ? "Bonus completamento: +50 XP!" : "Completa tutti per +50 XP bonus"}
        </p>
      </motion.div>
    </div>
  );
}
