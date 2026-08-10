/**
 * Funzioni pure della dashboard admin (aggregazioni, ordinamenti, formattazioni).
 *
 * Estratte da `src/app/admin/page.tsx` senza cambi di comportamento: la logica
 * è identica riga per riga, qui è solo testabile in isolamento
 * (`src/lib/admin-stats.test.ts`).
 */

import {
  PROVINCE_TO_REGION,
  type AsdDistributionRow,
  type AsdRow,
  type AsdTab,
  type DailyActivity,
  type DayUserRow,
  type LoginRecord,
  type PlatformBreakdown,
  type PlatformKey,
  type ProfileRecord,
  type SortDir,
  type SortKey,
  type Stats,
  type UserRow,
} from "@/app/admin/_types";

/** Sottoinsieme di `AsdClub` usato per arricchire la distribuzione ASD. */
export interface AsdClubLike {
  name: string;
  province?: string;
}

export function emptyPlatformBreakdown(): PlatformBreakdown {
  return { ios: 0, android: 0, pwa: 0, web: 0, unknown: 0 };
}

export function bucketPlatform(p: string | null | undefined): PlatformKey {
  if (p === "ios" || p === "android" || p === "pwa" || p === "web") return p;
  return "unknown";
}

/** Parse last_login which can be date-only "2026-03-11" or full ISO "2026-03-11T14:32:00Z" */
export function parseLogin(val: string | null): Date | null {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d;
}

export function isFullTimestamp(val: string): boolean {
  return val.includes("T");
}

/** Mediana con guardia sull'array vuoto (usata nelle statistiche per ASD). */
export function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * Variante compatta della mediana usata nell'aggregazione per
 * provincia/regione. Ha la stessa guardia sull'array vuoto di `median`: senza,
 * un gruppo senza utenti (o il "resto" dopo aver tolto il top user) finiva in
 * UI come `NaN` invece che come 0.
 */
export function medianRaw(arr: number[]): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

/**
 * Copia di `values` senza UNA sola occorrenza di `value` (la prima trovata).
 *
 * Serve a togliere il top user dal "resto" del gruppo: un `filter` toglierebbe
 * anche tutti i duplicati del suo valore (cioè altri utenti con lo stesso XP),
 * falsando la mediana del resto.
 */
export function dropOne(values: number[], value: number): number[] {
  const i = values.indexOf(value);
  if (i < 0) return [...values];
  return [...values.slice(0, i), ...values.slice(i + 1)];
}

/**
 * Nei tab "provincia" e "regione" le mediane non sono calcolate sugli utenti
 * ma ricostruite ripetendo la mediana di ogni ASD `count` volte (vedi
 * `buildAsdRows`): sono quindi stime, e la UI deve dirlo.
 */
export function asdMediansAreApproximate(asdTab: AsdTab): boolean {
  return asdTab !== "asd";
}

export function mapProfilesToUsers(profiles: ProfileRecord[]): UserRow[] {
  return profiles.map((u) => ({
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
    email: u.email ?? null,
  }));
}

export function countInstructors(profiles: ProfileRecord[]): number {
  return profiles.filter((u) => u.role === "instructor").length;
}

/**
 * Aggregazione completa delle statistiche admin.
 * `now` è iniettato per rendere la funzione deterministica nei test.
 */
export function computeStats(params: {
  profiles: ProfileRecord[];
  users: UserRow[];
  logins: LoginRecord[];
  asdClubs: AsdClubLike[];
  now: Date;
  instructors: number;
  classes: number;
  students: number;
}): Stats {
  const { profiles, users: mappedUsers, logins, asdClubs, now, instructors, classes, students } = params;

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
  for (const log of logins) {
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
    platformSignups[bucketPlatform(u.platform)]++;
  }
  const platformLogins30d = emptyPlatformBreakdown();
  for (const log of logins) {
    platformLogins30d[bucketPlatform(log.platform)]++;
  }

  return {
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
    instructors,
    classes,
    students,
  };
}

/**
 * Accumulatore di un gruppo (provincia o regione).
 *
 * `xps`/`mins` NON sono i valori dei singoli utenti: sono la mediana di ogni
 * ASD ripetuta `count` volte (i dati grezzi per utente non arrivano fin qui).
 * Le mediane di gruppo sono quindi delle stime — la UI lo dichiara tramite
 * `asdMediansAreApproximate`.
 *
 * `topMedianXp`/`topMedianMinutes` sono i valori con cui il top user è
 * rappresentato dentro `xps`/`mins`: sono quelle le occorrenze da togliere per
 * ottenere il "resto" del gruppo.
 */
