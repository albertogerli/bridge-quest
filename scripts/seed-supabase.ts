/**
 * Supabase catalog seeding script (Phase 3.2).
 *
 * Reads the in-repo course/lesson/module tree from `src/data/courses.ts`
 * and UPSERTs it into the Supabase tables created by `scripts/migrations/`
 * (Phase 3.1):
 *
 *   courses → course_worlds → lessons → lesson_modules
 *
 * Idempotent by design: every write is an `upsert` on the table's primary
 * key, so re-running this script after editing the TS source files
 * converges the DB to the new state without duplicating rows or breaking
 * foreign keys. Existing user-data tables (completed_modules, etc.) are
 * never touched — only the catalog tables this script owns.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=<service-role-key> npx tsx scripts/seed-supabase.ts
 *
 * Env requirements (uses the same Supabase project as the app):
 *   - NEXT_PUBLIC_SUPABASE_URL          (already in .env.local)
 *   - SUPABASE_SERVICE_ROLE_KEY         (server-only; do NOT prefix
 *                                        with NEXT_PUBLIC_)
 *
 * NOTE: The service-role key bypasses RLS. Keep it in `.env.local`
 * (gitignored) and never expose it to the browser bundle.
 */

import { createClient } from "@supabase/supabase-js";
import { courses } from "../src/data/courses.ts";
import type { Lesson, LessonModule, World } from "../src/data/courses.ts";

// Smazzate sources — each file is loaded raw (NO `validateSmazzate`) so we
// also persist the malformed 12/14-card hands. The FIGB review tooling will
// surface them in DB just like every other row; future correction passes
// will UPDATE them in place.
import { smazzate as smazzate1to4 } from "../src/data/smazzate.ts";
import { smazzate5to8 } from "../src/data/smazzate-5-8.ts";
import { smazzate9to12 } from "../src/data/smazzate-9-12.ts";
import { quadriSmazzate } from "../src/data/quadri-smazzate.ts";
import { cuoriGiocoSmazzate } from "../src/data/cuori-gioco-smazzate.ts";
import { cuoriLicitaSmazzate } from "../src/data/cuori-licita-smazzate.ts";

// Phase 4.2 — Glossary + ASD clubs catalog
import { GLOSSARY } from "../src/data/glossary.ts";
import { ASD_CLUBS } from "../src/data/asd-clubs.ts";

// ─── Env / client ────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing env vars. Required:\n" +
      "  NEXT_PUBLIC_SUPABASE_URL\n" +
      "  SUPABASE_SERVICE_ROLE_KEY\n\n" +
      "Set them in .env.local (the script reads from process.env).",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── Helpers ─────────────────────────────────────────────────────────────

