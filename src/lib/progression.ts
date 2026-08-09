/**
 * Regole di progressione didattica (estratte dalle pagine lezioni — rilievo
 * perizie 2026-08: business logic inline nella UI).
 *
 * Regole:
 *  - un modulo è bloccato finché il precedente della stessa lezione non è
 *    completato (il primo è sempre sbloccato);
 *  - il mondo N+1 si sblocca quando il mondo N è completato almeno al 50%.
 */

export interface ProgressionModule {
  id: string;
}

export interface ProgressionLesson {
  id: string | number;
  modules: ProgressionModule[];
}

export interface ProgressionWorld {
  lessons: ProgressionLesson[];
}

export type CompletedMap = Record<string, boolean | undefined>;

/** Chiave canonica di completamento modulo (stessa dello store zustand). */
export function moduleKey(lessonId: string | number, moduleId: string): string {
  return `${lessonId}-${moduleId}`;
}

export function isModuleCompleted(
  lesson: ProgressionLesson,
  moduleId: string,
  completed: CompletedMap
): boolean {
  return !!completed[moduleKey(lesson.id, moduleId)];
}

/** Un modulo è bloccato se il precedente non è completato. */
export function isModuleLocked(
  lesson: ProgressionLesson,
  moduleIndex: number,
  completed: CompletedMap
): boolean {
  if (moduleIndex <= 0) return false;
  const prev = lesson.modules[moduleIndex - 1];
  return !isModuleCompleted(lesson, prev.id, completed);
}

/** Percentuale di completamento di un mondo (0–100, arrotondata). */
export function worldCompletionPct(
  world: ProgressionWorld,
  completed: CompletedMap
): number {
  let total = 0;
  let done = 0;
  for (const lesson of world.lessons) {
    total += lesson.modules.length;
    for (const mod of lesson.modules) {
      if (isModuleCompleted(lesson, mod.id, completed)) done += 1;
    }
  }
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

export const WORLD_UNLOCK_THRESHOLD_PCT = 50;

/**
 * Il mondo N+1 è bloccato finché il mondo N non raggiunge la soglia.
 * Un mondo precedente senza moduli non blocca (comportamento storico).
 */
export function isWorldLocked(
  worlds: ProgressionWorld[],
  worldIndex: number,
  completed: CompletedMap
): boolean {
  if (worldIndex <= 0) return false;
  const prev = worlds[worldIndex - 1];
  const prevTotal = prev.lessons.reduce((sum, l) => sum + l.modules.length, 0);
  if (prevTotal === 0) return false;
  return worldCompletionPct(prev, completed) < WORLD_UNLOCK_THRESHOLD_PCT;
}
