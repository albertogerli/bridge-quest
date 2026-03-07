export type LessonCourseId = "fiori" | "quadri" | "cuori-gioco" | "cuori-licita";

export const QUADRI_LESSON_ID_OFFSET = 50;

export function toQuadriLessonId(displayNumber: number): number {
  return QUADRI_LESSON_ID_OFFSET + displayNumber;
}

export function getCourseIdFromLessonId(
  lessonId: number
): LessonCourseId | undefined {
  if (lessonId >= 0 && lessonId <= 12) return "fiori";
  if (lessonId >= 51 && lessonId <= 62) return "quadri";
  if (lessonId >= 100 && lessonId <= 109) return "cuori-gioco";
  if (lessonId >= 200 && lessonId <= 213) return "cuori-licita";
  return undefined;
}

export function getLessonDisplayNumber(lessonId: number): number {
  switch (getCourseIdFromLessonId(lessonId)) {
    case "fiori":
      return lessonId + 1;
    case "quadri":
      return lessonId - QUADRI_LESSON_ID_OFFSET;
    case "cuori-gioco":
      return lessonId - 99;
    case "cuori-licita":
      return lessonId - 199;
    default:
      return lessonId;
  }
}

export function getLessonAssetNumber(lessonId: number): number {
  const courseId = getCourseIdFromLessonId(lessonId);
  if (courseId === "quadri") {
    return getLessonDisplayNumber(lessonId);
  }
  return lessonId;
}
