"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import {
  courses,
  getAvailableCourses,
  getCourseStats,
  levelInfo,
  type Course,
  type CourseId,
} from "@/data/courses";
import Link from "next/link";
import { Lock, Trophy, Target, Crown, Spade, Construction } from "lucide-react";

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

// Course tab colors
const courseColors: Record<CourseId, { active: string; inactive: string; border: string }> = {
  fiori: { active: "bg-emerald-500 text-white", inactive: "text-emerald-700", border: "border-emerald-200" },
  quadri: { active: "bg-orange-500 text-white", inactive: "text-orange-700", border: "border-orange-200" },
  "cuori-gioco": { active: "bg-red-500 text-white", inactive: "text-red-700", border: "border-red-200" },
  "cuori-licita": { active: "bg-rose-500 text-white", inactive: "text-rose-700", border: "border-rose-200" },
};

export default function LezioniPage() {
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});
  const [selectedCourse, setSelectedCourse] = useState<CourseId>("fiori");

  useEffect(() => {
    try {
      const cm = localStorage.getItem("bq_completed_modules");
      if (cm) setCompletedMap(JSON.parse(cm));
      const saved = localStorage.getItem("bq_selected_course");
      if (saved && courses.some((c) => c.id === saved)) {
        setSelectedCourse(saved as CourseId);
      }
    } catch {}
  }, []);

  const handleCourseChange = (id: CourseId) => {
    setSelectedCourse(id);
    try {
      localStorage.setItem("bq_selected_course", id);
    } catch {}
  };

  const availableCourses = getAvailableCourses();
  const currentCourse = courses.find((c) => c.id === selectedCourse) ?? courses[0];
  const courseWorlds = currentCourse.worlds;

  // Calculate overall progress for this course
  const { totalModules, totalCompleted, progress: overallProgress } = getCourseStats(
    currentCourse.id,
    completedMap
  );

  return (
    <div className="pt-6 px-5 pb-24">
      <div className="mx-auto max-w-lg">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2"
        >
          <h1 className="text-2xl font-bold text-gray-900">
            Il Percorso
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalCompleted}/{totalModules} moduli completati
          </p>
        </motion.div>

        {/* Course selector tabs */}
        {availableCourses.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
          >
            {availableCourses.map((course) => {
              const isActive = course.id === selectedCourse;
              const colors = courseColors[course.id];
              const stats = getCourseStats(course.id, completedMap);
              return (
                <button
                  key={course.id}
                  onClick={() => handleCourseChange(course.id)}
                  className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-[0.97] ${
                    isActive
                      ? `${colors.active} shadow-[0_3px_0_rgba(0,0,0,0.15)]`
                      : `bg-white border-2 ${colors.border} ${colors.inactive} shadow-sm`
                  }`}
                >
                  <span className="text-lg">{course.icon}</span>
                  <div className="text-left">
                    <div className="text-[13px] font-semibold leading-tight">{course.name.replace("Corso ", "")}</div>
                    <div className={`text-[10px] leading-tight ${isActive ? "text-white/70" : "text-gray-400"}`}>
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
          <span className="text-xs text-gray-400">{currentCourse.subtitle}</span>
        </motion.div>

        {/* Dispense link */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.09 }}
          className="mb-4"
        >
          <Link href="/dispense">
            <div className="card-clean rounded-2xl bg-gradient-to-r from-[#003DA5]/5 to-[#003DA5]/10 border border-[#003DA5]/15 p-3.5 flex items-center gap-3 hover:shadow-md transition-all active:scale-[0.99] cursor-pointer">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#003DA5]/10">
                <svg className="h-5 w-5 text-[#003DA5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">Dispense & Infografiche</p>
                <p className="text-[11px] text-gray-500">Scarica il materiale didattico</p>
              </div>
              <svg className="h-5 w-5 text-gray-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
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
            <div className="flex-1 h-4 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${currentCourse.gradient}`}
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ delay: 0.3, duration: 0.8 }}
              />
            </div>
            <span className="text-sm font-bold text-gray-600">{overallProgress}%</span>
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
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              In arrivo!
            </h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              Il {currentCourse.name} sara disponibile presto. Intanto continua con il Corso Fiori!
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
              <div className="absolute left-[39px] top-8 bottom-8 w-1.5 bg-[#e5e7eb] rounded-full" />
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

              // Lock worlds 2+ until previous >= 50%
              let isLocked = false;
              if (worldIdx > 0) {
                const prevWorld = courseWorlds[worldIdx - 1];
                const prevTotal = prevWorld.lessons.reduce(
                  (sum, l) => sum + l.modules.length, 0
                );
                const prevCompleted = prevWorld.lessons.reduce(
                  (sum, l) =>
                    sum + l.modules.filter((m) => completedMap[`${l.id}-${m.id}`]).length,
                  0
                );
                isLocked = prevTotal > 0 && (prevCompleted / prevTotal) * 100 < 50;
              }

              return (
                <div key={world.id} className="mb-6">
                  {/* World header */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: worldIdx * 0.15 }}
                    className="flex items-center gap-3 mb-4 ml-1"
                  >
                    <div className={`flex h-[70px] w-[70px] shrink-0 items-center justify-center rounded-full text-2xl font-bold z-10 ${
                      isLocked
                        ? "bg-gray-200 text-gray-400"
                        : `bg-gradient-to-br ${world.gradient} text-white shadow-lg border-2 border-white`
                    }`}>
                      {isLocked ? <Lock className="w-6 h-6" /> : world.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className={`text-lg font-semibold ${isLocked ? "text-gray-400" : "text-gray-900"}`}>
                          {world.name}
                        </h2>
                        {worldProgress === 100 && (
                          <span className="text-emerald text-lg">✓</span>
                        )}
                      </div>
                      <p className={`text-xs ${isLocked ? "text-gray-400" : "text-gray-500"}`}>
                        {world.subtitle}
                      </p>
                      {!isLocked && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-2.5 rounded-full bg-gray-100 border border-gray-200 overflow-hidden max-w-[120px]">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${world.gradient}`}
                              style={{ width: `${worldProgress}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-gray-400">
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
                              delay: 0.2 + worldIdx * 0.15 + lessonIdx * 0.08,
                            }}
                            className={`relative ${offset}`}
                          >
                            <Link href={`/lezioni/${lesson.id}`}>
                              <div className={`group flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-[0.97] ${
                                isCurrent
                                  ? "bg-white border-2 border-emerald-300 shadow-[0_4px_0_#6ee7b7]"
                                  : isComplete
                                    ? "bg-white/60"
                                    : "bg-white/40"
                              }`}>
                                {/* Node circle */}
                                <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl z-10 transition-all ${
                                  isComplete
                                    ? `${colors.bg} text-white shadow-md border-2 border-white`
                                    : isCurrent
                                      ? `${colors.bg} text-white shadow-lg ${colors.glow} ring-4 ${colors.ring} ring-opacity-50`
                                      : "bg-gray-100 text-gray-400 border-2 border-gray-200"
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
                                        className="text-gray-200"
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
                                          : "text-gray-400 border-gray-200"
                                      }`}
                                    >
                                      Lez. {lesson.id}
                                    </Badge>
                                    {lesson.smazzateIds.length > 0 && (
                                      <span className="text-[10px] font-bold text-amber-500">
                                        {lesson.smazzateIds.length} <Spade className="w-3 h-3 inline ml-0.5" />
                                      </span>
                                    )}
                                  </div>
                                  <h3 className={`font-bold text-[15px] mt-0.5 truncate ${
                                    isCurrent ? "text-gray-900" : isComplete ? "text-gray-700" : "text-gray-500"
                                  }`}>
                                    {lesson.title}
                                  </h3>
                                  <p className="text-[12px] text-gray-400 mt-0.5 truncate">
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
                      transition={{ delay: 0.3 + worldIdx * 0.15 }}
                      className="ml-10 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 p-4 text-center"
                    >
                      <p className="text-sm text-gray-400 font-medium flex items-center justify-center gap-1.5">
                        <Lock className="w-4 h-4" /> Completa il mondo precedente al 50% per sbloccare
                      </p>
                    </motion.div>
                  )}

                  {/* World completion reward */}
                  {worldProgress === 100 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="ml-10 mt-2 flex items-center gap-2 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-xl p-3 border-2 border-amber-300 shadow-[0_3px_0_#fbbf24]"
                    >
                      <Trophy className="w-6 h-6 text-amber-700" />
                      <div>
                        <p className="text-sm font-bold text-amber-700">Mondo completato!</p>
                        <p className="text-[11px] text-amber-600/60">+200 XP bonus</p>
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
                      : "bg-gray-100 text-gray-300 border-2 border-gray-200"
                  }`}>
                    {overallProgress === 100 ? <Crown className="w-8 h-8" /> : <Target className="w-8 h-8" />}
                  </div>
                </motion.div>
                <p className="text-center text-xs text-gray-400 mt-2 font-semibold">
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
