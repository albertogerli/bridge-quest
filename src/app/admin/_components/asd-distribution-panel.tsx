"use client";

import { asdMediansAreApproximate, buildAsdRows, filterAsdRows, formatMinutes } from "@/lib/admin-stats";
import type { AsdTab, Stats } from "../_types";

/** Distribuzione ASD con tab per ASD / provincia / regione. */
export function AsdDistributionPanel({
  stats,
  asdTab,
  asdSearch,
  onTabChange,
  onSearchChange,
}: {
  stats: Stats | null;
  asdTab: AsdTab;
  asdSearch: string;
  onTabChange: (tab: AsdTab) => void;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
        Distribuzione ASD
      </h2>
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-3">
        {([["asd", "Per ASD"], ["province", "Per Provincia"], ["regione", "Per Regione"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all ${
              asdTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {/* Search */}
      <input
        type="text"
        value={asdSearch}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={`Cerca ${asdTab === "asd" ? "ASD" : asdTab === "province" ? "provincia" : "regione"}...`}
        className="w-full h-8 px-3 mb-3 rounded-lg border border-gray-200 bg-gray-50 text-xs focus:outline-none focus:ring-2 focus:ring-[#003DA5]/30"
      />
      {stats && stats.asdDistribution.length > 0 ? (
        (() => {
          const dist = stats.asdDistribution;
          const q = asdSearch.toLowerCase();
          // Per provincia/regione le mediane sono ricostruite dalle mediane per
          // ASD (i dati per utente non arrivano fin qui): si dichiarano stime.
          const approx = asdMediansAreApproximate(asdTab);

          // Build aggregated data based on tab
          const rows = buildAsdRows(dist, asdTab);

          // Filter by search
          const filtered = filterAsdRows(rows, q);
          const maxCount = filtered[0]?.count || 1;
          const totalUsers = filtered.reduce((s, r) => s + r.count, 0);
          const lowEngagementCount = filtered.filter(r => r.lowEngagement).length;

          return (
            <>
              <div className="flex items-center gap-2 text-[12px] text-gray-400 mb-2">
                <span>{filtered.length} {asdTab === "asd" ? "ASD" : asdTab === "province" ? "province" : "regioni"} · {totalUsers} utenti</span>
                {approx && (
                  <span className="text-gray-400" title="Le mediane di gruppo sono ricostruite dalle mediane per ASD, non dai dati dei singoli utenti">
                    mediane stimate
                  </span>
                )}
                {lowEngagementCount > 0 && asdTab === "asd" && (
                  <span className="text-orange-500 font-semibold">{lowEngagementCount} da riattivare</span>
                )}
              </div>
              <div className="space-y-0 max-h-[500px] overflow-y-auto pr-1">
                {filtered.map((row) => (
                  <div key={row.label} className={`py-3 border-b border-gray-100 last:border-0 ${row.lowEngagement ? "bg-orange-50/50 -mx-2 px-2 rounded-lg" : ""}`}>
                    {/* Header: name + count + low engagement badge */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 break-words">{row.label}</p>
                        {row.detail && <p className="text-[12px] text-gray-400">{row.detail}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {row.lowEngagement && (
                          <span className="text-[12px] font-bold text-orange-600 bg-orange-100 rounded-full px-2 py-0.5">RIATTIVARE</span>
                        )}
                        <span className="text-sm font-bold text-[#003DA5]">{row.count}</span>
                      </div>
                    </div>

                    {/* Group stats (without top user) */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                      <span className="text-[12px] text-gray-500">
                        Mediana XP{approx ? " (stima)" : ""}: <span className="font-semibold text-gray-700">{row.restMedianXp.toLocaleString("it-IT")}</span>
                        {row.count > 1 && <span className="text-gray-400 ml-0.5">({row.count - 1} utenti)</span>}
                      </span>
                      <span className="text-[12px] text-gray-500">
                        Uso mediano{approx ? " (stima)" : ""}: <span className="font-semibold text-gray-700">{formatMinutes(row.restMedianMinutes)}</span>
                      </span>
                      {row.firstSignup && row.lastActive && (
                        <span className="text-[12px] text-gray-400">
                          {row.firstSignup} → {row.lastActive}
                        </span>
                      )}
                    </div>

                    {/* Top performer — separated */}
                    <div className="flex items-center gap-1.5 mb-1.5 pl-2 border-l-2 border-amber-300">
                      <span className="text-[12px] text-amber-700 font-semibold">{row.topUser}</span>
                      <span className="text-[12px] text-amber-500">{row.topUserXp.toLocaleString("it-IT")} XP · {formatMinutes(row.medianMinutes)}</span>
                    </div>

                    {/* Bar */}
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          row.lowEngagement ? "bg-orange-400/70" :
                          asdTab === "regione" ? "bg-emerald-500/70" : asdTab === "province" ? "bg-amber-500/70" : "bg-[#003DA5]/70"
                        }`}
                        style={{ width: `${Math.max((row.count / maxCount) * 100, 3)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          );
        })()
      ) : (
        <p className="text-sm text-gray-400">Nessun utente con ASD associato</p>
      )}
    </div>
  );
}
