"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSharedAuth } from "@/contexts/auth-provider";
import Link from "next/link";

const ADMIN_EMAIL = "alberto@albertogerli.it";

interface UserRow {
  id: string;
  display_name: string | null;
  bbo_username: string | null;
  profile_type: "junior" | "giovane" | "adulto" | "senior";
  xp: number;
  streak: number;
  hands_played: number;
  asd_id: number | null;
  asd_name: string | null;
  marketing_consent: boolean | null;
  total_minutes: number;
  created_at: string;
  last_login: string | null;
}

interface DailyActivity {
  date: string;
  activeUsers: { id: string; display_name: string | null; last_login: string }[];
}

interface Stats {
  total: number;
  today: number;
  week: number;
  month: number;
  activeToday: number;
  activeWeek: number;
  byType: Record<string, number>;
  totalXp: number;
  totalHands: number;
  avgXp: number;
  avgHands: number;
  retention7d: number;
  hourlySignups: number[];
  dailySignups: { date: string; count: number }[];
  dailyActive: DailyActivity[];
  topUsers: UserRow[];
  asdDistribution: { name: string; count: number }[];
  maxStreak: number;
  marketingAccepted: number;
  marketingDeclined: number;
  marketingPending: number;
  totalMinutesAll: number;
  avgMinutes: number;
}

type SortKey = "display_name" | "profile_type" | "xp" | "streak" | "hands_played" | "asd" | "total_minutes" | "created_at" | "last_login";
type SortDir = "asc" | "desc";

/** Parse last_login which can be date-only "2026-03-11" or full ISO "2026-03-11T14:32:00Z" */
function parseLogin(val: string | null): Date | null {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d;
}

