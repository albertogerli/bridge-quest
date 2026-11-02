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

/**
 * Se all'allievo si dice solo «almeno X prese», senza il contratto.
 *
 * L'insegnante lo sceglie nel compito (`assignments.solo_obiettivo`, i «due
 * set di smazzate» chiesti da Trevissoi il 02/11/2026); se non l'ha scelto —
 * o la colonna non c'è ancora — decide la lezione della mano, come prima.
 */
export function soloObiettivo(sceltaDelCompito: boolean | null | undefined, lessonId: number | null | undefined): boolean {
  if (typeof sceltaDelCompito === "boolean") return sceltaDelCompito;
  return senzaLicita(lessonId);
}
