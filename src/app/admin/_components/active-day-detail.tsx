"use client";

import { formatMinutes, isFullTimestamp, resolveDayUsers } from "@/lib/admin-stats";
import { PROFILE_EMOJI, type DailyActivity, type UserRow } from "../_types";

/** Tabella di dettaglio degli utenti attivi in un singolo giorno. */
export function ActiveDayDetail({
  day,
  expandedDay,
  users,
  onClose,
  onSelectUser,
}: {
  day: DailyActivity;
  expandedDay: string;
  users: UserRow[];
  onClose: () => void;
  onSelectUser: (id: string) => void;
}) {
  const dayLabel = new Date(expandedDay + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
  // Resolve full user data for active users that day
  const dayUsers = resolveDayUsers(day.activeUsers, users);

  return (
    <div className="border-t border-gray-100 pt-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 capitalize">{dayLabel}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
            {dayUsers.length} utenti
          </span>
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
        </div>
      </div>
      {dayUsers.length > 0 ? (
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-left text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-3 py-2">Utente</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">BBO</th>
                <th className="px-3 py-2 text-right">XP</th>
                <th className="px-3 py-2 text-right">Streak</th>
                <th className="px-3 py-2 text-right">Mani</th>
                <th className="px-3 py-2">ASD</th>
                <th className="px-3 py-2 text-right">Tempo</th>
                <th className="px-3 py-2">Accesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dayUsers.map((u) => (
                <tr key={u.id} className="hover:bg-blue-50/50 cursor-pointer transition-colors" onClick={() => onSelectUser(u.id)}>
                  <td className="px-3 py-2 font-semibold text-gray-900">{u.display_name || "—"}</td>
                  <td className="px-3 py-2">{PROFILE_EMOJI[u.profile_type]} {u.profile_type}</td>
                  <td className="px-3 py-2 text-gray-500">{u.bbo_username || "—"}</td>
                  <td className="px-3 py-2 text-right font-bold text-[#003DA5]">{u.xp.toLocaleString("it-IT")}</td>
                  <td className="px-3 py-2 text-right">{u.streak > 0 ? `🔥 ${u.streak}` : "—"}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{u.hands_played}</td>
                  <td className="px-3 py-2 text-gray-500 max-w-[120px] truncate" title={u.asd_name || ""}>{u.asd_name || "—"}</td>
                  <td className="px-3 py-2 text-right text-gray-600">
                    {formatMinutes(u.total_minutes || 0)}
                  </td>
                  <td className="px-3 py-2 text-gray-500">
                    {isFullTimestamp(u.login_time) ? new Date(u.login_time).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : u.login_time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-gray-400">Nessun utente attivo questo giorno</p>
      )}
    </div>
  );
}