interface AsdGroupAcc {
  count: number;
  xps: number[];
  mins: number[];
  topUser: string;
  topUserXp: number;
  topMedianXp: number;
  topMedianMinutes: number;
}

function emptyAsdGroup(): AsdGroupAcc {
  return { count: 0, xps: [], mins: [], topUser: "", topUserXp: 0, topMedianXp: 0, topMedianMinutes: 0 };
}

function accumulateAsdGroup(prev: AsdGroupAcc, a: AsdDistributionRow): AsdGroupAcc {
  prev.count += a.count;
  for (let i = 0; i < a.count; i++) { prev.xps.push(a.medianXp); prev.mins.push(a.medianMinutes); }
  if (a.topUserXp > prev.topUserXp) {
    prev.topUser = a.topUser;
    prev.topUserXp = a.topUserXp;
    prev.topMedianXp = a.medianXp;
    prev.topMedianMinutes = a.medianMinutes;
  }
  return prev;
}

/**
 * Statistiche del gruppo senza il top user.
 *
 * Il "resto" toglie UNA sola occorrenza del top user da XP e minuti. Se il
 * gruppo ha un solo utente non resta nessuno: si riporta 0, com'è già per il
 * tab ASD (`median([])`), invece di ripetere i numeri del top user.
 */
function asdGroupRest(d: AsdGroupAcc): { restMedianXp: number; restMedianMinutes: number } {
  return {
    restMedianXp: medianRaw(dropOne(d.xps, d.topMedianXp)),
    restMedianMinutes: medianRaw(dropOne(d.mins, d.topMedianMinutes)),
  };
}

/** Righe della distribuzione ASD aggregate secondo il tab selezionato. */
export function buildAsdRows(dist: AsdDistributionRow[], asdTab: AsdTab): AsdRow[] {
  if (asdTab === "province") {
    const pMap = new Map<string, AsdGroupAcc>();
    for (const a of dist) {
      const p = a.province || "N/D";
      pMap.set(p, accumulateAsdGroup(pMap.get(p) || emptyAsdGroup(), a));
    }
    return [...pMap.entries()]
      .map(([p, d]) => ({
        label: p, count: d.count, detail: PROVINCE_TO_REGION[p] || "",
        medianXp: medianRaw(d.xps), medianMinutes: medianRaw(d.mins),
        topUser: d.topUser, topUserXp: d.topUserXp,
        ...asdGroupRest(d),
        lowEngagement: false,
      }))
      .sort((a, b) => b.count - a.count);
  }

  if (asdTab === "regione") {
    const rMap = new Map<string, AsdGroupAcc>();
    for (const a of dist) {
      const r = a.region || "N/D";
      rMap.set(r, accumulateAsdGroup(rMap.get(r) || emptyAsdGroup(), a));
    }
    return [...rMap.entries()]
      .map(([r, d]) => ({
        label: r, count: d.count,
        medianXp: medianRaw(d.xps), medianMinutes: medianRaw(d.mins),
        topUser: d.topUser, topUserXp: d.topUserXp,
        ...asdGroupRest(d),
        lowEngagement: false,
      }))
      .sort((a, b) => b.count - a.count);
  }

  return dist.map(a => ({
    label: a.name, count: a.count,
    detail: a.province ? `${a.province}${a.region ? ` · ${a.region}` : ""}` : undefined,
    medianXp: a.medianXp, medianMinutes: a.medianMinutes,
    topUser: a.topUser, topUserXp: a.topUserXp,
    restMedianXp: a.restMedianXp, restMedianMinutes: a.restMedianMinutes,
    lowEngagement: a.lowEngagement,
    firstSignup: a.firstSignup, lastActive: a.lastActive,
  }));
}

/** Filtro testuale sulle righe ASD: `q` è già in minuscolo. */
export function filterAsdRows(rows: AsdRow[], q: string): AsdRow[] {
  return q
    ? rows.filter(r => r.label.toLowerCase().includes(q) || (r.detail && r.detail.toLowerCase().includes(q)))
    : rows;
}

/**
 * Filtra per nome, handle BBO o email.
 *
 * L'email è spesso l'unico dato che si ha in mano quando un utente scrive per
 * un problema: cercarlo per indirizzo è il motivo principale per cui la
 * colonna esiste.
 */
export function filterUsers(users: UserRow[], search: string): UserRow[] {
  const needle = search.trim().toLowerCase();
  return needle
    ? users.filter(
        (u) =>
          u.display_name?.toLowerCase().includes(needle) ||
          u.bbo_username?.toLowerCase().includes(needle) ||
          u.email?.toLowerCase().includes(needle)
      )
    : users;
}