function parseDurationMinutes(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function assertOk<T>(label: string, error: { message: string } | null, count: T) {
  if (error) {
    console.error(`✗ ${label}: ${error.message}`);
    throw new Error(error.message);
  }
  console.log(`✓ ${label.padEnd(16)} ${count} rows upserted`);
}

// ─── Seeders (ordered by FK dependency) ──────────────────────────────────

async function seedCourses() {
  const rows = courses.map((c, i) => ({
    id: c.id,
    name: c.name,
    subtitle: c.subtitle,
    icon: c.icon,
    color: c.color,
    gradient: c.gradient,
    level: c.level,
    position: i,
  }));

  const { error } = await supabase
    .from("courses")
    .upsert(rows, { onConflict: "id" });

  assertOk("courses", error, rows.length);
}

async function seedWorlds() {
  const rows: Array<{
    id: number;
    course_id: string;
    name: string;
    subtitle: string;
    icon: string;
    gradient: string;
    icon_bg: string;
    position: number;
  }> = [];

  for (const course of courses) {
    course.worlds.forEach((w: World, i: number) => {
      rows.push({
        id: w.id,
        course_id: course.id,
        name: w.name,
        subtitle: w.subtitle,
        icon: w.icon,
        gradient: w.gradient,
        icon_bg: w.iconBg,
        position: i,
      });
    });
  }

  const { error } = await supabase
    .from("course_worlds")
    .upsert(rows, { onConflict: "id" });

  assertOk("course_worlds", error, rows.length);
}

async function seedLessons() {
  const rows: Array<{
    id: number;
    world_id: number;
    title: string;
    subtitle: string;
    icon: string;
    position: number;
  }> = [];

  for (const course of courses) {
    for (const world of course.worlds) {
      world.lessons.forEach((lesson: Lesson, i: number) => {
        rows.push({
          id: lesson.id,
          world_id: world.id,
          title: lesson.title,
          subtitle: lesson.subtitle,
          icon: lesson.icon,
          position: i,
          // smazzate_ids removed in Phase 4.1.1 — the relationship is now
          // owned by `smazzate.lesson_id` (FK), no need for a reverse array.
        });
      });
    }
  }

  const { error } = await supabase
    .from("lessons")
    .upsert(rows, { onConflict: "id" });

  assertOk("lessons", error, rows.length);
}

async function seedModules() {
  const rows: Array<{
    lesson_id: number;
    module_id: string;
    title: string;
    icon: string | null;
    duration_minutes: number | null;
    module_type: LessonModule["type"];
    xp_reward: number;
    content: unknown;
    position: number;
  }> = [];

  for (const course of courses) {
    for (const lesson of course.lessons) {
      lesson.modules.forEach((mod: LessonModule, i: number) => {
        rows.push({
          lesson_id: lesson.id,
          module_id: mod.id,
          title: mod.title,
          icon: null, // unified LessonModule shape currently has no icon
          duration_minutes: parseDurationMinutes(mod.duration),
          module_type: mod.type,
          xp_reward: mod.xpReward,
          content: mod.content,
          position: i,
        });
      });
    }
  }

  // Chunk to avoid the Supabase 1MB request body limit on payloads with a
  // lot of JSONB content. 200 rows per batch is conservative.
  const CHUNK = 200;
  let total = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from("lesson_modules")
      .upsert(slice, { onConflict: "lesson_id,module_id" });
    if (error) {
      console.error(`✗ lesson_modules batch ${i / CHUNK + 1}: ${error.message}`);
      throw new Error(error.message);
    }
    total += slice.length;
  }
  console.log(`✓ lesson_modules   ${total} rows upserted (${Math.ceil(rows.length / CHUNK)} batches)`);
}

// ─── Smazzate helpers (Phase 4.1.2) ──────────────────────────────────────

/**
 * Normalise a bid token to its canonical ASCII form:
 *   - unicode suit symbols ♠♥♦♣ → S H D C
 *   - alternative double notations (Dbl, Double, Doppio) → X
 *   - alternative redouble notations (Rdbl, Redouble, Surcontre) → XX
 *   - alternative pass notations (Pass) → P
 *   - whitespace trimmed
 *
 * `1NT` / `1S` / `1H` etc. stay unchanged. After this pass every bid token
 * across all 5 source files is in one consistent shape, which makes the
 * `bidding` GIN index actually useful for queries like
 *   `bidding->'bids' @> '["1S"]'::jsonb`.
 */
function normalizeBid(raw: unknown): string {
  if (typeof raw !== "string") return String(raw ?? "");
  let bid = raw.trim();
  bid = bid
    .replace(/♠/g, "S")
    .replace(/♥/g, "H")
    .replace(/♦/g, "D")
    .replace(/♣/g, "C");
  const upper = bid.toUpperCase();
  if (upper === "PASS") return "P";
  if (upper === "DBL" || upper === "DOUBLE" || upper === "DOPPIO") return "X";
  if (upper === "RDBL" || upper === "REDBL" || upper === "REDOUBLE" || upper === "SURCONTRE") return "XX";
  return bid;
}

/** Normalise vulnerability legacy "all" alias to "both". */
function normalizeVulnerability(v: unknown): "none" | "ns" | "ew" | "both" {
  const s = typeof v === "string" ? v.toLowerCase().trim() : "";
  if (s === "all" || s === "both") return "both";
  if (s === "ns" || s === "ew" || s === "none") return s;
  return "none";
}

