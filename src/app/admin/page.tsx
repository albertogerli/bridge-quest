"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSharedAuth } from "@/contexts/auth-provider";
import Link from "next/link";

const ADMIN_EMAIL = "alberto@albertogerli.it";

// DIDACTA dates (12-14 March 2026, CET)
const DIDACTA_START = new Date("2026-03-12T00:00:00+01:00");
const DIDACTA_END = new Date("2026-03-14T23:59:59+01:00");

interface UserRow {
  id: string;
  display_name: string | null;
  bbo_username: string | null;
  profile_type: "junior" | "giovane" | "adulto" | "senior";
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
  month: number;
  byType: Record<string, number>;
  totalXp: number;
  totalHands: number;
  activeToday: number;
  activeWeek: number;
  avgXp: number;
  avgHands: number;
  withStreak: number;
  didactaSignups: number;
  hourlyToday: number[];
  dailyLast30: { date: string; count: number; label: string }[];
  top10: UserRow[];
  byAsd: { asd: string; count: number }[];
}

export default function AdminPage() {
  const { user, loading: authLoading } = useSharedAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [authTimeout, setAuthTimeout] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sortCol, setSortCol] = useState<"xp" | "streak" | "hands_played" | "created_at" | "last_login">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, display_name, bbo_username, profile_type, xp, streak, hands_played, asd_id, created_at, last_login")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Admin fetch error:", error);
        setFetchError(`Errore DB: ${error.message}`);
        setLoading(false);
        return;
      }

      if (profiles) {
        setUsers(profiles as UserRow[]);

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const byType: Record<string, number> = {};
        let totalXp = 0;
        let totalHands = 0;
        let today = 0;
        let week = 0;
        let month = 0;
        let activeToday = 0;
        let activeWeek = 0;
        let withStreak = 0;
        let didactaSignups = 0;
        const hourlyToday = new Array(24).fill(0);
        const dailyMap: Record<string, number> = {};

        // Init last 30 days
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const key = d.toISOString().slice(0, 10);
          dailyMap[key] = 0;
        }

        for (const u of profiles) {
          byType[u.profile_type] = (byType[u.profile_type] || 0) + 1;
          totalXp += u.xp || 0;
          totalHands += u.hands_played || 0;
          if (u.streak > 0) withStreak++;

          const createdAt = new Date(u.created_at);
          if (createdAt >= todayStart) {
            today++;
            hourlyToday[createdAt.getHours()]++;
          }
          if (createdAt >= weekStart) week++;
          if (createdAt >= monthStart) month++;

          // DIDACTA signups
          if (createdAt >= DIDACTA_START && createdAt <= DIDACTA_END) {
            didactaSignups++;
          }

          // Daily chart
          const dayKey = createdAt.toISOString().slice(0, 10);
          if (dayKey in dailyMap) {
            dailyMap[dayKey]++;
          }

          // Active users — use full timestamp from last_login
          if (u.last_login) {
            const lastLogin = new Date(u.last_login);
            if (lastLogin >= todayStart) activeToday++;
            if (lastLogin >= weekStart) activeWeek++;
          }
        }

        const dailyLast30 = Object.entries(dailyMap).map(([date, count]) => {
          const d = new Date(date + "T12:00:00");
          const label = d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
          return { date, count, label };
        });

        const top10 = [...profiles].sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 10) as UserRow[];

        // ASD distribution
        const asdMap: Record<string, number> = {};
        for (const u of profiles) {
          const key = u.asd_id ? `ASD #${u.asd_id}` : "Nessun circolo";
          asdMap[key] = (asdMap[key] || 0) + 1;
        }
        const byAsd = Object.entries(asdMap)
          .map(([asd, count]) => ({ asd, count }))
          .sort((a, b) => b.count - a.count);

        const total = profiles.length;
        setStats({
          total,
          today,
          week,
          month,
          byType,
          totalXp,
          totalHands,
          activeToday,
          activeWeek,
          avgXp: total > 0 ? Math.round(totalXp / total) : 0,
          avgHands: total > 0 ? Math.round(totalHands / total) : 0,
          withStreak,
          didactaSignups,
          hourlyToday,
          dailyLast30,
          top10,
          byAsd,
        });
      }
    } catch (err) {
      console.error("Admin fetch error:", err);
      setFetchError(`Errore: ${err instanceof Error ? err.message : String(err)}`);
    }

    setLoading(false);
    setLastUpdated(new Date());
  }, [supabase]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [authLoading, user, fetchData]);

  useEffect(() => {
    if (authLoading) {
      const t = setTimeout(() => setAuthTimeout(true), 8000);
      return () => clearTimeout(t);
    }
  }, [authLoading]);

  if (authLoading && !authTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400 mt-4">Caricamento autenticazione...</p>
        </div>
      </div>
    );
  }

  if (authTimeout && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Errore di connessione</h1>
          <p className="text-gray-500 mb-4">Impossibile connettersi a Supabase. Controlla la connessione e riprova.</p>
          <Link href="/login" className="text-emerald-600 font-bold hover:underline">
            Vai al login
          </Link>
        </div>
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accesso negato</h1>
          <p className="text-gray-500 mb-6">Questa pagina è riservata agli amministratori.</p>
          <Link href="/" className="text-emerald-600 font-bold hover:underline">
            Torna alla home
          </Link>
        </div>
      </div>
    );
  }

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  const sortedUsers = useMemo(() => {
    const filtered = search.trim()
      ? users.filter(
          (u) =>
            u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
            u.bbo_username?.toLowerCase().includes(search.toLowerCase())
        )
      : users;

    return [...filtered].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;
      if (sortCol === "xp") { aVal = a.xp; bVal = b.xp; }
      else if (sortCol === "streak") { aVal = a.streak; bVal = b.streak; }
      else if (sortCol === "hands_played") { aVal = a.hands_played; bVal = b.hands_played; }
      else if (sortCol === "created_at") { aVal = a.created_at; bVal = b.created_at; }
      else if (sortCol === "last_login") { aVal = a.last_login || ""; bVal = b.last_login || ""; }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [users, search, sortCol, sortDir]);

  const profileEmoji: Record<string, string> = {
    junior: "🧒",
    giovane: "🎮",
    adulto: "🃏",
    senior: "🏆",
  };

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const timeAgo = useMemo(
    () => (date: string) => {
      const d = new Date(date);
      const diff = now - d.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "ora";
      if (mins < 60) return `${mins}m fa`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h fa`;
      const days = Math.floor(hours / 24);
      return `${days}g fa`;
    },
    [now],
  );

  const exportCSV = () => {
    const header = "Nome,BBO,Tipo,XP,Streak,Mani,ASD,Registrato,Ultimo Login\n";
    const rows = users.map((u) =>
      [
        `"${(u.display_name || "").replace(/"/g, '""')}"`,
        u.bbo_username || "",
        u.profile_type,
        u.xp,
        u.streak,
        u.hands_played,
        u.asd_id || "",
        u.created_at ? new Date(u.created_at).toLocaleString("it-IT") : "",
        u.last_login ? new Date(u.last_login).toLocaleString("it-IT") : "Mai",
      ].join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bridgelab-utenti-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isDidacta = new Date() >= DIDACTA_START && new Date() <= DIDACTA_END;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-4 py-6">
        <div className="max-w-6xl mx-auto">
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
                onClick={exportCSV}
                className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
                title="Esporta CSV"
              >
                📥 CSV
              </button>
              <button
                onClick={fetchData}
                className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
                title="Aggiorna dati"
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

      <div className="max-w-6xl mx-auto px-4 py-6">
        {fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-bold text-red-700">{fetchError}</p>
            <button
              onClick={fetchData}
              className="mt-2 text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
            >
              Riprova
            </button>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ===== DIDACTA LIVE COUNTER ===== */}
            {isDidacta && (
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 mb-8 text-white shadow-lg shadow-amber-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-black">DIDACTA 2026 LIVE</span>
                      <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
                    </div>
                    <p className="text-white/80 text-sm">Registrazioni durante la fiera (12-14 Marzo)</p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-black">{stats?.didactaSignups ?? 0}</div>
                    <div className="text-sm text-white/80 font-bold">nuovi utenti</div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard label="Utenti totali" value={stats?.total ?? 0} icon="👥" color="bg-blue-500" />
              <StatCard label="Registrati oggi" value={stats?.today ?? 0} icon="📅" color="bg-emerald-500" />
              <StatCard label="Ultimi 7 giorni" value={stats?.week ?? 0} icon="📈" color="bg-purple-500" />
              <StatCard label="Ultimi 30 giorni" value={stats?.month ?? 0} icon="📊" color="bg-indigo-500" />
            </div>

            {/* Active users + engagement */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Attivi oggi" value={stats?.activeToday ?? 0} icon="🟢" color="bg-teal-500" subtitle="ultimo login oggi" />
              <StatCard label="Attivi 7gg" value={stats?.activeWeek ?? 0} icon="📱" color="bg-cyan-500" subtitle="ultimo login 7 giorni" />
              <StatCard label="Mani giocate" value={stats?.totalHands ?? 0} icon="🃏" color="bg-amber-500" />
              <StatCard label="Con streak" value={stats?.withStreak ?? 0} icon="🔥" color="bg-orange-500" subtitle={`${stats?.total ? Math.round(((stats?.withStreak ?? 0) / stats.total) * 100) : 0}% degli utenti`} />
            </div>

            {/* Engagement metrics row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">XP totale</div>
                <div className="text-2xl font-bold text-[#1B5E3B]">{(stats?.totalXp ?? 0).toLocaleString("it-IT")}</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">XP medio/utente</div>
                <div className="text-2xl font-bold text-gray-900">{(stats?.avgXp ?? 0).toLocaleString("it-IT")}</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mani medie/utente</div>
                <div className="text-2xl font-bold text-gray-900">{stats?.avgHands ?? 0}</div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Retention 7gg</div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.total ? Math.round(((stats?.activeWeek ?? 0) / stats.total) * 100) : 0}%
                </div>
                <div className="text-[10px] text-gray-400">attivi/totali</div>
              </div>
            </div>

            {/* Profile type breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                Per tipo profilo
              </h2>
              <div className="flex gap-6 flex-wrap">
                {["junior", "giovane", "adulto", "senior"].map((type) => {
                  const count = stats?.byType[type] || 0;
                  const pct = stats?.total ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-2xl">{profileEmoji[type]}</span>
                      <div>
                        <div className="text-xl font-bold text-gray-900">{count}</div>
                        <div className="text-xs text-gray-500 capitalize">{type} ({pct}%)</div>
                      </div>
                      <div className="w-16 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-[#1B5E3B]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ===== HOURLY TODAY CHART ===== */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                Registrazioni oggi per ora
              </h2>
              <div className="flex items-end gap-1 h-32">
                {(stats?.hourlyToday ?? []).map((count, hour) => {
                  const currentHour = new Date().getHours();
                  const maxH = Math.max(...(stats?.hourlyToday ?? [1]), 1);
                  const pct = (count / maxH) * 100;
                  return (
                    <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                      {count > 0 && (
                        <span className="text-[9px] font-bold text-gray-600">{count}</span>
                      )}
                      <div
                        className={`w-full rounded-t transition-all ${
                          hour === currentHour
                            ? "bg-emerald-500"
                            : hour < currentHour
                            ? "bg-blue-400"
                            : "bg-gray-200"
                        }`}
                        style={{ height: `${Math.max(pct, count > 0 ? 8 : 2)}%` }}
                        title={`${hour}:00 — ${count} registrazioni`}
                      />
                      {hour % 3 === 0 && (
                        <span className="text-[8px] text-gray-400">{hour}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ===== DAILY 30 DAYS CHART ===== */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                Registrazioni ultimi 30 giorni
              </h2>
              <div className="flex items-end gap-[3px] h-40">
                {(stats?.dailyLast30 ?? []).map((day) => {
                  const maxD = Math.max(...(stats?.dailyLast30 ?? []).map((d) => d.count), 1);
                  const pct = (day.count / maxD) * 100;
                  const isToday = day.date === new Date().toISOString().slice(0, 10);
                  const isDidactaDay = day.date >= "2026-03-12" && day.date <= "2026-03-14";
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {day.count > 0 && (
                        <span className="text-[8px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.count}
                        </span>
                      )}
                      <div
                        className={`w-full rounded-t cursor-default transition-all ${
                          isToday
                            ? "bg-emerald-500"
                            : isDidactaDay
                            ? "bg-amber-500"
                            : "bg-blue-400"
                        } hover:opacity-80`}
                        style={{ height: `${Math.max(pct, day.count > 0 ? 4 : 1)}%` }}
                        title={`${day.label}: ${day.count} registrazioni`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[9px] text-gray-400">{stats?.dailyLast30?.[0]?.label}</span>
                <span className="text-[9px] text-gray-400">Oggi</span>
              </div>
            </div>

            {/* ===== TOP 10 + ASD SIDE BY SIDE ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Top 10 */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                  Top 10 utenti per XP
                </h2>
                <div className="space-y-2">
                  {(stats?.top10 ?? []).map((u, i) => (
                    <div key={u.id} className="flex items-center gap-3">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${
                        i === 0 ? "bg-amber-400 text-white" :
                        i === 1 ? "bg-gray-300 text-gray-700" :
                        i === 2 ? "bg-amber-700 text-white" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{u.display_name || "Anonimo"}</p>
                      </div>
                      <span className="text-xs text-gray-400">{profileEmoji[u.profile_type]}</span>
                      <span className="text-sm font-bold text-[#1B5E3B]">{u.xp.toLocaleString("it-IT")} XP</span>
                    </div>
                  ))}
                  {(stats?.top10?.length ?? 0) === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Nessun utente</p>
                  )}
                </div>
              </div>

              {/* ASD distribution */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                  Distribuzione per circolo (ASD)
                </h2>
                <div className="space-y-2">
                  {(stats?.byAsd ?? []).slice(0, 10).map((item) => {
                    const maxAsd = Math.max(...(stats?.byAsd ?? []).map((a) => a.count), 1);
                    const pct = (item.count / maxAsd) * 100;
                    return (
                      <div key={item.asd}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 font-medium truncate">{item.asd}</span>
                          <span className="text-gray-500 font-bold ml-2">{item.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-indigo-400" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {(stats?.byAsd?.length ?? 0) === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Nessun dato</p>
                  )}
                </div>
              </div>
            </div>

            {/* ===== USERS TABLE ===== */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  Utenti ({sortedUsers.length})
                </h2>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cerca utente..."
                  className="w-60 h-10 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-3">Utente</th>
                      <th className="px-5 py-3">Tipo</th>
                      <th className="px-5 py-3">BBO</th>
                      <th className="px-5 py-3 text-right cursor-pointer hover:text-gray-900 select-none" onClick={() => handleSort("xp")}>
                        XP {sortCol === "xp" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                      </th>
                      <th className="px-5 py-3 text-right cursor-pointer hover:text-gray-900 select-none" onClick={() => handleSort("streak")}>
                        Streak {sortCol === "streak" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                      </th>
                      <th className="px-5 py-3 text-right cursor-pointer hover:text-gray-900 select-none" onClick={() => handleSort("hands_played")}>
                        Mani {sortCol === "hands_played" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                      </th>
                      <th className="px-5 py-3 cursor-pointer hover:text-gray-900 select-none" onClick={() => handleSort("created_at")}>
                        Registrato {sortCol === "created_at" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                      </th>
                      <th className="px-5 py-3 cursor-pointer hover:text-gray-900 select-none" onClick={() => handleSort("last_login")}>
                        Ultimo accesso {sortCol === "last_login" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-semibold text-gray-900">
                          {u.display_name || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1">
                            {profileEmoji[u.profile_type] || "❓"}
                            <span className="capitalize text-gray-600">{u.profile_type}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500">
                          {u.bbo_username || "—"}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-[#1B5E3B]">
                          {u.xp.toLocaleString("it-IT")}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {u.streak > 0 ? `🔥 ${u.streak}` : "—"}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-600">
                          {u.hands_played}
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">
                          {new Date(u.created_at).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">
                          {u.last_login
                            ? `${timeAgo(u.last_login)} (${new Date(u.last_login).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })})`
                            : "Mai"}
                        </td>
                      </tr>
                    ))}
                    {sortedUsers.length === 0 && (
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
  subtitle,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
  subtitle?: string;
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
      {subtitle && <div className="text-[10px] text-gray-400 mt-0.5">{subtitle}</div>}
    </div>
  );
}
