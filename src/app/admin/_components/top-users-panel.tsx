"use client";

import type { Stats } from "../_types";

/** Classifica dei primi 10 utenti per XP. */
export function TopUsersPanel({ stats }: { stats: Stats | null }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
        Top 10 utenti per XP
      </h2>
      <div className="space-y-2">
        {stats?.topUsers.map((u, i) => (
          <div key={u.id} className="flex items-center gap-3">
            <span className={`w-6 text-center font-black ${i === 0 ? "text-amber-500 text-lg" : i === 1 ? "text-gray-400 text-base" : i === 2 ? "text-amber-700 text-base" : "text-gray-300 text-sm"}`}>
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">
                {u.display_name || "Anonimo"}
              </div>
            </div>
            <span className="text-sm font-bold text-[#003DA5]">
              {u.xp.toLocaleString("it-IT")} XP
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
