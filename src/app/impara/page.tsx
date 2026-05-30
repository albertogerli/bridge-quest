"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useCatalog } from "@/store/use-catalog-store";
import { useGameStore, useHasHydrated } from "@/store/use-game-store";

interface Step {
  key: string;
  href: string;
  emoji: string;
  title: string;
  desc: string;
  done: boolean;
  progress?: string; // e.g. "3/24 moduli"
}

const STUDY_TOOLS: { href: string; emoji: string; title: string; desc: string }[] = [
  { href: "/lezioni", emoji: "📚", title: "Corsi e Lezioni", desc: "I 4 corsi: Fiori, Quadri, Cuori" },
  { href: "/dispense", emoji: "📄", title: "Dispense", desc: "Materiale e infografiche da scaricare" },
  { href: "/glossario", emoji: "📖", title: "Glossario", desc: "I termini del bridge spiegati" },
  { href: "/ripasso", emoji: "🔁", title: "Ripasso", desc: "Rivedi ciò su cui hai sbagliato" },
  { href: "/obiettivi", emoji: "🎯", title: "Obiettivi", desc: "Le tue sfide settimanali" },
];

export default function ImparaPage() {
  const hydrated = useHasHydrated();
  const completedModules = useGameStore((s) => s.completedModules);
  const { courses } = useCatalog();

  const [onboarded, setOnboarded] = useState(false);
  const [minibridgePlayed, setMinibridgePlayed] = useState(false);
  const [guidedPlayed, setGuidedPlayed] = useState(false);

  useEffect(() => {
    try {
      setOnboarded(localStorage.getItem("bq_onboarded") === "1");
      setMinibridgePlayed(localStorage.getItem("bq_minibridge_played") === "1");
      // "guided hands" leaves a results trail; treat any guided completion as started
      setGuidedPlayed(!!localStorage.getItem("bq_mano_guidata_done"));
    } catch {}
  }, []);

  // Corso Fiori progress (the first course of the beginner path)
  const fiori = useMemo(() => {
    const course = courses.find((c) => c.id === "fiori");
    if (!course) return { total: 0, done: 0 };
    let total = 0;
    let done = 0;
    for (const lesson of course.lessons) {
      for (const m of lesson.modules) {
        total++;
        if (completedModules[`${lesson.id}-${m.id}`]) done++;
      }
    }
    return { total, done };
  }, [courses, completedModules]);

  const steps: Step[] = [
    {
      key: "prima-mano",
      href: "/prima-mano",
      emoji: "👋",
      title: "Prima Mano",
      desc: "Le basi: prese, atout e morto. Il primo tutorial.",
      done: onboarded,
    },
    {
      key: "minibridge",
      href: "/gioca/minibridge",
      emoji: "🎓",
      title: "MiniBridge",
      desc: "Gioca mani intere senza licita: conta i punti e scegli il contratto.",
      done: minibridgePlayed,
    },
    {
      key: "corso-fiori",
      href: "/lezioni",
      emoji: "♣️",
      title: "Corso Fiori",
      desc: "Teoria e pratica del gioco e della licita, passo dopo passo.",
      done: fiori.total > 0 && fiori.done >= fiori.total,
      progress: fiori.total > 0 ? `${fiori.done}/${fiori.total} moduli` : undefined,
    },
    {
      key: "mano-guidata",
      href: "/gioca/mano-guidata",
      emoji: "🃏",
      title: "Mano Guidata",
      desc: "Allena il gioco della carta con i suggerimenti del maestro.",
      done: guidedPlayed,
    },
  ];

  const nextIndex = steps.findIndex((s) => !s.done);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Impara</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Il tuo percorso dal primo tutorial fino a giocare una mano completa.
        </p>
      </div>

      {/* Percorso */}
      <section className="mb-10">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Il tuo percorso</h2>
        <div className="space-y-3">
          {steps.map((step, i) => {
            const isNext = hydrated && i === nextIndex;
            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={step.href} className="block">
                  <div
                    className={`flex items-center gap-4 rounded-2xl border p-4 transition-all hover:shadow-md ${
                      hydrated && step.done
                        ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                        : isNext
                          ? "border-primary/40 bg-primary/5 shadow-sm"
                          : "border-border bg-card"
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${
                        hydrated && step.done
                          ? "bg-emerald-100 dark:bg-emerald-950/50"
                          : isNext
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                      }`}
                    >
                      {hydrated && step.done ? "✓" : step.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-display text-lg font-semibold">{step.title}</p>
                        {isNext && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                            Prossimo passo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                      {step.progress && (
                        <p className="mt-0.5 text-xs font-medium text-muted-foreground">{step.progress}</p>
                      )}
                    </div>
                    <svg className="h-5 w-5 shrink-0 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <polyline points="9,6 15,12 9,18" />
                    </svg>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Strumenti di studio */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Strumenti di studio</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {STUDY_TOOLS.map((t, i) => (
            <motion.div key={t.href} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link href={t.href} className="block">
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-md">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lg">{t.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <polyline points="9,6 15,12 9,18" />
                  </svg>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
