"use client";

import Link from "@/components/link";
import { useCollectibleCards } from "@/store/use-collectible-cards-store";
import { evaluateUnlock } from "@/lib/catalog";
import { useT } from "@/contexts/traduzioni-provider";

interface CollectionTeaserProps {
  xp: number;
  streak: number;
  handsPlayed: number;
  completedModules: number;
}

export function CollectionTeaser({ xp, streak, handsPlayed, completedModules }: CollectionTeaserProps) {
  const t = useT();
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
    <Link href="/collezione" className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-bold">{t("Collezione Carte")}</h2>
        <span className="text-sm font-semibold tabular-nums text-muted-foreground">{unlocked.length}/{total}</span>
      </div>
      {/* Le ultime quattro sbloccate, o le prime quattro da sbloccare. Le
          sfumature sono quelle delle carte: è il prodotto, non decorazione. */}
      <div className="mt-3 flex gap-2">
        {(unlocked.length > 0 ? unlocked.slice(-4) : cards.slice(0, 4)).map((card) => {
          const isUnlocked = unlocked.includes(card);
          return (
            <div
              key={card.id}
              className={`flex size-11 items-center justify-center rounded-lg text-xl ${
                isUnlocked ? `bg-gradient-to-br ${card.gradient}` : "bg-muted opacity-50 grayscale"
              }`}
            >
              {isUnlocked ? card.emoji : "?"}
            </div>
          );
        })}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-gold-dark" style={{ width: `${(unlocked.length / total) * 100}%` }} />
      </div>
      {nextCard && (
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          {t("Prossima:")} <span className="font-semibold text-foreground">{nextCard.name}</span> — {nextCard.unlockCondition}
        </p>
      )}
    </Link>
  );
}
