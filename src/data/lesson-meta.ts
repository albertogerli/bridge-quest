import { PROGRAMMA_PRIMO_LIVELLO } from "@/lib/programma-corso";

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

/**
 * Lezione del sito → lezione del programma del Corso di Primo Livello
 * (`src/lib/programma-corso.ts`, campo `lezioniSito`). La Lezione 0 resta 0:
 * nel programma non c'è, è l'introduzione alle regole.
 */
const NUMERO_PROGRAMMA: Record<number, number> = (() => {
  const m: Record<number, number> = { 0: 0 };
  for (const l of PROGRAMMA_PRIMO_LIVELLO) for (const id of l.lezioniSito) m[id] = l.numero;
  return m;
})();

export function getLessonDisplayNumber(lessonId: number): number {
  switch (getCourseIdFromLessonId(lessonId)) {
    case "fiori":
      // Il numero del programma ufficiale della Commissione, non l'id: due
      // lezioni del sito possono essere le due parti della stessa lezione
      // (Trevissoi, 06/11/2026). Id, progressi, smazzate («1-N») e video non
      // cambiano: cambia solo il numero che si legge.
      return NUMERO_PROGRAMMA[lessonId] ?? lessonId;
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
