/**
 * Catalog layer (Phase 3.3).
 *
 * The single abstraction point between the frontend and the Supabase
 * `courses` / `course_worlds` / `lessons` / `lesson_modules` tables seeded
 * in Phase 3.2. Consumers MUST NOT import from `@/data/courses` or its
 * child files anymore — go through this layer instead. The shape of the
 * exported types matches the legacy in-repo types (with tiny cleanups
 * documented inline), so migrating callers is mostly s/import/await/.
 *
 * The full catalog is fetched once per session (browser) or per process
 * (server) and assembled into the same nested tree the app expects:
 *
 *   Course → World[] → Lesson[] → LessonModule[] → ContentBlock[]
 *
 * Re-entrancy is safe: `getCourses()` returns the same in-flight Promise
 * for concurrent callers. On error the cache is cleared so the next call
 * retries.
 */

import { createClient } from "@/lib/supabase/client";
import type { Card, Position } from "@/lib/bridge-engine";

// ─── Types (mirror legacy @/data/courses; small fields tweaked) ──────────

export type CourseId = "fiori" | "quadri" | "cuori-gioco" | "cuori-licita";
export type CourseLevel = "base" | "intermedio" | "avanzato";

export interface ContentBlock {
  type: string;            // 'text' | 'heading' | 'rule' | 'example' | 'tip'
                           //  | 'quiz' | 'bid-select' | 'card-select'
                           //  | 'hand-eval' | 'true-false' | 'sequence'
  content: string;
  cards?: string;
  options?: string[];
  correctAnswer?: number;
  correctCard?: string;
  correctValue?: number;
  correctOrder?: number[];
  explanation?: string;
}

export interface LessonModule {
  id: string;
  title: string;
  icon: string | null;
  duration: string;        // kept as string for shape parity; "5" or ""
  type: "theory" | "exercise" | "quiz" | "practice";
  content: ContentBlock[];
  xpReward: number;
}

export interface Lesson {
  id: number;
  worldId: number;
  title: string;
  subtitle: string;
  icon: string;
  modules: LessonModule[];
}

export interface World {
  id: number;
  name: string;
  subtitle: string;
  icon: string;
  gradient: string;
  iconBg: string;
  lessons: Lesson[];
}

export interface Course {
  id: CourseId;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  gradient: string;
  level: CourseLevel;
  lessonCount: number;
  worlds: World[];
  lessons: Lesson[];
}

// ─── Smazzate (Phase 4.1) ────────────────────────────────────────────────

export type Vulnerability = "none" | "ns" | "ew" | "both";

export interface BiddingData {
  dealer: Position;
  /** Sequential bids starting from dealer. Canonical ASCII form post-seed:
   *  ["1NT","P","3NT","P","P","P"] / ["1S","X","P","2H",...] */
  bids: string[];
}

export interface Smazzata {
  id: string;                  // "1-1", "Q1-1", "5-3", ...
  lesson: number;              // global lesson id (Fiori 0-12, Quadri 51-62, …)
  board: number;
  title: string;
  contract: string;            // "3NT", "4♠", "5♦X" (unicode preserved)
  declarer: Position;
  openingLead: Card;
  vulnerability: Vulnerability;
  hands: {
    north: Card[];
    south: Card[];
    east: Card[];
    west: Card[];
  };
  bidding?: BiddingData;
  commentary: string;
}

// ─── Static UI metadata (no DB roundtrip needed) ─────────────────────────

export const levelInfo: Record<
  CourseLevel,
  { label: string; color: string; bg: string }
> = {
  base: { label: "Base", color: "text-emerald-700", bg: "bg-emerald-50" },
  intermedio: { label: "Intermedio", color: "text-orange-700", bg: "bg-orange-50" },
  avanzato: { label: "Avanzato", color: "text-red-700", bg: "bg-red-50" },
};

// ─── Raw DB row shapes (snake_case columns) ──────────────────────────────

interface RawCourse {
  id: string;
  name: string;
  subtitle: string | null;
  icon: string | null;
  color: string | null;
  gradient: string | null;
  level: string;
  position: number;
}

interface RawWorld {
  id: number;
  course_id: string;
  name: string;
  subtitle: string | null;
  icon: string | null;
  gradient: string | null;
  icon_bg: string | null;
  position: number;
}

interface RawLesson {
  id: number;
  world_id: number;
  title: string;
  subtitle: string | null;
  icon: string | null;
  position: number;
}

