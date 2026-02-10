"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

const ADMIN_EMAIL = "alberto@albertogerli.it";

interface UserRow {
  id: string;
  display_name: string | null;
  bbo_username: string | null;
  profile_type: "giovane" | "adulto" | "senior";
  xp: number;
  streak: number;
  hands_played: number;
  asd_id: number | null;
  created_at: string;
  last_login: string | null;
}

interface Stats {
  total: number;
  today: number;
  week: number;
  byType: Record<string, number>;
  totalXp: number;
  totalHands: number;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, bbo_username, profile_type, xp, streak, hands_played, asd_id, created_at, last_login")
      .order("created_at", { ascending: false });

    if (profiles) {
      setUsers(profiles as UserRow[]);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const byType: Record<string, number> = {};
      let totalXp = 0;
      let totalHands = 0;
      let today = 0;
      let week = 0;

      for (const u of profiles) {
        byType[u.profile_type] = (byType[u.profile_type] || 0) + 1;
        totalXp += u.xp || 0;
        totalHands += u.hands_played || 0;
        if (u.created_at >= todayStart) today++;
        if (u.created_at >= weekStart) week++;
      }

      setStats({
        total: profiles.length,
        today,
        week,
        byType,
        totalXp,
        totalHands,
      });
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user, fetchData]);

  // Auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Accesso negato</h1>
          <p className="text-gray-500 mb-6">Questa pagina e riservata agli amministratori.</p>
          <Link href="/" className="text-emerald-600 font-bold hover:underline">
            Torna alla home
          </Link>
        </div>
      </div>
    );
  }

  const filteredUsers = search.trim()
    ? users.filter(
        (u) =>
          u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
          u.bbo_username?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const profileEmoji: Record<string, string> = {
    giovane: "🎮",
    adulto: "🃏",
    senior: "🏆",
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m fa`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h fa`;
    const days = Math.floor(hours / 24);
    return `${days}g fa`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold flex items-center gap-2">
                ⚙️ Admin BridgeQuest
              </h1>
              <p className="text-slate-400 text-sm mt-1">Dashboard amministratore</p>
            </div>
            <Link
              href="/"
              className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              ← App
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Utenti totali" value={stats?.total ?? 0} icon="👥" color="bg-blue-500" />
              <StatCard label="Oggi" value={stats?.today ?? 0} icon="📅" color="bg-emerald-500" />
              <StatCard label="Ultimi 7 giorni" value={stats?.week ?? 0} icon="📈" color="bg-purple-500" />
              <StatCard label="Mani giocate" value={stats?.totalHands ?? 0} icon="🃏" color="bg-amber-500" />
            </div>

            {/* Profile type breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                Per tipo profilo
              </h2>
              <div className="flex gap-6">
                {["giovane", "adulto", "senior"].map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <span className="text-2xl">{profileEmoji[type]}</span>
                    <div>
                      <div className="text-xl font-extrabold text-gray-900">
                        {stats?.byType[type] || 0}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">{type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* XP total */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                XP totale piattaforma
              </h2>
              <div className="text-3xl font-extrabold text-emerald-600">
                {(stats?.totalXp ?? 0).toLocaleString("it-IT")} XP
              </div>
            </div>

            {/* Users table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-gray-900">
                  Utenti ({filteredUsers.length})
                </h2>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cerca utente..."
                  className="w-60 h-10 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-3">Utente</th>
                      <th className="px-5 py-3">Tipo</th>
                      <th className="px-5 py-3">BBO</th>
                      <th className="px-5 py-3 text-right">XP</th>
                      <th className="px-5 py-3 text-right">Streak</th>
                      <th className="px-5 py-3 text-right">Mani</th>
                      <th className="px-5 py-3">Registrato</th>
                      <th className="px-5 py-3">Ultimo accesso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-semibold text-gray-900">
                          {u.display_name || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1">
                            {profileEmoji[u.profile_type]}
                            <span className="capitalize text-gray-600">{u.profile_type}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500">
                          {u.bbo_username || "—"}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-emerald-600">
                          {u.xp.toLocaleString("it-IT")}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {u.streak > 0 ? `🔥 ${u.streak}` : "—"}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-600">
                          {u.hands_played}
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">
                          {new Date(u.created_at).toLocaleDateString("it-IT")}
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">
                          {u.last_login ? timeAgo(u.last_login) : "Mai"}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-5 py-10 text-center text-gray-400">
                          {search ? "Nessun utente trovato" : "Nessun utente registrato"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
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
      <div className="text-3xl font-extrabold text-gray-900">{value.toLocaleString("it-IT")}</div>
    </div>
  );
}
