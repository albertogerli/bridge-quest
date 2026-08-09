"use client";

import Link from "next/link";

/** Barra superiore: titolo, ora dell'ultimo aggiornamento, azioni. */
export function AdminHeader({
  lastUpdated,
  onExportCsv,
  onRefresh,
}: {
  lastUpdated: Date | null;
  onExportCsv: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-4 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              ⚙️ Admin BridgeLab
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Dashboard amministratore
              {lastUpdated && (
                <span className="ml-2 text-slate-500">
                  · aggiornato {lastUpdated.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onExportCsv}
              className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              📥 CSV
            </button>
            <button
              onClick={onRefresh}
              className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              🔄 Aggiorna
            </button>
            <Link
              href="/"
              className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              ← App
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
