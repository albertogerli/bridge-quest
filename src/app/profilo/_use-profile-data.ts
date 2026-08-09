"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useSharedAuth } from "@/contexts/auth-provider";
import { useCatalog } from "@/store/use-catalog-store";
import { useGameStore } from "@/store/use-game-store";
import { useGameHistory, type GameStats } from "@/hooks/use-game-history";
import { useSecretAchievements, type SecretAchievement } from "@/hooks/use-secret-achievements";
import { useChallenges, type ChallengeData, type ChallengeStats } from "@/hooks/use-challenges";
import { useShopCosmetics, type ShopCosmetics } from "@/hooks/use-shop-cosmetics";
import { getProfileConfig, type UserProfile } from "@/hooks/use-profile";
import { getLevel, getXpInLevel, getLevelProgress, getXpForNextLevel } from "@/lib/xp-levels";
import { reportError } from "@/lib/report-error";
import type { Course, World } from "@/lib/catalog";
import {
  buildBadges,
  buildGamesPerDay,
  computeCourseCompetence,
  computeFiches,
  computeGamePerformance,
  completionPercent as toCompletionPercent,
  countCompletedModules,
  countCompletedWorlds,
  countEarnedBadges,
  countTotalModules,
  resolveLevelNames,
  type CompletedModules,
} from "@/lib/profile-stats";
import { getInviteCount } from "@/lib/share";
import type {
  CourseCompetence,
  GamePerformanceStats,
  GamesPerDay,
  PendingAchievement,
  ProfileBadge,
} from "./_types";

/** Legge una chiave di localStorage senza propagare le eccezioni (Safari privato). */
function readLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export interface ProfileData {
  // Progressi dallo store di gioco
  xp: number;
  streak: number;
  handsPlayed: number;
  completedModules: CompletedModules;
  // Catalogo
  courses: Course[];
  allWorlds: World[];
  // Livello
  level: number;
  xpInLevel: number;
  levelProgress: number;
  xpForNext: number;
  levelName: string;
  nextLevelName: string;
  // Moduli e mondi
  totalModulesCompleted: number;
  totalModulesAvailable: number;
  completionPercent: number;
  worldsCompleted: number;
  totalWorldsCount: number;
  // Badge
  badges: ProfileBadge[];
  earnedCount: number;
  // Grafici e statistiche
  gameStats: GameStats;
  gamesPerDay: GamesPerDay;
  courseCompetence: CourseCompetence[];
  gamePerformanceStats: GamePerformanceStats;
  // Achievement segreti
  earnedSecretAchievements: SecretAchievement[];
  totalSecretAchievements: number;
  pendingAchievement: PendingAchievement | null;
  setPendingAchievement: Dispatch<SetStateAction<PendingAchievement | null>>;
  /** Resta true dopo il primo sblocco: preserva l'animazione di uscita del popup. */
  achievementPopupArmed: boolean;
  // Sfide IMP
  challengeHistory: ChallengeData[];
  challengeStats: ChallengeStats | null;
  // Profilo locale e inviti
  cosmetics: ShopCosmetics;
  currentProfile: UserProfile;
  setCurrentProfile: Dispatch<SetStateAction<UserProfile>>;
  invitesSent: number;
  setInvitesSent: Dispatch<SetStateAction<number>>;
}

/**
 * Caricamento e derivazione dei dati della pagina profilo.
 *
 * Estratto da `src/app/profilo/page.tsx` senza cambi di comportamento: stessi
 * store, stessa sequenza di effetti e stesse formule (ora in
 * `@/lib/profile-stats`).
 */
