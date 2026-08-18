"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { levelInfo } from "@/lib/catalog";
import { useCatalog } from "@/store/use-catalog-store";
import { useT } from "@/contexts/traduzioni-provider";

interface CoursesSectionProps {
  completedModules: Record<string, boolean>;
}

export function CoursesSection({ completedModules }: CoursesSectionProps) {
  const t = useT();
  const { courses } = useCatalog();
  const availableCourses = courses.filter((c) => c.lessons.length > 0);

  if (availableCourses.length <= 1) return null; // Don't show if only Fiori

  return (
    <section className="px-4 sm:px-5 pt-4">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              {t("I Corsi FIGB")}
            </h2>
          </div>
          <Badge variant="outline" className="text-[12px] font-bold text-primary/60 border-primary/20">
            {availableCourses.length} corsi
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {availableCourses.map((course, i) => {
            let totalMods = 0;
            let doneMods = 0;
            for (const lesson of course.lessons) {
              for (const mod of lesson.modules) {
                totalMods++;
                if (completedModules[`${lesson.id}-${mod.id}`]) doneMods++;
              }
            }
            const progress = totalMods > 0 ? Math.round((doneMods / totalMods) * 100) : 0;
            const stats = { progress };
            const info = levelInfo[course.level];
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
              >
                <Link href={`/lezioni?corso=${course.id}`}>
                  <div className="btn-squishy rounded-2xl bg-card p-4 cursor-pointer border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${course.gradient} text-white font-bold text-lg`}>
                        {course.icon}
                      </div>
                      <span className={`text-[12px] font-bold px-1.5 py-0.5 rounded-full ${info.bg} ${info.color}`}>
                        {info.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {course.name.replace("Corso ", "")}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-0.5 truncate">
                      {course.lessonCount} lezioni
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${course.gradient}`}
                          style={{ width: `${stats.progress}%` }}
                        />
                      </div>
                      <span className="text-[12px] font-bold text-muted-foreground">{stats.progress}%</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
