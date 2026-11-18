"use client";

import { useT } from "@/contexts/traduzioni-provider";
import { useLingua } from "@/hooks/use-lingua";
import Link from "@/components/link";
import { Play, Target, Zap } from "lucide-react";

interface HeroStats {
  level: number;
  levelName: string;
  xp: number;
  streak: number;
  xpInLevel: number;
  levelProgress: number;
}

interface NextModule {
  lessonId: number;
  moduleId: string;
  moduleTitle: string;
  lessonIcon: string;
}

interface HeroSectionProps {
  stats: HeroStats;
  totalModulesCompleted: number;
  handsPlayed: number;
  hasStarted: boolean;
  nextModule: NextModule | null;
}

/**
 * La testata della home di chi non segue un corso.
 *
 * Era una banda di panno verde sfumato con il marchio, i numeri in bianco e un
 * pulsante «squishy»: il panno senza carte, che dal 18/11/2026 si usa solo dove
 * ci sono carte da guardare. Adesso è un foglio: il saluto, il livello in una
 * pillola, i quattro numeri e un solo pulsante blu, «Riprendi» o «Inizia».
 */
export function HeroSection({
  stats,
  totalModulesCompleted,
  handsPlayed,
  hasStarted,
  nextModule,
}: HeroSectionProps) {
  const t = useT();
  const { lingua } = useLingua();
  const numeri = [
    { valore: stats.xp.toLocaleString(lingua === "en" ? "en-US" : "it-IT"), etichetta: "XP" },
    { valore: String(stats.streak), etichetta: t("Streak") },
    { valore: String(totalModulesCompleted), etichetta: t("Moduli") },
    { valore: String(handsPlayed), etichetta: t("Mani") },
  ];
  return (
    <section className="px-4 pt-6 sm:px-5 lg:pt-10">
      <div className="mx-auto grid max-w-6xl gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{t("Ciao")}</h1>
          <span className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm">
            <Zap className="size-4 text-gold" aria-hidden="true" />
            <span className="font-bold tabular-nums">{t("Livello {n}", { n: stats.level })}</span>
            <span className="text-muted-foreground">{stats.levelName}</span>
          </span>
        </div>

        <dl className="grid grid-cols-4 gap-2">
          {numeri.map((n) => (
            <div key={n.etichetta} className="rounded-xl bg-muted/50 px-2 py-2.5 text-center">
              <dd className="text-lg font-bold leading-none tabular-nums">{n.valore}</dd>
              <dt className="mt-1 text-xs font-semibold uppercase text-muted-foreground">{n.etichetta}</dt>
            </div>
          ))}
        </dl>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground tabular-nums">{t("Livello {n}", { n: stats.level })} → {stats.level + 1}</span>
            <span className="font-bold tabular-nums">{stats.xpInLevel} XP</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${stats.levelProgress}%` }} />
          </div>
        </div>

        {hasStarted && nextModule ? (
          <Link
            href={`/lezioni/${nextModule.lessonId}/${nextModule.moduleId}`}
            className="flex min-h-14 items-center gap-3 rounded-xl bg-primary px-5 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold uppercase tracking-wider text-primary-foreground/75">{t("Riprendi")}</span>
              <span className="block truncate font-bold">{nextModule.moduleTitle}</span>
            </span>
            <Play className="size-5 shrink-0" aria-hidden="true" />
          </Link>
        ) : (
          <Link
            href="/lezioni"
            className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Target className="size-5" aria-hidden="true" />
            {t("Inizia il tuo viaggio")}
          </Link>
        )}
      </div>
    </section>
  );
}
