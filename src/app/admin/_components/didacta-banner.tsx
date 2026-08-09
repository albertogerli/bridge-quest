"use client";

import { MiniCard } from "./cards";
import type { Stats, UserRow } from "../_types";

/** Contatore live mostrato solo durante DIDACTA 2026. */
export function DidactaBanner({ stats, users }: { stats: Stats | null; users: UserRow[] }) {
  return (
    <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-400/60 rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping" />
        </div>
        <h2 className="text-lg font-black text-amber-900">DIDACTA 2026 LIVE</h2>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-700">
          Firenze
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-4">
        <MiniCard label="Iscritti oggi" value={stats?.today ?? 0} color="text-emerald-600" />
        <MiniCard label="Attivi ora" value={stats?.activeToday ?? 0} color="text-blue-600" />
        <MiniCard label="Nuovi 3 giorni" value={
          users.filter(u => new Date(u.created_at) >= new Date("2026-03-12")).length
        } color="text-amber-700" />
      </div>
    </div>
  );
}
