"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Swords, Star } from "lucide-react";
import { ConfettiBurst, StarBurst } from "@/components/celebration-effects";
import { StepShell } from "../step-shell";
import type { StepProps } from "../types";

interface StepVittoriaProps extends StepProps {
  totalXp: number;
  handResult: { tricksMade: number; tricksNeeded: number; made: boolean } | null;
  quizScore: { correct: number; total: number };
  miniPreseScore: { won: number; total: number };
}

const ACHIEVEMENTS = [
  "Sai come si vince una presa.",
  "Sai quando devi rispondere al seme.",
  "Conosci i ruoli al tavolo.",
  "Sai quando l'atout puo tagliare.",
];

function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target <= 0) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

function quizStars(correct: number, total: number): number {
  if (total === 0) return 0;
  const ratio = correct / total;
  if (ratio >= 1) return 3;
  if (ratio >= 0.75) return 2;
  if (ratio >= 0.5) return 1;
  return 0;
}

export function StepVittoria({
  onComplete,
  playSound,
  totalXp,
  handResult,
  quizScore,
  miniPreseScore,
}: StepVittoriaProps) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(false);
  const animatedXp = useAnimatedCounter(totalXp, 1500);
  const stars = quizStars(quizScore.correct, quizScore.total);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(true);
      playSound("levelUp");
    }, 600);
    return () => clearTimeout(timer);
  }, [playSound]);

  // Call onComplete(0) once -- XP was already awarded in previous steps
  const completedRef = useRef(false);
  useEffect(() => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete(0);
    }
  }, [onComplete]);

  const summaryItems = [
    ...ACHIEVEMENTS,
    `Hai giocato 4 mini-prese. (${miniPreseScore.won}/${miniPreseScore.total})`,
    handResult
      ? `Hai giocato la tua prima mano vera! (${handResult.tricksMade}/${handResult.tricksNeeded} prese)`
      : "Hai giocato la tua prima mano vera!",
  ];

  return (
    <StepShell
      kicker="Applauso"
      title="Hai giocato la tua prima mano."
      body="Non hai studiato tutto il bridge. Hai studiato abbastanza per iniziare."
    >
      <ConfettiBurst trigger={showConfetti} count={50} />
      <StarBurst trigger={showConfetti} />

      {/* Achievements list */}
      <div className="mt-6 space-y-2">
        {summaryItems.map((text, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.18, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start gap-3 rounded-[20px] border border-[#d8d0c0] bg-white px-4 py-3"
          >
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <span className="text-xs text-emerald-600">{"\u2713"}</span>
            </div>
            <p className="text-sm leading-6 text-[#44536d]">{text}</p>
          </motion.div>
        ))}
      </div>

      {/* XP total */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
        className="mt-6 rounded-[28px] border border-[#c8a44e]/30 bg-gradient-to-br from-[#fffdf5] to-[#fff8e1] p-6 text-center shadow-[0_10px_40px_rgba(200,164,78,0.15)]"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f6b16]">
          XP Totali Guadagnati
        </p>
        <p className="mt-3 text-5xl font-black text-[#c8a44e]" style={{ textShadow: "0 0 20px rgba(200,164,78,0.3)" }}>
          +{animatedXp}
        </p>
      </motion.div>

      {/* Quiz stars */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="mt-4 flex items-center justify-center gap-1"
      >
        {[1, 2, 3].map((n) => (
          <Star
            key={n}
            className={`h-6 w-6 ${
              n <= stars
                ? "fill-[#f0d37a] text-[#c8a44e]"
                : "fill-none text-[#d8d0c0]"
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-[#5c677d]">
          Quiz: {quizScore.correct}/{quizScore.total}
        </span>
      </motion.div>

      {/* CTA buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.3 }}
        className="mt-6 grid gap-3 sm:grid-cols-2"
      >
        <Button
          onClick={() => router.push("/gioca/sfida")}
          size="lg"
          className="h-14 w-full rounded-[22px] bg-[#003DA5] text-base font-semibold hover:bg-[#002d7a]"
        >
          <Swords className="mr-2 h-4 w-4" />
          Gioca ancora
        </Button>
        <Button
          onClick={() => router.push("/lezioni")}
          size="lg"
          variant="outline"
          className="h-14 w-full rounded-[22px] border-[#d8d0c0] bg-white text-base font-semibold text-[#12305f] hover:bg-[#f7f5f0]"
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Inizia il corso
        </Button>
      </motion.div>
    </StepShell>
  );
}
