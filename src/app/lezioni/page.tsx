"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
import Link from "next/link";
import { Lock, Trophy, Target, Crown, Spade, Construction, BookOpen, CheckCircle2 } from "lucide-react";
import { useGameStore } from "@/store/use-game-store";

// Colors for the path nodes per world
const worldColors = [
  { bg: "bg-emerald-500", ring: "ring-emerald-300", glow: "shadow-emerald-400/50", text: "text-emerald-700", light: "bg-emerald-100" },
  { bg: "bg-blue-500", ring: "ring-blue-300", glow: "shadow-blue-400/50", text: "text-blue-700", light: "bg-blue-100" },
  { bg: "bg-purple-500", ring: "ring-purple-300", glow: "shadow-purple-400/50", text: "text-purple-700", light: "bg-purple-100" },
  { bg: "bg-amber-500", ring: "ring-amber-300", glow: "shadow-amber-400/50", text: "text-amber-700", light: "bg-amber-100" },
  { bg: "bg-rose-500", ring: "ring-rose-300", glow: "shadow-rose-400/50", text: "text-rose-700", light: "bg-rose-100" },
  { bg: "bg-cyan-500", ring: "ring-cyan-300", glow: "shadow-cyan-400/50", text: "text-cyan-700", light: "bg-cyan-100" },
  { bg: "bg-orange-500", ring: "ring-orange-300", glow: "shadow-orange-400/50", text: "text-orange-700", light: "bg-orange-100" },
  { bg: "bg-indigo-500", ring: "ring-indigo-300", glow: "shadow-indigo-400/50", text: "text-indigo-700", light: "bg-indigo-100" },
];

/**
 * I ritardi a cascata (0.15s per mondo) su un corso da ~20 mondi arrivavano a
 * oltre 3s: il contenuto restava a `opacity: 0` — invisibile a lungo e segnalato
 * da axe come testo a contrasto nullo. Tetto a 1s: la cascata resta percepibile
 * ma tutto è visibile subito.
 */
const MAX_STAGGER_DELAY = 1;
const staggerDelay = (d: number) => Math.min(d, MAX_STAGGER_DELAY);

// Course tab colors.
// Le tinte "active" sono al livello 700 (non 500) perché il testo bianco sopra
// il 500 restava sotto 4.5:1 — violazione serious rilevata da axe su /lezioni.
const courseColors: Record<CourseId, { active: string; inactive: string; border: string }> = {
  fiori: { active: "bg-emerald-700 text-white", inactive: "text-emerald-700", border: "border-emerald-200" },
  quadri: { active: "bg-orange-700 text-white", inactive: "text-orange-700", border: "border-orange-200" },
  "cuori-gioco": { active: "bg-red-700 text-white", inactive: "text-red-700", border: "border-red-200" },
  "cuori-licita": { active: "bg-rose-700 text-white", inactive: "text-rose-700", border: "border-rose-200" },
};

