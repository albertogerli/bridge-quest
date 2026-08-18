"use client";

import { MiniCard } from "./cards";
import { GAME_LABELS, type GameStats } from "../_types";
import { useT } from "@/contexts/traduzioni-provider";

/** Statistiche giochi (RPC admin_game_stats). */
export function GameStatsPanel({ gameStats }: { gameStats: GameStats }) {
  const t = useT();
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
        🎮 Statistiche giochi
      </h2>

      {/* Counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <MiniCard label="Partite totali" value={gameStats.totals.plays} color="text-[#003DA5]" />
        <MiniCard label="Partite oggi" value={gameStats.totals.playsToday} color="text-emerald-600" />
        <MiniCard label="Partite 7 giorni" value={gameStats.totals.plays7d} color="text-purple-600" />
        <MiniCard label="Giocatori unici" value={gameStats.totals.players} color="text-teal-600" />
        <MiniCard label="Giocatori 7 giorni" value={gameStats.totals.players7d} color="text-cyan-600" />
      </div>

      {/* 30-day plays trend */}
      <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">
        {t("Partite ultimi 30 giorni")}
      </h3>
      <div className="flex items-end gap-[2px] mb-1" style={{ height: 90 }}>
        {(() => {
          const maxPlays = Math.max(...gameStats.daily.map((d) => d.plays), 1);
          return gameStats.daily.map((d) => {
            const ratio = d.plays / maxPlays;
            const barH = d.plays > 0 ? Math.max(ratio * 78, 6) : 0;
            const isToday = d.date === new Date().toISOString().split("T")[0];
            return (
              <div
                key={d.date}
                className="flex-1 flex flex-col items-center justify-end h-full"
                title={`${d.date}: ${d.plays} partite · ${d.players} giocatori`}
              >
                {d.plays > 0 && ratio >= 0.5 && (
                  <span className="text-[12px] font-bold text-gray-500 mb-0.5">{d.plays}</span>
                )}
                <div
                  className={`w-full rounded-t transition-all ${isToday ? "bg-emerald-500" : "bg-violet-500/60"}`}
                  style={{ height: barH }}
                />
              </div>
            );
          });
        })()}
      </div>
      <div className="flex justify-between mb-6">
        <span className="text-[12px] text-gray-400">{gameStats.daily[0]?.date.slice(5)}</span>
        <span className="text-[12px] text-gray-400">oggi</span>
      </div>

      {/* Per-game breakdown */}
      <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">
        {t("Per gioco")}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-left text-[12px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-3 py-2">{t("Gioco")}</th>
              <th className="px-3 py-2 text-right">{t("Partite")}</th>
              <th className="px-3 py-2 text-right">{t("Ultimi 7 gg")}</th>
              <th className="px-3 py-2 text-right">{t("Giocatori")}</th>
              <th className="px-3 py-2 text-right">{t("Punteggio medio")}</th>
              <th className="px-3 py-2">{t("Ultima partita")}</th>
              <th className="px-3 py-2 w-1/4">{t("Quota")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(() => {
              const maxGame = Math.max(...gameStats.byGame.map((g) => g.plays), 1);
              return gameStats.byGame.map((g) => (
                <tr key={g.game} className="hover:bg-violet-50/40 transition-colors">
                  <td className="px-3 py-2 font-semibold text-gray-900">
                    {GAME_LABELS[g.game] ?? g.game}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-[#003DA5]">
                    {g.plays.toLocaleString("it-IT")}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600">
                    {g.plays7d > 0 ? g.plays7d.toLocaleString("it-IT") : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600">{g.players}</td>
                  <td className="px-3 py-2 text-right text-gray-600">
                    {g.avgScore != null ? g.avgScore.toLocaleString("it-IT") : "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{g.lastPlayed ?? "—"}</td>
                  <td className="px-3 py-2">
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-500/70"
                        style={{ width: `${Math.max((g.plays / maxGame) * 100, 2)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
