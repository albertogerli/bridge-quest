import { getCourseIdFromLessonId } from "@/data/lesson-meta";

/**
 * Le lezioni del primo modulo del corso Fiori, «Il gioco della carta»
 * (lezioni 1–6): lì non si parla ancora di dichiarazione.
 *
 * Serve a non mostrare la licita nei compiti di quelle lezioni: un allievo
 * alla prima lezione di gioco della carta che vede un diagramma d'asta pensa
 * di dover capire anche quello (feedback Trevissoi del 12/10/2026).
 */
export function senzaLicita(lessonId: number | null | undefined): boolean {
  if (lessonId == null) return false;
  return getCourseIdFromLessonId(lessonId) === "fiori" && lessonId >= 1 && lessonId <= 6;
}