export default function LezioniPage() {
  const completedMap = useGameStore((s) => s.completedModules);
  const { courses, isLoaded: catalogLoaded } = useCatalog();
  const { smazzate: allSmazzate } = useSmazzate();
  const [selectedCourse, setSelectedCourse] = useState<CourseId>("fiori");
  const [onboarded, setOnboarded] = useState(false);

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
        <h1 className="sr-only">Il Percorso</h1>
        <div className="pt-10 text-center text-muted-foreground text-sm" role="status" aria-label="Caricamento corsi">
          Caricamento corsi…
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

  return (
    <div className="pt-6 px-5 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2"
        >
          <h1 className="font-display text-3xl font-bold text-foreground">
            Il Percorso
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCompleted}/{totalModules} moduli completati
          </p>
        </motion.div>

        {/* Prima Mano — lezione introduttiva, sempre visibile */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="mb-4"
        >
          <Link href="/prima-mano" aria-label="Prima Mano: lezione introduttiva">
            <div className={`relative overflow-hidden rounded-2xl border p-4 transition-all hover:shadow-lg active:scale-[0.99] ${
              onboarded
                ? "border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-card dark:from-emerald-950/30 dark:to-card"
                : "border-[#c8a44e]/30 dark:border-[#c8a44e]/20 bg-[linear-gradient(135deg,#fffaf0_0%,#f0e4c8_50%,#e8d9b0_100%)] dark:bg-[linear-gradient(135deg,#2a2518_0%,#1f1c14_100%)]"
            }`}>
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#c8a44e]/10 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg ${
                  onboarded
                    ? "bg-emerald-500 text-white shadow-emerald-500/20"
                    : "bg-figb text-white shadow-figb/20"
                }`}>
                  {onboarded ? <CheckCircle2 className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-[#12305f] dark:text-gray-100">Prima Mano</p>
                    <Badge className={`text-[10px] font-bold border-0 ${
                      onboarded
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-[#c8a44e]/20 text-[#8f6b16]"
                    }`}>
                      {onboarded ? "Completata ✓" : "3 min"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {onboarded
                      ? "Rivedi le basi: cos'è una presa, come si gioca, la tua prima mano"
                      : "Inizia da qui! Scopri il bridge in 3 minuti e gioca la tua prima mano"}
                  </p>
                </div>
                <svg className="h-5 w-5 text-muted-foreground/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <polyline points="9,6 15,12 9,18" />
                </svg>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Course selector tabs */}
        {availableCourses.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
            role="tablist"
            aria-label="Seleziona corso"
          >
            {availableCourses.map((course) => {
              const isActive = course.id === selectedCourse;
              const colors = courseColors[course.id];
              let _total = 0;
              let _done = 0;
              for (const lesson of course.lessons) {
                for (const mod of lesson.modules) {
                  _total++;
                  if (completedMap[`${lesson.id}-${mod.id}`]) _done++;
                }
              }
              const stats = { progress: _total > 0 ? Math.round((_done / _total) * 100) : 0 };
              return (
                <button
                  key={course.id}
                  onClick={() => handleCourseChange(course.id)}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`${course.name}: ${stats.progress}% completato`}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.97] ${
                    isActive
                      ? `${colors.active} shadow-[0_3px_0_rgba(0,0,0,0.15)]`
                      : `bg-card border-2 ${colors.border} ${colors.inactive} shadow-sm`
                  }`}
                >
                  <span className="text-lg">{course.icon}</span>
                  <div className="text-left">
                    <div className="text-[13px] font-semibold leading-tight">{course.name.replace("Corso ", "")}</div>
                    <div className={`text-[10px] leading-tight ${isActive ? "text-white" : "text-muted-foreground"}`}>
                      {stats.progress}%
                    </div>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}

        {/* Course info badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-4 flex items-center gap-2"
        >
          <Badge className={`${levelInfo[currentCourse.level].bg} ${levelInfo[currentCourse.level].color} text-[10px] font-bold border-0`}>
            {levelInfo[currentCourse.level].label}
          </Badge>
          <span className="text-xs text-muted-foreground">{currentCourse.subtitle}</span>
        </motion.div>

        {/* Dispense link */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.09 }}
          className="mb-4"
        >
          <Link href="/dispense" aria-label="Dispense e Infografiche: scarica il materiale didattico">
            <div className="card-clean card-interactive rounded-2xl bg-gradient-to-r from-figb/5 to-figb/10 dark:from-primary/10 dark:to-primary/15 border border-figb/15 dark:border-primary/20 p-3.5 flex items-center gap-3 cursor-pointer">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-figb/10 dark:bg-primary/15">
                <svg className="h-5 w-5 text-figb dark:text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">Dispense & Infografiche</p>
                <p className="text-[11px] text-muted-foreground">Scarica il materiale didattico</p>
              </div>
              <svg className="h-5 w-5 text-muted-foreground/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="9,6 15,12 9,18" />
              </svg>
            </div>
          </Link>
        </motion.div>

        {/* Overall progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 h-4 rounded-full bg-muted border border-border overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${currentCourse.gradient}`}
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ delay: 0.3, duration: 0.8 }}
              />
            </div>
            <span className="text-sm font-bold text-muted-foreground">{overallProgress}%</span>
          </div>
        </motion.div>

        {/* Empty state for courses without content yet */}
        {courseWorlds.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="flex justify-center mb-4"><Construction className="w-12 h-12 text-amber-500" /></div>
            {/* h2: sezione di primo livello sotto l'h1 della pagina
                (con h3 il salto violerebbe `heading-order`). */}
            <h2 className="text-lg font-semibold text-foreground/80 mb-2">
              In arrivo!
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Il {currentCourse.name} sarà disponibile presto. Intanto continua con il Corso Fiori!
            </p>
          </motion.div>
        )}

        {/* Lesson path */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCourse}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="relative"
          >
            {/* Vertical connector line */}
            {courseWorlds.length > 0 && (
              <div className="absolute left-[39px] top-8 bottom-8 w-1.5 bg-border rounded-full" />
            )}

            {courseWorlds.map((world, worldIdx) => {
              const colors = worldColors[worldIdx % worldColors.length];
              const worldModules = world.lessons.reduce(
                (sum, l) => sum + l.modules.length, 0
              );
              const worldCompleted = world.lessons.reduce(
                (sum, l) =>
                  sum + l.modules.filter((m) => completedMap[`${l.id}-${m.id}`]).length,
                0
              );
              const worldProgress = worldModules > 0
                ? Math.round((worldCompleted / worldModules) * 100)
                : 0;

              // Lock worlds 2+ until previous >= 50% (regola in @/lib/progression)
              const isLocked = isWorldLocked(courseWorlds, worldIdx, completedMap);

              return (
                <div key={world.id} className="mb-6">
                  {/* World header */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: staggerDelay(worldIdx * 0.15) }}
                    className="flex items-center gap-3 mb-4 ml-1"
                  >
                    <div className={`flex h-[70px] w-[70px] shrink-0 items-center justify-center rounded-full text-2xl font-bold z-10 ${
                      isLocked
                        ? "bg-muted text-muted-foreground"
                        : `bg-gradient-to-br ${world.gradient} text-white shadow-lg border-2 border-background`
                    }`}>
                      {isLocked ? <Lock className="w-6 h-6" /> : world.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className={`text-lg font-semibold ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>
                          {world.name}
                        </h2>
                        {worldProgress === 100 && (
                          <span className="text-emerald-700 text-lg" aria-label="Completato">✓</span>
                        )}
                      </div>
                      <p className={`text-xs ${isLocked ? "text-muted-foreground" : "text-muted-foreground"}`}>
                        {world.subtitle}
                      </p>
                      {!isLocked && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-2.5 rounded-full bg-muted border border-border overflow-hidden max-w-[120px]">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${world.gradient}`}
                              style={{ width: `${worldProgress}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-muted-foreground">
                            {worldCompleted}/{worldModules}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Lessons in this world - path nodes */}
                  {!isLocked ? (
                    <div className="space-y-1">
                      {world.lessons.map((lesson, lessonIdx) => {
                        const lessonNumber = getLessonDisplayNumber(lesson.id);
                        const lessonModules = lesson.modules.length;
                        const lessonCompleted = lesson.modules.filter(
                          (m) => completedMap[`${lesson.id}-${m.id}`]
                        ).length;
                        const lessonProgress = lessonModules > 0
                          ? Math.round((lessonCompleted / lessonModules) * 100)
                          : 0;
                        const isComplete = lessonProgress === 100;

                        // Determine if this is the "current" (first incomplete) lesson
                        const isCurrent = !isComplete && (() => {
                          for (let i = 0; i < lessonIdx; i++) {
                            const prev = world.lessons[i];
                            const prevDone = prev.modules.filter(
                              (m) => completedMap[`${prev.id}-${m.id}`]
                            ).length;
                            if (prevDone < prev.modules.length) return false;
                          }
                          for (let w = 0; w < worldIdx; w++) {
                            for (const l of courseWorlds[w].lessons) {
                              const d = l.modules.filter(
                                (m) => completedMap[`${l.id}-${m.id}`]
                              ).length;
                              if (d < l.modules.length) return false;
                            }
                          }
                          return true;
                        })();

                        // Zigzag offset
                        const offset = lessonIdx % 2 === 0 ? "ml-0" : "ml-16";

                        return (
                          <motion.div
                            key={lesson.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              delay: staggerDelay(0.2 + worldIdx * 0.15 + lessonIdx * 0.08),
                            }}
                            className={`relative ${offset}`}
                          >
                            <Link href={`/lezioni/${lesson.id}`} aria-label={`Lezione ${lessonNumber}: ${lesson.title}, ${lessonCompleted} di ${lessonModules} moduli completati`}>
                              <div className={`group flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-[0.97] ${
                                isCurrent
                                  ? "bg-card border-2 border-emerald-300 dark:border-emerald-700 shadow-[0_4px_0_#6ee7b7] dark:shadow-[0_4px_0_#065f46]"
                                  : isComplete
                                    ? "bg-card/60"
                                    : "bg-card/40"
                              }`}>
                                {/* Node circle */}
                                <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl z-10 transition-all ${
                                  isComplete
                                    ? `${colors.bg} text-white shadow-md border-2 border-background`
                                    : isCurrent
                                      ? `${colors.bg} text-white shadow-lg ${colors.glow} ring-4 ${colors.ring} ring-opacity-50`
                                      : "bg-muted text-muted-foreground border-2 border-border"
                                }`}>
                                  {isComplete ? (
                                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                      <polyline points="20,6 9,17 4,12" />
                                    </svg>
                                  ) : (
                                    <span>{lesson.icon}</span>
                                  )}

                                  {isCurrent && (
                                    <motion.div
                                      className={`absolute inset-0 rounded-full ${colors.bg} opacity-30`}
                                      animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                                      transition={{ duration: 2, repeat: Infinity }}
                                    />
                                  )}

                                  {!isComplete && lessonProgress > 0 && (
                                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
                                      <circle
                                        cx="28" cy="28" r="26"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        className="text-border"
                                      />
                                      <circle
                                        cx="28" cy="28" r="26"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeDasharray={`${lessonProgress * 1.63} 163`}
                                        strokeLinecap="round"
                                        className={colors.text}
                                      />
                                    </svg>
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] font-bold px-1.5 py-0 ${
                                        isComplete
                                          ? "text-emerald border-emerald/30"
                                          : "text-muted-foreground border-border"
                                      }`}
                                      title={`Lezione ${lessonNumber} - ${lessonModules} moduli`}
                                    >
                                      Lez. {lessonNumber}
                                    </Badge>
                                    {(() => {
                                      const smazzateCount = allSmazzate.filter((s) => s.lesson === lesson.id).length;
                                      return smazzateCount > 0 ? (
                                        <span
                                          className="text-[10px] font-bold text-amber-600 dark:text-amber-400"
                                          title={`${smazzateCount} mani pratiche disponibili`}
                                        >
                                          {smazzateCount} <Spade className="w-3 h-3 inline ml-0.5" />
                                        </span>
                                      ) : null;
                                    })()}
                                  </div>
                                  <h3 className={`font-bold text-[15px] mt-0.5 truncate ${
                                    isCurrent ? "text-foreground" : isComplete ? "text-foreground/80" : "text-muted-foreground"
                                  }`}>
                                    {lesson.title}
                                  </h3>
                                  <p className="text-[12px] text-muted-foreground mt-0.5 truncate">
                                    {lessonCompleted}/{lessonModules} moduli
                                    {isComplete && " · Completata!"}
                                  </p>
                                </div>

                                {isCurrent && (
                                  <motion.div
                                    animate={{ x: [0, 4, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="shrink-0"
                                  >
                                    <svg
                                      className="h-6 w-6 text-emerald"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                    >
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </motion.div>
                                )}
                              </div>
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: staggerDelay(0.3 + worldIdx * 0.15) }}
                      className="ml-10 rounded-2xl bg-muted border-2 border-dashed border-border p-4 text-center"
                    >
                      <p className="text-sm text-muted-foreground font-medium flex items-center justify-center gap-1.5">
                        <Lock className="w-4 h-4" /> Completa il mondo precedente al 50% per sbloccare
                      </p>
                    </motion.div>
                  )}

                  {/* World completion reward */}
                  {worldProgress === 100 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="ml-10 mt-2 flex items-center gap-2 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 rounded-xl p-3 border-2 border-amber-300 dark:border-amber-700 shadow-[0_3px_0_#fbbf24]"
                    >
                      <Trophy className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                      <div>
                        <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Mondo completato!</p>
                        <p className="text-[11px] text-amber-600/60 dark:text-amber-500/60">+200 XP bonus</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}

            {/* Final trophy */}
            {courseWorlds.length > 0 && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="flex justify-center mt-4"
                >
                  <div className={`flex h-20 w-20 items-center justify-center rounded-full text-3xl ${
                    overallProgress === 100
                      ? "bg-gradient-to-br from-amber-400 to-amber-500 shadow-xl shadow-amber-400/30 text-white border-3 border-amber-300"
                      : "bg-muted text-muted-foreground/50 border-2 border-border"
                  }`}>
                    {overallProgress === 100 ? <Crown className="w-8 h-8" /> : <Target className="w-8 h-8" />}
                  </div>
                </motion.div>
                <p className="text-center text-xs text-muted-foreground mt-2 font-semibold">
                  {overallProgress === 100
                    ? `${currentCourse.name} completato!`
                    : `Diplomato ${currentCourse.name} FIGB`}
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
