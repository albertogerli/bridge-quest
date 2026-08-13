"use client";

import type { Stats } from "../_types";

/** Segmentazione utenti per presenza di username BBO e associazione ASD. */
export function BboAsdSegmentation({ stats }: { stats: Stats | null }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
        Segmentazione BBO / Associazione
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
          <div className="text-[12px] font-bold text-emerald-600 uppercase tracking-wider">BBO + ASD</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {stats?.bboWithAsd ?? 0}
          </div>
          <div className="text-[12px] text-emerald-600/70 mt-0.5 font-semibold">
            {stats && stats.total > 0 ? Math.round(((stats.bboWithAsd) / stats.total) * 100) : 0}% del totale
          </div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <div className="text-[12px] font-bold text-amber-600 uppercase tracking-wider">BBO senza ASD</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">
            {stats?.bboWithoutAsd ?? 0}
          </div>
          <div className="text-[12px] text-amber-600/70 mt-0.5 font-semibold">
            {stats && stats.total > 0 ? Math.round(((stats.bboWithoutAsd) / stats.total) * 100) : 0}% del totale
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="text-[12px] font-bold text-blue-600 uppercase tracking-wider">ASD senza BBO</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {stats?.asdWithoutBbo ?? 0}
          </div>
          <div className="text-[12px] text-blue-600/70 mt-0.5 font-semibold">
            {stats && stats.total > 0 ? Math.round(((stats.asdWithoutBbo) / stats.total) * 100) : 0}% del totale
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <div className="text-[12px] font-bold text-red-600 uppercase tracking-wider">No BBO, no ASD</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {stats?.noBboNoAsd ?? 0}
          </div>
          <div className="text-[12px] text-red-600/70 mt-0.5 font-semibold">
            {stats && stats.total > 0 ? Math.round(((stats.noBboNoAsd) / stats.total) * 100) : 0}% del totale
          </div>
        </div>
      </div>
      {/* Visual bar */}
      {stats && stats.total > 0 && (
        <div className="mt-4 flex rounded-full overflow-hidden h-4">
          <div className="bg-emerald-500 transition-all" style={{ width: `${(stats.bboWithAsd / stats.total) * 100}%` }} title={`BBO + ASD: ${stats.bboWithAsd}`} />
          <div className="bg-amber-400 transition-all" style={{ width: `${(stats.bboWithoutAsd / stats.total) * 100}%` }} title={`BBO senza ASD: ${stats.bboWithoutAsd}`} />
          <div className="bg-blue-400 transition-all" style={{ width: `${(stats.asdWithoutBbo / stats.total) * 100}%` }} title={`ASD senza BBO: ${stats.asdWithoutBbo}`} />
          <div className="bg-red-400 transition-all" style={{ width: `${(stats.noBboNoAsd / stats.total) * 100}%` }} title={`No BBO, no ASD: ${stats.noBboNoAsd}`} />
        </div>
      )}
    </div>
  );
}