interface RawModule {
  lesson_id: number;
  module_id: string;
  title: string;
  icon: string | null;
  duration_minutes: number | null;
  module_type: LessonModule["type"];
  xp_reward: number;
  content: ContentBlock[] | null;
  position: number;
}

// ─── Internal fetch + assembly ───────────────────────────────────────────

let catalogPromise: Promise<Course[]> | null = null;

async function loadCatalog(): Promise<Course[]> {
  const supabase = createClient();

  const [coursesRes, worldsRes, lessonsRes, modulesRes] = await Promise.all([
    supabase
      .from("courses")
      .select("id, name, subtitle, icon, color, gradient, level, position")
      .order("position", { ascending: true }),
    supabase
      .from("course_worlds")
      .select("id, course_id, name, subtitle, icon, gradient, icon_bg, position")
      .order("position", { ascending: true }),
    supabase
      .from("lessons")
      .select("id, world_id, title, subtitle, icon, position")
      .order("position", { ascending: true }),
    supabase
      .from("lesson_modules")
      .select(
        "lesson_id, module_id, title, icon, duration_minutes, module_type, xp_reward, content, position",
      )
      .order("position", { ascending: true }),
  ]);

  for (const [label, res] of [
    ["courses", coursesRes],
    ["course_worlds", worldsRes],
    ["lessons", lessonsRes],
    ["lesson_modules", modulesRes],
  ] as const) {
    if (res.error) {
      throw new Error(`catalog: failed to load ${label}: ${res.error.message}`);
    }
  }

  const rawCourses = (coursesRes.data ?? []) as RawCourse[];
  const rawWorlds = (worldsRes.data ?? []) as RawWorld[];
  const rawLessons = (lessonsRes.data ?? []) as RawLesson[];
  const rawModules = (modulesRes.data ?? []) as RawModule[];

  // lesson_id → ordered modules
  const modulesByLesson = new Map<number, LessonModule[]>();
  for (const m of rawModules) {
    const list = modulesByLesson.get(m.lesson_id) ?? [];
    list.push({
      id: m.module_id,
      title: m.title,
      icon: m.icon,
      duration: m.duration_minutes != null ? String(m.duration_minutes) : "",
      type: m.module_type,
      xpReward: m.xp_reward,
      content: m.content ?? [],
    });
    modulesByLesson.set(m.lesson_id, list);
  }

  // world_id → ordered lessons
  const lessonsByWorld = new Map<number, Lesson[]>();
  for (const l of rawLessons) {
    const list = lessonsByWorld.get(l.world_id) ?? [];
    list.push({
      id: l.id,
      worldId: l.world_id,
      title: l.title,
      subtitle: l.subtitle ?? "",
      icon: l.icon ?? "",
      modules: modulesByLesson.get(l.id) ?? [],
    });
    lessonsByWorld.set(l.world_id, list);
  }

  // course_id → ordered worlds
  const worldsByCourse = new Map<string, World[]>();
  for (const w of rawWorlds) {
    const list = worldsByCourse.get(w.course_id) ?? [];
    list.push({
      id: w.id,
      name: w.name,
      subtitle: w.subtitle ?? "",
      icon: w.icon ?? "",
      gradient: w.gradient ?? "",
      iconBg: w.icon_bg ?? "",
      lessons: lessonsByWorld.get(w.id) ?? [],
    });
    worldsByCourse.set(w.course_id, list);
  }

  return rawCourses.map<Course>((c) => {
    const worlds = worldsByCourse.get(c.id) ?? [];
    const lessons = worlds.flatMap((w) => w.lessons);
    return {
      id: c.id as CourseId,
      name: c.name,
      subtitle: c.subtitle ?? "",
      icon: c.icon ?? "",
      color: c.color ?? "",
      gradient: c.gradient ?? "",
      level: c.level as CourseLevel,
      lessonCount: lessons.length,
      worlds,
      lessons,
    };
  });
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Returns the full catalog, cached for the lifetime of the
 * session/process. Subsequent calls await the same in-flight promise.
 * If the fetch fails, the cache is cleared so the next call retries.
 */
export function getCourses(): Promise<Course[]> {
  if (!catalogPromise) {
    catalogPromise = loadCatalog().catch((err) => {
      catalogPromise = null;
      throw err;
    });
  }
  return catalogPromise;
}

/**
 * Forces the next `getCourses()` call to re-fetch from Supabase.
 * Useful in dev after re-running `npm run seed:supabase`, or after a
 * future CMS write flushes the catalog.
 */
export function resetCatalogCache(): void {
  catalogPromise = null;
}

export async function getCourseById(id: CourseId): Promise<Course | undefined> {
  const all = await getCourses();
  return all.find((c) => c.id === id);
}

export async function getAvailableCourses(): Promise<Course[]> {
  const all = await getCourses();
  return all.filter((c) => c.lessons.length > 0);
}

export async function getCourseForLesson(
  lessonId: number,
): Promise<Course | undefined> {
  const all = await getCourses();
  return all.find((c) => c.lessons.some((l) => l.id === lessonId));
}

export async function getLessonById(id: number): Promise<Lesson | undefined> {
  const all = await getCourses();
  for (const course of all) {
    const lesson = course.lessons.find((l) => l.id === id);
    if (lesson) return lesson;
  }
  return undefined;
}

export async function getModuleById(
  lessonId: number,
  moduleId: string,
): Promise<LessonModule | undefined> {
  const lesson = await getLessonById(lessonId);
  return lesson?.modules.find((m) => m.id === moduleId);
}

export async function getLessonIdsForCourse(
  courseId: CourseId,
): Promise<number[]> {
  const course = await getCourseById(courseId);
  return course?.lessons.map((l) => l.id) ?? [];
}

/** Aggregate counts across every course. */
export async function getGlobalStats(
  completedMap: Record<string, boolean>,
): Promise<{ totalModules: number; totalCompleted: number }> {
  const all = await getCourses();
  let totalModules = 0;
  let totalCompleted = 0;
  for (const course of all) {
    for (const lesson of course.lessons) {
      totalModules += lesson.modules.length;
      totalCompleted += lesson.modules.filter(
        (m) => completedMap[`${lesson.id}-${m.id}`],
      ).length;
    }
  }
  return { totalModules, totalCompleted };
}

/** Counts + progress for a single course. */
export async function getCourseStats(
  courseId: CourseId,
  completedMap: Record<string, boolean>,
): Promise<{ totalModules: number; totalCompleted: number; progress: number }> {
  const course = await getCourseById(courseId);
  if (!course) return { totalModules: 0, totalCompleted: 0, progress: 0 };

  let totalModules = 0;
  let totalCompleted = 0;
  for (const lesson of course.lessons) {
    totalModules += lesson.modules.length;
    totalCompleted += lesson.modules.filter(
      (m) => completedMap[`${lesson.id}-${m.id}`],
    ).length;
  }
  const progress =
    totalModules > 0 ? Math.round((totalCompleted / totalModules) * 100) : 0;
  return { totalModules, totalCompleted, progress };
}

// ─── Smazzate fetcher + helpers ──────────────────────────────────────────

interface RawSmazzata {
  id: string;
  lesson_id: number;
  board: number;
  title: string;
  contract: string;
  declarer: Position;
  vulnerability: Vulnerability;
  opening_lead: Card;
  hands: { north: Card[]; south: Card[]; east: Card[]; west: Card[] };
  bidding: { dealer: Position; bids: string[] } | null;
  commentary: string;
}

let smazzatePromise: Promise<Smazzata[]> | null = null;

async function loadSmazzate(): Promise<Smazzata[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("smazzate")
    .select(
      "id, lesson_id, board, title, contract, declarer, vulnerability, opening_lead, hands, bidding, commentary",
    )
    .order("lesson_id", { ascending: true })
    .order("board", { ascending: true });

  if (error) {
    throw new Error(`catalog: failed to load smazzate: ${error.message}`);
  }

  const rows = (data ?? []) as RawSmazzata[];
  return rows.map<Smazzata>((r) => ({
    id: r.id,
    lesson: r.lesson_id,
    board: r.board,
    title: r.title,
    contract: r.contract,
    declarer: r.declarer,
    openingLead: r.opening_lead,
    vulnerability: r.vulnerability,
    hands: r.hands,
    bidding: r.bidding ?? undefined,
    commentary: r.commentary ?? "",
  }));
}

/**
 * Returns the full set of smazzate (validated + non-validated), cached
 * for the lifetime of the session/process. Same retry-on-error pattern
 * as `getCourses()`.
 */
export function getAllSmazzate(): Promise<Smazzata[]> {
  if (!smazzatePromise) {
    smazzatePromise = loadSmazzate().catch((err) => {
      smazzatePromise = null;
      throw err;
    });
  }
  return smazzatePromise;
}

/** Forces the next `getAllSmazzate()` call to re-fetch from Supabase. */
export function resetSmazzateCache(): void {
  smazzatePromise = null;
}

export async function getSmazzataById(id: string): Promise<Smazzata | undefined> {
  return (await getAllSmazzate()).find((s) => s.id === id);
}

export async function getSmazzateByLesson(
  lessonId: number,
  courseId?: CourseId,
): Promise<Smazzata[]> {
  let pool = await getAllSmazzate();
  if (courseId) {
    const ids = new Set(await getLessonIdsForCourse(courseId));
    pool = pool.filter((s) => ids.has(s.lesson));
  }
  return pool.filter((s) => s.lesson === lessonId);
}

export async function getSmazzateByCourse(
  courseId: CourseId,
): Promise<Smazzata[]> {
  const ids = new Set(await getLessonIdsForCourse(courseId));
  return (await getAllSmazzate()).filter((s) => ids.has(s.lesson));
}

// ─── Smazzate pure utilities (no DB) ─────────────────────────────────────
//
// Reused from `@/data/all-smazzate.ts` and frozen here as the canonical
// implementation. The seeder persists ALL smazzate (including malformed
// ones) — these utilities filter / patch them at consumption time.

const POSITIONS: Position[] = ["north", "south", "east", "west"];
const RANK_ORDER = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"] as const;

function nextPos(p: Position): Position {
  const order: Position[] = ["north", "east", "south", "west"];
  return order[(order.indexOf(p) + 1) % 4];
}

function declarerFromBidding(bidding: { dealer: Position; bids: string[] }): Position | null {
  const order: Position[] = ["south", "west", "north", "east"];
  const dealerIdx = order.indexOf(bidding.dealer);
  if (dealerIdx === -1) return null;

  let lastBidIdx = -1;
  for (let i = bidding.bids.length - 1; i >= 0; i--) {
    const b = bidding.bids[i];
    if (b !== "P" && b !== "Dbl" && b !== "Rdbl" && b !== "X" && b !== "XX") {
      lastBidIdx = i;
      break;
    }
  }
  if (lastBidIdx === -1) return null;

  const lastBidderPos = order[(dealerIdx + lastBidIdx) % 4];
  const winningSide = lastBidderPos === "north" || lastBidderPos === "south" ? "ns" : "ew";
  const denom = bidding.bids[lastBidIdx].replace(/[0-9]/g, "").toUpperCase();

  for (let i = 0; i < bidding.bids.length; i++) {
    const pos = order[(dealerIdx + i) % 4];
    const bid = bidding.bids[i];
    if (bid === "P" || bid === "Dbl" || bid === "Rdbl" || bid === "X" || bid === "XX") continue;
    const bidDenom = bid.replace(/[0-9]/g, "").toUpperCase();
    const bidSide = pos === "north" || pos === "south" ? "ns" : "ew";
    if (bidSide === winningSide && bidDenom === denom) return pos;
  }
  return lastBidderPos;
}

function pickOpeningLead(hand: Card[], trumpSuit: string | null): Card {
  const suits = ["spade", "heart", "diamond", "club"] as const;
  const nonTrump = suits.filter((s) => s !== trumpSuit);
  const preferred = [...nonTrump, ...(trumpSuit ? [trumpSuit as typeof suits[number]] : [])];

  for (const suit of preferred) {
    const cards = hand
      .filter((c) => c.suit === suit)
      .sort((a, b) => RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank));
    if (cards.length >= 4) return cards[3];
    if (cards.length >= 2) return cards[0];
  }
  return hand[0];
}

