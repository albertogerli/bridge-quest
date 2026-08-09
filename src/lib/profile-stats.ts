/**
 * Funzioni pure della pagina profilo (statistiche, badge, progresso per corso).
 *
 * Estratte da `src/app/profilo/page.tsx` senza cambi di comportamento: la
 * logica è identica riga per riga, qui è solo testabile in isolamento
 * (`src/lib/profile-stats.test.ts`). Le letture di `localStorage` restano nel
 * chiamante e vengono passate come stringhe grezze.
 */

import {
  COURSE_COMPETENCE_CONFIGS,
  DAY_LABELS,
  type ChallengeOutcome,
  type CourseCompetence,
  type GamePerformanceStats,
  type ProfileBadge,
  type WorldProgress,
  type XpDay,
  type XpPerDay,
} from "@/app/profilo/_types";
import type { Course, World } from "@/lib/catalog";
import { MAX_LEVEL } from "@/lib/xp-levels";

/** Mappa `"<lessonId>-<moduleId>" → true` dei moduli completati. */
export type CompletedModules = Record<string, boolean>;

/** Sottoinsieme di `ChallengeData` usato per derivare l'esito di una sfida. */
export interface ChallengeLike {
  challenger_id: string;
  challenger_imps: number | null;
  opponent_imps: number | null;
  challenger_name?: string;
  opponent_name?: string;
}

/** Sottoinsieme di `ChallengeStats` usato per la percentuale di vittorie. */
export interface ChallengeStatsLike {
  played: number;
  won: number;
}

// ── Chart 1: XP per giorno ──────────────────────────────────────────────────

/**
 * XP guadagnati negli ultimi 7 giorni (oggi incluso).
 * `rawQueue` è il contenuto grezzo di `bq_game_results_queue`.
 */
export function buildXpPerDay(now: Date, rawQueue: string | null): XpPerDay {
  const days: XpDay[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({
      label: DAY_LABELS[d.getDay()],
      xp: 0,
      date: d.toISOString().slice(0, 10),
    });
  }

  try {
    if (rawQueue) {
      const queue: { timestamp: string; score: number }[] = JSON.parse(rawQueue);
      for (const entry of queue) {
        const entryDate = entry.timestamp.slice(0, 10);
        const day = days.find((d) => d.date === entryDate);
        if (day) {
          day.xp += entry.score || 0;
        }
      }
    }
  } catch {}

  const maxXp = Math.max(...days.map((d) => d.xp), 1);
  const hasData = days.some((d) => d.xp > 0);
  return { days, maxXp, hasData };
}

// ── Chart 2: competenze per corso ───────────────────────────────────────────

/** Percentuale di moduli completati per ciascuno dei 4 corsi principali. */
export function computeCourseCompetence(
  courses: Course[],
  completedModules: CompletedModules,
): CourseCompetence[] {
  return COURSE_COMPETENCE_CONFIGS.map((cfg) => {
    const course = courses.find((c) => c.id === cfg.id);
    let total = 0;
    let completed = 0;
    for (const lesson of course?.lessons ?? []) {
      for (const mod of lesson.modules) {
        total++;
        if (completedModules[`${lesson.id}-${mod.id}`]) completed++;
      }
    }
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      ...cfg,
      progress,
      completed,
      total,
    };
  });
}

// ── Chart 3: rendimento di gioco ────────────────────────────────────────────

