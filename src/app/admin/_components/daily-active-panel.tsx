"use client";

import { ActiveDayDetail } from "./active-day-detail";
import type { Stats, UserRow } from "../_types";

/** Utenti attivi per giorno (ultimi 14) con dettaglio del giorno selezionato. */
export function DailyActivePanel({
  stats,
  users,
  expandedDay,
  onExpandDay,
  onSelectUser,
}: {
  stats: Stats | null;
  users: UserRow[];
  expandedDay: string | null;
  onExpandDay: (date: string | null) => void;
  onSelectUser: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
        Utenti attivi per giorno (ultimi 14 giorni)
      </h2>
      {/* Bar chart */}
      <div className="flex items-end gap-1 mb-4" style={{ height: 80 }}>
        {stats?.dailyActive && (() => {
          const reversed = [...stats.dailyActive].reverse();
          const maxActive = Math.max(...reversed.map(d => d.activeUsers.length), 1);
          return reversed.map((d) => {
            const count = d.activeUsers.length;
            const barH = count > 0 ? Math.max((count / maxActive) * 64, 6) : 0;
            const isToday = d.date === new Date().toISOString().split("T")[0];
            const isExpanded = expandedDay === d.date;
            return (
              <div
                key={d.date}
                className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer"
                onClick={() => onExpandDay(isExpanded ? null : d.date)}
                title={`${d.date}: ${count} utenti attivi`}
              >
                {count > 0 && (
                  <span className="text-[12px] font-bold text-gray-500 mb-0.5">{count}</span>
                )}
                <div
                  className={`w-full rounded-t transition-all ${isExpanded ? "bg-violet-500" : isToday ? "bg-emerald-500" : "bg-teal-500/70"}`}
                  style={{ height: barH }}
                />
                <span className="text-[12px] text-gray-400 mt-0.5">
                  {d.date.slice(8)}
                </span>
              </div>
            );
          });
        })()}
      </div>
      <div className="flex justify-between mb-3">
        <span className="text-[12px] text-gray-400">{stats?.dailyActive?.[13]?.date.slice(5)}</span>
        <span className="text-[12px] text-gray-400">oggi</span>
      </div>

      {/* Expanded day detail — full data table */}
      {expandedDay && stats?.dailyActive && (() => {
        const day = stats.dailyActive.find(d => d.date === expandedDay);
        if (!day) return null;
        return (
          <ActiveDayDetail
            day={day}
            expandedDay={expandedDay}
            users={users}
            onClose={() => onExpandDay(null)}
            onSelectUser={onSelectUser}
          />
        );
      })()}
    </div>
  );
}
