"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { levelInfo } from "@/lib/catalog";
import { useCatalog } from "@/store/use-catalog-store";
import type { Course, World } from "@/lib/catalog";
import { WorldCard, type WorldSummary } from "./world-card";

interface WorldsGridProps {
  completedModules: Record<string, boolean>;
}

export function WorldsGrid({ completedModules }: WorldsGridProps) {
  const { courses } = useCatalog();

  // Live-derived world summaries — recompute only when the catalog changes.
  const worlds = useMemo<WorldSummary[]>(
    () =>
      courses.flatMap((c) =>
        c.worlds.map((w) => ({
          id: w.id,
          name: w.name,
          subtitle: w.subtitle,
          icon: w.icon,
          gradient: w.gradient,
          iconBg: w.iconBg,
          chapters: w.lessons.length,
          totalModules: w.lessons.reduce(
            (sum, l) => sum + l.modules.length,
            0,
          ),
        })),
      ),
    [courses],
  );

  const [expandedCourse, setExpandedCourse] = useState<string | null>(() => {
    // Default: expand the first course that has incomplete modules. If the
    // catalog hasn't loaded yet, this returns null; the parent page gates
    // rendering on `catalogLoaded`, so in practice the catalog is ready
    // by the time this component mounts.
    try {
      const completedCount = Object.keys(completedModules).length;
      for (const c of courses) {
        const totalMods = c.worlds.reduce(
          (sum, w) =>
            sum + w.lessons.reduce((s, l) => s + l.modules.length, 0),
          0,
        );
        if (totalMods > 0 && completedCount < totalMods) return c.id;
      }
    } catch {}
    return courses[0]?.id ?? null;
  });

  function countCompletedInWorld(worldId: number): number {
    let count = 0;
    for (const c of courses) {
      const world = c.worlds.find((w) => w.id === worldId);
      if (!world) continue;
      for (const lesson of world.lessons) {
        for (const mod of lesson.modules) {
          if (completedModules[`${lesson.id}-${mod.id}`]) count++;
        }
      }
      break;
    }
    return count;
  }

  function hrefForWorld(worldId: number, courseId?: string): string {
    for (const c of courses) {
      const world = c.worlds.find((w) => w.id === worldId);
      if (world?.lessons[0]) return `/lezioni/${world.lessons[0].id}`;
    }
    if (courseId) return `/lezioni?corso=${courseId}`;
    return "/lezioni";
  }

  return (
    <section className="px-4 sm:px-5 pt-4 pb-6">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1B5E3B]/10 dark:bg-emerald-900/40">
              <BookOpen className="w-4 h-4 text-[#1B5E3B] dark:text-emerald-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground font-display">
              Il tuo percorso
            </h2>
          </div>
          <Link href="/lezioni">
            <Badge
              variant="outline"
              className="text-[11px] font-semibold text-[#1B5E3B] dark:text-emerald-400 border-[#1B5E3B]/20 dark:border-emerald-800 cursor-pointer hover:bg-[#1B5E3B]/5 dark:hover:bg-emerald-950/40 transition-colors"
            >
              Vedi tutto →
            </Badge>
          </Link>
        </div>

        <div className="space-y-3">
          {courses.map((course: Course) => {
            const courseWorlds: WorldSummary[] = worlds.filter((w) =>
              course.worlds.some((cw: World) => cw.id === w.id),
            );
            if (courseWorlds.length === 0) return null;

            const isExpanded = expandedCourse === course.id;
            const completedWorlds = courseWorlds.filter(
              (w) => countCompletedInWorld(w.id) === w.totalModules,
            ).length;

            return (
              <div
                key={course.id}
                className="rounded-2xl bg-card border border-border overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedCourse(isExpanded ? null : course.id)
                  }
                  className="w-full flex items-center gap-2.5 p-3.5 hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="text-lg">{course.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground/80 truncate">
                        {course.name}
                      </h3>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${levelInfo[course.level].bg} ${levelInfo[course.level].color}`}
                      >
                        {levelInfo[course.level].label}
                      </span>
                    </div>
                    {!isExpanded && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {completedWorlds}/{courseWorlds.length} mondi completati
                      </p>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
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
                            completedModules={countCompletedInWorld(world.id)}
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
