import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

function loadEnv(file) {
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[t.slice(0, eq).trim()] = v;
  }
  return env;
}

const env = loadEnv(path.join(process.cwd(), ".env.local"));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase credentials");
  process.exit(2);
}

const measuredAt = new Date().toISOString();
const rome = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Rome",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
}).format(new Date()).replace(",", "");

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const hashId = (id) => createHash("sha256").update(String(id)).digest("hex").slice(0, 16);

async function openapi() {
  const res = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/openapi+json" },
  });
  const spec = await res.json();
  const tables = Object.keys(spec.definitions || spec.components?.schemas || {}).filter((n) => !n.includes("."));
  const paths = Object.keys(spec.paths || {}).filter((p) => p.startsWith("/"));
  const rpc = Object.keys(spec.paths || {}).filter((p) => p.startsWith("/rpc/"));
  return {
    status: res.status,
    table_or_schema_names: tables.sort(),
    path_count: paths.length,
    rpc_paths: rpc.sort(),
  };
}

async function countExact(table) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) return { table, error: error.message, code: error.code };
  return { table, rows: count };
}

async function fetchAll(table, columns, pageSize = 1000) {
  const rows = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function authUserCount() {
  // GoTrue admin API: paginate, count only, never persist emails/ids.
  let page = 1;
  const perPage = 200;
  let total = 0;
  const createdAts = [];
  for (;;) {
    const res = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=${perPage}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      return { error: `auth admin HTTP ${res.status}`, registered_users: null };
    }
    const body = await res.json();
    const users = body.users || [];
    total += users.length;
    for (const u of users) {
      if (u.created_at) createdAts.push(u.created_at);
    }
    if (users.length < perPage) break;
    page += 1;
    if (page > 500) break;
  }
  const byMonth = {};
  for (const iso of createdAts) {
    const d = new Date(iso);
    const keyM = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    byMonth[keyM] = (byMonth[keyM] ?? 0) + 1;
  }
  const months = Object.keys(byMonth).sort();
  const growth = months.map((m, i) => {
    const registrations = byMonth[m];
    const prior = i === 0 ? null : byMonth[months[i - 1]];
    return {
      month: m,
      registrations,
      monthly_growth_pct: prior ? Number(((100 * (registrations - prior)) / prior).toFixed(2)) : null,
    };
  });
  return { registered_users: total, registrations_by_month_utc: growth };
}

function monthKeyRome(iso) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome", year: "numeric", month: "2-digit",
  }).formatToParts(new Date(iso));
  const y = parts.find((p) => p.type === "year").value;
  const m = parts.find((p) => p.type === "month").value;
  return `${y}-${m}`;
}

function inferSessions(eventsByUser, gapMinutes) {
  let sessions = 0;
  let singleEvent = 0;
  const durations = [];
  for (const times of eventsByUser.values()) {
    times.sort((a, b) => a - b);
    let start = times[0];
    let end = times[0];
    let count = 1;
    const flush = () => {
      sessions += 1;
      const dur = (end - start) / 60000;
      durations.push(dur);
      if (count === 1) singleEvent += 1;
    };
    for (let i = 1; i < times.length; i += 1) {
      if ((times[i] - end) / 60000 > gapMinutes) {
        flush();
        start = times[i];
        count = 1;
      } else {
        count += 1;
      }
      end = times[i];
    }
    flush();
  }
  durations.sort((a, b) => a - b);
  const mean = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null;
  const median = durations.length
    ? (durations.length % 2 ? durations[Math.floor(durations.length / 2)] : (durations[durations.length / 2 - 1] + durations[durations.length / 2]) / 2)
    : null;
  return {
    gap_threshold_minutes: gapMinutes,
    inferred_sessions: sessions,
    inferred_mean_minutes: mean === null ? null : Number(mean.toFixed(2)),
    inferred_median_minutes: median === null ? null : Number(median.toFixed(2)),
    single_event_sessions: singleEvent,
    single_event_share: sessions ? Number((singleEvent / sessions).toFixed(4)) : null,
  };
}

function retention(profiles, loginsByUser, days) {
  const now = Date.now();
  const windowMs = days * 86400000;
  let eligible = 0;
  let retained = 0;
  for (const p of profiles) {
    const created = new Date(p.created_at).getTime();
    if (created > now - windowMs) continue;
    eligible += 1;
    const logins = loginsByUser.get(p.id) || [];
    const threshold = created + windowMs;
    if (logins.some((t) => t >= threshold)) retained += 1;
  }
  return {
    days,
    eligible_users: eligible,
    retained_users: retained,
    rolling_retention_pct: eligible ? Number(((100 * retained) / eligible).toFixed(2)) : null,
    formula: "rolling: utenti con created_at <= now - N giorni; retained se esiste almeno un login_history.logged_in_at >= created_at + N giorni",
  };
}