export function sortUsers(users: UserRow[], sortKey: SortKey, sortDir: SortDir): UserRow[] {
  return [...users].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "last_login") {
      // `last_login` mescola date secche ("2026-03-11") e timestamp ISO
      // ("2026-03-11T14:32:00Z"): confrontarli come stringhe non dà un ordine
      // cronologico. Si ordina sull'istante reale, con i non parsabili
      // trattati come mancanti e quindi in fondo (come le altre colonne).
      const at = parseLogin(a.last_login)?.getTime() ?? null;
      const bt = parseLogin(b.last_login)?.getTime() ?? null;
      if (at == null && bt == null) return 0;
      if (at == null) return 1;
      if (bt == null) return -1;
      return (at - bt) * dir;
    }
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
}

/** Direzione iniziale quando si cambia colonna di ordinamento. */
export function defaultSortDir(key: SortKey): SortDir {
  return key === "xp" || key === "hands_played" || key === "streak" || key === "total_minutes" ? "desc" : "asc";
}

export function formatMinutes(m: number): string {
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

/** "Ultimo accesso" relativo a `now` (ms epoch). */
export function formatLastLogin(val: string | null, now: number): string {
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
}

/** Contenuto del CSV di export utenti (header + righe). */
export function buildUsersCsv(users: UserRow[]): string {
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
  return header + rows.join("\n");
}

/** DIDACTA date check */
export function isDidactaPeriod(n: Date): boolean {
  const start = new Date("2026-03-12T00:00:00+01:00");
  const end = new Date("2026-03-14T23:59:59+01:00");
  return n >= start && n <= end;
}

/** Giorni interi trascorsi dalla data ISO indicata. */
export function daysSince(iso: string, now: number = Date.now()): number {
  return Math.floor((now - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

/** I 30 giorni della heatmap attività, dal più vecchio a oggi. */
export function last30Days(now: number = Date.now()): Date[] {
  return Array.from({ length: 30 }, (_, i) => new Date(now - (29 - i) * 24 * 60 * 60 * 1000));
}

/** Posizione (1-based) dell'utente `id` ordinando per `key` decrescente. */
export function rankBy(users: UserRow[], id: string, key: "xp" | "hands_played"): number {
  return [...users].sort((a, b) => b[key] - a[key]).findIndex(usr => usr.id === id) + 1;
}

/** Utenti attivi in un giorno, risolti sull'anagrafica e ordinati per accesso. */
export function resolveDayUsers(
  activeUsers: DailyActivity["activeUsers"],
  users: UserRow[],
): DayUserRow[] {
  const dayUsers = activeUsers
    .map(au => {
      const full = users.find(u => u.id === au.id);
      return full ? { ...full, login_time: au.last_login } : null;
    })
    .filter(Boolean) as DayUserRow[];
  dayUsers.sort((a, b) => new Date(b.login_time).getTime() - new Date(a.login_time).getTime());
  return dayUsers;
}

export interface UserActivity {
  activeDaysLog: { date: string; logins: string[] }[];
  activeDaySet: Set<string>;
  createdDay: string;
}

function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Log accessi per giorno di un utente (login_history + fallback last_login/created_at). */
export function buildUserActivity(u: UserRow, loginHistory: LoginRecord[]): UserActivity {
  // Find all days this user was active (from login_history)
  const userLogins = loginHistory.filter(l => l.user_id === u.id);
  // Group logins by local date, keep all timestamps per day
  const dayLoginsMap = new Map<string, string[]>();
  for (const l of userLogins) {
    // Use local date (not UTC) for grouping
    const localDate = new Date(l.logged_in_at);
    const dayKey = localDayKey(localDate);
    const prev = dayLoginsMap.get(dayKey) || [];
    prev.push(l.logged_in_at);
    dayLoginsMap.set(dayKey, prev);
  }
  // Also include last_login fallback (only if no login_history for that day)
  if (u.last_login) {
    const lastDay = parseLogin(u.last_login);
    if (lastDay) {
      const lastDayKey = localDayKey(lastDay);
      if (!dayLoginsMap.has(lastDayKey)) {
        dayLoginsMap.set(lastDayKey, [u.last_login]);
      }
    }
  }
  // Also include created_at as first active day
  const createdDate = new Date(u.created_at);
  const createdDay = localDayKey(createdDate);
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

  return { activeDaysLog, activeDaySet, createdDay };
}