function contractTrumpSuit(contract: string): string | null {
  const normalized = contract
    .replace(/♠/g, "S")
    .replace(/♥/g, "H")
    .replace(/♦/g, "D")
    .replace(/♣/g, "C");
  const m = normalized.match(/\d(NT|S|H|D|C)/i);
  if (!m) return null;
  const s = m[1].toUpperCase();
  if (s === "S") return "spade";
  if (s === "H") return "heart";
  if (s === "D") return "diamond";
  if (s === "C") return "club";
  return null;
}

function fixDeclarerFromBidding(s: Smazzata): Smazzata {
  if (!s.bidding) return s;
  const correct = declarerFromBidding(s.bidding);
  if (!correct || correct === s.declarer) return s;

  const newLeader = nextPos(correct);
  const leaderHand = s.hands[newLeader];
  const hasLead = leaderHand.some(
    (c) => c.suit === s.openingLead.suit && c.rank === s.openingLead.rank,
  );

  return {
    ...s,
    declarer: correct,
    openingLead: hasLead
      ? s.openingLead
      : pickOpeningLead(leaderHand, contractTrumpSuit(s.contract)),
  };
}

/**
 * Apply `fixDeclarerFromBidding` and filter out smazzate with data
 * issues: hand sizes ≠ 13, duplicated cards, opening lead missing from
 * the leader's hand.
 */
