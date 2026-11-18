"use client";

import { Flame, Star } from "lucide-react";
import { useT } from "@/contexts/traduzioni-provider";
import { useLingua } from "@/hooks/use-lingua";

/**
 * Livello, streak e XP totali: la casa delle cose «da gioco» (18/11/2026).
 *
 * Prima era un riquadro petrolio scuro con bagliori arancio e gialli, l'unico
 * scuro del sito. Adesso è un foglio come gli altri: l'anello del livello in
 * blu, i due numeri accanto. Livello e streak non stanno più nella colonna
 * destra di ogni pagina, stanno qui.
 */
export function LevelProgressCard({
  level,
  levelName,
  nextLevelName,
  streak,
  levelProgress,
  xpInLevel,
  xpForNext,
  xp,
}: {
  level: number;
  levelName: string;
  nextLevelName: string;
  streak: number;
  levelProgress: number;
  xpInLevel: number;
  xpForNext: number;
  xp: number;
}) {
  const t = useT();
  const { lingua } = useLingua();
  const locale = lingua === "en" ? "en-US" : "it-IT";
  const giro = 2 * Math.PI * 50;
  return (
    <section className="mt-6 grid items-center gap-6 rounded-2xl border border-border bg-card p-6 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
      <div className="relative mx-auto flex size-32 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="50" fill="none" strokeWidth="8" className="stroke-muted" />
          <circle
            cx="60" cy="60" r="50" fill="none" strokeWidth="8" strokeLinecap="round"
            className="stroke-primary"
            strokeDasharray={`${(levelProgress / 100) * giro} ${giro}`}
          />
        </svg>
        <span className="flex flex-col items-center">
          <span className="font-display text-3xl font-bold tabular-nums leading-none">{levelProgress}%</span>
          <span className="mt-1 text-xs text-muted-foreground tabular-nums">
            {xpInLevel.toLocaleString(locale)} / {xpForNext.toLocaleString(locale)}
          </span>
        </span>
      </div>
      <div className="text-center sm:text-left">
        <h2 className="font-display text-xl font-bold text-balance">{t("Livello {n} — {nome}", { n: level, nome: levelName })}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{t("Prossimo livello: {nome}", { nome: nextLevelName })}</p>
      </div>
      <dl className="flex justify-center gap-8 sm:justify-end">
        <div className="flex flex-col items-center">
          <Flame className="mb-1 size-6 text-muted-foreground" aria-hidden="true" />
          <dt className="text-xs text-muted-foreground">{t("Streak")}</dt>
          <dd className="font-bold tabular-nums">{t("{n} gg", { n: streak })}</dd>
        </div>
        <div className="flex flex-col items-center">
          <Star className="mb-1 size-6 text-gold" aria-hidden="true" />
          <dt className="text-xs text-muted-foreground">{t("Totale XP")}</dt>
          <dd className="font-bold tabular-nums">{xp.toLocaleString(locale)}</dd>
        </div>
      </dl>
    </section>
  );
}
