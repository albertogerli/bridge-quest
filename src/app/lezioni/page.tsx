"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  levelInfo,
  type Course,
  type CourseId,
} from "@/lib/catalog";
import { useCatalog } from "@/store/use-catalog-store";
import { useSmazzate } from "@/store/use-smazzate-store";
import { getLessonDisplayNumber } from "@/data/lesson-meta";
import { isWorldLocked } from "@/lib/progression";
import Link from "@/components/link";
import { BookOpen, CheckCircle2, ChevronRight, Compass, Construction, FileText, Play, RefreshCw, Spade, Sprout, Target, Trophy } from "lucide-react";
import { useGameStore } from "@/store/use-game-store";
import { useT } from "@/contexts/traduzioni-provider";
import { CollegamentiSezione } from "@/components/collegamenti-sezione";
import { primoModuloIncompleto } from "@/lib/prossimo-modulo";
import { useTestoSA } from "@/hooks/use-testo-sa";

/**
 * IL PERCORSO, RIDISEGNATO IL 18/11/2026.
 *
 * Sul computer due colonne: a sinistra i mondi del corso, a destra le lezioni
 * del mondo scelto. Prima era una colonna sola a zig-zag, con cerchi colorati
 * di otto tinte, animazioni che pulsavano e i mondi successivi chiusi da un
 * lucchetto («guarda cosa non puoi avere»). Il mondo non ancora aperto adesso
 * si vede attenuato e dice cosa lo apre, senza lucchetto.
 *
 * Sul telefono le due colonne diventano una: i mondi uno sotto l'altro, ognuno
 * con le sue lezioni, come prima ma senza zig-zag.
 */

