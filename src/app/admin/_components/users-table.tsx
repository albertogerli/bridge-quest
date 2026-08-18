"use client";

import { formatMinutes } from "@/lib/admin-stats";
import { PROFILE_EMOJI, type SortDir, type SortKey, type UserRow } from "../_types";
import { useT } from "@/contexts/traduzioni-provider";

/** Tabella utenti con ricerca e ordinamento per colonna. */
export function UsersTable({
  users,
  search,
  onSearchChange,
  sortKey,
  sortDir,
  onSort,
  onSelectUser,
  formatLastLogin,
}: {
  users: UserRow[];
  search: string;
  onSearchChange: (value: string) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onSelectUser: (id: string) => void;
  formatLastLogin: (val: string | null) => string;
}) {
  const t = useT();
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Utenti ({users.length})
        </h2>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("Cerca per nome, BBO o email...")}
          className="w-60 h-10 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#003DA5]"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
              <SortTh label="Utente" field="display_name" current={sortKey} dir={sortDir} onClick={onSort} />
              <SortTh label="Tipo" field="profile_type" current={sortKey} dir={sortDir} onClick={onSort} />
              <th className="px-5 py-3">BBO</th>
              <SortTh label="XP" field="xp" current={sortKey} dir={sortDir} onClick={onSort} align="right" />
              <SortTh label="Streak" field="streak" current={sortKey} dir={sortDir} onClick={onSort} align="right" />
              <SortTh label="Mani" field="hands_played" current={sortKey} dir={sortDir} onClick={onSort} align="right" />
              <SortTh label="ASD" field="asd" current={sortKey} dir={sortDir} onClick={onSort} />
              <SortTh label="Tempo" field="total_minutes" current={sortKey} dir={sortDir} onClick={onSort} align="right" />
              <SortTh label="Registrato" field="created_at" current={sortKey} dir={sortDir} onClick={onSort} />
              <SortTh label="Ultimo accesso" field="last_login" current={sortKey} dir={sortDir} onClick={onSort} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-blue-50/50 transition-colors cursor-pointer" onClick={() => onSelectUser(u.id)}>
                {/* L'email sta sotto il nome invece che in una colonna sua:
                    la tabella ha già dieci colonne e un indirizzo è lungo. */}
                <td className="px-5 py-3 font-semibold text-gray-900">
                  <span className="hover:text-[#003DA5] hover:underline">{u.display_name || "—"}</span>
                  {u.email && (
                    <span className="block font-normal text-xs text-gray-400 truncate max-w-[15rem]" title={u.email}>
                      {u.email}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1">
                    {PROFILE_EMOJI[u.profile_type] || "❓"}
                    <span className="capitalize text-gray-600">{u.profile_type}</span>
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500">
                  {u.bbo_username || "—"}
                </td>
                <td className="px-5 py-3 text-right font-bold text-[#003DA5]">
                  {u.xp.toLocaleString("it-IT")}
                </td>
                <td className="px-5 py-3 text-right">
                  {u.streak > 0 ? `🔥 ${u.streak}` : "—"}
                </td>
                <td className="px-5 py-3 text-right text-gray-600">
                  {u.hands_played}
                </td>
                <td className="px-5 py-3 text-gray-500 text-xs">
                  {u.asd_name || "—"}
                </td>
                <td className="px-5 py-3 text-right text-gray-600 text-xs">
                  {formatMinutes(u.total_minutes || 0)}
                </td>
                <td className="px-5 py-3 text-gray-500 text-xs">
                  {new Date(u.created_at).toLocaleDateString("it-IT")}
                </td>
                <td className="px-5 py-3 text-gray-500 text-xs">
                  {formatLastLogin(u.last_login)}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={10} className="px-5 py-10 text-center text-gray-400">
                  {search ? "Nessun utente trovato" : "Nessun utente registrato"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortTh({
  label,
  field,
  current,
  dir,
  onClick,
  align,
}: {
  label: string;
  field: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (k: SortKey) => void;
  align?: "right";
}) {
  const active = current === field;
  return (
    <th
      className={`px-5 py-3 cursor-pointer hover:text-gray-700 select-none ${align === "right" ? "text-right" : ""}`}
      onClick={() => onClick(field)}
    >
      {label}
      {active && (
        <span className="ml-1">{dir === "asc" ? "↑" : "↓"}</span>
      )}
    </th>
  );
}
