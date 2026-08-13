import { motion } from "motion/react";
import Link from "next/link";

export interface WorldSummary {
  id: number;
  name: string;
  subtitle: string;
  icon: string;
  gradient: string;
  iconBg: string;
  chapters: number;
  totalModules: number;
}

interface WorldCardProps {
  world: WorldSummary;
  completedModules: number;
  href: string;
}

export function WorldCard({ world, completedModules, href }: WorldCardProps) {
  const progress = world.totalModules > 0
    ? Math.round((completedModules / world.totalModules) * 100)
    : 0;

  return (
    <Link href={href}>
      <div className="btn-squishy group relative overflow-hidden rounded-2xl bg-card transition-colors border border-border cursor-pointer">
        <div className={`absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl bg-gradient-to-b ${world.gradient}`} />

        <div className="flex items-center gap-4 p-4 pl-5">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold ${world.iconBg}`}>
            {world.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">
                {world.name}
              </h3>
              {progress === 100 && (
                <span className="text-emerald-700 dark:text-emerald-400 text-lg" aria-label="Completato">✓</span>
              )}
            </div>
            <p className="text-[13px] text-muted-foreground mt-0.5">{world.subtitle}</p>
            <div className="mt-2.5 flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${world.gradient}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ delay: 1, duration: 0.8 }}
                />
              </div>
              <span className="text-[12px] font-bold text-muted-foreground tabular-nums">
                {completedModules}/{world.totalModules}
              </span>
            </div>
          </div>

          <svg
            className="h-5 w-5 text-muted-foreground/50 shrink-0 group-hover:text-[#1B5E3B] dark:group-hover:text-emerald-400 transition-colors"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <polyline points="9,6 15,12 9,18" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
