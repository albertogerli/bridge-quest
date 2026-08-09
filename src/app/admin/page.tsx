"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { createClient } from "@/lib/supabase/client";
import { useSharedAuth } from "@/contexts/auth-provider";
import { useAsdClubs } from "@/store/use-asd-store";
import Link from "next/link";

const PROVINCE_TO_REGION: Record<string, string> = {
  TO:"Piemonte",VC:"Piemonte",NO:"Piemonte",CN:"Piemonte",AT:"Piemonte",AL:"Piemonte",BI:"Piemonte",VB:"Piemonte",
  AO:"Valle d'Aosta",
  VA:"Lombardia",CO:"Lombardia",SO:"Lombardia",MI:"Lombardia",BG:"Lombardia",BS:"Lombardia",PV:"Lombardia",CR:"Lombardia",MN:"Lombardia",LC:"Lombardia",LO:"Lombardia",MB:"Lombardia",
  BZ:"Trentino-Alto Adige",TN:"Trentino-Alto Adige",
  VR:"Veneto",VI:"Veneto",BL:"Veneto",TV:"Veneto",VE:"Veneto",PD:"Veneto",RO:"Veneto",
  UD:"Friuli Venezia Giulia",GO:"Friuli Venezia Giulia",TS:"Friuli Venezia Giulia",PN:"Friuli Venezia Giulia",
  IM:"Liguria",SV:"Liguria",GE:"Liguria",SP:"Liguria",
  PC:"Emilia-Romagna",PR:"Emilia-Romagna",RE:"Emilia-Romagna",MO:"Emilia-Romagna",BO:"Emilia-Romagna",FE:"Emilia-Romagna",RA:"Emilia-Romagna",FC:"Emilia-Romagna",RN:"Emilia-Romagna",
  MS:"Toscana",LU:"Toscana",PT:"Toscana",FI:"Toscana",LI:"Toscana",PI:"Toscana",AR:"Toscana",SI:"Toscana",GR:"Toscana",PO:"Toscana",
  PG:"Umbria",TR:"Umbria",
  PU:"Marche",AN:"Marche",MC:"Marche",AP:"Marche",FM:"Marche",
  VT:"Lazio",RI:"Lazio",RM:"Lazio",LT:"Lazio",FR:"Lazio",
  AQ:"Abruzzo",TE:"Abruzzo",PE:"Abruzzo",CH:"Abruzzo",
  CB:"Molise",IS:"Molise",
  CE:"Campania",BN:"Campania",NA:"Campania",AV:"Campania",SA:"Campania",
  FG:"Puglia",BA:"Puglia",TA:"Puglia",BR:"Puglia",LE:"Puglia",BT:"Puglia",
  PZ:"Basilicata",MT:"Basilicata",
  CS:"Calabria",CZ:"Calabria",KR:"Calabria",VV:"Calabria",RC:"Calabria",
  TP:"Sicilia",PA:"Sicilia",ME:"Sicilia",AG:"Sicilia",CL:"Sicilia",EN:"Sicilia",CT:"Sicilia",RG:"Sicilia",SR:"Sicilia",
  SS:"Sardegna",NU:"Sardegna",CA:"Sardegna",OR:"Sardegna",SU:"Sardegna",
};

interface UserRow {
  id: string;
  display_name: string | null;
  bbo_username: string | null;
  profile_type: "junior" | "giovane" | "adulto" | "senior";
  xp: number;
  streak: number;
  hands_played: number;
  asd_code: string | null;
  asd_name: string | null;
  marketing_consent: boolean | null;
  total_minutes: number;
  created_at: string;
  last_login: string | null;
  platform: string | null;
}

type ProfileRecord = UserRow & { role?: string | null };

interface LoginRecord {
  id: string;
  user_id: string;
  logged_in_at: string;
  platform: string | null;
}

// ── Game stats (RPC admin_game_stats, see scripts/sql/admin_game_stats.sql) ──
interface GameStatRow {
  game: string;
  plays: number;
  plays7d: number;
  players: number;
  avgScore: number | null;
  lastPlayed: string | null;
}
interface GameStats {
  totals: { plays: number; playsToday: number; plays7d: number; players: number; players7d: number };
  byGame: GameStatRow[];
  daily: { date: string; plays: number; players: number }[];
}

