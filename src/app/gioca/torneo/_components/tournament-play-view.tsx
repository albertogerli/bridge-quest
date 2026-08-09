"use client";

import type { ProfileConfig } from "@/hooks/use-profile";
import type { Smazzata } from "@/lib/catalog";
import { useTournamentPlay } from "../_use-tournament-play";
import { type TournamentResult } from "../_types";
import { HandTransition } from "./hand-transition";
import { SingleHandView } from "./single-hand-view";
import { TournamentSummary } from "./tournament-summary";

/**
 * Tournament Play View — mani in sequenza.
 * Il totale è `hands.length` (la pool può averne meno di
 * TOURNAMENT_HAND_COUNT), non la costante nominale.
 */
export function TournamentPlayView({
  weekNum,
  hands,
  alreadyPlayed,
  onFinish,
  onBack,
  isMobile,
  profile,
}: {
  weekNum: number;
  hands: Smazzata[];
  alreadyPlayed: boolean;
  onFinish: (result: TournamentResult) => void;
  onBack: () => void;
  isMobile: boolean;
  profile: ProfileConfig;
}) {
  const {
    currentHandIdx,
    currentHand,
    handResults,
    showSummary,
    showTransition,
    handleHandFinished,
    handleNextHand,
  } = useTournamentPlay({ weekNum, hands, alreadyPlayed, onFinish });

  // ── Summary View ──
  if (showSummary) {
    return (
      <TournamentSummary
        weekNum={weekNum}
        hands={hands}
        handResults={handResults}
        alreadyPlayed={alreadyPlayed}
        xpLabel={profile.xpLabel}
        onBack={onBack}
      />
    );
  }

  // ── Transition between hands ──
  if (showTransition) {
    return (
      <HandTransition
        hands={hands}
        handResults={handResults}
        onNextHand={handleNextHand}
        onBack={onBack}
      />
    );
  }

  // ── Single hand playing view ──
  return (
    <SingleHandView
      key={`hand-${currentHandIdx}`}
      smazzata={currentHand}
      handNumber={currentHandIdx + 1}
      totalHands={hands.length}
      handResults={handResults}
      onFinish={handleHandFinished}
      onBack={onBack}
      isMobile={isMobile}
    />
  );
}