export function useProfileData(): ProfileData {
  const { user, profile: authProfile } = useSharedAuth();
  const { courses } = useCatalog();
  const allWorlds = useMemo(() => courses.flatMap((c) => c.worlds), [courses]);
  const cosmetics = useShopCosmetics();

  const xp = useGameStore((s) => s.xp);
  const streak = useGameStore((s) => s.streak);
  const handsPlayed = useGameStore((s) => s.handsPlayed);
  const completedModules = useGameStore((s) => s.completedModules);

  const [currentProfile, setCurrentProfile] = useState<UserProfile>("adulto");
  const [invitesSent, setInvitesSent] = useState(0);

  // `records` è lo stato React dello storico `bq_game_history`: le derivate
  // qui sotto lo tengono nelle dipendenze e si ricalcolano quando cambia.
  const { records, getStats } = useGameHistory();
  // Memoizzato su `records`: senza, ogni render produrrebbe un oggetto nuovo e
  // le derivate qui sotto si ricalcolerebbero a vuoto.
  const gameStats = useMemo(() => getStats(), [getStats]);
  const { checkAchievements, earnedSecretAchievements, totalSecretAchievements } =
    useSecretAchievements();
  const [pendingAchievement, setPendingAchievement] = useState<PendingAchievement | null>(null);
  // Resta montato dopo il primo sblocco: preserva l'animazione di uscita.
  // Armato insieme all'achievement (vedi effetto sotto): un effetto dedicato
  // che reagiva a `pendingAchievement` era un render a cascata inutile.
  const [achievementPopupArmed, setAchievementPopupArmed] = useState(false);
  const { getHistory, getStats: getChallengeStats } = useChallenges();
  const [challengeHistory, setChallengeHistory] = useState<ChallengeData[]>([]);
  const [challengeStats, setChallengeStats] = useState<ChallengeStats | null>(null);

  // ===== Chart Data Computations =====

  // Chart 1: partite per giorno (ultimi 7 giorni), dallo storico
  const gamesPerDay = useMemo(() => buildGamesPerDay(new Date(), records), [records]);

  // Chart 2: Course competence (% completed per course)
  const courseCompetence = useMemo(
    () => computeCourseCompetence(courses, completedModules),
    [completedModules, courses],
  );

  // Chart 3: Game performance stats — stessa fonte dell'intestazione
  // (`gameStats`) più streak dallo store e minuti da localStorage. Le
  // dipendenze reali sostituiscono il vecchio `[]`, che fotografava
  // localStorage al mount e non si aggiornava più.
  const gamePerformanceStats = useMemo(
    () =>
      computeGamePerformance({
        gameStats,
        rawMinutes: readLocalStorage("bq_total_minutes"),
        streak,
      }),
    [gameStats, streak],
  );

  useEffect(() => {
    const newOnes = checkAchievements();
    if (newOnes.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- gli achievement segreti stanno in localStorage: si possono controllare solo dopo il mount (stesso pattern degli altri stati client-only)
      setPendingAchievement(newOnes[0]);
      setAchievementPopupArmed(true);
    }
  }, [checkAchievements]);

  useEffect(() => {
    try {
      // Sync fiches with negozio (derived from current XP).
      localStorage.setItem("bq_fiches", String(computeFiches(xp)));
      const p = localStorage.getItem("bq_profile") as UserProfile | null;
      if (p) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- stato client-only (localStorage) letto dopo il mount per evitare hydration mismatch SSR: pattern intenzionale
        setCurrentProfile(p);
      } else if (authProfile?.profile_type) {
        // Sync from Supabase if localStorage is empty (e.g. after clearing data)
        const dbProfile = authProfile.profile_type as UserProfile;
        setCurrentProfile(dbProfile);
        localStorage.setItem("bq_profile", dbProfile);
      }
      setInvitesSent(getInviteCount());
    } catch {}
  }, [authProfile, xp]);

  // Fetch challenge history & stats
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [history, stats] = await Promise.all([getHistory(10), getChallengeStats()]);
        if (history) setChallengeHistory(history as ChallengeData[]);
        if (stats) setChallengeStats(stats);
      } catch (e) {
        reportError("profilo:challenge-history", e);
      }
    })();
  }, [user, getHistory, getChallengeStats]);

  const level = getLevel(xp);
  const xpInLevel = getXpInLevel(xp);
  const levelProgress = getLevelProgress(xp);
  const xpForNext = getXpForNextLevel(xp);
  // `currentProfile` è già il profilo locale: parte da "adulto" (come il render
  // server) e viene allineato a `bq_profile` dopo il mount. Leggere qui
  // localStorage durante il render produceva un mismatch di idratazione.
  const profileLevelNames = getProfileConfig(currentProfile).levelNames;
  const { levelName, nextLevelName } = resolveLevelNames(level, profileLevelNames);

  // Solo i moduli ancora a catalogo: le chiavi dei moduli ritirati facevano
  // superare il 100% di completamento.
  const totalModulesCompleted = countCompletedModules(allWorlds, completedModules);
  const totalModulesAvailable = countTotalModules(allWorlds);
  const completionPercent = toCompletionPercent(totalModulesCompleted, totalModulesAvailable);

  // Count completed worlds (all courses)
  const worldsCompleted = countCompletedWorlds(allWorlds, completedModules);
  const totalWorldsCount = allWorlds.length;

  const badges = buildBadges({
    totalModulesCompleted,
    handsPlayed,
    streak,
    xp,
    worldsCompleted,
    completionPercent,
  });
  const earnedCount = countEarnedBadges(badges);

  return {
    xp,
    streak,
    handsPlayed,
    completedModules,
    courses,
    allWorlds,
    level,
    xpInLevel,
    levelProgress,
    xpForNext,
    levelName,
    nextLevelName,
    totalModulesCompleted,
    totalModulesAvailable,
    completionPercent,
    worldsCompleted,
    totalWorldsCount,
    badges,
    earnedCount,
    gameStats,
    gamesPerDay,
    courseCompetence,
    gamePerformanceStats,
    earnedSecretAchievements,
    totalSecretAchievements,
    pendingAchievement,
    setPendingAchievement,
    achievementPopupArmed,
    challengeHistory,
    challengeStats,
    cosmetics,
    currentProfile,
    setCurrentProfile,
    invitesSent,
    setInvitesSent,
  };
}
