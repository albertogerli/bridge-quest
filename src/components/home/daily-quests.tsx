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
      icon: <Spade className="w-5 h-5 text-gray-700" />,
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
              done ? "bg-[#1B5E3B]/5 border border-[#1B5E3B]/15" : "bg-white dark:bg-[#1a1f2e] border border-[#E8E4DC] dark:border-[#2a3040]"
            }`}
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${
              done ? "bg-[#1B5E3B]/10" : "bg-gray-50 dark:bg-gray-800/50"
            }`}>
              {done ? <CheckCircle2 className="w-5 h-5 text-[#1B5E3B]" /> : quest.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${done ? "text-[#1B5E3B] line-through" : "text-gray-900 dark:text-gray-100"}`}>
                {quest.label}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden max-w-[80px]">
                  <div
                    className={`h-full rounded-full ${done ? "bg-[#1B5E3B]" : "bg-[#c8a44e]"}`}
                    style={{ width: `${(quest.progress / quest.target) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-gray-500">
                  {quest.progress}/{quest.target}
                </span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              done ? "bg-[#1B5E3B]/10 text-[#1B5E3B]" : "bg-[#c8a44e]/10 text-[#c8a44e]"
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
            : "bg-gray-50 dark:bg-gray-800/50 border border-[#E8E4DC] dark:border-gray-700"
        }`}
      >
        {allDone ? <Gift className="w-5 h-5 text-[#c8a44e]" /> : <Target className="w-5 h-5 text-gray-400" />}
        <p className={`text-xs font-bold ${allDone ? "text-[#c8a44e]" : "text-gray-400"}`}>
          {allDone ? "Bonus completamento: +50 XP!" : "Completa tutti per +50 XP bonus"}
        </p>
      </motion.div>
    </div>
  );
}
