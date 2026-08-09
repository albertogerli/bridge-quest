/**
 * Ripetizione dilazionata — sistema di Leitner a 5 scatole.
 *
 * Sostituisce gli intervalli fissi 1/3/7 indicizzati sugli errori (rilievo
 * perizie 2026-08: "non è un vero algoritmo di ripetizione spaziata").
 *
 * Regole:
 *  - risposta SBAGLIATA → l'item (ri)parte dalla scatola 1 (ripasso a 1 giorno);
 *  - risposta GIUSTA in ripasso → avanza di scatola (intervalli crescenti);
 *  - risposta giusta oltre l'ultima scatola → padroneggiato, esce dalla coda.
 *
 * Logica pura, senza dipendenze: il hook use-spaced-review fa da adapter
 * (localStorage + React state).
 */

export const LEITNER_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const;
export const MAX_BOX = LEITNER_INTERVALS_DAYS.length; // 5

export interface SpacedItem {
  /** Scatola di Leitner corrente (1..MAX_BOX). */
  box: number;
  /** Errori cumulativi (statistica, non guida più lo scheduling). */
  wrongCount: number;
  /** ISO "YYYY-MM-DD" dell'ultimo ripasso/errore. */
  lastReview: string;
  /** ISO "YYYY-MM-DD" della prossima scadenza. */
  nextReview: string;
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function intervalForBox(box: number): number {
  const idx = Math.min(Math.max(box, 1), MAX_BOX) - 1;
  return LEITNER_INTERVALS_DAYS[idx];
}

/** Nuovo item o regressione dopo una risposta sbagliata. */
export function scheduleAfterWrong<T extends Partial<SpacedItem>>(
  existing: T | null,
  today: string
): SpacedItem {
  return {
    box: 1,
    wrongCount: (existing?.wrongCount ?? 0) + 1,
    lastReview: today,
    nextReview: addDaysISO(today, intervalForBox(1)),
  };
}

/**
 * Avanzamento dopo una risposta giusta in ripasso.
 * Ritorna null se l'item è padroneggiato (era già nell'ultima scatola).
 */
export function scheduleAfterCorrect(
  existing: Pick<SpacedItem, "box" | "wrongCount">,
  today: string
): SpacedItem | null {
  const currentBox = existing.box >= 1 ? existing.box : 1;
  if (currentBox >= MAX_BOX) return null;
  const nextBox = currentBox + 1;
  return {
    box: nextBox,
    wrongCount: existing.wrongCount,
    lastReview: today,
    nextReview: addDaysISO(today, intervalForBox(nextBox)),
  };
}

/**
 * Migrazione degli item salvati prima dell'introduzione delle scatole
 * (formato 1/3/7): erano tutti item d'errore mai consolidati → scatola 1.
 */
export function migrateLegacyBox(item: { box?: number }): number {
  return item.box && item.box >= 1 && item.box <= MAX_BOX ? item.box : 1;
}
