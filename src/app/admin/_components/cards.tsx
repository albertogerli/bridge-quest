"use client";

/** Primitive di presentazione condivise dalla dashboard admin. */

export function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white text-lg`}
        >
          {icon}
        </div>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value.toLocaleString("it-IT")}</div>
    </div>
  );
}

export function MiniCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

export function UserStatBox({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">{label}</div>
      <div className={`text-xl font-bold mt-1 ${color}`}>{value}</div>
      <div className="text-[12px] text-gray-400 mt-0.5">{sub}</div>
    </div>
  );
}