/**
 * Permissive shape across the 5 source files (some use `BridgeHand` from
 * smazzate-5-8, some use `Smazzata` from smazzate.ts, all structurally
 * equivalent except for the `vulnerability` "all" alias).
 */
interface AnySmazzata {
  id: string;
  lesson: number;
  board: number;
  title: string;
  contract: string;
  declarer: string;
  openingLead: { suit: string; rank: string };
  vulnerability: string;
  hands: {
    north: Array<{ suit: string; rank: string }>;
    south: Array<{ suit: string; rank: string }>;
    east: Array<{ suit: string; rank: string }>;
    west: Array<{ suit: string; rank: string }>;
  };
  bidding?: { dealer: string; bids: string[] };
  commentary: string;
}

/**
 * Cuori-gioco smazzate use the global lesson IDs natively (100…). Fiori
 * smazzate use the Fiori IDs natively (1…12). Quadri smazzate are already
 * mapped to global IDs (51…) by `quadriSmazzate`'s own .map() on export.
 * So `smazzata.lesson` is already a global lesson_id for every source.
 *
 * This helper just exists to make the assumption explicit and to fail loud
 * if a future source breaks it.
 */
function toGlobalLessonId(smazzata: AnySmazzata): number {
  return smazzata.lesson;
}

async function seedSmazzate() {
  // Collect all raw sources. The TS types differ slightly (BridgeHand vs
  // Smazzata) but the runtime shapes are compatible — cast through unknown
  // for the few callers that have an "all" vulnerability alias.
  const sources: AnySmazzata[] = [
    ...(smazzate1to4 as unknown as AnySmazzata[]),
    ...(smazzate5to8 as unknown as AnySmazzata[]),
    ...(smazzate9to12 as unknown as AnySmazzata[]),
    ...(quadriSmazzate as unknown as AnySmazzata[]),
    ...(cuoriGiocoSmazzate as unknown as AnySmazzata[]),
    ...(cuoriLicitaSmazzate as unknown as AnySmazzata[]),
  ];

  // Deduplicate by id — if the same id appears in multiple files, the last
  // occurrence wins. (Currently there are no overlaps but seed-time
  // duplicate detection guards against future regressions.)
  const byId = new Map<string, AnySmazzata>();
  for (const s of sources) byId.set(s.id, s);

  const rows = Array.from(byId.values()).map((s) => ({
    id: s.id,
    lesson_id: toGlobalLessonId(s),
    board: s.board,
    title: s.title,
    contract: s.contract,
    declarer: s.declarer,
    vulnerability: normalizeVulnerability(s.vulnerability),
    opening_lead: s.openingLead,
    hands: s.hands,
    bidding: s.bidding
      ? {
          dealer: s.bidding.dealer,
          bids: s.bidding.bids.map(normalizeBid),
        }
      : null,
    commentary: s.commentary ?? "",
  }));

  // Sanity counters logged before the network call so we spot drift early.
  const withBidding = rows.filter((r) => r.bidding).length;
  const malformed = rows.filter((r) => {
    const h = r.hands as unknown as Record<string, unknown[]>;
    return (
      h.north?.length !== 13 ||
      h.south?.length !== 13 ||
      h.east?.length !== 13 ||
      h.west?.length !== 13
    );
  }).length;
  console.log(
    `  · ${rows.length} smazzate (${withBidding} con bidding, ${malformed} con hand sizes ≠ 13)`,
  );

  // Smazzate carry the full 4-hand JSONB plus auction + commentary, so the
  // average row is ~3–5 KB. Same 200/batch ceiling we use for lesson_modules.
  const CHUNK = 200;
  let total = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from("smazzate")
      .upsert(slice, { onConflict: "id" });
    if (error) {
      console.error(`✗ smazzate batch ${i / CHUNK + 1}: ${error.message}`);
      throw new Error(error.message);
    }
    total += slice.length;
  }
  console.log(`✓ smazzate         ${total} rows upserted (${Math.ceil(rows.length / CHUNK)} batches)`);
}

