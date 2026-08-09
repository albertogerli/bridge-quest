"use client";

import { motion } from "motion/react";
import { levelInfo, type Course, type World } from "@/lib/catalog";
import { worldProgress, type CompletedModules } from "@/lib/profile-stats";

/** "Progresso per Corso": barra di avanzamento di ogni mondo, raggruppata per corso. */
export function CourseProgressSection({
  courses,
  allWorlds,
  completedModules,
}: {
  courses: Course[];
  allWorlds: World[];
  completedModules: CompletedModules;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
    >
      <h2 className="text-lg font-semibold text-foreground mb-3">
        Progresso per Corso
      </h2>
      <div className="space-y-4">
        {courses.map((course) => {
          const courseWorldsData = allWorlds.filter(w => course.worlds.some(cw => cw.id === w.id));
          if (courseWorldsData.length === 0) return null;
          return (
            <div key={course.id}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{course.icon}</span>
                <p className="text-sm font-semibold text-foreground/80">{course.name}</p>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${levelInfo[course.level].bg} ${levelInfo[course.level].color}`}>
                  {levelInfo[course.level].label}
                </span>
              </div>
              <div className="space-y-2">
                {courseWorldsData.map((w) => {
                  const { modules: wModules, completed: wCompleted, percent: wPercent } =
                    worldProgress(w, completedModules);
                  return (
                    <div key={w.id} className="rounded-xl bg-card p-3.5 border-2 border-border shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${w.iconBg}`}>
                          {w.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold text-foreground truncate">{w.name}</p>
                            <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                              {wCompleted}/{wModules}
                            </span>
                          </div>
                          <div className="h-2.5 rounded-full bg-muted border border-border overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${w.gradient}`}
                              style={{ width: `${wPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
