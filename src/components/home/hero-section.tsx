"use client";

import { useT } from "@/contexts/traduzioni-provider";
import { useLingua } from "@/hooks/use-lingua";
import Link from "@/components/link";
import { BookOpen, ChevronRight, Play } from "lucide-react";

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

/**
 * La testata della home di chi non segue un corso (seconda versione,
 * 18/11/2026).
 *
 * La prima era un foglio unico con il saluto, quattro numeri in quattro
 * caselle grigie, la barra del livello e un pulsante blu largo quanto lo
 * schermo: su un monitor diventava una fascia di 1000 pixel con una parola
 * dentro. Adesso sono due cose diverse, ciascuna dove serve: il saluto e il
 * «riprendi» in alto nella colonna principale, i numeri nella colonna a lato.
 */
export function Saluto({ nome }: { nome: string | null }) {
  const t = useT();
  const primo = nome?.trim().split(/\s+/)[0];
  return (
    <header>
      <h1 className="font-display text-3xl font-bold text-balance lg:text-4xl">
        {primo ? t("Ciao, {nome}", { nome: primo }) : t("Ciao")}
      </h1>
    </header>
  );
}

export function RiprendiLezione({ hasStarted, nextModule }: { hasStarted: boolean; nextModule: NextModule | null }) {
  const t = useT();
  const riprendi = hasStarted && nextModule;
  const href = riprendi ? `/lezioni/${nextModule.lessonId}/${nextModule.moduleId}` : "/lezioni";
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl text-primary" aria-hidden="true">
        {riprendi && nextModule.lessonIcon ? nextModule.lessonIcon : <BookOpen className="size-6" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {riprendi ? t("Riprendi da qui") : t("Il percorso")}
        </p>
        <h2 className="mt-0.5 font-display text-xl font-bold text-balance">
          {riprendi ? nextModule.moduleTitle : t("Comincia dalla prima lezione")}
        </h2>
      </div>
      <Link
        href={href}
        className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Play className="size-4" aria-hidden="true" />
        {riprendi ? t("Riprendi") : t("Inizia")}
      </Link>
    </section>
  );
}

export function IlTuoLivello({
  stats,
  totalModulesCompleted,
  handsPlayed,
}: {
  stats: HeroStats;
  totalModulesCompleted: number;
  handsPlayed: number;
}) {
  const t = useT();
  const { lingua } = useLingua();
  const locale = lingua === "en" ? "en-US" : "it-IT";
  const giro = 2 * Math.PI * 26;
  const numeri = [
    { valore: stats.xp.toLocaleString(locale), etichetta: t("Totale XP") },
    { valore: t("{n} gg", { n: stats.streak }), etichetta: t("Streak") },
    { valore: String(totalModulesCompleted), etichetta: t("Moduli") },
    { valore: String(handsPlayed), etichetta: t("Mani") },
  ];
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-4">
        <div className="relative flex size-16 shrink-0 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 60 60" aria-hidden="true">
            <circle cx="30" cy="30" r="26" fill="none" strokeWidth="5" className="stroke-muted" />
            <circle
              cx="30" cy="30" r="26" fill="none" strokeWidth="5" strokeLinecap="round"
              className="stroke-primary"
              strokeDasharray={`${(stats.levelProgress / 100) * giro} ${giro}`}
            />
          </svg>
          <span className="font-display text-xl font-bold tabular-nums">{stats.level}</span>
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold">{t("Livello {n}", { n: stats.level })}</h2>
          <p className="text-sm font-semibold">{stats.levelName}</p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {t("{p}% verso il livello {n}", { p: stats.levelProgress, n: stats.level + 1 })}
          </p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4">
        {numeri.map((n) => (
          <div key={n.etichetta}>
            <dt className="text-xs text-muted-foreground">{n.etichetta}</dt>
            <dd className="text-lg font-bold tabular-nums">{n.valore}</dd>
          </div>
        ))}
      </dl>
      <Link href="/profilo" className="mt-4 flex min-h-10 items-center gap-1 text-sm font-semibold text-primary hover:underline">
        {t("Il tuo profilo")}
        <ChevronRight className="size-4" aria-hidden="true" />
      </Link>
    </section>
  );
}
