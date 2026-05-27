"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { courses, levelInfo } from "@/data/courses";
import { WorldCard, type WorldSummary } from "./world-card";

// Derived world summaries from all courses (pure data, module-level).
const allWorldsData = courses.flatMap((c) => c.worlds);

const worlds: WorldSummary[] = allWorldsData.map((w) => ({
  id: w.id,
  name: w.name,
  subtitle: w.subtitle,
  icon: w.icon,
  gradient: w.gradient,
  iconBg: w.iconBg,
  chapters: w.lessons.length,
  totalModules: w.lessons.reduce((sum, l) => sum + l.modules.length, 0),
}));

function countCompletedInWorld(
  worldId: number,
  completedModules: Record<string, boolean>,
): number {
  const worldData = allWorldsData.find((wd) => wd.id === worldId);
  if (!worldData) return 0;
  let count = 0;
  for (const lesson of worldData.lessons) {
    for (const mod of lesson.modules) {
      if (completedModules[`${lesson.id}-${mod.id}`]) count++;
    }
  }
  return count;
}

function hrefForWorld(worldId: number, courseId?: string): string {
  const wd = allWorldsData.find((w) => w.id === worldId);
  const firstLessonId = wd?.lessons[0]?.id;
  if (firstLessonId != null) return `/lezioni/${firstLessonId}`;
  if (courseId) return `/lezioni?corso=${courseId}`;
  return "/lezioni";
}

interface WorldsGridProps {
  completedModules: Record<string, boolean>;
}

export function WorldsGrid({ completedModules }: WorldsGridProps) {
  const [expandedCourse, setExpandedCourse] = useState<string | null>(() => {
    // Default: expand the first course that has incomplete modules
    try {
      const completedCount = Object.keys(completedModules).length;
      for (const c of courses) {
        const cWorlds = worlds.filter((w) =>
          c.worlds.some((cw) => cw.id === w.id),
        );
        const totalMods = cWorlds.reduce((sum, w) => sum + w.totalModules, 0);
        if (totalMods > 0 && completedCount < totalMods) return c.id;
      }
    } catch {}
    return courses[0]?.id ?? null;
  });

  return (
    <section className="px-4 sm:px-5 pt-4 pb-6">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1B5E3B]/10">
              <BookOpen className="w-4 h-4 text-[#1B5E3B]" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
              Il tuo percorso
            </h2>
          </div>
          <Link href="/lezioni">
            <Badge
              variant="outline"
              className="text-[11px] font-semibold text-[#1B5E3B] border-[#1B5E3B]/20 cursor-pointer hover:bg-[#1B5E3B]/5 transition-colors"
            >
              Vedi tutto →
            </Badge>
          </Link>
        </div>

        <div className="space-y-3">
          {courses.map((course) => {
            const courseWorlds = worlds.filter((w) =>
              course.worlds.some((cw) => cw.id === w.id),
            );
            if (courseWorlds.length === 0) return null;

            const isExpanded = expandedCourse === course.id;
            const completedWorlds = courseWorlds.filter((w) => {
              return (
                countCompletedInWorld(w.id, completedModules) ===
                w.totalModules
              );
            }).length;

            return (
              <div
                key={course.id}
                className="rounded-2xl bg-white dark:bg-[#1a1f2e] border border-[#E8E4DC] dark:border-gray-700/50 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedCourse(isExpanded ? null : course.id)
                  }
                  className="w-full flex items-center gap-2.5 p-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors text-left"
                >
                  <span className="text-lg">{course.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">
                        {course.name}
                      </h3>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${levelInfo[course.level].bg} ${levelInfo[course.level].color}`}
                      >
                        {levelInfo[course.level].label}
                      </span>
                    </div>
                    {!isExpanded && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {completedWorlds}/{courseWorlds.length} mondi completati
                      </p>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <polyline points="6,9 12,15 18,9" />
                  </svg>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-3.5 pb-3.5 space-y-2.5">
                        {courseWorlds.map((world) => (
                          <WorldCard
                            key={world.id}
                            world={world}
                            completedModules={countCompletedInWorld(
                              world.id,
                              completedModules,
                            )}
                            href={hrefForWorld(world.id, course.id)}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
