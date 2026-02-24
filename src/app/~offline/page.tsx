"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#003DA5]/5 to-white px-6 text-center">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#003DA5] to-[#002E7A] text-white text-4xl font-bold shadow-lg shadow-[#003DA5]/20 mb-6">
        BL
      </div>
      <div className="flex gap-2 text-3xl mb-6 opacity-60">
        <span>&#9824;</span>
        <span className="text-red-500">&#9829;</span>
        <span className="text-orange-500">&#9830;</span>
        <span className="text-emerald-600">&#9827;</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Sei offline
      </h1>
      <p className="text-gray-500 max-w-xs mb-8">
        Connettiti a Internet per continuare a giocare a Bridge LAB.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-8 py-3 rounded-2xl bg-[#003DA5] text-white font-semibold shadow-lg shadow-[#003DA5]/20 hover:shadow-xl transition-all active:scale-95"
      >
        Riprova
      </button>
    </div>
  );
}
