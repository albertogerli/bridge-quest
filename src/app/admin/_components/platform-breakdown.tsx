"use client";

import { emptyPlatformBreakdown } from "@/lib/admin-stats";
import { PLATFORM_COLOR, PLATFORM_LABEL, type Stats } from "../_types";
import { useT } from "@/contexts/traduzioni-provider";

/** Distribuzione per piattaforma: iscrizioni e accessi degli ultimi 30 giorni. */
export function PlatformBreakdown({ stats }: { stats: Stats | null }) {
  const t = useT();
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
        {t("Piattaforme")}
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        {([
          { title: "Iscrizioni (ultima piattaforma nota)", data: stats?.platformSignups, total: stats?.total ?? 0 },
          { title: "Accessi ultimi 30 giorni", data: stats?.platformLogins30d, total: Object.values(stats?.platformLogins30d ?? emptyPlatformBreakdown()).reduce((a, b) => a + b, 0) },
        ]).map(({ title, data, total }) => (
          <div key={title}>
            <div className="text-xs text-gray-500 mb-2">{title} — {total}</div>
            <div className="space-y-2">
              {(["ios", "android", "pwa", "web", "unknown"] as const).map((key) => {
                const count = data?.[key] ?? 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const color = PLATFORM_COLOR[key];
                return (
                  <div key={key} className="flex items-center gap-3 text-sm">
                    <span className="w-20 text-gray-600">{PLATFORM_LABEL[key]}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="w-14 text-right font-semibold text-gray-800">{count}</span>
                    <span className="w-10 text-right text-xs text-gray-400">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
