"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { collectibleCards } from "@/data/collectible-cards";

interface CollectionTeaserProps {
  xp: number;
  streak: number;
  handsPlayed: number;
  completedModules: number;
}

export function CollectionTeaser({ xp, streak, handsPlayed, completedModules }: CollectionTeaserProps) {
  const playerStats = {
    xp,
    streak,
    handsPlayed,
    completedModules,
    badges: [],
    quizLampoBest: 0,
    memoryBest: 0,
    dailyHandsTotal: 0,
  };

  const unlocked = collectibleCards.filter((c) => c.checkUnlock(playerStats));
  const total = collectibleCards.length;
  const nextCard = collectibleCards.find((c) => !c.checkUnlock(playerStats));

  return (
    <section className="px-4 sm:px-5 pt-4">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Collezione Carte
            </h2>
            <Badge className="bg-amber-50 text-amber-600 text-[10px] font-bold border-0">
              {unlocked.length}/{total}
            </Badge>
          </div>
          <Link href="/collezione">
            <Badge
              variant="outline"
              className="text-[10px] font-semibold text-amber-700 border-amber-200 cursor-pointer hover:bg-amber-50 transition-colors"
            >
              Vedi tutte →
            </Badge>
          </Link>
        </div>

        <Link href="/collezione">
          <div className="btn-squishy rounded-2xl bg-white dark:bg-[#1a1f2e] p-4 cursor-pointer border border-[#E8E4DC] dark:border-[#2a3040]">
            {/* Mini card preview - show last 4 unlocked or first 4 locked */}
            <div className="flex items-center gap-2 mb-3">
              {(unlocked.length > 0 ? unlocked.slice(-4) : collectibleCards.slice(0, 4)).map((card) => {
                const isUnlocked = unlocked.includes(card);
                return (
                  <div
                    key={card.id}
                    className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${
                      isUnlocked
                        ? `bg-gradient-to-br ${card.gradient} shadow-sm`
                        : "bg-gray-100 dark:bg-gray-800 grayscale opacity-40"
                    }`}
                  >
                    {isUnlocked ? card.emoji : "❓"}
                  </div>
                );
              })}
              <div className="flex-1 text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{unlocked.length}</p>
                <p className="text-[10px] text-gray-400 font-bold">sbloccate</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                style={{ width: `${(unlocked.length / total) * 100}%` }}
              />
            </div>

            {nextCard && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                Prossima: <span className="font-bold text-gray-700">{nextCard.emoji} {nextCard.name}</span>
                <span className="text-gray-400"> — {nextCard.unlockCondition}</span>
              </p>
            )}
          </div>
        </Link>
      </div>
    </section>
  );
}
