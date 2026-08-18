"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/hooks/use-profile";
import { parseContract } from "@/lib/bridge-engine";
import { useDailyHand } from "./_use-daily-hand";
import { DailyCountdownCard } from "./_components/daily-countdown-card";
import { DailyHero } from "./_components/daily-hero";
import { DailyResultCard } from "./_components/daily-result-card";
import { DailyStatsCard } from "./_components/daily-stats-card";
import { MaestroTip } from "./_components/maestro-tip";
import { PlayingView } from "./_components/playing-view";
import { YesterdayHandCard } from "./_components/yesterday-hand-card";
import { useT } from "@/contexts/traduzioni-provider";

export default function ManoDelGiornoPage() {
  const t = useT();
  const isMobile = useMobile();
  const profile = useProfile();
  const daily = useDailyHand();

  // Need a loaded smazzate pool for everything below.
  if (!daily.todayHand || !daily.yesterdayHand) {
    return (
      <div className="pt-10 text-center text-muted-foreground text-sm" role="status" aria-label={t("Caricamento mano del giorno")}>
        {t("Caricamento mano del giorno…")}
      </div>
    );
  }

  // ── Playing view ──
  if (daily.isPlaying) {
    return (
      <PlayingView
        smazzata={daily.todayHand}
        isDaily
        alreadyPlayed={daily.alreadyPlayed}
        onFinish={daily.onGameFinished}
        onBack={() => daily.setIsPlaying(false)}
        isMobile={isMobile}
        profile={profile}
        saveGameResult={daily.saveGameResult}
      />
    );
  }

  if (daily.playingYesterday) {
    return (
      <PlayingView
        smazzata={daily.yesterdayHand}
        isDaily={false}
        alreadyPlayed={false}
        onFinish={() => {}}
        onBack={() => daily.setPlayingYesterday(false)}
        isMobile={isMobile}
        profile={profile}
        saveGameResult={daily.saveGameResult}
      />
    );
  }

  // ── Pre-play / post-play hub ──
  const { tricksNeeded } = parseContract(daily.todayHand.contract);

  return (
    <div className="pt-6 px-5 pb-28">
      <div className="mx-auto max-w-6xl">
        {/* Back nav */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Link
              href="/gioca"
              className="hover:text-emerald transition-colors"
            >
              {t("Gioca")}
            </Link>
            <span>/</span>
            <span className="text-emerald font-semibold">
              {t("Mano del Giorno")}
            </span>
          </div>
        </motion.div>

        {/* Hero Card */}
        <DailyHero
          mounted={daily.mounted}
          today={daily.today}
          todayHand={daily.todayHand}
          tricksNeeded={tricksNeeded}
          alreadyPlayed={daily.alreadyPlayed}
          xpLabel={profile.xpLabel}
          onPlay={() => daily.setIsPlaying(true)}
        />

        {/* ── Result Card (after playing today) ── */}
        <DailyResultCard
          alreadyPlayed={daily.alreadyPlayed}
          todayResult={daily.todayResult}
          tricksNeeded={tricksNeeded}
          contract={daily.todayHand.contract}
          fieldStats={daily.fieldStats}
          xpLabel={profile.xpLabel}
        />

        {/* ── Countdown to next hand ── */}
        <DailyCountdownCard mounted={daily.mounted} countdown={daily.countdown} />

        {/* ── Daily Stats ── */}
        <DailyStatsCard
          mounted={daily.mounted}
          streak={daily.streak}
          total={daily.total}
          alreadyPlayed={daily.alreadyPlayed}
          todayResult={daily.todayResult}
        />

        {/* ── Yesterday's Hand ── */}
        <YesterdayHandCard
          mounted={daily.mounted}
          yesterday={daily.yesterday}
          yesterdayHand={daily.yesterdayHand}
          onPlay={() => daily.setPlayingYesterday(true)}
        />

        {/* ── Maestro Fiori Tip ── */}
        <MaestroTip />
      </div>
    </div>
  );
}