const GAME_LABELS: Record<string, string> = {
  "mano-del-giorno": "Mano del Giorno",
  "sfida": "Sfida amici",
  "smazzata": "Smazzate",
  "torneo": "Torneo",
  "quiz-lampo": "Quiz Lampo",
  "conta-veloce": "Conta Veloce",
  "impasse": "Impasse o Drop",
  "memory": "Memory Bridge",
  "trova-errore": "Trova l'Errore",
  "mano-guidata": "Mano Guidata",
  "dichiara": "Dichiara!",
  "pratica-licita": "Pratica Licita",
  "sfida-settimanale": "Sfida Settimanale",
  "segnali": "Segnali in Difesa",
  "compito": "Compiti classe",
};

type PlatformKey = "ios" | "android" | "pwa" | "web" | "unknown";
type PlatformBreakdown = Record<PlatformKey, number>;

function emptyPlatformBreakdown(): PlatformBreakdown {
  return { ios: 0, android: 0, pwa: 0, web: 0, unknown: 0 };
}

function bucketPlatform(p: string | null | undefined): PlatformKey {
  if (p === "ios" || p === "android" || p === "pwa" || p === "web") return p;
  return "unknown";
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
  asdDistribution: {
    name: string; count: number; province?: string; region?: string;
    medianXp: number; medianMinutes: number;
    topUser: string; topUserXp: number;
    restMedianXp: number; restMedianMinutes: number;
    firstSignup: string;
    lastActive: string;
    lowEngagement: boolean;
  }[];
  maxStreak: number;
  marketingAccepted: number;
  marketingDeclined: number;
  marketingPending: number;
  totalMinutesAll: number;
  avgMinutes: number;
  bboWithAsd: number;
  bboWithoutAsd: number;
  asdWithoutBbo: number;
  noBboNoAsd: number;
  platformSignups: PlatformBreakdown;
  platformLogins30d: PlatformBreakdown;
  instructors: number;
  classes: number;
  students: number;
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
  const { user, profile, loading: authLoading } = useSharedAuth();
  const { clubs: asdClubs } = useAsdClubs();
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
  const userDialogRef = useRef<HTMLDivElement>(null);
  const closeUserDetail = useCallback(() => setSelectedUserId(null), []);
  useFocusTrap(userDialogRef, selectedUserId !== null, { onEscape: closeUserDetail });
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [asdTab, setAsdTab] = useState<"asd" | "province" | "regione">("asd");
  const [asdSearch, setAsdSearch] = useState("");
  const [gameStats, setGameStats] = useState<GameStats | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setFetchError(null);

    try {
      let allProfiles: ProfileRecord[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, display_name, bbo_username, profile_type, xp, streak, hands_played, asd_code, asd_name, marketing_consent, total_minutes, created_at, last_login, platform, role")
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Admin fetch error:", error);
          setFetchError(`Errore DB: ${error.message}`);
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          allProfiles = allProfiles.concat(data as ProfileRecord[]);
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      const profiles = allProfiles;

      // Fetch login history (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: logins } = await supabase
        .from("login_history")
        .select("id, user_id, logged_in_at, platform")
        .gte("logged_in_at", thirtyDaysAgo)
        .order("logged_in_at", { ascending: false });
      setLoginHistory((logins as LoginRecord[]) ?? []);

      // Game stats — degrades gracefully if admin_game_stats.sql isn't installed
      try {
        const { data: gs, error: gsError } = await supabase.rpc("admin_game_stats");
        setGameStats(gsError ? null : ((gs as GameStats) ?? null));
      } catch {
        setGameStats(null);
      }

      // Instructor-portal counts: classes + distinct active students via the
      // admin-only RPC (degrades to 0 if admin_school_stats.sql isn't installed);
      // instructors counted from the profiles already loaded (role column).
      let schoolClasses = 0;
      let schoolStudents = 0;
      try {
        const { data: ss } = await supabase.rpc("admin_school_stats");
        if (ss) {
          schoolClasses = (ss as { classes?: number }).classes ?? 0;
          schoolStudents = (ss as { students?: number }).students ?? 0;
        }
      } catch {}
      const instructorsCount = profiles.filter(
        (u) => u.role === "instructor"
      ).length;

      if (profiles) {
        const mappedUsers: UserRow[] = profiles.map((u) => ({
          id: u.id,
          display_name: u.display_name,
          bbo_username: u.bbo_username,
          profile_type: u.profile_type,
          xp: u.xp,
          streak: u.streak,
          hands_played: u.hands_played,
          asd_code: u.asd_code,
          asd_name: u.asd_name || null,
          marketing_consent: u.marketing_consent,
          total_minutes: u.total_minutes,
          created_at: u.created_at,
          last_login: u.last_login,
          platform: u.platform ?? null,
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
        const asdMap = new Map<string, { users: { name: string; xp: number; minutes: number; createdAt: string }[] }>();

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

          // ASD distribution — collect individual user data
          if (u.asd_name) {
            const asdName = u.asd_name;
            const prev = asdMap.get(asdName) || { users: [] };
            prev.users.push({ name: u.display_name || "Anonimo", xp: u.xp || 0, minutes: u.total_minutes || 0, createdAt: u.created_at });
            asdMap.set(asdName, prev);
          }
        }

        // Build 30-day daily array
        const dailySignups: { date: string; count: number }[] = [];
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const key = d.toISOString().split("T")[0];
          dailySignups.push({ date: key, count: dailyMap.get(key) || 0 });
        }

        // Daily active users (last 14 days) — from login_history table
        const dailyActiveMap = new Map<string, Map<string, { id: string; display_name: string | null; last_login: string }>>();
        for (let i = 0; i < 14; i++) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const key = d.toISOString().split("T")[0];
          dailyActiveMap.set(key, new Map());
        }
        // Use login_history for accurate per-day tracking
        for (const log of (logins as LoginRecord[]) ?? []) {
          const logDate = new Date(log.logged_in_at);
          const dayKey = logDate.toISOString().split("T")[0];
          const dayMap = dailyActiveMap.get(dayKey);
          if (dayMap && !dayMap.has(log.user_id)) {
            const profile = profiles.find((p) => p.id === log.user_id);
            dayMap.set(log.user_id, {
              id: log.user_id,
              display_name: profile?.display_name ?? null,
              last_login: log.logged_in_at,
            });
          }
        }
        // Fallback: also include last_login from profiles (for days before login_history existed)
        for (const u of profiles) {
          const login = parseLogin(u.last_login);
          if (login) {
            const loginDay = login.toISOString().split("T")[0];
            const dayMap = dailyActiveMap.get(loginDay);
            if (dayMap && !dayMap.has(u.id)) {
              dayMap.set(u.id, {
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
          dailyActive.push({ date: key, activeUsers: [...(dailyActiveMap.get(key)?.values() ?? [])] });
        }

        // Top 10 users by XP
        const topUsers = [...mappedUsers]
          .sort((a, b) => (b.xp || 0) - (a.xp || 0))
          .slice(0, 10);

        // Median helper
        const median = (arr: number[]) => {
          if (arr.length === 0) return 0;
          const sorted = [...arr].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
        };

        // ASD distribution sorted by count — enrich with province/region from the catalog
        const asdClubByName = new Map(asdClubs.map(c => [c.name, c]));
        const asdDistribution = [...asdMap.entries()]
          .map(([name, data]) => {
            const club = asdClubByName.get(name);
            const province = club?.province;
            const region = province ? PROVINCE_TO_REGION[province] : undefined;
            const users = data.users;
            const count = users.length;
            const allXp = users.map(u => u.xp);
            const allMin = users.map(u => u.minutes);

            // Top user
            const topIdx = allXp.indexOf(Math.max(...allXp));
            const topUser = users[topIdx]?.name || "";
            const topUserXp = allXp[topIdx] || 0;

            // Rest (without top user) — more honest picture
            const restXp = allXp.filter((_, i) => i !== topIdx);
            const restMin = allMin.filter((_, i) => i !== topIdx);

            // Detect low engagement: median XP < 50 and last signup > 14 days ago
            const dates = users.map(u => new Date(u.createdAt).getTime());
            const firstSignup = new Date(Math.min(...dates)).toISOString().slice(0, 10);
            const lastSignup = new Date(Math.max(...dates));
            const daysSinceLastSignup = Math.floor((now.getTime() - lastSignup.getTime()) / 86400000);
            const lowEngagement = median(restXp) < 50 && daysSinceLastSignup > 14 && count >= 3;

            return {
              name, count, province, region,
              medianXp: median(allXp),
              medianMinutes: median(allMin),
              topUser, topUserXp,
              restMedianXp: median(restXp),
              restMedianMinutes: median(restMin),
              firstSignup,
              lastActive: lastSignup.toISOString().slice(0, 10),
              lowEngagement,
            };
          })
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

        // BBO / ASD segmentation
        let bboWithAsd = 0;
        let bboWithoutAsd = 0;
        let noBboNoAsd = 0;
        let asdWithoutBbo = 0;
        for (const u of profiles) {
          const hasBbo = !!u.bbo_username;
          const hasAsd = !!u.asd_name;
          if (hasBbo && hasAsd) bboWithAsd++;
          else if (hasBbo && !hasAsd) bboWithoutAsd++;
          else if (!hasBbo && hasAsd) asdWithoutBbo++;
          else noBboNoAsd++;
        }

        // Platform breakdowns
        const platformSignups = emptyPlatformBreakdown();
        for (const u of profiles) {
          platformSignups[bucketPlatform((u as { platform?: string | null }).platform)]++;
        }
        const platformLogins30d = emptyPlatformBreakdown();
        for (const log of (logins as LoginRecord[]) ?? []) {
          platformLogins30d[bucketPlatform(log.platform)]++;
        }

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
          bboWithAsd,
          bboWithoutAsd,
          asdWithoutBbo,
          noBboNoAsd,
          platformSignups,
          platformLogins30d,
          instructors: instructorsCount,
          classes: schoolClasses,
          students: schoolStudents,
        });
      }
    } catch (err) {
      console.error("Admin fetch error:", err);
      setFetchError(`Errore: ${err instanceof Error ? err.message : String(err)}`);
    }

    setLoading(false);
    setLastUpdated(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- asdClubs si popola async dallo store: includerlo rilancerebbe l'intero fetch admin a ogni load dei circoli
  }, [supabase]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData(false);
      const interval = setInterval(() => fetchData(true), 30000);
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

  // Il profilo arriva in background dopo la sessione: finché non c'è, spinner
  // (evita il flash di "Accesso negato" per l'admin legittimo).
  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Autorizzazione a ruolo (profiles.role), come /admin/classi e /admin/istruttori;
  // la protezione reale dei dati resta nelle RLS/RPC con is_admin().
  if (!user || profile?.role !== "admin") {
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

  const platformLabel: Record<PlatformKey, string> = {
    ios: "iOS",
    android: "Android",
    pwa: "PWA",
    web: "Web",
    unknown: "Non tracciato",
  };

  const platformColor: Record<PlatformKey, string> = {
    ios: "#0f172a",
    android: "#34a853",
    pwa: "#c8a44e",
    web: "#003DA5",
    unknown: "#9ca3af",
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
                onClick={() => fetchData(false)}
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
              onClick={() => fetchData(false)}
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

            {/* Scuola · Portale Istruttori */}
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Scuola · Portale Istruttori</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <StatCard label="Istruttori" value={stats?.instructors ?? 0} icon="👨‍🏫" color="bg-rose-500" />
              <StatCard label="Classi" value={stats?.classes ?? 0} icon="🏫" color="bg-fuchsia-500" />
              <StatCard label="Allievi" value={stats?.students ?? 0} icon="🎓" color="bg-lime-600" />
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

            {/* BBO / ASD segmentation */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                Segmentazione BBO / Associazione
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">BBO + ASD</div>
                  <div className="text-2xl font-bold text-emerald-700 mt-1">
                    {stats?.bboWithAsd ?? 0}
                  </div>
                  <div className="text-[10px] text-emerald-600/70 mt-0.5 font-semibold">
                    {stats && stats.total > 0 ? Math.round(((stats.bboWithAsd) / stats.total) * 100) : 0}% del totale
                  </div>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">BBO senza ASD</div>
                  <div className="text-2xl font-bold text-amber-700 mt-1">
                    {stats?.bboWithoutAsd ?? 0}
                  </div>
                  <div className="text-[10px] text-amber-600/70 mt-0.5 font-semibold">
                    {stats && stats.total > 0 ? Math.round(((stats.bboWithoutAsd) / stats.total) * 100) : 0}% del totale
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">ASD senza BBO</div>
                  <div className="text-2xl font-bold text-blue-700 mt-1">
                    {stats?.asdWithoutBbo ?? 0}
                  </div>
                  <div className="text-[10px] text-blue-600/70 mt-0.5 font-semibold">
                    {stats && stats.total > 0 ? Math.round(((stats.asdWithoutBbo) / stats.total) * 100) : 0}% del totale
                  </div>
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider">No BBO, no ASD</div>
                  <div className="text-2xl font-bold text-red-600 mt-1">
                    {stats?.noBboNoAsd ?? 0}
                  </div>
                  <div className="text-[10px] text-red-600/70 mt-0.5 font-semibold">
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

            {/* Piattaforme: iscrizioni + accessi */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                Piattaforme
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {([
                  { title: "Iscrizioni (ultima piattaforma nota)", data: stats?.platformSignups, total: stats?.total ?? 0 },
                  { title: "Accessi ultimi 30 giorni", data: stats?.platformLogins30d, total: Object.values(stats?.platformLogins30d ?? emptyPlatformBreakdown()).reduce((a, b) => a + b, 0) },
                ]).map(({ title, data, total }) => (
                  <div key={title}>
                    <div className="text-xs text-gray-500 mb-2">{title} — {total}</div>
                    <div className="space-y-2">
                      {(["ios", "android", "pwa", "web", "unknown"] as const).map((key) => {
                        const count = data?.[key] ?? 0;
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        const color = platformColor[key];
                        return (
                          <div key={key} className="flex items-center gap-3 text-sm">
                            <span className="w-20 text-gray-600">{platformLabel[key]}</span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                            </div>
                            <span className="w-14 text-right font-semibold text-gray-800">{count}</span>
                            <span className="w-10 text-right text-xs text-gray-400">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
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

            {/* Game stats (RPC admin_game_stats) */}
            {gameStats && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                  🎮 Statistiche giochi
                </h2>

                {/* Counters */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <MiniCard label="Partite totali" value={gameStats.totals.plays} color="text-[#003DA5]" />
                  <MiniCard label="Partite oggi" value={gameStats.totals.playsToday} color="text-emerald-600" />
                  <MiniCard label="Partite 7 giorni" value={gameStats.totals.plays7d} color="text-purple-600" />
                  <MiniCard label="Giocatori unici" value={gameStats.totals.players} color="text-teal-600" />
                  <MiniCard label="Giocatori 7 giorni" value={gameStats.totals.players7d} color="text-cyan-600" />
                </div>

                {/* 30-day plays trend */}
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Partite ultimi 30 giorni
                </h3>
                <div className="flex items-end gap-[2px] mb-1" style={{ height: 90 }}>
                  {(() => {
                    const maxPlays = Math.max(...gameStats.daily.map((d) => d.plays), 1);
                    return gameStats.daily.map((d) => {
                      const ratio = d.plays / maxPlays;
                      const barH = d.plays > 0 ? Math.max(ratio * 78, 6) : 0;
                      const isToday = d.date === new Date().toISOString().split("T")[0];
                      return (
                        <div
                          key={d.date}
                          className="flex-1 flex flex-col items-center justify-end h-full"
                          title={`${d.date}: ${d.plays} partite · ${d.players} giocatori`}
                        >
                          {d.plays > 0 && ratio >= 0.5 && (
                            <span className="text-[7px] font-bold text-gray-500 mb-0.5">{d.plays}</span>
                          )}
                          <div
                            className={`w-full rounded-t transition-all ${isToday ? "bg-emerald-500" : "bg-violet-500/60"}`}
                            style={{ height: barH }}
                          />
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="flex justify-between mb-6">
                  <span className="text-[9px] text-gray-400">{gameStats.daily[0]?.date.slice(5)}</span>
                  <span className="text-[9px] text-gray-400">oggi</span>
                </div>

                {/* Per-game breakdown */}
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Per gioco
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="px-3 py-2">Gioco</th>
                        <th className="px-3 py-2 text-right">Partite</th>
                        <th className="px-3 py-2 text-right">Ultimi 7 gg</th>
                        <th className="px-3 py-2 text-right">Giocatori</th>
                        <th className="px-3 py-2 text-right">Punteggio medio</th>
                        <th className="px-3 py-2">Ultima partita</th>
                        <th className="px-3 py-2 w-1/4">Quota</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(() => {
                        const maxGame = Math.max(...gameStats.byGame.map((g) => g.plays), 1);
                        return gameStats.byGame.map((g) => (
                          <tr key={g.game} className="hover:bg-violet-50/40 transition-colors">
                            <td className="px-3 py-2 font-semibold text-gray-900">
                              {GAME_LABELS[g.game] ?? g.game}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-[#003DA5]">
                              {g.plays.toLocaleString("it-IT")}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-600">
                              {g.plays7d > 0 ? g.plays7d.toLocaleString("it-IT") : "—"}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-600">{g.players}</td>
                            <td className="px-3 py-2 text-right text-gray-600">
                              {g.avgScore != null ? g.avgScore.toLocaleString("it-IT") : "—"}
                            </td>
                            <td className="px-3 py-2 text-gray-500">{g.lastPlayed ?? "—"}</td>
                            <td className="px-3 py-2">
                              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-violet-500/70"
                                  style={{ width: `${Math.max((g.plays / maxGame) * 100, 2)}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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

              {/* ASD distribution — enhanced */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Distribuzione ASD
                </h2>
                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-3">
                  {([["asd", "Per ASD"], ["province", "Per Provincia"], ["regione", "Per Regione"]] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setAsdTab(key); setAsdSearch(""); }}
                      className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-all ${
                        asdTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {/* Search */}
                <input
                  type="text"
                  value={asdSearch}
                  onChange={(e) => setAsdSearch(e.target.value)}
                  placeholder={`Cerca ${asdTab === "asd" ? "ASD" : asdTab === "province" ? "provincia" : "regione"}...`}
                  className="w-full h-8 px-3 mb-3 rounded-lg border border-gray-200 bg-gray-50 text-xs focus:outline-none focus:ring-2 focus:ring-[#003DA5]/30"
                />
                {stats && stats.asdDistribution.length > 0 ? (
                  (() => {
                    const dist = stats.asdDistribution;
                    const q = asdSearch.toLowerCase();

                    interface AsdRow {
                      label: string; count: number; detail?: string;
                      medianXp: number; medianMinutes: number;
                      topUser: string; topUserXp: number;
                      restMedianXp: number; restMedianMinutes: number;
                      lowEngagement: boolean; firstSignup?: string; lastActive?: string;
                    }

                    // Build aggregated data based on tab
                    let rows: AsdRow[];
                    if (asdTab === "province") {
                      const pMap = new Map<string, { count: number; xps: number[]; mins: number[]; topUser: string; topUserXp: number; lowCount: number }>();
                      for (const a of dist) {
                        const p = a.province || "N/D";
                        const prev = pMap.get(p) || { count: 0, xps: [], mins: [], topUser: "", topUserXp: 0, lowCount: 0 };
                        prev.count += a.count;
                        // Approximate: use medians as representative values (repeated by count)
                        for (let i = 0; i < a.count; i++) { prev.xps.push(a.medianXp); prev.mins.push(a.medianMinutes); }
                        if (a.topUserXp > prev.topUserXp) { prev.topUser = a.topUser; prev.topUserXp = a.topUserXp; }
                        if (a.lowEngagement) prev.lowCount++;
                        pMap.set(p, prev);
                      }
                      const medianFn = (arr: number[]) => { const s = [...arr].sort((a,b) => a-b); const m = Math.floor(s.length/2); return s.length % 2 ? s[m] : Math.round((s[m-1]+s[m])/2); };
                      rows = [...pMap.entries()]
                        .map(([p, d]) => {
                          const restXps = d.xps.filter(x => x < d.topUserXp || d.xps.indexOf(x) > 0);
                          return { label: p, count: d.count, detail: PROVINCE_TO_REGION[p] || "", medianXp: medianFn(d.xps), medianMinutes: medianFn(d.mins), topUser: d.topUser, topUserXp: d.topUserXp, restMedianXp: restXps.length ? medianFn(restXps) : 0, restMedianMinutes: medianFn(d.mins), lowEngagement: false };
                        }).sort((a, b) => b.count - a.count);
                    } else if (asdTab === "regione") {
                      const rMap = new Map<string, { count: number; xps: number[]; mins: number[]; topUser: string; topUserXp: number }>();
                      for (const a of dist) {
                        const r = a.region || "N/D";
                        const prev = rMap.get(r) || { count: 0, xps: [], mins: [], topUser: "", topUserXp: 0 };
                        prev.count += a.count;
                        for (let i = 0; i < a.count; i++) { prev.xps.push(a.medianXp); prev.mins.push(a.medianMinutes); }
                        if (a.topUserXp > prev.topUserXp) { prev.topUser = a.topUser; prev.topUserXp = a.topUserXp; }
                        rMap.set(r, prev);
                      }
                      const medianFn = (arr: number[]) => { const s = [...arr].sort((a,b) => a-b); const m = Math.floor(s.length/2); return s.length % 2 ? s[m] : Math.round((s[m-1]+s[m])/2); };
                      rows = [...rMap.entries()]
                        .map(([r, d]) => {
                          const restXps = d.xps.filter(x => x < d.topUserXp || d.xps.indexOf(x) > 0);
                          return { label: r, count: d.count, medianXp: medianFn(d.xps), medianMinutes: medianFn(d.mins), topUser: d.topUser, topUserXp: d.topUserXp, restMedianXp: restXps.length ? medianFn(restXps) : 0, restMedianMinutes: medianFn(d.mins), lowEngagement: false };
                        }).sort((a, b) => b.count - a.count);
                    } else {
                      rows = dist.map(a => ({
                        label: a.name, count: a.count,
                        detail: a.province ? `${a.province}${a.region ? ` · ${a.region}` : ""}` : undefined,
                        medianXp: a.medianXp, medianMinutes: a.medianMinutes,
                        topUser: a.topUser, topUserXp: a.topUserXp,
                        restMedianXp: a.restMedianXp, restMedianMinutes: a.restMedianMinutes,
                        lowEngagement: a.lowEngagement,
                        firstSignup: a.firstSignup, lastActive: a.lastActive,
                      }));
                    }

                    // Filter by search
                    const filtered = q
                      ? rows.filter(r => r.label.toLowerCase().includes(q) || (r.detail && r.detail.toLowerCase().includes(q)))
                      : rows;
                    const maxCount = filtered[0]?.count || 1;
                    const totalUsers = filtered.reduce((s, r) => s + r.count, 0);
                    const lowEngagementCount = filtered.filter(r => r.lowEngagement).length;

                    const fmtMin = (m: number) => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;

                    return (
                      <>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-2">
                          <span>{filtered.length} {asdTab === "asd" ? "ASD" : asdTab === "province" ? "province" : "regioni"} · {totalUsers} utenti</span>
                          {lowEngagementCount > 0 && asdTab === "asd" && (
                            <span className="text-orange-500 font-semibold">{lowEngagementCount} da riattivare</span>
                          )}
                        </div>
                        <div className="space-y-0 max-h-[500px] overflow-y-auto pr-1">
                          {filtered.map((row) => (
                            <div key={row.label} className={`py-3 border-b border-gray-100 last:border-0 ${row.lowEngagement ? "bg-orange-50/50 -mx-2 px-2 rounded-lg" : ""}`}>
                              {/* Header: name + count + low engagement badge */}
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-gray-800 break-words">{row.label}</p>
                                  {row.detail && <p className="text-[10px] text-gray-400">{row.detail}</p>}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {row.lowEngagement && (
                                    <span className="text-[9px] font-bold text-orange-600 bg-orange-100 rounded-full px-2 py-0.5">RIATTIVARE</span>
                                  )}
                                  <span className="text-sm font-bold text-[#003DA5]">{row.count}</span>
                                </div>
                              </div>

                              {/* Group stats (without top user) */}
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                                <span className="text-[10px] text-gray-500">
                                  Mediana XP: <span className="font-semibold text-gray-700">{row.restMedianXp.toLocaleString("it-IT")}</span>
                                  {row.count > 1 && <span className="text-gray-400 ml-0.5">({row.count - 1} utenti)</span>}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  Uso mediano: <span className="font-semibold text-gray-700">{fmtMin(row.restMedianMinutes)}</span>
                                </span>
                                {row.firstSignup && row.lastActive && (
                                  <span className="text-[10px] text-gray-400">
                                    {row.firstSignup} → {row.lastActive}
                                  </span>
                                )}
                              </div>

                              {/* Top performer — separated */}
                              <div className="flex items-center gap-1.5 mb-1.5 pl-2 border-l-2 border-amber-300">
                                <span className="text-[10px] text-amber-700 font-semibold">{row.topUser}</span>
                                <span className="text-[10px] text-amber-500">{row.topUserXp.toLocaleString("it-IT")} XP · {fmtMin(row.medianMinutes)}</span>
                              </div>

                              {/* Bar */}
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    row.lowEngagement ? "bg-orange-400/70" :
                                    asdTab === "regione" ? "bg-emerald-500/70" : asdTab === "province" ? "bg-amber-500/70" : "bg-[#003DA5]/70"
                                  }`}
                                  style={{ width: `${Math.max((row.count / maxCount) * 100, 3)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()
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

              // Find all days this user was active (from login_history)
              const userLogins = loginHistory.filter(l => l.user_id === u.id);
              // Group logins by local date, keep all timestamps per day
              const dayLoginsMap = new Map<string, string[]>();
              for (const l of userLogins) {
                // Use local date (not UTC) for grouping
                const localDate = new Date(l.logged_in_at);
                const dayKey = `${localDate.getFullYear()}-${String(localDate.getMonth()+1).padStart(2,"0")}-${String(localDate.getDate()).padStart(2,"0")}`;
                const prev = dayLoginsMap.get(dayKey) || [];
                prev.push(l.logged_in_at);
                dayLoginsMap.set(dayKey, prev);
              }
              // Also include last_login fallback (only if no login_history for that day)
              if (u.last_login) {
                const lastDay = parseLogin(u.last_login);
                if (lastDay) {
                  const lastDayKey = `${lastDay.getFullYear()}-${String(lastDay.getMonth()+1).padStart(2,"0")}-${String(lastDay.getDate()).padStart(2,"0")}`;
                  if (!dayLoginsMap.has(lastDayKey)) {
                    dayLoginsMap.set(lastDayKey, [u.last_login]);
                  }
                }
              }
              // Also include created_at as first active day
              const createdDate = new Date(u.created_at);
              const createdDay = `${createdDate.getFullYear()}-${String(createdDate.getMonth()+1).padStart(2,"0")}-${String(createdDate.getDate()).padStart(2,"0")}`;
              if (!dayLoginsMap.has(createdDay)) {
                dayLoginsMap.set(createdDay, [u.created_at]);
              }
              // Build sorted log entries with all accesses per day
              const activeDaysLog = [...dayLoginsMap.entries()]
                .map(([date, logins]) => ({
                  date,
                  logins: logins.sort((a, b) => a.localeCompare(b)),
                }))
                .sort((a, b) => b.date.localeCompare(a.date));
              const activeDaySet = new Set(dayLoginsMap.keys());

              // Find user rank by XP
              const xpRank = [...users].sort((a, b) => b.xp - a.xp).findIndex(usr => usr.id === u.id) + 1;

              // Find user rank by hands
              const handsRank = [...users].sort((a, b) => b.hands_played - a.hands_played).findIndex(usr => usr.id === u.id) + 1;

              return (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeUserDetail}>
                  <div
                    ref={userDialogRef}
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
                              <span>{profileEmoji[u.profile_type]} {u.profile_type}</span>
                              {u.bbo_username && <span>BBO: {u.bbo_username}</span>}
                            </div>
                          </div>
                        </div>
                        <button onClick={closeUserDetail} aria-label="Chiudi" className="text-white/70 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"><span aria-hidden="true">✕</span></button>
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
                            <span className="font-mono text-[10px] text-gray-400 max-w-[160px] truncate" title={u.id}>{u.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Activity heatmap - last 30 days */}
                      <div className="mb-6">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Attività ultimi 30 giorni</h3>
                        <div className="flex gap-1 flex-wrap">
                          {Array.from({ length: 30 }, (_, i) => {
                            const d = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
                            const key = d.toISOString().split("T")[0];
                            const wasActive = activeDaySet.has(key);
                            const isToday = i === 29;
                            const dayName = d.toLocaleDateString("it-IT", { weekday: "short" }).slice(0, 2);
                            const dayNum = d.getDate();
                            const isFirstOfWeek = d.getDay() === 1;
                            return (
                              <div key={key} className={`flex flex-col items-center gap-0.5 ${isFirstOfWeek && i > 0 ? "ml-1" : ""}`} title={`${key}: ${wasActive ? "attivo" : "inattivo"}`}>
                                <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${
                                  wasActive
                                    ? "bg-emerald-500 text-white"
                                    : isToday
                                      ? "bg-gray-200 text-gray-500 ring-2 ring-gray-300"
                                      : "bg-gray-100 text-gray-300"
                                }`}>
                                  {dayNum}
                                </div>
                                {(i === 0 || isFirstOfWeek) && <span className="text-[8px] text-gray-400">{dayName}</span>}
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400">
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
                                    {isRegistration && <span className="ml-1.5 text-[10px] font-bold text-blue-500">registrazione</span>}
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