// ─── Glossary (Phase 4.2.2) ──────────────────────────────────────────────

async function seedGlossary() {
  const entries = Object.entries(GLOSSARY);
  const validIds = new Set(entries.map(([id]) => id));

  // Preventive audit of related_terms — Postgres can't FK on array
  // elements, so we enforce referential integrity here. Dangling refs
  // get logged AND dropped from the row before upsert.
  let droppedRefs = 0;
  const rows = entries.map(([id, entry]) => {
    const rawRelated = entry.relatedTerms ?? [];
    const validRelated: string[] = [];
    const dangling: string[] = [];
    for (const ref of rawRelated) {
      if (validIds.has(ref)) validRelated.push(ref);
      else dangling.push(ref);
    }
    if (dangling.length > 0) {
      console.warn(
        `  ⚠ glossary["${id}"].relatedTerms: dropping unknown slug(s) ${dangling.map((d) => `"${d}"`).join(", ")}`,
      );
      droppedRefs += dangling.length;
    }

    return {
      id,
      term: entry.term,
      definition: entry.definition,
      emoji: entry.emoji,
      category: entry.category,
      example: entry.example ?? null,
      cards: entry.cards ?? null,
      related_terms: validRelated,
      quiz: {
        question: entry.quiz.question,
        options: entry.quiz.options,
        correctAnswer: entry.quiz.correctAnswer,
        explanation: entry.quiz.explanation,
      },
    };
  });

  console.log(
    `  · ${rows.length} glossary entries (${droppedRefs} dangling related_terms removed)`,
  );

  const { error } = await supabase
    .from("glossary")
    .upsert(rows, { onConflict: "id" });
  if (error) {
    console.error(`✗ glossary: ${error.message}`);
    throw new Error(error.message);
  }
  console.log(`✓ glossary         ${rows.length} rows upserted`);
}

// ─── ASD clubs (Phase 4.2.2) ─────────────────────────────────────────────

async function seedAsdClubs() {
  const rows = ASD_CLUBS.map((c) => ({
    code: c.code,
    name: c.name,
    kind: c.kind ?? "",
    active: c.active,
    has_school: c.hasSchool,           // camelCase → snake_case
    region: c.region ?? "",
    address: c.address ?? "",
    city: c.city ?? "",
    province: c.province ?? "",
    cap: c.cap ?? "",                  // TEXT, preserves leading zeros
    lat: c.lat ?? 0,
    lng: c.lng ?? 0,
  }));

  // Sanity counters before the network call.
  const active = rows.filter((r) => r.active).length;
  const withSchool = rows.filter((r) => r.has_school).length;
  const geocoded = rows.filter((r) => r.lat !== 0 || r.lng !== 0).length;
  console.log(
    `  · ${rows.length} ASD clubs (${active} active, ${withSchool} con scuola, ${geocoded} geocoded)`,
  );

  // 260 rows × ~250 bytes = ~65 KB total, well under the 1MB limit.
  const { error } = await supabase
    .from("asd_clubs")
    .upsert(rows, { onConflict: "code" });
  if (error) {
    console.error(`✗ asd_clubs: ${error.message}`);
    throw new Error(error.message);
  }
  console.log(`✓ asd_clubs        ${rows.length} rows upserted`);
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();
  console.log(`Seeding ${SUPABASE_URL} ...\n`);

  await seedCourses();
  await seedWorlds();
  await seedLessons();
  await seedModules();
  await seedSmazzate();
  await seedGlossary();
  await seedAsdClubs();

  const dt = ((Date.now() - t0) / 1000).toFixed(2);
  console.log(`\nDone in ${dt}s. Catalog tables are in sync with src/data/.`);
  console.log(
    "Note: this script never deletes — rows orphaned by source removals\n" +
      "must be cleaned up manually until we add a reconcile step.",
  );
}

main().catch((err: unknown) => {
  console.error("\nSeeding failed:", err);
  process.exit(1);
});
