"use client";

import { use, useState, useEffect } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { useCatalog } from "@/store/use-catalog-store";
import { useSmazzate } from "@/store/use-smazzate-store";
import { getLessonDisplayNumber } from "@/data/lesson-meta";
import { isModuleLocked } from "@/lib/progression";
import { getYouTubeEmbedUrl, getInfographicForLesson, getMaestroName } from "@/components/maestro-video";
import { useProfile } from "@/hooks/use-profile";
import Link from "next/link";
import { useGameStore } from "@/store/use-game-store";

export default function LessonDetailPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = use(params);
  const lessonIdNum = parseInt(lessonId);

  const { courses, isLoaded: catalogLoaded } = useCatalog();
  const { smazzate: allSmazzate } = useSmazzate();
  const completedMap = useGameStore((s) => s.completedModules);
  const [draftsMap, setDraftsMap] = useState<Record<string, boolean>>({});
  const [infographicLoaded, setInfographicLoaded] = useState(false);
  const profileConfig = useProfile();

  const lesson = courses
    .flatMap((c) => c.lessons)
    .find((l) => l.id === lessonIdNum);
  const course = courses.find((c) => c.lessons.some((l) => l.id === lessonIdNum));

  useEffect(() => {
    // Check for saved drafts on each module
    if (lesson) {
      const drafts: Record<string, boolean> = {};
      for (const m of lesson.modules) {
        const key = `bq_module_draft_${lesson.id}_${m.id}`;
        if (localStorage.getItem(key)) {
          drafts[`${lesson.id}-${m.id}`] = true;
        }
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- stato client-only (localStorage) letto dopo il mount per evitare hydration mismatch SSR: pattern intenzionale
      setDraftsMap(drafts);
    }
  }, [lesson]);

  if (!catalogLoaded) {
    return (
      <div className="pt-10 text-center text-muted-foreground text-sm" role="status" aria-label="Caricamento lezione">
        Caricamento lezione…
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="pt-10 px-5 text-center">
        <p className="text-muted-foreground">Lezione non trovata</p>
        <Link href="/lezioni" className="text-emerald font-bold text-sm mt-2 inline-block">
          Torna alle lezioni
        </Link>
      </div>
    );
  }

  const lessonNumber = getLessonDisplayNumber(lesson.id);
  const maestroName = getMaestroName(profileConfig.profile);
  const infographic = getInfographicForLesson(lesson.id, profileConfig.profile);

  const completedModules = lesson.modules.filter(
    (m) => completedMap[`${lesson.id}-${m.id}`]
  ).length;
  const totalModules = lesson.modules.length;
  const progress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
  const totalXp = lesson.modules.reduce((sum, m) => sum + m.xpReward, 0);
  const totalDuration = lesson.modules.reduce((sum, m) => sum + parseInt(m.duration), 0);
  const youtubeEmbed = getYouTubeEmbedUrl(lesson.id, profileConfig.profile);
  const lessonSmazzateCount = allSmazzate.filter((s) => s.lesson === lesson.id).length;

  return (
    <div className="pt-6 px-5">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs text-muted-foreground mb-4"
        >
          <Link href="/lezioni" className="hover:text-emerald transition-colors">
            Lezioni
          </Link>
          <span>/</span>
          <span className="text-emerald font-semibold">Lezione {lessonNumber}</span>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl hero-gradient p-6 mb-6"
        >
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
          <div className="relative">
            <div className="text-4xl mb-3">{lesson.icon}</div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-white/20 text-white text-[12px] font-bold border-0">
                Lezione {lessonNumber}
              </Badge>
              <Badge className="bg-white/10 text-white/70 text-[12px] font-bold border-0">
                {totalDuration} min
              </Badge>
            </div>
            <h1 className="font-display text-2xl font-bold text-white">{lesson.title}</h1>
            <p className="text-sm text-white/70 mt-1">{lesson.subtitle}</p>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white/80 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-bold text-white/80">
                {completedModules}/{totalModules}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Maestro YouTube video */}
        {youtubeEmbed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="card-clean rounded-2xl bg-card overflow-hidden mb-4"
          >
            <div className="relative w-full" style={{ aspectRatio: "9/16" }}>
              <iframe
                src={youtubeEmbed}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`Maestro Franci - ${lesson.title}`}
              />
            </div>
            <div className="p-3 flex items-center gap-2">
              <span className="text-lg">🎓</span>
              <p className="text-sm font-bold text-foreground/80">
                Maestro Franci introduce la lezione
              </p>
            </div>
          </motion.div>
        )}

        {/* Infografica / Dispensa */}
        {infographic && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: infographicLoaded ? 1 : 0, y: infographicLoaded ? 0 : 8 }}
            transition={{ delay: 0.12 }}
            className={`card-clean rounded-2xl bg-card overflow-hidden mb-4 ${infographicLoaded ? "" : "hidden"}`}
          >
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={infographic.image}
                alt={`Infografica Lezione ${lessonNumber}`}
                className="w-full"
                onLoad={() => setInfographicLoaded(true)}
                onError={() => setInfographicLoaded(false)}
              />
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <p className="text-sm font-bold text-foreground/80">
                  Dispensa — {maestroName}
                </p>
              </div>
              <a
                href={infographic.pdf}
                download
                className="flex items-center gap-1.5 rounded-xl bg-[#0098D4]/10 px-3 py-1.5 text-xs font-bold text-[#0098D4] hover:bg-[#0098D4]/20 transition-colors active:scale-95"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                PDF
              </a>
            </div>
          </motion.div>
        )}

        {/* XP reward banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-clean rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-100 dark:border-amber-900 p-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="font-bold text-sm text-amber-800 dark:text-amber-300">
                {totalXp} XP disponibili
              </p>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/80">
                Completa tutti i moduli per guadagnare XP
              </p>
            </div>
          </div>
        </motion.div>

        {/* Modules */}
        <div className="space-y-3">
          {lesson.modules.map((module, index) => {
            const isCompleted = !!completedMap[`${lesson.id}-${module.id}`];
            const hasDraft = !!draftsMap[`${lesson.id}-${module.id}`] && !isCompleted;
            const isLocked = isModuleLocked(lesson, index, completedMap);

            const typeConfig = {
              theory: { label: "Teoria", color: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400", icon: "📖" },
              exercise: { label: "Esercizio", color: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400", icon: "✏️" },
              quiz: { label: "Quiz", color: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400", icon: "❓" },
              practice: { label: "Pratica", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300", icon: "🃏" },
            };

            const config = typeConfig[module.type];

            const cardContent = (
              <div className={`group card-clean rounded-2xl bg-card p-4 ${isLocked ? "" : "card-interactive cursor-pointer"}`}>
                <div className="flex items-center gap-4">
                  {/* Step number */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${
                      isCompleted
                        ? "bg-emerald text-white"
                        : isLocked
                        ? "bg-muted text-muted-foreground/50"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    ) : isLocked ? (
                      <span className="text-base">🔒</span>
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge className={`text-[12px] font-bold border-0 ${config.color}`}>
                        {config.icon} {config.label}
                      </Badge>
                      {hasDraft && !isLocked && (
                        <Badge className="text-[12px] font-bold border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          Riprendi
                        </Badge>
                      )}
                      <span className="text-[12px] text-muted-foreground">
                        {module.duration} min
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground text-[15px]">
                      {module.title}
                    </h3>
                    {isLocked ? (
                      <p className="text-[12px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 flex items-center gap-1">
                        <span>🔒</span> Completa il modulo precedente per sbloccare
                      </p>
                    ) : (
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        +{module.xpReward} XP
                      </p>
                    )}
                  </div>

                  {/* Arrow or lock badge */}
                  {isLocked ? (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted shrink-0">
                      <svg className="h-3.5 w-3.5 text-muted-foreground/50" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/>
                      </svg>
                    </div>
                  ) : (
                    <svg
                      className="h-5 w-5 text-muted-foreground/50 shrink-0 group-hover:text-emerald group-hover:translate-x-0.5 transition-all"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <polyline points="9,6 15,12 9,18" />
                    </svg>
                  )}
                </div>
              </div>
            );

            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.08 }}
              >
                {isLocked ? (
                  <div className="opacity-60 pointer-events-none">
                    {cardContent}
                  </div>
                ) : (
                  <Link
                    href={
                      module.type === "practice" &&
                      allSmazzate.some((s) => s.lesson === lesson.id)
                        ? `/gioca/smazzata?lesson=${lesson.id}${course ? `&course=${course.id}` : ""}`
                        : `/lezioni/${lesson.id}/${module.id}`
                    }
                  >
                    {cardContent}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Pratica: mani collegate alla lezione (proposta a fine teoria) */}
        {lessonSmazzateCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + lesson.modules.length * 0.08 }}
            className="mt-6"
          >
            <Link
              href={`/gioca/smazzata?lesson=${lesson.id}${course ? `&course=${course.id}` : ""}`}
            >
              <div className="group card-clean card-interactive cursor-pointer rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-100 dark:border-emerald-900 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald text-white text-xl">
                    🃏
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge className="text-[12px] font-bold border-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        🃏 Pratica
                      </Badge>
                    </div>
                    <h3 className="font-bold text-foreground text-[15px]">
                      Esercitati con questa lezione
                    </h3>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      {lessonSmazzateCount}{" "}
                      {lessonSmazzateCount === 1 ? "mano pratica" : "mani pratiche"} FIGB da giocare
                    </p>
                  </div>
                  <svg
                    className="h-5 w-5 text-emerald/60 shrink-0 group-hover:text-emerald group-hover:translate-x-0.5 transition-all"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <polyline points="9,6 15,12 9,18" />
                  </svg>
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
