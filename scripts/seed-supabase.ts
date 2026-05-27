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
    smazzate_ids: string[];
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
          smazzate_ids: lesson.smazzateIds ?? [],
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

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();
  console.log(`Seeding ${SUPABASE_URL} ...\n`);

  await seedCourses();
  await seedWorlds();
  await seedLessons();
  await seedModules();

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
