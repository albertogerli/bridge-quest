"use client";

import type { Stats } from "../_types";
import { useT } from "@/contexts/traduzioni-provider";

/** Metriche di engagement, tempo in app e consenso marketing. */
export function EngagementMetrics({ stats }: { stats: Stats | null }) {
  const t = useT();
  return (
    <>
      {/* Engagement metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t("XP totale")}</div>
          <div className="text-2xl font-bold text-[#003DA5] mt-1">
            {(stats?.totalXp ?? 0).toLocaleString("it-IT")}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t("XP medio/utente")}</div>
          <div className="text-2xl font-bold text-[#003DA5] mt-1">
            {(stats?.avgXp ?? 0).toLocaleString("it-IT")}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t("Mani medie/utente")}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {(stats?.avgHands ?? 0).toLocaleString("it-IT")}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t("Retention 7 giorni")}</div>
          <div className="text-2xl font-bold mt-1" style={{ color: (stats?.retention7d ?? 0) >= 30 ? "#059669" : "#dc2626" }}>
            {stats?.retention7d ?? 0}%
          </div>
        </div>
      </div>

      {/* Marketing consent + Time tracking */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t("Tempo totale app")}</div>
          <div className="text-2xl font-bold text-[#003DA5] mt-1">
            {Math.round((stats?.totalMinutesAll ?? 0) / 60)}h {(stats?.totalMinutesAll ?? 0) % 60}m
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t("Tempo medio/utente")}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {stats?.avgMinutes ?? 0} min
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t("Marketing ✅/❌")}</div>
          <div className="text-2xl font-bold mt-1">
            <span className="text-emerald-600">{stats?.marketingAccepted ?? 0}</span>
            <span className="text-gray-300 mx-1">/</span>
            <span className="text-red-500">{stats?.marketingDeclined ?? 0}</span>
          </div>
          <div className="text-[12px] text-gray-400 mt-0.5">
            {stats?.marketingPending ?? 0} non chiesto
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t("Consenso %")}</div>
          <div className="text-2xl font-bold mt-1" style={{
            color: ((stats?.marketingAccepted ?? 0) + (stats?.marketingDeclined ?? 0)) > 0
              ? (stats!.marketingAccepted / (stats!.marketingAccepted + stats!.marketingDeclined) >= 0.5 ? "#059669" : "#dc2626")
              : "#6b7280"
          }}>
            {((stats?.marketingAccepted ?? 0) + (stats?.marketingDeclined ?? 0)) > 0
              ? Math.round((stats!.marketingAccepted / (stats!.marketingAccepted + stats!.marketingDeclined)) * 100)
              : 0}%
          </div>
        </div>
      </div>
    </>
  );
}
