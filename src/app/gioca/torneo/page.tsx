"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/hooks/use-profile";
import { useTournamentWeek } from "./_use-tournament-week";
import { MaestroTip } from "./_components/maestro-tip";
import { TournamentHero } from "./_components/tournament-hero";
import { TournamentHistory } from "./_components/tournament-history";
import { TournamentLeaderboard } from "./_components/tournament-leaderboard";
import { TournamentPlayView } from "./_components/tournament-play-view";
import { TournamentResultCard } from "./_components/tournament-result-card";

export default function TorneoSettimanale() {
  const isMobile = useMobile();
  const profile = useProfile();
  const week = useTournamentWeek();

  // ── Playing view ──
  if (week.isPlaying) {
    return (
      <TournamentPlayView
        weekNum={week.weekNum}
        hands={week.tournamentHands}
        alreadyPlayed={week.alreadyPlayed}
        onFinish={week.onTournamentFinished}
        onBack={() => week.setIsPlaying(false)}
        isMobile={isMobile}
        profile={profile}
      />
    );
  }

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
              Gioca
            </Link>
            <span>/</span>
            <span className="text-emerald font-semibold">
              Torneo Settimanale
            </span>
          </div>
        </motion.div>

        {/* Hero Card */}
        <TournamentHero
          mounted={week.mounted}
          weekNum={week.weekNum}
          start={week.start}
          end={week.end}
          alreadyPlayed={week.alreadyPlayed}
          totalNeeded={week.totalNeeded}
          countdown={week.countdown}
          tournamentHands={week.tournamentHands}
          existingResult={week.existingResult}
          inProgressCount={week.inProgressCount}
          xpLabel={profile.xpLabel}
          onPlay={() => week.setIsPlaying(true)}
        />

        {/* ── Result Card (after playing) ── */}
        <TournamentResultCard
          alreadyPlayed={week.alreadyPlayed}
          existingResult={week.existingResult}
          xpLabel={profile.xpLabel}
        />

        {/* ── Leaderboard ── */}
        <TournamentLeaderboard
          weekNum={week.weekNum}
          leaderboard={week.leaderboard}
          alreadyPlayed={week.alreadyPlayed}
          existingResult={week.existingResult}
        />

        {/* ── Le settimane già giocate ── */}
        <TournamentHistory
          entries={week.history}
          weekNumCorrente={week.weekNum}
          loading={week.historyLoading}
        />

        {/* ── Maestro Fiori Tip ── */}
        <MaestroTip />
      </div>
    </div>
  );
}
