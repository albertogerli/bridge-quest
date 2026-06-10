"use client";

/**
 * Planning quiz — the most important didactic habit in bridge: after the
 * opening lead, before touching dummy, the declarer should count tricks.
 * Asks "how many tricks can you take with best play?" and checks the answer
 * against the double-dummy solver.
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Target } from "lucide-react";
import type { Card, Position } from "@/lib/bridge-engine";
import { useDDS } from "@/hooks/use-dds";

export interface PlanningQuizProps {
  hands: Record<Position, Card[]>;
  contract: string;
  declarer: Position;
  openingLead: Card;
  /** Called when the user answers; correct → small XP bonus upstream */
  onAnswer?: (correct: boolean) => void;
  onDismiss: () => void;
}

export function PlanningQuiz({
  hands,
  contract,
  declarer,
  openingLead,
  onAnswer,
  onDismiss,
}: PlanningQuizProps) {
  const dds = useDDS();
  const [ddTricks, setDdTricks] = useState<number | null>(null);
  const [isExact, setIsExact] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    dds.analyzeHand(hands, contract, declarer, openingLead).then((res) => {
      if (active) {
        setDdTricks(res.ddTricks);
        setIsExact(res.isExact);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stable options around the DD value (clamped to 0..13)
  const options = useMemo(() => {
    if (ddTricks === null) return [];
    const base = Math.min(12, Math.max(1, ddTricks));
    const set = new Set([base - 1, base, base + 1]);
    set.add(base >= 7 ? base - 2 : base + 2);
    return [...set].filter((n) => n >= 0 && n <= 13).sort((a, b) => a - b);
  }, [ddTricks]);

  // With a full deal the solver may return an estimate: accept ±1 in that case
  const isCorrectPick = (n: number) =>
    ddTricks !== null && (isExact ? n === ddTricks : Math.abs(n - ddTricks) <= 1);

  const answered = picked !== null;
  const correct = answered && isCorrectPick(picked);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="mx-auto mt-3 max-w-md rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-4 shadow-sm"
      >
        <div className="flex items-start gap-2">
          <Target className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              Fai il piano prima di giocare
            </p>
            <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">
              Guarda il morto e conta: quante prese puoi realizzare con il gioco
              migliore?
            </p>

            {!answered && (
              <div className="mt-3 flex flex-wrap gap-2">
                {ddTricks === null ? (
                  <span className="text-xs text-amber-600 dark:text-amber-400">Calcolo in corso…</span>
                ) : (
                  options.map((n) => (
                    <Button
                      key={n}
                      variant="outline"
                      size="sm"
                      className="h-8 w-10 rounded-xl border-amber-300 dark:border-amber-800 bg-card text-sm font-bold"
                      onClick={() => {
                        setPicked(n);
                        onAnswer?.(isCorrectPick(n));
                      }}
                    >
                      {n}
                    </Button>
                  ))
                )}
              </div>
            )}

            {answered && (
              <div className="mt-3">
                <p
                  className={`text-xs font-bold ${correct ? "text-emerald-700" : "text-red-600"}`}
                >
                  {correct
                    ? `Esatto! Col miglior gioco si fanno ${ddTricks} prese. +5 XP`
                    : `Non proprio: col miglior gioco si fanno ${ddTricks} prese${isExact ? "" : " (stima)"}.`}
                </p>
                <Button
                  size="sm"
                  className="mt-2 h-8 rounded-xl px-4 text-xs font-bold"
                  onClick={onDismiss}
                >
                  Capito, gioco!
                </Button>
              </div>
            )}

            {!answered && (
              <button
                onClick={onDismiss}
                className="mt-2 text-[11px] font-semibold text-amber-600 dark:text-amber-400 underline-offset-2 hover:underline"
              >
                Salta
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
