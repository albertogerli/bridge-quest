"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Check, Crown, Flame, Gamepad2, GraduationCap, Globe, Medal,
  Share2, Spade, Star, Target, Trophy, BookOpenCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SecretAchievement } from "@/hooks/use-secret-achievements";
import type { BadgeIconKey, ProfileBadge } from "../_types";

/** Icona di ciascun badge: i dati (nome/descrizione/sblocco) stanno in `@/lib/profile-stats`. */
const BADGE_ICONS: Record<BadgeIconKey, ReactNode> = {
  "spade": <Spade className="w-6 h-6" />,
  "book-open-check": <BookOpenCheck className="w-6 h-6" />,
  "target": <Target className="w-6 h-6" />,
  "gamepad": <Gamepad2 className="w-6 h-6" />,
  "flame": <Flame className="w-6 h-6" />,
  "medal": <Medal className="w-6 h-6" />,
  "star": <Star className="w-6 h-6" />,
  "globe": <Globe className="w-6 h-6" />,
  "crown": <Crown className="w-6 h-6" />,
  "graduation-cap": <GraduationCap className="w-6 h-6" />,
  "trophy": <Trophy className="w-6 h-6" />,
};

/** Griglia dei badge collezionati + blocco degli achievement segreti. */
export function BadgesSection({
  badges,
  earnedCount,
  sharedBadge,
  onShareBadge,
  earnedSecretAchievements,
  totalSecretAchievements,
}: {
  badges: ProfileBadge[];
  earnedCount: number;
  sharedBadge: string | null;
  onShareBadge: (badgeName: string) => void;
  earnedSecretAchievements: SecretAchievement[];
  totalSecretAchievements: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Badge Collezionati
        </h2>
        <Badge
          variant="outline"
          className="text-[11px] text-muted-foreground border-border"
        >
          {earnedCount} / {badges.length}
        </Badge>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {badges.map((badge, i) => (
          <motion.div
            key={badge.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 + i * 0.03 }}
            className={`relative flex flex-col items-center gap-1.5 ${
              !badge.earned ? "opacity-25 grayscale" : ""
            }`}
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full shadow-md"
              style={{ background: badge.earned ? "radial-gradient(circle at 30% 30%, #ffd700, #b8860b)" : "radial-gradient(circle at 30% 30%, #d1d5db, #9ca3af)" }}
            >
              <span className="text-white/80">{BADGE_ICONS[badge.icon]}</span>
            </div>
            {badge.earned && (
              <button
                onClick={(e) => { e.stopPropagation(); onShareBadge(badge.name); }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-figb text-white shadow-sm hover:bg-figb-dark transition-colors"
                title="Condividi badge"
              >
                {sharedBadge === badge.name ? (
                  <Check className="w-2.5 h-2.5" />
                ) : (
                  <Share2 className="w-2.5 h-2.5" />
                )}
              </button>
            )}
            <span className="text-[10px] text-center text-muted-foreground font-semibold leading-tight">
              {badge.name}
            </span>
          </motion.div>
        ))}
      </div>
      {/* Badge share toast */}
      <AnimatePresence>
        {sharedBadge && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-3 text-center"
          >
            <span className="inline-flex items-center gap-1.5 bg-figb/10 dark:bg-primary/15 text-figb dark:text-primary text-xs font-bold rounded-full px-3 py-1.5">
              <Check className="h-3.5 w-3.5" />
              Badge condiviso!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secret Achievements */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-500" />
            Achievement Segreti
          </h3>
          <Badge variant="outline" className="text-[11px] text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900">
            {earnedSecretAchievements.length} / {totalSecretAchievements}
          </Badge>
        </div>
        {earnedSecretAchievements.length > 0 ? (
          <div className="grid grid-cols-5 gap-2">
            {earnedSecretAchievements.map((a) => (
              <div key={a.id} className="flex flex-col items-center gap-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-950/40 dark:to-yellow-950/30 border border-amber-200 dark:border-amber-900 text-xl">
                  {a.icon}
                </div>
                <span className="text-[9px] text-center text-amber-700 dark:text-amber-300 font-semibold leading-tight">{a.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900 px-4 py-3">
            <span className="text-lg">🔒</span>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Ci sono <span className="font-bold">{totalSecretAchievements} achievement nascosti</span> da scoprire. Gioca, esplora e completa sfide per sbloccarli!
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
