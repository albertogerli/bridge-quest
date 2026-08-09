"use client";

import { useCallback, useEffect, useState } from "react";
import { parseContract } from "@/lib/bridge-engine";
import type { Smazzata } from "@/lib/catalog";
import { computeHandTotals, computeTournamentXp } from "@/lib/tournament-stats";
import {
  clearTournamentProgress,
  restoreProgress,
  saveTournamentProgress,
} from "./_storage";
import type { HandResult, TournamentResult } from "./_types";

export interface TournamentPlay {
  currentHandIdx: number;
  currentHand: Smazzata;
  handResults: HandResult[];
  showSummary: boolean;
  showTransition: boolean;
  handleHandFinished: (tricksMade: number, resultDelta: number) => void;
  handleNextHand: () => void;
}

/**
 * Sequenza delle 5 mani del torneo: mano corrente, esiti parziali e ripresa di
 * un torneo interrotto (reload/standby a metà).
 *
 * Estratta da `TournamentPlayView` in `src/app/gioca/torneo/page.tsx` senza cambi
 * di comportamento.
 */
export function useTournamentPlay({
  weekNum,
  hands,
  alreadyPlayed,
  onFinish,
}: {
  weekNum: number;
  hands: Smazzata[];
  alreadyPlayed: boolean;
  onFinish: (result: TournamentResult) => void;
}): TournamentPlay {
  // Riprende un eventuale torneo interrotto (reload/standby a metà).
  // Il rigioco senza punti non riprende nulla: vedi il salvataggio qui sotto.
  const [restored] = useState<HandResult[]>(() =>
    restoreProgress(weekNum, hands, alreadyPlayed)
  );
  const [currentHandIdx, setCurrentHandIdx] = useState(restored.length);
  const [handResults, setHandResults] = useState<HandResult[]>(restored);
  const [showSummary, setShowSummary] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  const currentHand = hands[currentHandIdx];

  // Salva l'avanzamento dopo ogni mano completata (rimosso a torneo finito).
  // Nel rigioco senza punti NON si salva: la CTA della hero resta "Rigioca il
  // torneo (senza punti)" e non annuncia nessuna ripresa, quindi salvare
  // significherebbe far ripartire il rigioco da metà senza dirlo.
  useEffect(() => {
    if (alreadyPlayed) return;
    if (handResults.length === 0 || handResults.length >= hands.length) return;
    saveTournamentProgress({
      weekNum,
      handIds: hands.map((h) => h.id),
      handResults,
    });
  }, [alreadyPlayed, handResults, hands, weekNum]);

  const handleHandFinished = useCallback(
    (tricksMade: number, resultDelta: number) => {
      const { tricksNeeded } = parseContract(currentHand.contract);
      const hr: HandResult = {
        smazzataId: currentHand.id,
        tricksMade,
        tricksNeeded,
        result: resultDelta,
      };
      const newResults = [...handResults, hr];
      setHandResults(newResults);

      if (currentHandIdx < hands.length - 1) {
        // Show transition, then move to next hand
        setShowTransition(true);
      } else {
        // All hands done - show summary
        const { totalTricks, totalNeeded } = computeHandTotals(newResults);
        const { xpEarned } = computeTournamentXp(newResults, alreadyPlayed);

        const tournamentResult: TournamentResult = {
          weekNum,
          totalTricks,
          totalNeeded,
          handResults: newResults,
          completedAt: new Date().toISOString(),
          xpEarned: alreadyPlayed ? 0 : xpEarned,
        };

        if (!alreadyPlayed) {
          onFinish(tournamentResult);
        }
        clearTournamentProgress(weekNum);
        setShowSummary(true);
      }
    },
    [currentHand, currentHandIdx, handResults, hands.length, weekNum, alreadyPlayed, onFinish]
  );

  const handleNextHand = useCallback(() => {
    setShowTransition(false);
    setCurrentHandIdx((prev) => prev + 1);
  }, []);

  return {
    currentHandIdx,
    currentHand,
    handResults,
    showSummary,
    showTransition,
    handleHandFinished,
    handleNextHand,
  };
}
