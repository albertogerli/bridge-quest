"use client";

import type { Stats } from "../_types";

/** Grafici delle iscrizioni: per ora (oggi) e per giorno (ultimi 30). */
export function SignupCharts({ stats }: { stats: Stats | null }) {
  const maxDaily = stats ? Math.max(...stats.dailySignups.map((d) => d.count), 1) : 1;
  const maxHourly = stats ? Math.max(...stats.hourlySignups, 1) : 1;

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      {/* Hourly signups today */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          Iscrizioni per ora (oggi)
        </h2>
        <div className="flex items-end gap-[3px]" style={{ height: 120 }}>
          {stats?.hourlySignups.map((count, hour) => {
            const ratio = count / maxHourly;
            const barH = count > 0 ? Math.max(ratio * 108, 6) : 0;
            const isNow = new Date().getHours() === hour;
            return (
              <div
                key={hour}
                className="flex-1 flex flex-col items-center justify-end h-full"
                title={`${hour}:00 — ${count} iscrizioni`}
              >
                {count > 0 && (
                  <span className="text-[8px] font-bold text-gray-500 mb-0.5">{count}</span>
                )}
                <div
                  className={`w-full rounded-t transition-all ${isNow ? "bg-emerald-500" : "bg-[#003DA5]/70"}`}
                  style={{ height: barH }}
                />
                {hour % 4 === 0 && (
                  <span className="text-[9px] text-gray-400 mt-1">{hour}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 30-day trend */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          Iscrizioni ultimi 30 giorni
        </h2>
        <div className="flex items-end gap-[2px]" style={{ height: 120 }}>
          {stats?.dailySignups.map((d) => {
            const ratio = d.count / maxDaily;
            const barH = d.count > 0 ? Math.max(ratio * 108, 6) : 0;
            const isDidacta = d.date >= "2026-03-12" && d.date <= "2026-03-14";
            const isToday = d.date === new Date().toISOString().split("T")[0];
            return (
              <div
                key={d.date}
                className="flex-1 flex flex-col items-center justify-end h-full"
                title={`${d.date}: ${d.count} iscrizioni`}
              >
                {d.count > 0 && ratio >= 0.5 && (
                  <span className="text-[7px] font-bold text-gray-500 mb-0.5">{d.count}</span>
                )}
                <div
                  className={`w-full rounded-t transition-all ${isToday ? "bg-emerald-500" : isDidacta ? "bg-amber-400" : "bg-[#003DA5]/60"}`}
                  style={{ height: barH }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-gray-400">{stats?.dailySignups[0]?.date.slice(5)}</span>
          <span className="text-[9px] text-gray-400">oggi</span>
        </div>
      </div>
    </div>
  );
}
