/**
 * Persistenza su localStorage del modulo di lezione: bozza di avanzamento
 * (passo, risposte, XP, vite, serie) e timestamp dell'ultima lezione svolta.
 *
 * Estratta da `src/app/lezioni/[lessonId]/[moduleId]/page.tsx` senza cambi di
 * comportamento: le decisioni sono nelle funzioni pure di `@/lib/lesson-module`,
 * qui resta solo l'I/O (che fallisce sempre in silenzio, come prima).
 */

import type { ModuleDraft } from "./_types";

/** Ultimo modulo completato, letto dalla home per i promemoria. */
const LAST_LESSON_KEY = "bq_last_lesson_ts";

function getDraftKey(lessonId: string, moduleId: string) {
  return `bq_module_draft_${lessonId}_${moduleId}`;
}

export function loadDraft(lessonId: string, moduleId: string): ModuleDraft | null {
  try {
    const raw = localStorage.getItem(getDraftKey(lessonId, moduleId));
    if (!raw) return null;
    return JSON.parse(raw) as ModuleDraft;
  } catch {
    return null;
  }
}

export function saveDraft(lessonId: string, moduleId: string, draft: ModuleDraft) {
  try {
    localStorage.setItem(getDraftKey(lessonId, moduleId), JSON.stringify(draft));
  } catch {}
}

export function clearDraft(lessonId: string, moduleId: string) {
  try {
    localStorage.removeItem(getDraftKey(lessonId, moduleId));
  } catch {}
}

export function setLastLessonTimestamp(nowMs: number) {
  localStorage.setItem(LAST_LESSON_KEY, String(nowMs));
}