export function validateSmazzate(hands: Smazzata[]): Smazzata[] {
  return hands.map(fixDeclarerFromBidding).filter((s) => {
    for (const pos of POSITIONS) {
      if (s.hands[pos].length !== 13) return false;
    }
    const seen = new Set<string>();
    for (const pos of POSITIONS) {
      for (const c of s.hands[pos]) {
        const key = `${c.suit}-${c.rank}`;
        if (seen.has(key)) return false;
        seen.add(key);
      }
    }
    const leader = nextPos(s.declarer);
    const hasLead = s.hands[leader].some(
      (c) => c.suit === s.openingLead.suit && c.rank === s.openingLead.rank,
    );
    return hasLead;
  });
}

/** HCP plausibility heuristic — used by the random-pool playable filter. */
const HCP_TABLE: Record<string, number> = { A: 4, K: 3, Q: 2, J: 1 };

function handHcp(hand: Card[]): number {
  let s = 0;
  for (const c of hand) s += HCP_TABLE[c.rank] ?? 0;
  return s;
}

function minHcpForContract(contract: string): number {
  const normalized = contract
    .replace(/♠/g, "S")
    .replace(/♥/g, "H")
    .replace(/♦/g, "D")
    .replace(/♣/g, "C");
  const isDoubled = /[XR]+$/.test(normalized);
  const stripped = normalized.replace(/[XR]+$/g, "");
  const m = stripped.match(/^(\d)(NT|S|H|D|C)$/i);
  if (!m) return 0;
  const lvl = parseInt(m[1], 10);
  const strain = m[2].toUpperCase();
  const isNT = strain === "NT";
  const isMaj = strain === "S" || strain === "H";
  let base: number;
  if (lvl <= 2) base = 12;
  else if (lvl === 3 && !isNT) base = 16;
  else if (lvl === 3 && isNT) base = 19;
  else if (lvl === 4 && isMaj) base = 18;
  else if (lvl === 4 && !isMaj && !isNT) base = 17;
  else if (lvl === 5) base = 21;
  else if (lvl === 6) base = 25;
  else if (lvl === 7) base = 27;
  else return 0;
  return isDoubled ? Math.max(0, base - 5) : base;
}