function isFullTimestamp(val: string): boolean {
  return val.includes("T");
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
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, display_name, bbo_username, profile_type, xp, streak, hands_played, asd_id, asd:asd_id(name), marketing_consent, total_minutes, created_at, last_login")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Admin fetch error:", error);
        setFetchError(`Errore DB: ${error.message}`);
        setLoading(false);
        return;
      }

      if (profiles) {
        const mappedUsers: UserRow[] = profiles.map((u: any) => ({
          id: u.id,
          display_name: u.display_name,
          bbo_username: u.bbo_username,
          profile_type: u.profile_type,
          xp: u.xp,
          streak: u.streak,
          hands_played: u.hands_played,
          asd_id: u.asd_id,
          asd_name: u.asd?.name || null,
          marketing_consent: u.marketing_consent,
          total_minutes: u.total_minutes,
          created_at: u.created_at,
          last_login: u.last_login,
        }));
        setUsers(mappedUsers);

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
        let maxStreak = 0;
        let marketingAccepted = 0;
        let marketingDeclined = 0;
        let marketingPending = 0;
        let totalMinutesAll = 0;
        const hourlySignups = new Array(24).fill(0);
        const dailyMap = new Map<string, number>();
        const asdMap = new Map<string, number>();

        for (const u of profiles) {
          const created = new Date(u.created_at);
          byType[u.profile_type] = (byType[u.profile_type] || 0) + 1;
          totalXp += u.xp || 0;
          totalHands += u.hands_played || 0;
          if (u.streak > maxStreak) maxStreak = u.streak;
          totalMinutesAll += u.total_minutes || 0;
          if (u.marketing_consent === true) marketingAccepted++;
          else if (u.marketing_consent === false) marketingDeclined++;
          else marketingPending++;

          if (created >= todayStart) {
            today++;
            hourlySignups[created.getHours()]++;
          }
          if (created >= weekStart) week++;
          if (created >= monthStart) month++;

          // Active users (based on last_login)
          const login = parseLogin(u.last_login);
          if (login) {
            if (login >= todayStart) activeToday++;
            if (login >= weekStart) activeWeek++;
          }

          // Daily signups for last 30 days
          if (created >= monthStart) {
            const dayKey = created.toISOString().split("T")[0];
            dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + 1);
          }

          // ASD distribution
          const asdName = (u as any).asd?.name;
          if (asdName) {
            asdMap.set(asdName, (asdMap.get(asdName) || 0) + 1);
          }
        }

        // Build 30-day daily array
        const dailySignups: { date: string; count: number }[] = [];
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const key = d.toISOString().split("T")[0];
          dailySignups.push({ date: key, count: dailyMap.get(key) || 0 });
        }

        // Daily active users (last 14 days)
        const dailyActiveMap = new Map<string, { id: string; display_name: string | null; last_login: string }[]>();
        for (let i = 0; i < 14; i++) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const key = d.toISOString().split("T")[0];
          dailyActiveMap.set(key, []);
        }
        for (const u of profiles) {
          const login = parseLogin(u.last_login);
          if (login) {
            const loginDay = login.toISOString().split("T")[0];
            if (dailyActiveMap.has(loginDay)) {
              dailyActiveMap.get(loginDay)!.push({
                id: u.id,
                display_name: u.display_name,
                last_login: u.last_login!,
              });
            }
          }
        }
        const dailyActive: DailyActivity[] = [];
        for (let i = 0; i < 14; i++) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const key = d.toISOString().split("T")[0];
          dailyActive.push({ date: key, activeUsers: dailyActiveMap.get(key) || [] });
        }

        // Top 10 users by XP
        const topUsers = [...mappedUsers]
          .sort((a, b) => (b.xp || 0) - (a.xp || 0))
          .slice(0, 10);

        // ASD distribution sorted by count
        const asdDistribution = [...asdMap.entries()]
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        // Retention: users registered 7+ days ago who logged in last 7 days
        const registeredBefore7d = profiles.filter(
          (u) => new Date(u.created_at) < weekStart
        );
        const retainedCount = registeredBefore7d.filter((u) => {
          const login = parseLogin(u.last_login);
          return login && login >= weekStart;
        }).length;
        const retention7d =
          registeredBefore7d.length > 0
            ? Math.round((retainedCount / registeredBefore7d.length) * 100)
            : 0;

        setStats({
          total: profiles.length,
          today,
          week,
          month,
          activeToday,
          activeWeek,
          byType,
          totalXp,
          totalHands,
          avgXp: profiles.length > 0 ? Math.round(totalXp / profiles.length) : 0,
          avgHands: profiles.length > 0 ? Math.round(totalHands / profiles.length) : 0,
          retention7d,
          hourlySignups,
          dailySignups,
          dailyActive,
          topUsers,
          asdDistribution,
          maxStreak,
          marketingAccepted,
          marketingDeclined,
          marketingPending,
          totalMinutesAll,
          avgMinutes: profiles.length > 0 ? Math.round(totalMinutesAll / profiles.length) : 0,
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

  // Stable clock for timeAgo
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const formatLastLogin = useMemo(
    () => (val: string | null) => {
      if (!val) return "Mai";
      const d = parseLogin(val);
      if (!d) return "—";

      if (!isFullTimestamp(val)) {
        return d.toLocaleDateString("it-IT");
      }

      const diff = now - d.getTime();
      const mins = Math.floor(diff / 60000);
      const time = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

      if (mins < 1) return `Ora (${time})`;
      if (mins < 60) return `${mins}m fa (${time})`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h fa (${time})`;
      const days = Math.floor(hours / 24);
      return `${days}g fa (${time})`;
    },
    [now],
  );

  // Auth guards
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
          <div className="text-6xl mb-4">&#9888;&#65039;</div>
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
          <div className="text-6xl mb-4">&#128274;</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accesso negato</h1>
          <p className="text-gray-500 mb-6">Questa pagina è riservata agli amministratori.</p>
          <Link href="/" className="text-emerald-600 font-bold hover:underline">
            Torna alla home
          </Link>
        </div>
      </div>
    );
  }

  // Sorting
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "xp" || key === "hands_played" || key === "streak" || key === "total_minutes" ? "desc" : "asc");
    }
  };

  const filteredUsers = search.trim()
    ? users.filter(
        (u) =>
          u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
          u.bbo_username?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "asd") {
      const av = a.asd_name;
      const bv = b.asd_name;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return av.localeCompare(bv) * dir;
    }
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });

  const profileEmoji: Record<string, string> = {
    junior: "🧒",
    giovane: "🎮",
    adulto: "🃏",
    senior: "🏆",
  };

  // CSV export
  const exportCsv = () => {
    const header = "Nome,BBO,Tipo,XP,Streak,Mani,Tempo(min),ASD,Marketing,Registrato,Ultimo accesso\n";
    const rows = users.map((u) =>
      [
        u.display_name || "",
        u.bbo_username || "",
        u.profile_type,
        u.xp,
        u.streak,
        u.hands_played,
        u.total_minutes || 0,
        u.asd_name || "",
        u.marketing_consent === true ? "Sì" : u.marketing_consent === false ? "No" : "—",
        new Date(u.created_at).toLocaleDateString("it-IT"),
        u.last_login || "Mai",
      ].join(",")
    );
    const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bridgelab-utenti-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // DIDACTA date check
  const isDidactaPeriod = (() => {
    const n = new Date();
    const start = new Date("2026-03-12T00:00:00+01:00");
    const end = new Date("2026-03-14T23:59:59+01:00");
    return n >= start && n <= end;
  })();

  const maxDaily = stats ? Math.max(...stats.dailySignups.map((d) => d.count), 1) : 1;
  const maxHourly = stats ? Math.max(...stats.hourlySignups, 1) : 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                onClick={exportCsv}
                className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
              >
                📥 CSV
              </button>
              <button
                onClick={fetchData}
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

      <div className="max-w-7xl mx-auto px-4 py-6">
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
            {/* DIDACTA live counter */}
            {isDidactaPeriod && (
              <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-400/60 rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  </div>
                  <h2 className="text-lg font-black text-amber-900">DIDACTA 2026 LIVE</h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-700">
                    Firenze
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4">
                  <MiniCard label="Iscritti oggi" value={stats?.today ?? 0} color="text-emerald-600" />
                  <MiniCard label="Attivi ora" value={stats?.activeToday ?? 0} color="text-blue-600" />
                  <MiniCard label="Nuovi 3 giorni" value={
                    users.filter(u => new Date(u.created_at) >= new Date("2026-03-12")).length
                  } color="text-amber-700" />
                </div>
              </div>
            )}

            {/* Stats cards - row 1 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <StatCard label="Utenti totali" value={stats?.total ?? 0} icon="👥" color="bg-blue-500" />
              <StatCard label="Oggi" value={stats?.today ?? 0} icon="📅" color="bg-emerald-500" />
              <StatCard label="Ultimi 7 giorni" value={stats?.week ?? 0} icon="📈" color="bg-purple-500" />
              <StatCard label="Ultimi 30 giorni" value={stats?.month ?? 0} icon="📊" color="bg-indigo-500" />
            </div>

            {/* Stats cards - row 2 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Attivi oggi" value={stats?.activeToday ?? 0} icon="🟢" color="bg-teal-500" />
              <StatCard label="Attivi 7 giorni" value={stats?.activeWeek ?? 0} icon="📱" color="bg-cyan-500" />
              <StatCard label="Mani giocate" value={stats?.totalHands ?? 0} icon="🃏" color="bg-amber-500" />
              <StatCard label="Streak max" value={stats?.maxStreak ?? 0} icon="🔥" color="bg-red-500" />
            </div>

            {/* Engagement metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">XP totale</div>
                <div className="text-2xl font-bold text-[#003DA5] mt-1">
                  {(stats?.totalXp ?? 0).toLocaleString("it-IT")}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">XP medio/utente</div>
                <div className="text-2xl font-bold text-[#003DA5] mt-1">
                  {(stats?.avgXp ?? 0).toLocaleString("it-IT")}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mani medie/utente</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {(stats?.avgHands ?? 0).toLocaleString("it-IT")}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Retention 7 giorni</div>
                <div className="text-2xl font-bold mt-1" style={{ color: (stats?.retention7d ?? 0) >= 30 ? "#059669" : "#dc2626" }}>
                  {stats?.retention7d ?? 0}%
                </div>
              </div>
            </div>

            {/* Marketing consent + Time tracking */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tempo totale app</div>
                <div className="text-2xl font-bold text-[#003DA5] mt-1">
                  {Math.round((stats?.totalMinutesAll ?? 0) / 60)}h {(stats?.totalMinutesAll ?? 0) % 60}m
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tempo medio/utente</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {stats?.avgMinutes ?? 0} min
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Marketing ✅/❌</div>
                <div className="text-2xl font-bold mt-1">
                  <span className="text-emerald-600">{stats?.marketingAccepted ?? 0}</span>
                  <span className="text-gray-300 mx-1">/</span>
                  <span className="text-red-500">{stats?.marketingDeclined ?? 0}</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {stats?.marketingPending ?? 0} non chiesto
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Consenso %</div>
                <div className="text-2xl font-bold mt-1" style={{
                  color: ((stats?.marketingAccepted ?? 0) + (stats?.marketingDeclined ?? 0)) > 0
                    ? (stats!.marketingAccepted / (stats!.marketingAccepted + stats!.marketingDeclined) >= 0.5 ? "#059669" : "#dc2626")
                    : "#6b7280"
                }}>
                  {((stats?.marketingAccepted ?? 0) + (stats?.marketingDeclined ?? 0)) > 0
                    ? Math.round((stats!.marketingAccepted / (stats!.marketingAccepted + stats!.marketingDeclined)) * 100)
                    : 0}%
                </div>
              </div>
            </div>

            {/* Profile type breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                Per tipo profilo
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["junior", "giovane", "adulto", "senior"].map((type) => {
                  const count = stats?.byType[type] || 0;
                  const pct = stats && stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-2xl">{profileEmoji[type]}</span>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-gray-900">{count}</span>
                          <span className="text-xs text-gray-400">{pct}%</span>
                        </div>
                        <div className="text-xs text-gray-500 capitalize">{type}</div>
                        <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#003DA5] rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Charts row */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Hourly signups today */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                  Iscrizioni per ora (oggi)
                </h2>
                <div className="flex items-end gap-[3px]" style={{ height: 120 }}>
                  {stats?.hourlySignups.map((count, hour) => {
                    const ratio = count / maxHourly;
                    const barH = count > 0 ? Math.max(ratio * 108, 6) : 0;
                    const isNow = new Date().getHours() === hour;
                    return (
                      <div
                        key={hour}
                        className="flex-1 flex flex-col items-center justify-end h-full"
                        title={`${hour}:00 — ${count} iscrizioni`}
                      >
                        {count > 0 && (
                          <span className="text-[8px] font-bold text-gray-500 mb-0.5">{count}</span>
                        )}
                        <div
                          className={`w-full rounded-t transition-all ${isNow ? "bg-emerald-500" : "bg-[#003DA5]/70"}`}
                          style={{ height: barH }}
                        />
                        {hour % 4 === 0 && (
                          <span className="text-[9px] text-gray-400 mt-1">{hour}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 30-day trend */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                  Iscrizioni ultimi 30 giorni
                </h2>
                <div className="flex items-end gap-[2px]" style={{ height: 120 }}>
                  {stats?.dailySignups.map((d) => {
                    const ratio = d.count / maxDaily;
                    const barH = d.count > 0 ? Math.max(ratio * 108, 6) : 0;
                    const isDidacta = d.date >= "2026-03-12" && d.date <= "2026-03-14";
                    const isToday = d.date === new Date().toISOString().split("T")[0];
                    return (
                      <div
                        key={d.date}
                        className="flex-1 flex flex-col items-center justify-end h-full"
                        title={`${d.date}: ${d.count} iscrizioni`}
                      >
                        {d.count > 0 && ratio >= 0.5 && (
                          <span className="text-[7px] font-bold text-gray-500 mb-0.5">{d.count}</span>
                        )}
                        <div
                          className={`w-full rounded-t transition-all ${isToday ? "bg-emerald-500" : isDidacta ? "bg-amber-400" : "bg-[#003DA5]/60"}`}
                          style={{ height: barH }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-gray-400">{stats?.dailySignups[0]?.date.slice(5)}</span>
                  <span className="text-[9px] text-gray-400">oggi</span>
                </div>
              </div>
            </div>

            {/* Daily Active Users - last 14 days */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                Utenti attivi per giorno (ultimi 14 giorni)
              </h2>
              {/* Bar chart */}
              <div className="flex items-end gap-1 mb-4" style={{ height: 80 }}>
                {stats?.dailyActive && (() => {
                  const reversed = [...stats.dailyActive].reverse();
                  const maxActive = Math.max(...reversed.map(d => d.activeUsers.length), 1);
                  return reversed.map((d) => {
                    const count = d.activeUsers.length;
                    const barH = count > 0 ? Math.max((count / maxActive) * 64, 6) : 0;
                    const isToday = d.date === new Date().toISOString().split("T")[0];
                    const isExpanded = expandedDay === d.date;
                    return (
                      <div
                        key={d.date}
                        className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer"
                        onClick={() => setExpandedDay(isExpanded ? null : d.date)}
                        title={`${d.date}: ${count} utenti attivi`}
                      >
                        {count > 0 && (
                          <span className="text-[8px] font-bold text-gray-500 mb-0.5">{count}</span>
                        )}
                        <div
                          className={`w-full rounded-t transition-all ${isExpanded ? "bg-violet-500" : isToday ? "bg-emerald-500" : "bg-teal-500/70"}`}
                          style={{ height: barH }}
                        />
                        <span className="text-[8px] text-gray-400 mt-0.5">
                          {d.date.slice(8)}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-[9px] text-gray-400">{stats?.dailyActive?.[13]?.date.slice(5)}</span>
                <span className="text-[9px] text-gray-400">oggi</span>
              </div>

              {/* Expanded day detail — full data table */}
              {expandedDay && stats?.dailyActive && (() => {
                const day = stats.dailyActive.find(d => d.date === expandedDay);
                if (!day) return null;
                const dayLabel = new Date(expandedDay + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
                // Resolve full user data for active users that day
                const dayUsers = day.activeUsers
                  .map(au => {
                    const full = users.find(u => u.id === au.id);
                    return full ? { ...full, login_time: au.last_login } : null;
                  })
                  .filter(Boolean) as (UserRow & { login_time: string })[];
                dayUsers.sort((a, b) => new Date(b.login_time).getTime() - new Date(a.login_time).getTime());

                return (
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-900 capitalize">{dayLabel}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                          {dayUsers.length} utenti
                        </span>
                        <button onClick={() => setExpandedDay(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                      </div>
                    </div>
                    {dayUsers.length > 0 ? (
                      <div className="overflow-x-auto max-h-80 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
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
                              <tr key={u.id} className="hover:bg-blue-50/50 cursor-pointer transition-colors" onClick={() => setSelectedUserId(u.id)}>
                                <td className="px-3 py-2 font-semibold text-gray-900">{u.display_name || "—"}</td>
                                <td className="px-3 py-2">{profileEmoji[u.profile_type]} {u.profile_type}</td>
                                <td className="px-3 py-2 text-gray-500">{u.bbo_username || "—"}</td>
                                <td className="px-3 py-2 text-right font-bold text-[#003DA5]">{u.xp.toLocaleString("it-IT")}</td>
                                <td className="px-3 py-2 text-right">{u.streak > 0 ? `🔥 ${u.streak}` : "—"}</td>
                                <td className="px-3 py-2 text-right text-gray-600">{u.hands_played}</td>
                                <td className="px-3 py-2 text-gray-500 max-w-[120px] truncate" title={u.asd_name || ""}>{u.asd_name || "—"}</td>
                                <td className="px-3 py-2 text-right text-gray-600">
                                  {(u.total_minutes || 0) >= 60 ? `${Math.floor(u.total_minutes / 60)}h ${u.total_minutes % 60}m` : `${u.total_minutes || 0}m`}
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
              })()}
            </div>

            {/* Top 10 + ASD row */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Top 10 */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                  Top 10 utenti per XP
                </h2>
                <div className="space-y-2">
                  {stats?.topUsers.map((u, i) => (
                    <div key={u.id} className="flex items-center gap-3">
                      <span className={`w-6 text-center font-black ${i === 0 ? "text-amber-500 text-lg" : i === 1 ? "text-gray-400 text-base" : i === 2 ? "text-amber-700 text-base" : "text-gray-300 text-sm"}`}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {u.display_name || "Anonimo"}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-[#003DA5]">
                        {u.xp.toLocaleString("it-IT")} XP
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ASD distribution */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                  Distribuzione ASD/Circoli
                </h2>
                {stats && stats.asdDistribution.length > 0 ? (
                  <div className="space-y-2">
                    {stats.asdDistribution.slice(0, 10).map((asd) => {
                      const maxAsd = stats.asdDistribution[0]?.count || 1;
                      return (
                        <div key={asd.name} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-32 shrink-0 truncate" title={asd.name}>{asd.name}</span>
                          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#003DA5]/70 rounded-full"
                              style={{ width: `${(asd.count / maxAsd) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-8 text-right">{asd.count}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Nessun utente con ASD associato</p>
                )}
              </div>
            </div>

            {/* Users table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Utenti ({sortedUsers.length})
                </h2>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cerca utente..."
                  className="w-60 h-10 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#003DA5]"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <SortTh label="Utente" field="display_name" current={sortKey} dir={sortDir} onClick={handleSort} />
                      <SortTh label="Tipo" field="profile_type" current={sortKey} dir={sortDir} onClick={handleSort} />
                      <th className="px-5 py-3">BBO</th>
                      <SortTh label="XP" field="xp" current={sortKey} dir={sortDir} onClick={handleSort} align="right" />
                      <SortTh label="Streak" field="streak" current={sortKey} dir={sortDir} onClick={handleSort} align="right" />
                      <SortTh label="Mani" field="hands_played" current={sortKey} dir={sortDir} onClick={handleSort} align="right" />
                      <SortTh label="ASD" field="asd" current={sortKey} dir={sortDir} onClick={handleSort} />
                      <SortTh label="Tempo" field="total_minutes" current={sortKey} dir={sortDir} onClick={handleSort} align="right" />
                      <SortTh label="Registrato" field="created_at" current={sortKey} dir={sortDir} onClick={handleSort} />
                      <SortTh label="Ultimo accesso" field="last_login" current={sortKey} dir={sortDir} onClick={handleSort} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-blue-50/50 transition-colors cursor-pointer" onClick={() => setSelectedUserId(u.id)}>
                        <td className="px-5 py-3 font-semibold text-gray-900">
                          <span className="hover:text-[#003DA5] hover:underline">{u.display_name || "—"}</span>
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
                          {u.asd_name || "\u2014"}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-600 text-xs">
                          {(u.total_minutes || 0) >= 60
                            ? `${Math.floor(u.total_minutes / 60)}h ${u.total_minutes % 60}m`
                            : `${u.total_minutes || 0}m`}
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">
                          {new Date(u.created_at).toLocaleDateString("it-IT")}
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">
                          {formatLastLogin(u.last_login)}
                        </td>
                      </tr>
                    ))}
                    {sortedUsers.length === 0 && (
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
            {/* User detail modal */}
            {selectedUserId && (() => {
              const u = users.find(usr => usr.id === selectedUserId);
              if (!u) return null;

              // Calculate days since registration
              const daysSinceReg = Math.floor((Date.now() - new Date(u.created_at).getTime()) / (1000 * 60 * 60 * 24));

              // Find all days this user was active (from dailyActive data)
              const activeDays = (stats?.dailyActive ?? [])
                .filter(d => d.activeUsers.some(au => au.id === u.id))
                .map(d => ({
                  date: d.date,
                  login: d.activeUsers.find(au => au.id === u.id)!.last_login,
                }))
                .sort((a, b) => b.date.localeCompare(a.date));

              // Find user rank by XP
              const xpRank = [...users].sort((a, b) => b.xp - a.xp).findIndex(usr => usr.id === u.id) + 1;

              // Find user rank by hands
              const handsRank = [...users].sort((a, b) => b.hands_played - a.hands_played).findIndex(usr => usr.id === u.id) + 1;

              return (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedUserId(null)}>
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#003DA5] to-[#0052CC] text-white p-6 rounded-t-2xl">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                            {(u.display_name || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <h2 className="text-xl font-bold">{u.display_name || "Anonimo"}</h2>
                            <div className="flex items-center gap-3 mt-1 text-sm text-white/80">
                              <span>{profileEmoji[u.profile_type]} {u.profile_type}</span>
                              {u.bbo_username && <span>BBO: {u.bbo_username}</span>}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => setSelectedUserId(null)} className="text-white/70 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10">✕</button>
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
                            <span className="text-gray-500">ASD/Circolo</span>
                            <span className="font-semibold text-gray-900">{u.asd_name || "Nessuno"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Marketing</span>
                            <span className={`font-semibold ${u.marketing_consent === true ? "text-emerald-600" : u.marketing_consent === false ? "text-red-500" : "text-gray-400"}`}>
                              {u.marketing_consent === true ? "✅ Accettato" : u.marketing_consent === false ? "❌ Rifiutato" : "Non chiesto"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Giorni dall'iscrizione</span>
                            <span className="font-semibold text-gray-900">{daysSinceReg}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">ID</span>
                            <span className="font-mono text-[10px] text-gray-400 max-w-[160px] truncate" title={u.id}>{u.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Activity heatmap - last 14 days */}
                      <div className="mb-6">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Attività ultimi 14 giorni</h3>
                        <div className="flex gap-1.5 flex-wrap">
                          {Array.from({ length: 14 }, (_, i) => {
                            const d = new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000);
                            const key = d.toISOString().split("T")[0];
                            const wasActive = activeDays.some(ad => ad.date === key);
                            const isToday = i === 13;
                            const dayName = d.toLocaleDateString("it-IT", { weekday: "short" }).slice(0, 2);
                            const dayNum = d.getDate();
                            return (
                              <div key={key} className="flex flex-col items-center gap-0.5" title={`${key}: ${wasActive ? "attivo" : "inattivo"}`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                                  wasActive
                                    ? "bg-emerald-500 text-white"
                                    : isToday
                                      ? "bg-gray-200 text-gray-500 ring-2 ring-gray-300"
                                      : "bg-gray-100 text-gray-300"
                                }`}>
                                  {dayNum}
                                </div>
                                <span className="text-[9px] text-gray-400">{dayName}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /> Attivo</span>
                          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100" /> Inattivo</span>
                          <span className="ml-auto font-semibold">{activeDays.length} giorni attivi su 14</span>
                        </div>
                      </div>

                      {/* Activity log */}
                      {activeDays.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Log accessi</h3>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {activeDays.map(ad => (
                              <div key={ad.date} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                                <span className="font-semibold text-gray-700">
                                  {new Date(ad.date + "T12:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
                                </span>
                                <span className="text-gray-400">
                                  {isFullTimestamp(ad.login) ? new Date(ad.login).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
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
      <div className="text-3xl font-bold text-gray-900">{value.toLocaleString("it-IT")}</div>
    </div>
  );
}

function MiniCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function UserStatBox({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</div>
      <div className={`text-xl font-bold mt-1 ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>
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
