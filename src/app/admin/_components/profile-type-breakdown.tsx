"use client";

import { PROFILE_EMOJI, type Stats } from "../_types";
import { useT } from "@/contexts/traduzioni-provider";

/** Ripartizione degli iscritti per tipo di profilo. */
export function ProfileTypeBreakdown({ stats }: { stats: Stats | null }) {
  const t = useT();
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
        {t("Per tipo profilo")}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["junior", "giovane", "adulto", "senior"].map((type) => {
          const count = stats?.byType[type] || 0;
          const pct = stats && stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
          return (
            <div key={type} className="flex items-center gap-3">
              <span className="text-2xl">{PROFILE_EMOJI[type]}</span>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-gray-900">{count}</span>
                  <span className="text-xs text-gray-400">{pct}%</span>
                </div>
                <div className="text-xs text-gray-500 capitalize">{type}</div>
                <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#003DA5] rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