async function main() {
  const spec = await openapi();
  const candidateTables = [
    "asd", "profiles", "completed_modules", "badges", "review_items",
    "forum_posts", "forum_comments", "forum_likes", "game_results",
    "push_subscriptions", "friendships", "challenges", "login_history",
    "forum_poll_votes", "courses", "course_worlds", "lessons", "lesson_modules",
    "smazzate", "glossary", "asd_clubs", "collectible_cards", "weekly_challenges",
    "guided_hands", "eserciziario_exercises", "trova_errore_scenarios",
    "classes", "class_members", "assignments", "instructor_requests",
    "class_messages", "email_events", "tournament_results",
    "bbo_username_cleanup_2026_08", "partner_profiles",
  ];
  const tableCounts = [];
  for (const t of candidateTables) tableCounts.push(await countExact(t));

  const auth = await authUserCount();

  const profileTimes = await fetchAll("profiles", "id, created_at");
  let cumulativeMinutes = "non determinabile";
  let minutesPresent = 0;
  try {
    const mins = await fetchAll("profiles", "total_minutes");
    minutesPresent = mins.filter((p) => typeof p.total_minutes === "number").length;
    cumulativeMinutes = mins.reduce((s, p) => s + (typeof p.total_minutes === "number" ? p.total_minutes : 0), 0);
  } catch {
    minutesPresent = 0;
    cumulativeMinutes = "non determinabile";
  }
  const profileRegs = {};
  for (const p of profileTimes) {
    const k = monthKeyRome(p.created_at);
    profileRegs[k] = (profileRegs[k] ?? 0) + 1;
  }
  const profileMonths = Object.keys(profileRegs).sort();
  const profileGrowth = profileMonths.map((m, i) => {
    const registrations = profileRegs[m];
    const prior = i === 0 ? null : profileRegs[profileMonths[i - 1]];
    return {
      month: m,
      profile_registrations: registrations,
      monthly_growth_pct: prior ? Number(((100 * (registrations - prior)) / prior).toFixed(2)) : null,
    };
  });

  const loginRows = await fetchAll("login_history", "user_id, logged_in_at");
  const mau = {};
  const loginEventsByMonth = {};
  const loginsByUser = new Map();
  const eventsByUser = new Map();
  for (const row of loginRows) {
    const hid = hashId(row.user_id);
    const t = new Date(row.logged_in_at).getTime();
    const k = monthKeyRome(row.logged_in_at);
    if (!mau[k]) mau[k] = new Set();
    mau[k].add(hid);
    loginEventsByMonth[k] = (loginEventsByMonth[k] ?? 0) + 1;
    if (!loginsByUser.has(row.user_id)) loginsByUser.set(row.user_id, []);
    loginsByUser.get(row.user_id).push(t);
    if (!eventsByUser.has(hid)) eventsByUser.set(hid, []);
    eventsByUser.get(hid).push(t);
  }
  const monthlyActive = Object.keys(mau).sort().map((m) => ({
    month: m,
    monthly_active_users: mau[m].size,
    login_events: loginEventsByMonth[m],
  }));

  const sessionDiag = [21, 30, 39].map((g) => inferSessions(eventsByUser, g));

  const hashedProfiles = profileTimes.map((p) => ({ id: p.id, created_at: p.created_at }));
  const retentionRows = [5, 7, 9, 21, 30, 39].map((d) => retention(hashedProfiles, loginsByUser, d));

  const modules = await fetchAll("completed_modules", "user_id, lesson_id, module_id, completed_at");
  const lessonModules = await fetchAll("lesson_modules", "lesson_id, module_id");
  const required = new Map();
  const validKeys = new Set();
  for (const lm of lessonModules) {
    const lid = String(lm.lesson_id);
    required.set(lid, (required.get(lid) ?? 0) + 1);
    validKeys.add(`${lid}||${lm.module_id}`);
  }
  let matched = 0;
  const byUserLesson = new Map();
  for (const row of modules) {
    const key = `${row.lesson_id}||${row.module_id}`;
    if (validKeys.has(key)) {
      matched += 1;
      const uk = `${row.user_id}||${row.lesson_id}`;
      if (!byUserLesson.has(uk)) byUserLesson.set(uk, { user: row.user_id, lesson: String(row.lesson_id), modules: new Set(), last: row.completed_at });
      const rec = byUserLesson.get(uk);
      rec.modules.add(row.module_id);
      if (row.completed_at > rec.last) rec.last = row.completed_at;
    }
  }
  const completedPairs = [];
  const usersWithLesson = new Set();
  const lessonsByMonth = {};
  for (const rec of byUserLesson.values()) {
    const need = required.get(rec.lesson) ?? Infinity;
    if (rec.modules.size >= need) {
      completedPairs.push(rec);
      usersWithLesson.add(hashId(rec.user));
      const k = monthKeyRome(rec.last);
      lessonsByMonth[k] = (lessonsByMonth[k] ?? 0) + 1;
    }
  }

  const courses = await countExact("courses");
  const worlds = await countExact("course_worlds");
  const lessons = await countExact("lessons");
  const moduleCount = await countExact("lesson_modules");
  const moduleTypesRaw = await fetchAll("lesson_modules", "module_type, content");
  const moduleTypes = {};
  const blockTypes = {};
  let quizBlocks = 0;
  const quizTypeSet = new Set(["quiz", "true-false", "card-select", "hand-eval", "bid-select", "sequence"]);
  for (const m of moduleTypesRaw) {
    moduleTypes[m.module_type || "null"] = (moduleTypes[m.module_type || "null"] ?? 0) + 1;
    const content = Array.isArray(m.content) ? m.content : [];
    for (const b of content) {
      const t = b?.type || "unknown";
      blockTypes[t] = (blockTypes[t] ?? 0) + 1;
      if (quizTypeSet.has(t)) quizBlocks += 1;
    }
  }

  const smazzateMeta = await fetchAll("smazzate", "dd_tricks, contract");
  const dd = {
    catalog_hands: smazzateMeta.length,
    hands_with_dd_tricks: smazzateMeta.filter((x) => x.dd_tricks != null).length,
    hands_without_dd_tricks: smazzateMeta.filter((x) => x.dd_tricks == null).length,
  };

  let exerciseBlocks = {};
  try {
    const exercises = await fetchAll("eserciziario_exercises", "content");
    for (const e of exercises) {
      const content = Array.isArray(e.content) ? e.content : [];
      for (const b of content) {
        const t = b?.type || "unknown";
        exerciseBlocks[t] = (exerciseBlocks[t] ?? 0) + 1;
      }
    }
  } catch (err) {
    exerciseBlocks = { error: String(err.message || err) };
  }

  const product = {};
  for (const t of ["courses", "course_worlds", "lessons", "lesson_modules", "smazzate", "glossary", "collectible_cards", "weekly_challenges", "guided_hands", "eserciziario_exercises", "trova_errore_scenarios"]) {
    product[t] = (await countExact(t)).rows ?? null;
  }

  const output = {
    measured_at_utc: measuredAt,
    measured_at_europe_rome: rome,
    connector: "Supabase JS service role + PostgREST OpenAPI + GoTrue admin count. Nessuna riga individuale persistita.",
    schema_live_pg_catalog: "non determinabile: assente DATABASE_URL / connessione SQL diretta; pg_catalog non esposto via PostgREST",
    openapi: spec,
    table_row_counts: tableCounts,
    usage: {
      auth_registered_users: auth.registered_users,
      auth_registrations_by_month_utc: auth.registrations_by_month_utc || auth.error,
      profiles: profileTimes.length,
      profile_registrations_by_month_europe_rome: profileGrowth,
      profiles_with_total_minutes: minutesPresent,
      cumulative_visible_minutes: minutesPresent ? cumulativeMinutes : "non determinabile",
      login_events: loginRows.length,
      monthly_active_users: monthlyActive,
      session_inference: sessionDiag,
      session_note: "login_history contiene solo user_id e logged_in_at; nessun heartbeat, start/end o timeout. Le sessioni inferite da gap temporale sono un proxy.",
      retention_rolling: retentionRows,
      completed_module_rows: modules.length,
      matched_module_rows: matched,
      unmatched_module_rows: modules.length - matched,
      completed_lesson_user_pairs: completedPairs.length,
      users_completing_at_least_one_lesson: usersWithLesson.size,
      completed_lessons_by_month: Object.keys(lessonsByMonth).sort().map((m) => ({ month: m, completed_lessons: lessonsByMonth[m] })),
    },
    product_live: {
      ...product,
      module_type_distribution: moduleTypes,
      lesson_content_block_types: blockTypes,
      inline_quiz_blocks: quizBlocks,
      smazzate_dd: dd,
      eserciziario_block_types: exerciseBlocks,
      courses_count: courses.rows,
      worlds_count: worlds.rows,
      lessons_count: lessons.rows,
      modules_count: moduleCount.rows,
    },
  };

  fs.writeFileSync("audit-bridgelab/grok-raw/db-aggregates.json", JSON.stringify(output, null, 2));
  console.log(JSON.stringify({
    measured_at_europe_rome: rome,
    registered_users: auth.registered_users,
    profiles: profileTimes.length,
    login_events: loginRows.length,
    tables_ok: tableCounts.filter((t) => t.rows != null).length,
    tables_err: tableCounts.filter((t) => t.error).map((t) => t.table),
    sessions_30: sessionDiag.find((s) => s.gap_threshold_minutes === 30),
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
