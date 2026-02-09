"use client";

import { use, useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { getLessonById } from "@/data/courses";
import { getVideoForLesson } from "@/components/maestro-video";
import Link from "next/link";

export default function LessonDetailPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = use(params);
  const lesson = getLessonById(parseInt(lessonId));

  if (!lesson) {
    return (
      <div className="pt-10 px-5 text-center">
        <p className="text-gray-500">Lezione non trovata</p>
        <Link href="/lezioni" className="text-emerald font-bold text-sm mt-2 inline-block">
          Torna alle lezioni
        </Link>
      </div>
    );
  }

  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const cm = localStorage.getItem("bq_completed_modules");
      if (cm) setCompletedMap(JSON.parse(cm));
    } catch {}
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoMuted, setVideoMuted] = useState(true);

  const completedModules = lesson.modules.filter(
    (m) => completedMap[`${lesson.id}-${m.id}`]
  ).length;
  const totalModules = lesson.modules.length;
  const progress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
  const totalXp = lesson.modules.reduce((sum, m) => sum + m.xpReward, 0);
  const totalDuration = lesson.modules.reduce((sum, m) => sum + parseInt(m.duration), 0);
  const lessonVideo = getVideoForLesson(lesson.id);

  return (
    <div className="pt-6 px-5">
      <div className="mx-auto max-w-lg">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs text-gray-400 mb-4"
        >
          <Link href="/lezioni" className="hover:text-emerald transition-colors">
            Lezioni
          </Link>
          <span>/</span>
          <span className="text-emerald font-semibold">Lezione {lesson.id}</span>
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
              <Badge className="bg-white/20 text-white text-[10px] font-bold border-0">
                Lezione {lesson.id}
              </Badge>
              <Badge className="bg-white/10 text-white/70 text-[10px] font-bold border-0">
                {totalDuration} min
              </Badge>
            </div>
            <h1 className="text-2xl font-extrabold text-white">{lesson.title}</h1>
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

        {/* Maestro Fiori video */}
        {lessonVideo && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="card-elevated rounded-2xl bg-white overflow-hidden mb-4"
          >
            <div className="relative">
              <video
                ref={videoRef}
                src={lessonVideo}
                className="w-full aspect-square object-cover"
                autoPlay
                muted={videoMuted}
                playsInline
                loop={false}
              />
              <button
                onClick={() => {
                  setVideoMuted(!videoMuted);
                  if (videoRef.current) {
                    videoRef.current.muted = !videoMuted;
                    if (videoMuted) {
                      videoRef.current.currentTime = 0;
                      videoRef.current.play();
                    }
                  }
                }}
                className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all hover:bg-black/70 active:scale-90"
              >
                {videoMuted ? (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                  </svg>
                )}
              </button>
            </div>
            <div className="p-3 flex items-center gap-2">
              <span className="text-lg">🎓</span>
              <p className="text-sm font-bold text-gray-700">
                Il Maestro Fiori introduce la lezione
              </p>
            </div>
          </motion.div>
        )}

        {/* XP reward banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-100 p-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="font-bold text-sm text-amber-800">
                {totalXp} XP disponibili
              </p>
              <p className="text-xs text-amber-600/70">
                Completa tutti i moduli per guadagnare XP
              </p>
            </div>
          </div>
        </motion.div>

        {/* Modules */}
        <div className="space-y-3">
          {lesson.modules.map((module, index) => {
            const isCompleted = !!completedMap[`${lesson.id}-${module.id}`];

            const typeConfig = {
              theory: { label: "Teoria", color: "bg-blue-50 text-blue-600", icon: "📖" },
              exercise: { label: "Esercizio", color: "bg-purple-50 text-purple-600", icon: "✏️" },
              quiz: { label: "Quiz", color: "bg-amber-50 text-amber-600", icon: "❓" },
              practice: { label: "Pratica", color: "bg-emerald-50 text-emerald-700", icon: "🃏" },
            };

            const config = typeConfig[module.type];

            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.08 }}
              >
                <Link
                  href={
                    module.type === "practice" && lesson.smazzateIds.length > 0
                      ? `/gioca/smazzata?lesson=${lesson.id}`
                      : `/lezioni/${lesson.id}/${module.id}`
                  }
                >
                  <div className="group card-elevated rounded-2xl bg-white p-4 cursor-pointer hover:shadow-lg transition-all active:scale-[0.99]">
                    <div className="flex items-center gap-4">
                      {/* Step number */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${
                          isCompleted
                            ? "bg-emerald text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {isCompleted ? (
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        ) : (
                          <span className="text-sm font-bold">{index + 1}</span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge className={`text-[10px] font-bold border-0 ${config.color}`}>
                            {config.icon} {config.label}
                          </Badge>
                          <span className="text-[11px] text-gray-400">
                            {module.duration} min
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-[15px]">
                          {module.title}
                        </h3>
                        <p className="text-[12px] text-gray-500 mt-0.5">
                          +{module.xpReward} XP
                        </p>
                      </div>

                      {/* Arrow */}
                      <svg
                        className="h-5 w-5 text-gray-300 shrink-0 group-hover:text-emerald group-hover:translate-x-0.5 transition-all"
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