export default function LezioniPage() {
  const t = useT();
  // Le icone dei mondi arrivano dai dati: «NT» va scritto SA in italiano.
  const testoSA = useTestoSA();
  const iconaMondo = (icona: unknown) => {
    const testo = String(icona);
    // «NT» da solo (l'icona del mondo della competizione) non è un contratto,
    // e testoConSA non lo tocca: in italiano va scritto SA lo stesso.
    return testo === "NT" ? testoSA("1NT").slice(1) : testoSA(testo);
  };
  const completedMap = useGameStore((s) => s.completedModules);
  const { courses, isLoaded: catalogLoaded } = useCatalog();
  // Dove riprendere. Stessa funzione che usa l'eroe della home: se
  // divergessero, i due punti manderebbero l'allievo in lezioni diverse.
  const riprendi = primoModuloIncompleto(courses, completedMap);

  const { smazzate: allSmazzate } = useSmazzate();
  const [selectedCourse, setSelectedCourse] = useState<CourseId>("fiori");
  const [onboarded, setOnboarded] = useState(false);
  /** Il mondo scelto nella colonna di sinistra; `null` = quello in cui si è arrivati. */
  const [sceltoMondo, setSceltoMondo] = useState<number | null>(null);

  useEffect(() => {
    if (!catalogLoaded) return;
    try {
      const saved = localStorage.getItem("bq_selected_course");
      if (saved && courses.some((c) => c.id === saved)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- stato client-only (localStorage) letto dopo il mount per evitare hydration mismatch SSR: pattern intenzionale
        setSelectedCourse(saved as CourseId);
      }
      setOnboarded(localStorage.getItem("bq_onboarded") === "true");
    } catch {}
  }, [catalogLoaded, courses]);

  const handleCourseChange = (id: CourseId) => {
    setSelectedCourse(id);
    try {
      localStorage.setItem("bq_selected_course", id);
    } catch {}
  };

  const availableCourses = courses.filter((c) => c.lessons.length > 0);
  const currentCourse: Course | undefined = courses.find((c) => c.id === selectedCourse) ?? courses[0];

  if (!catalogLoaded || !currentCourse) {
    return (
      <>
        {/* Il catalogo arriva dal DB: finché non c'è, la pagina restava senza
            nessun h1 (violazione `page-has-heading-one` colta dall'audit axe
            quando l'attesa si allunga). Il titolo della pagina esiste da
            subito, solo per gli screen reader in questa fase. */}
        <h1 className="sr-only">{t("Il Percorso")}</h1>
        <div className="pt-10 text-center text-muted-foreground text-sm" role="status" aria-label={t("Caricamento corsi")}>
          {t("Caricamento corsi…")}
        </div>
      </>
    );
  }

  const courseWorlds = currentCourse.worlds;

  // Calculate overall progress for this course from the live catalog
  let totalModules = 0;
  let totalCompleted = 0;
  for (const lesson of currentCourse.lessons) {
    totalModules += lesson.modules.length;
    totalCompleted += lesson.modules.filter((m) => completedMap[`${lesson.id}-${m.id}`]).length;
  }
  const overallProgress = totalModules > 0 ? Math.round((totalCompleted / totalModules) * 100) : 0;

  // Il mondo aperto a destra: quello scelto, o quello in cui si è arrivati.
  const mondoAttuale = (() => {
    const i = courseWorlds.findIndex((w, idx) =>
      !isWorldLocked(courseWorlds, idx, completedMap) &&
      w.lessons.some((l) => l.modules.some((m) => !completedMap[`${l.id}-${m.id}`])),
    );
    return i >= 0 ? i : 0;
  })();
  const mondoScelto = Math.min(sceltoMondo ?? mondoAttuale, Math.max(courseWorlds.length - 1, 0));

  // La prima lezione non finita del corso: «tocca a te».
  const lezioneCorrente = (() => {
    for (const w of courseWorlds) for (const l of w.lessons) {
      if (l.modules.some((m) => !completedMap[`${l.id}-${m.id}`])) return l.id;
    }
    return null;
  })();

  const conti = (moduli: { lessonId: number; ids: string[] }[]) => {
    let fatti = 0, totale = 0;
    for (const { lessonId, ids } of moduli) for (const id of ids) { totale++; if (completedMap[`${lessonId}-${id}`]) fatti++; }
    return { fatti, totale };
  };

  return (
    <div className="px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pt-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-balance lg:text-4xl">{t("Il Percorso")}</h1>
        <p className="mt-1 text-muted-foreground tabular-nums">
          {/* Del corso scelto: la colonna laterale conta tutti i corsi, e
              «2/91» accanto a «2/199» sembrava un errore (28/09/2026). */}
          {t("{fatti}/{totale} moduli completati in {corso}", { fatti: totalCompleted, totale: totalModules, corso: currentCourse.name })}
        </p>
        <p className="mt-1 text-sm font-semibold text-primary">
          {t("Contenuti tecnici a cura della Commissione del Settore Insegnamento FIGB")}
        </p>
      </header>

      {/* Corsi: schede semplici, un solo colore per quella scelta. */}
      {availableCourses.length > 1 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="tablist" aria-label={t("Seleziona corso")}>
          {availableCourses.map((course) => {
            const isActive = course.id === selectedCourse;
            const { fatti, totale } = conti(course.lessons.map((l) => ({ lessonId: l.id, ids: l.modules.map((m) => m.id) })));
            const progress = totale > 0 ? Math.round((fatti / totale) * 100) : 0;
            return (
              <button
                key={course.id}
                onClick={() => { handleCourseChange(course.id); setSceltoMondo(null); }}
                role="tab"
                aria-selected={isActive}
                aria-label={`${course.name}: ${progress}% completato`}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                  isActive ? "border-primary bg-primary/10 font-bold text-primary" : "border-border bg-card font-semibold text-foreground hover:border-primary/40"
                }`}
              >
                <span aria-hidden="true">{course.icon}</span>
                <span>{course.name.replace(/^Corso\s+(di\s+)?/i, "").replace(/\s+Course$/i, "")}</span>
                <span className={`tabular-nums ${isActive ? "text-primary" : "text-muted-foreground"}`}>{progress}%</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Riprendi, Prima mano, Dispense: tre porte affiancate. Riprendi in cima
          perché chi torna atterrava in cima e doveva CERCARE dove si era
          fermato, scorrendo quarantanove lezioni. */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {riprendi && totalCompleted > 0 && (
          <Link
            href={`/lezioni/${riprendi.lessonId}/${riprendi.moduleId}`}
            aria-label={`${t("Riprendi")}: ${riprendi.moduleTitle}`}
            className="flex items-center gap-3 rounded-xl border border-primary bg-primary/5 p-4 transition-colors hover:bg-primary/10"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground" aria-hidden="true">
              <Play className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold uppercase tracking-wider text-primary">{t("Riprendi")}</span>
              <span className="block truncate font-semibold">{riprendi.moduleTitle}</span>
              <span className="block truncate text-sm text-muted-foreground">{riprendi.lessonTitle}</span>
            </span>
          </Link>
        )}
        <Link href="/prima-mano" aria-label={t("Prima Mano: lezione introduttiva")} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${onboarded ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400" : "bg-primary/10 text-primary"}`} aria-hidden="true">
            {onboarded ? <CheckCircle2 className="size-5" /> : <BookOpen className="size-5" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="font-semibold">{t("Prima Mano")}</span>
              <span className="text-sm text-muted-foreground">{onboarded ? t("Completata ✓") : t("3 min")}</span>
            </span>
            <span className="block text-sm text-muted-foreground text-pretty">
              {onboarded
                ? t("Rivedi le basi: cos'è una presa, come si gioca, la tua prima mano")
                : t("Inizia da qui! Scopri il bridge in 3 minuti e gioca la tua prima mano")}
            </span>
          </span>
        </Link>
        <Link href="/dispense" aria-label={t("Dispense e Infografiche: scarica il materiale didattico")} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
            <FileText className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{t("Dispense e infografiche")}</span>
            <span className="block text-sm text-muted-foreground">{t("Scarica il materiale didattico")}</span>
          </span>
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Badge className={`${levelInfo[currentCourse.level].bg} ${levelInfo[currentCourse.level].color} border-0 text-xs font-bold`}>
          {levelInfo[currentCourse.level].label}
        </Badge>
        <span className="text-sm text-muted-foreground">{currentCourse.subtitle}</span>
        <span className="ml-auto flex min-w-40 flex-1 items-center gap-3 sm:max-w-xs">
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-primary" style={{ width: `${overallProgress}%` }} />
          </span>
          <span className="text-sm font-bold tabular-nums text-muted-foreground">{overallProgress}%</span>
        </span>
      </div>

      {courseWorlds.length === 0 && (
        <div className="rounded-2xl border border-border bg-card py-16 text-center">
          <div className="mb-4 flex justify-center"><Construction className="size-12 text-muted-foreground" aria-hidden="true" /></div>
          {/* h2: sezione di primo livello sotto l'h1 della pagina
              (con h3 il salto violerebbe `heading-order`). */}
          <h2 className="mb-2 text-lg font-semibold">{t("In arrivo!")}</h2>
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">
            {t("Il {corso} sarà disponibile presto. Intanto continua con il Corso di Primo Livello!", { corso: currentCourse.name })}
          </p>
        </div>
      )}

      {courseWorlds.length > 0 && (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          {/* I mondi: solo sul computer, per scegliere quale vedere a destra. */}
          <nav className="hidden gap-1 lg:sticky lg:top-6 lg:grid" aria-label={t("Mondi del corso")}>
            {courseWorlds.map((world, worldIdx) => {
              const { fatti, totale } = conti(world.lessons.map((l) => ({ lessonId: l.id, ids: l.modules.map((m) => m.id) })));
              const chiuso = isWorldLocked(courseWorlds, worldIdx, completedMap);
              const scelto = worldIdx === mondoScelto;
              return (
                <button
                  key={world.id}
                  type="button"
                  onClick={() => setSceltoMondo(worldIdx)}
                  aria-current={scelto ? "true" : undefined}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                    scelto ? "border-primary bg-card shadow-sm" : "border-transparent hover:bg-card"
                  } ${chiuso && !scelto ? "opacity-60" : ""}`}
                >
                  <Anello fatti={fatti} totale={totale} icona={iconaMondo(world.icon)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{world.name}</span>
                    <span className="block truncate text-sm text-muted-foreground tabular-nums">
                      {chiuso ? t("Non ancora aperto") : t("{fatti} di {totale} moduli", { fatti, totale })}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
            {courseWorlds.map((world, worldIdx) => {
              const { fatti: worldCompleted, totale: worldModules } = conti(world.lessons.map((l) => ({ lessonId: l.id, ids: l.modules.map((m) => m.id) })));
              const worldProgress = worldModules > 0 ? Math.round((worldCompleted / worldModules) * 100) : 0;
              // Regola in @/lib/progression: i mondi dal secondo in poi si
              // aprono quando il precedente è fatto almeno a metà.
              const isLocked = isWorldLocked(courseWorlds, worldIdx, completedMap);
              const precedente = worldIdx > 0 ? courseWorlds[worldIdx - 1] : null;
              return (
                <section
                  key={world.id}
                  aria-labelledby={`mondo-${world.id}`}
                  className={`rounded-2xl border border-border bg-card p-5 lg:p-6 ${worldIdx === mondoScelto ? "" : "lg:hidden"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="lg:hidden"><Anello fatti={worldCompleted} totale={worldModules} icona={iconaMondo(world.icon)} /></span>
                    <div className="min-w-0 flex-1">
                      <h2 id={`mondo-${world.id}`} className="font-display text-xl font-bold text-balance lg:text-2xl">
                        {world.name}
                        {worldProgress === 100 && <span className="ml-2 text-emerald-700 dark:text-emerald-400" aria-label={t("Completato")}>✓</span>}
                      </h2>
                      <p className="text-sm text-muted-foreground">{world.subtitle}</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-muted-foreground">{worldCompleted}/{worldModules}</span>
                  </div>

                  {isLocked ? (
                    /* Niente lucchetto: si dice cosa lo apre (CLAUDE.md, «La
                       prima schermata dà, non chiede»). */
                    <p className="mt-4 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground text-pretty">
                      {precedente
                        ? t("Si apre quando hai completato metà di «{mondo}».", { mondo: precedente.name })
                        : t("Non ancora aperto")}
                    </p>
                  ) : (
                    <ol className="mt-4 divide-y divide-border border-t border-border">
                      {world.lessons.map((lesson) => {
                        const lessonNumber = getLessonDisplayNumber(lesson.id);
                        const lessonModules = lesson.modules.length;
                        const lessonCompleted = lesson.modules.filter((m) => completedMap[`${lesson.id}-${m.id}`]).length;
                        const isComplete = lessonModules > 0 && lessonCompleted === lessonModules;
                        const isCurrent = lesson.id === lezioneCorrente;
                        const smazzateCount = allSmazzate.filter((s) => s.lesson === lesson.id).length;
                        return (
                          <li key={lesson.id}>
                            <Link
                              href={`/lezioni/${lesson.id}`}
                              aria-label={t("Lezione {n}: {titolo}, {fatti} di {totale} moduli completati", { n: lessonNumber, titolo: lesson.title, fatti: lessonCompleted, totale: lessonModules })}
                              className="group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 py-3"
                            >
                              <span
                                className={`flex size-10 items-center justify-center rounded-full text-sm font-bold tabular-nums ${
                                  isComplete
                                    ? "bg-emerald-700 text-white"
                                    : isCurrent
                                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                                      : "border border-border bg-background text-muted-foreground"
                                }`}
                                aria-hidden="true"
                              >
                                {isComplete ? "✓" : lessonNumber}
                              </span>
                              <span className="min-w-0">
                                <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  <span className={`font-semibold group-hover:text-primary ${isCurrent || isComplete ? "text-foreground" : "text-foreground/80"}`}>{lesson.title}</span>
                                  {/* «Tocca a te» scritto, non solo colorato: lo stato «sei qui»
                                      si riconosceva solo dal colore del cerchio. */}
                                  {isCurrent && (
                                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-primary-foreground">{t("Tocca a te")}</span>
                                  )}
                                </span>
                                <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground tabular-nums">
                                  <span>{t("Lez. {n}", { n: lessonNumber })} · {t("{fatti} di {totale} moduli", { fatti: lessonCompleted, totale: lessonModules })}</span>
                                  {smazzateCount > 0 && (
                                    <span title={t("{n} mani pratiche disponibili", { n: smazzateCount })}>
                                      {smazzateCount} <Spade className="inline size-3" aria-hidden="true" />
                                    </span>
                                  )}
                                </span>
                                {lessonCompleted > 0 && !isComplete && (
                                  <span className="mt-1.5 block h-1.5 max-w-48 overflow-hidden rounded-full bg-muted">
                                    <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.round((lessonCompleted / lessonModules) * 100)}%` }} />
                                  </span>
                                )}
                              </span>
                              <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
                            </Link>
                          </li>
                        );
                      })}
                    </ol>
                  )}

                  {worldProgress === 100 && (
                    <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Trophy className="size-5 text-gold" aria-hidden="true" />
                      {t("Mondo completato!")} <span className="font-normal text-muted-foreground">+200 XP bonus</span>
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* Gli strumenti di studio stavano in `/impara`, che era un menu
          davanti al percorso. Tolto il menu, stanno qui: sotto il percorso,
          dove si è quando servono. */}
      <div className="mt-10">
        <CollegamentiSezione
          titolo="Strumenti di studio"
          voci={[
            { href: "/ripasso", icona: RefreshCw, etichetta: "Ripasso", descrizione: "Rivedi quello che rischi di dimenticare" },
            { href: "/obiettivi", icona: Target, etichetta: "Obiettivi", descrizione: "Cosa ti manca per il prossimo traguardo" },
            { href: "/dispense", icona: FileText, etichetta: "Dispense", descrizione: "Il materiale da leggere e stampare" },
            { href: "/glossario", icona: BookOpen, etichetta: "Glossario", descrizione: "I termini del bridge, spiegati" },
            { href: "/guida", icona: Compass, etichetta: "Guida", descrizione: "Come funziona BridgeLab" },
            { href: "/prima-mano", icona: Sprout, etichetta: "Prima mano", descrizione: "Non hai mai giocato? Si comincia da qui" },
          ]}
        />
      </div>
    </div>
  );
}

/** Il simbolo del mondo dentro un anello che si riempie con i moduli fatti. */
function Anello({ fatti, totale, icona }: { fatti: number; totale: number; icona: React.ReactNode }) {
  const quota = totale > 0 ? fatti / totale : 0;
  const giro = 2 * Math.PI * 18;
  return (
    <span className="relative flex size-11 shrink-0 items-center justify-center text-lg" aria-hidden="true">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="none" strokeWidth="4" className="stroke-muted" />
        {quota > 0 && (
          <circle cx="22" cy="22" r="18" fill="none" strokeWidth="4" strokeLinecap="round" className={quota === 1 ? "stroke-emerald-600" : "stroke-primary"} strokeDasharray={`${quota * giro} ${giro}`} />
        )}
      </svg>
      <span>{icona}</span>
    </span>
  );
}
