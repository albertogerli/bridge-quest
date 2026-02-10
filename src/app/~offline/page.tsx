"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-6 text-center">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-4xl font-black shadow-lg shadow-emerald-500/30 mb-6">
        BQ
      </div>
      <div className="flex gap-2 text-3xl mb-6 opacity-60">
        <span>&#9824;</span>
        <span className="text-red-500">&#9829;</span>
        <span className="text-orange-500">&#9830;</span>
        <span className="text-emerald-600">&#9827;</span>
      </div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
        Sei offline
      </h1>
      <p className="text-gray-500 max-w-xs mb-8">
        Connettiti a Internet per continuare a giocare a BridgeQuest.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-extrabold shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all active:scale-95"
      >
        Riprova
      </button>
    </div>
  );
}
