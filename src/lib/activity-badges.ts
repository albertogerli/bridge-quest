import type { Course } from "./catalog";

/** Actual catalog module completion, not overlapping hardcoded lesson-ID ranges. */
export function completedLessonInEveryCourse(courses: Course[], completed: Record<string, boolean>): boolean {
  return courses.length === 4 && courses.every((course) => course.lessons.some((lesson) =>
    lesson.modules.length > 0 && lesson.modules.every((module) => completed[`${lesson.id}-${module.id}`])));
}

export function readStoredStringList(key: string): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch { return []; }
}

/** Called only by completion events. These badges are already covered by badge sync. */
export function awardActivityBadge(id: "prima_mano" | "guided_master"): void {
  try {
    const badges = new Set(readStoredStringList("bq_badges"));
    if (badges.has(id)) return;
    badges.add(id);
    localStorage.setItem("bq_badges", JSON.stringify([...badges]));
    window.dispatchEvent(new Event("bq_stats_updated"));
  } catch { /* Storage may be unavailable in private browsing. */ }
}