export function isPlausibleSmazzata(s: Smazzata): boolean {
  const isNS = s.declarer === "north" || s.declarer === "south";
  const declarerHcp = isNS
    ? handHcp(s.hands.north) + handHcp(s.hands.south)
    : handHcp(s.hands.east) + handHcp(s.hands.west);
  const oppHcp = 40 - declarerHcp;
  if (declarerHcp + 10 < oppHcp) return false;
  if (declarerHcp < minHcpForContract(s.contract)) return false;
  return true;
}

/** Filtered subset used by random-draw features (sfida del giorno, torneo). */
export async function getPlayableSmazzate(): Promise<Smazzata[]> {
  const all = await getAllSmazzate();
  return validateSmazzate(all).filter(isPlausibleSmazzata);
}

// ─── Lesson title fallbacks (used when navigating a smazzata) ───────────

/**
 * Legacy Fiori lesson title overrides, kept as a last-resort fallback for
 * smazzate that point to a lesson_id not currently in the catalog.
 */
export const lessonTitles: Record<number, string> = {
  1: "Vincenti e affrancabili",
  2: "Il punto di vista dei difensori",
  3: "Affrancamenti di lunga e di posizione",
  4: "Il piano di gioco a senz'atout",
  5: "Il gioco con l'atout",
  6: "Il piano di gioco con l'atout",
  7: "La valutazione della mano",
  8: "L'apertura e la risposta",
  9: "La ridichiara dell'apertore",
  10: "Le risposte a 1SA",
  11: "L'intervento",
  12: "Sviluppi dopo l'intervento",
};

/** Async title resolver: catalog → static fallback → "Lezione N". */
export async function getLessonTitle(lessonId: number): Promise<string> {
  const lesson = await getLessonById(lessonId);
  return lesson?.title ?? lessonTitles[lessonId] ?? `Lezione ${lessonId}`;
}