/** Minuti di gioco in forma leggibile ("< 1 min", "42 min", "2h 5m", "3h"). */
export function formatPlayTime(totalMinutes: number): string {
  if (totalMinutes < 1) {
    return "< 1 min";
  }
  if (totalMinutes < 60) {
    return `${Math.round(totalMinutes)} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Aggregato delle 4 card di rendimento.
 * `rawQueue`/`rawMinutes` sono i contenuti grezzi di `bq_game_results_queue` e
 * `bq_total_minutes`; `streak` arriva dallo store di gioco.
 */
export function computeGamePerformance(params: {
  rawQueue: string | null;
  rawMinutes: string | null;
  streak: number;
}): GamePerformanceStats {
  const { rawQueue, rawMinutes, streak } = params;

  let totalGames = 0;
  let totalScore = 0;

  try {
    if (rawQueue) {
      const queue: { score: number }[] = JSON.parse(rawQueue);
      totalGames = queue.length;
      totalScore = queue.reduce((sum, e) => sum + (e.score || 0), 0);
    }
  } catch {}

  const bestStreak = streak;

  const totalMinutes = parseFloat(rawMinutes || "0");

  const avgXp = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;

  return { totalGames, bestStreak, timeDisplay: formatPlayTime(totalMinutes), avgXp };
}

// ── Progresso moduli / mondi ────────────────────────────────────────────────

/** Numero totale di moduli disponibili nei mondi passati. */
export function countTotalModules(worlds: World[]): number {
  return worlds.reduce(
    (sum, w) => sum + w.lessons.reduce((s, l) => s + l.modules.length, 0),
    0,
  );
}

/** Percentuale di completamento arrotondata (0 se non c'è nulla da completare). */
export function completionPercent(completed: number, total: number): number {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

/** Moduli totali/completati e percentuale di un singolo mondo. */
export function worldProgress(world: World, completedModules: CompletedModules): WorldProgress {
  const modules = world.lessons.reduce((s, l) => s + l.modules.length, 0);
  const completed = world.lessons.reduce(
    (s, l) => s + l.modules.filter((m) => completedModules[`${l.id}-${m.id}`]).length,
    0,
  );
  return { modules, completed, percent: completionPercent(completed, modules) };
}

/** Mondi completati al 100% (i mondi senza moduli non contano). */
export function countCompletedWorlds(
  worlds: World[],
  completedModules: CompletedModules,
): number {
  return worlds.filter((w) => {
    const { modules, completed } = worldProgress(w, completedModules);
    return modules > 0 && completed === modules;
  }).length;
}

// ── Livelli ─────────────────────────────────────────────────────────────────

/**
 * Nome del livello corrente e del successivo, con clamp sull'ultimo nome
 * disponibile (al livello massimo il "prossimo" coincide con il corrente).
 */
export function resolveLevelNames(
  level: number,
  levelNames: string[],
): { levelName: string; nextLevelName: string } {
  const levelName = levelNames[Math.min(level - 1, levelNames.length - 1)];
  const nextLevelName =
    level < MAX_LEVEL ? levelNames[Math.min(level, levelNames.length - 1)] : levelName;
  return { levelName, nextLevelName };
}

// ── Badge ───────────────────────────────────────────────────────────────────

/** Elenco ordinato dei badge con lo stato di sblocco. */
export function buildBadges(params: {
  totalModulesCompleted: number;
  handsPlayed: number;
  streak: number;
  xp: number;
  worldsCompleted: number;
  completionPercent: number;
}): ProfileBadge[] {
  const {
    totalModulesCompleted,
    handsPlayed,
    streak,
    xp,
    worldsCompleted,
    completionPercent: percent,
  } = params;
  return [
    { name: "Prima Presa", icon: "spade", desc: "Completa 1 modulo", earned: totalModulesCompleted >= 1 },
    { name: "Studente", icon: "book-open-check", desc: "Completa 5 moduli", earned: totalModulesCompleted >= 5 },
    { name: "Impasse Riuscita", icon: "target", desc: "Completa 10 moduli", earned: totalModulesCompleted >= 10 },
    { name: "Praticante", icon: "gamepad", desc: "Gioca 10 mani", earned: handsPlayed >= 10 },
    { name: "Streak 7gg", icon: "flame", desc: "Streak di 7 giorni", earned: streak >= 7 },
    { name: "Colpo in Bianco", icon: "target", desc: "Completa 20 moduli", earned: totalModulesCompleted >= 20 },
    { name: "Veterano", icon: "medal", desc: "Gioca 50 mani", earned: handsPlayed >= 50 },
    { name: "Piccolo Slam", icon: "star", desc: "Raggiungi 500 XP", earned: xp >= 500 },
    { name: "Mondo Completo", icon: "globe", desc: "Completa un mondo", earned: worldsCompleted >= 1 },
    { name: "Grande Slam", icon: "crown", desc: "Raggiungi 2000 XP", earned: xp >= 2000 },
    { name: "Diplomato", icon: "graduation-cap", desc: "100% completamento", earned: percent >= 100 },
    { name: "Campione", icon: "trophy", desc: "Top della classifica", earned: false },
  ];
}

/** Quanti badge sono stati sbloccati. */
export function countEarnedBadges(badges: ProfileBadge[]): number {
  return badges.filter((b) => b.earned).length;
}

// ── Sfide IMP ───────────────────────────────────────────────────────────────

/** Percentuale di sfide vinte, arrotondata (0 se non se ne è giocata nessuna). */
export function challengeWinRate(stats: ChallengeStatsLike): number {
  return stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
}

/** Esito di una sfida dal punto di vista dell'utente `userId`. */
export function describeChallenge(ch: ChallengeLike, userId: string): ChallengeOutcome {
  const isChallenger = ch.challenger_id === userId;
  const opponentName = isChallenger
    ? (ch.opponent_name || "Avversario")
    : (ch.challenger_name || "Avversario");
  const myImps = isChallenger ? ch.challenger_imps : ch.opponent_imps;
  const theirImps = isChallenger ? ch.opponent_imps : ch.challenger_imps;
  const won = (myImps ?? 0) > (theirImps ?? 0);
  const drawn = myImps === theirImps;
  const netImp = (myImps ?? 0) - (theirImps ?? 0);
  return { isChallenger, opponentName, myImps, theirImps, won, drawn, netImp };
}

// ── Fiches ──────────────────────────────────────────────────────────────────

/** Fiches derivate dagli XP (1 fiche ogni 10 XP). */
export function computeFiches(xp: number): number {
  return Math.floor(xp / 10);
}
