"use client";

import type { RefObject } from "react";
import { UserStatBox } from "./cards";
import { buildUserActivity, daysSince, isFullTimestamp, last30Days, rankBy } from "@/lib/admin-stats";
import { PROFILE_EMOJI, type LoginRecord, type UserRow } from "../_types";

/** Scheda di dettaglio di un singolo utente (modale). */
export function UserDetailModal({
  user: u,
  users,
  loginHistory,
  dialogRef,
  onClose,
  formatLastLogin,
}: {
  user: UserRow;
  users: UserRow[];
  loginHistory: LoginRecord[];
  dialogRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  formatLastLogin: (val: string | null) => string;
}) {
  // Calculate days since registration
  const daysSinceReg = daysSince(u.created_at);

  const { activeDaysLog, activeDaySet, createdDay } = buildUserActivity(u, loginHistory);

  // Find user rank by XP
  const xpRank = rankBy(users, u.id, "xp");

  // Find user rank by hands
  const handsRank = rankBy(users, u.id, "hands_played");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-dialog-title"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#003DA5] to-[#0052CC] text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                {(u.display_name || "?")[0].toUpperCase()}
              </div>
              <div>
                <h2 id="admin-user-dialog-title" className="text-xl font-bold">{u.display_name || "Anonimo"}</h2>
                <div className="flex items-center gap-3 mt-1 text-sm text-white/80">
                  <span>{PROFILE_EMOJI[u.profile_type]} {u.profile_type}</span>
                  {u.bbo_username && <span>BBO: {u.bbo_username}</span>}
                </div>
                {/* Link mailto: da qui si scrive all'utente senza passare per
                    copia-e-incolla, che è il modo tipico di sbagliare
                    destinatario. */}
                {u.email && (
                  <a
                    href={`mailto:${u.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="block mt-1 text-sm text-white/90 underline underline-offset-2 hover:text-white break-all"
                  >
                    {u.email}
                  </a>
                )}
              </div>
            </div>
            <button onClick={onClose} aria-label="Chiudi" className="text-white/70 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"><span aria-hidden="true">✕</span></button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <UserStatBox label="XP" value={u.xp.toLocaleString("it-IT")} sub={`#${xpRank} su ${users.length}`} color="text-[#003DA5]" />
            <UserStatBox label="Streak" value={u.streak > 0 ? `🔥 ${u.streak}` : "0"} sub={u.streak > 0 ? "giorni" : "—"} color="text-orange-500" />
            <UserStatBox label="Mani giocate" value={u.hands_played.toLocaleString("it-IT")} sub={`#${handsRank} su ${users.length}`} color="text-emerald-600" />
            <UserStatBox label="Tempo in app" value={(u.total_minutes || 0) >= 60 ? `${Math.floor(u.total_minutes / 60)}h ${u.total_minutes % 60}m` : `${u.total_minutes || 0}m`} sub={daysSinceReg > 0 ? `${Math.round((u.total_minutes || 0) / daysSinceReg)} min/giorno` : "—"} color="text-violet-600" />
          </div>

          {/* Info table */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Dettagli profilo</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Registrato</span>
                <span className="font-semibold text-gray-900">{new Date(u.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ultimo accesso</span>
                <span className="font-semibold text-gray-900">{formatLastLogin(u.last_login)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ASD</span>
                <span className="font-semibold text-gray-900">{u.asd_name || "Nessuno"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Marketing</span>
                <span className={`font-semibold ${u.marketing_consent === true ? "text-emerald-600" : u.marketing_consent === false ? "text-red-500" : "text-gray-400"}`}>
                  {u.marketing_consent === true ? "✅ Accettato" : u.marketing_consent === false ? "❌ Rifiutato" : "Non chiesto"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Giorni dall&apos;iscrizione</span>
                <span className="font-semibold text-gray-900">{daysSinceReg}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ID</span>
                <span className="font-mono text-[12px] text-gray-400 max-w-[160px] truncate" title={u.id}>{u.id}</span>
              </div>
            </div>
          </div>

          {/* Activity heatmap - last 30 days */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Attività ultimi 30 giorni</h3>
            <div className="flex gap-1 flex-wrap">
              {last30Days().map((d, i) => {
                const key = d.toISOString().split("T")[0];
                const wasActive = activeDaySet.has(key);
                const isToday = i === 29;
                const dayName = d.toLocaleDateString("it-IT", { weekday: "short" }).slice(0, 2);
                const dayNum = d.getDate();
                const isFirstOfWeek = d.getDay() === 1;
                return (
                  <div key={key} className={`flex flex-col items-center gap-0.5 ${isFirstOfWeek && i > 0 ? "ml-1" : ""}`} title={`${key}: ${wasActive ? "attivo" : "inattivo"}`}>
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[12px] font-bold transition-all ${
                      wasActive
                        ? "bg-emerald-500 text-white"
                        : isToday
                          ? "bg-gray-200 text-gray-500 ring-2 ring-gray-300"
                          : "bg-gray-100 text-gray-300"
                    }`}>
                      {dayNum}
                    </div>
                    {(i === 0 || isFirstOfWeek) && <span className="text-[12px] text-gray-400">{dayName}</span>}
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-3 text-[12px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /> Attivo</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100" /> Inattivo</span>
              <span className="ml-auto font-semibold">{activeDaySet.size} giorni attivi su 30</span>
            </div>
          </div>

          {/* Activity log from login_history */}
          {activeDaysLog.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Log accessi ({activeDaysLog.length} giorni)</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {activeDaysLog.map(ad => {
                  const isRegistration = ad.date === createdDay;
                  return (
                    <div key={ad.date} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-semibold text-gray-700">
                        {new Date(ad.date + "T12:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
                        {isRegistration && <span className="ml-1.5 text-[12px] font-bold text-blue-500">registrazione</span>}
                      </span>
                      <span className="text-gray-400 flex items-center gap-1.5">
                        {ad.logins.map((login, i) => {
                          if (!isFullTimestamp(login)) return <span key={i}>—</span>;
                          const t = new Date(login);
                          return <span key={i} className="bg-white rounded px-1.5 py-0.5 text-gray-600">{t.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</span>;
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
