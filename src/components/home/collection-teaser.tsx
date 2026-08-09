"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useCollectibleCards } from "@/store/use-collectible-cards-store";
import { evaluateUnlock } from "@/lib/catalog";

interface CollectionTeaserProps {
  xp: number;
  streak: number;
  handsPlayed: number;
  completedModules: number;
}

export function CollectionTeaser({ xp, streak, handsPlayed, completedModules }: CollectionTeaserProps) {
  const { cards } = useCollectibleCards();
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

  const unlocked = cards.filter((c) => evaluateUnlock(c.unlock, playerStats));
  const total = cards.length;
  const nextCard = cards.find((c) => !evaluateUnlock(c.unlock, playerStats));

  if (total === 0) return null;

  return (
    <section className="px-4 sm:px-5 pt-4">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">
              Collezione Carte
            </h2>
            <Badge className="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 text-[10px] font-bold border-0">
              {unlocked.length}/{total}
            </Badge>
          </div>
          <Link href="/collezione">
            <Badge
              variant="outline"
              className="text-[10px] font-semibold text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-900 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
            >
              Vedi tutte →
            </Badge>
          </Link>
        </div>

        <Link href="/collezione">
          <div className="btn-squishy rounded-2xl bg-card p-4 cursor-pointer border border-border">
            {/* Mini card preview - show last 4 unlocked or first 4 locked */}
            <div className="flex items-center gap-2 mb-3">
              {(unlocked.length > 0 ? unlocked.slice(-4) : cards.slice(0, 4)).map((card) => {
                const isUnlocked = unlocked.includes(card);
                return (
                  <div
                    key={card.id}
                    className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${
                      isUnlocked
                        ? `bg-gradient-to-br ${card.gradient} shadow-sm`
                        : "bg-muted grayscale opacity-40"
                    }`}
                  >
                    {isUnlocked ? card.emoji : "❓"}
                  </div>
                );
              })}
              <div className="flex-1 text-right">
                <p className="text-2xl font-bold text-foreground">{unlocked.length}</p>
                <p className="text-[10px] text-muted-foreground font-bold">sbloccate</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-3 rounded-full bg-muted border border-border overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                style={{ width: `${(unlocked.length / total) * 100}%` }}
              />
            </div>

            {nextCard && (
              <p className="text-[11px] text-muted-foreground mt-2">
                Prossima: <span className="font-bold text-foreground/80">{nextCard.emoji} {nextCard.name}</span>
                <span className="text-muted-foreground"> — {nextCard.unlockCondition}</span>
              </p>
            )}
          </div>
        </Link>
      </div>
    </section>
  );
}
