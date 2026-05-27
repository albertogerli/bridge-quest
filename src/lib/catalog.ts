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
  smazzateIds: string[];
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
  smazzate_ids: string[] | null;
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
      .select("id, world_id, title, subtitle, icon, position, smazzate_ids")
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
      smazzateIds: l.smazzate_ids ?? [],
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
