"use client";

import { StatCard } from "./cards";
import type { Stats } from "../_types";

/** Card di riepilogo: iscrizioni, attività, portale istruttori. */
export function SummaryCards({ stats }: { stats: Stats | null }) {
  return (
    <>
      {/* Stats cards - row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Utenti totali" value={stats?.total ?? 0} icon="👥" color="bg-blue-500" />
        <StatCard label="Oggi" value={stats?.today ?? 0} icon="📅" color="bg-emerald-500" />
        <StatCard label="Ultimi 7 giorni" value={stats?.week ?? 0} icon="📈" color="bg-purple-500" />
        <StatCard label="Ultimi 30 giorni" value={stats?.month ?? 0} icon="📊" color="bg-indigo-500" />
      </div>

      {/* Stats cards - row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Attivi oggi" value={stats?.activeToday ?? 0} icon="🟢" color="bg-teal-500" />
        <StatCard label="Attivi 7 giorni" value={stats?.activeWeek ?? 0} icon="📱" color="bg-cyan-500" />
        <StatCard label="Mani giocate" value={stats?.totalHands ?? 0} icon="🃏" color="bg-amber-500" />
        <StatCard label="Streak max" value={stats?.maxStreak ?? 0} icon="🔥" color="bg-red-500" />
      </div>

      {/* Scuola · Portale Istruttori */}
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Scuola · Portale Istruttori</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Istruttori" value={stats?.instructors ?? 0} icon="👨‍🏫" color="bg-rose-500" />
        <StatCard label="Classi" value={stats?.classes ?? 0} icon="🏫" color="bg-fuchsia-500" />
        <StatCard label="Allievi" value={stats?.students ?? 0} icon="🎓" color="bg-lime-600" />
      </div>
    </>
  );
}
