"use client";

import { useState, useEffect, useCallback } from "react";

export interface WeeklyObjective {
  id: string;
  title: string;
  description: string;
  emoji: string;
  target: number;
  current: number;
  completed: boolean;
  xpReward: number;
}

interface WeeklyState {
  weekKey: string;
  objectives: WeeklyObjective[];
  allCompleted: boolean;
  bonusClaimed: boolean;
}

// Pool of possible objectives
const OBJECTIVE_POOL = [
  { id: "quiz", title: "Rispondi ai quiz", description: "Completa {target} quiz", emoji: "📝", targets: [5, 8, 10], xp: 30, storageKey: "bq_weekly_quizzes" },
  { id: "hands", title: "Gioca le mani", description: "Gioca {target} mani", emoji: "🃏", targets: [3, 5, 8], xp: 40, storageKey: "bq_hands_played" },
  { id: "xp", title: "Guadagna XP", description: "Guadagna {target} XP", emoji: "⭐", targets: [100, 200, 300], xp: 25, storageKey: "bq_xp" },
  { id: "modules", title: "Completa moduli", description: "Completa {target} moduli", emoji: "📚", targets: [3, 5, 7], xp: 35, storageKey: "bq_completed_modules" },
  { id: "streak", title: "Mantieni la serie", description: "Gioca per {target} giorni di fila", emoji: "🔥", targets: [3, 5, 7], xp: 50, storageKey: "bq_streak" },
  { id: "minigames", title: "Gioca mini-giochi", description: "Gioca {target} mini-giochi", emoji: "🎮", targets: [3, 5, 8], xp: 30, storageKey: "bq_weekly_minigames" },
  { id: "daily", title: "Mano del giorno", description: "Gioca {target} mani del giorno", emoji: "📅", targets: [1, 3, 5], xp: 40, storageKey: "bq_daily_hand_total" },
  { id: "perfect", title: "Risposte perfette", description: "Dai {target} risposte corrette di fila", emoji: "💯", targets: [5, 8, 12], xp: 35, storageKey: "bq_weekly_perfect" },
];

function getWeekKey(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
  const week = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Deterministic selection based on week
function selectObjectives(weekKey: string): WeeklyObjective[] {
  const hash = weekKey.split("").reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0);
  const shuffled = [...OBJECTIVE_POOL].sort((a, b) => {
    const ha = (hash * 7 + a.id.charCodeAt(0)) % 100;
    const hb = (hash * 7 + b.id.charCodeAt(0)) % 100;
    return ha - hb;
  });

  return shuffled.slice(0, 3).map((obj, i) => {
    const targetIdx = Math.abs(hash + i) % obj.targets.length;
    const target = obj.targets[targetIdx];
    return {
      id: obj.id,
      title: obj.title,
      description: obj.description.replace("{target}", String(target)),
      emoji: obj.emoji,
      target,
      current: 0,
      completed: false,
      xpReward: obj.xp,
    };
  });
}

export function useWeeklyObjectives() {
  const [state, setState] = useState<WeeklyState>({
    weekKey: "",
    objectives: [],
    allCompleted: false,
    bonusClaimed: false,
  });

  const loadProgress = useCallback(() => {
    const weekKey = getWeekKey();
    const saved = localStorage.getItem(`bq_objectives_${weekKey}`);

    if (saved) {
      const parsed = JSON.parse(saved) as WeeklyState;
      setState(parsed);
      return;
    }

    // Generate new objectives for this week
    const objectives = selectObjectives(weekKey);

    // Load current progress from localStorage
    const xpStart = parseInt(localStorage.getItem(`bq_objectives_xp_start_${weekKey}`) || localStorage.getItem("bq_xp") || "0", 10);
    if (!localStorage.getItem(`bq_objectives_xp_start_${weekKey}`)) {
      localStorage.setItem(`bq_objectives_xp_start_${weekKey}`, String(xpStart));
    }

    const modulesStart = parseInt(localStorage.getItem(`bq_objectives_modules_start_${weekKey}`) || "0", 10);
    if (!localStorage.getItem(`bq_objectives_modules_start_${weekKey}`)) {
      const cm = localStorage.getItem("bq_completed_modules");
      const count = cm ? Object.keys(JSON.parse(cm)).length : 0;
      localStorage.setItem(`bq_objectives_modules_start_${weekKey}`, String(count));
    }

    setState({ weekKey, objectives, allCompleted: false, bonusClaimed: false });
  }, []);

  // Refresh progress from localStorage
  const refreshProgress = useCallback(() => {
    const weekKey = getWeekKey();
    const saved = localStorage.getItem(`bq_objectives_${weekKey}`);
    let objectives: WeeklyObjective[];

    if (saved) {
      objectives = (JSON.parse(saved) as WeeklyState).objectives;
    } else {
      objectives = selectObjectives(weekKey);
    }

    const xpStart = parseInt(localStorage.getItem(`bq_objectives_xp_start_${weekKey}`) || "0", 10);
    const currentXp = parseInt(localStorage.getItem("bq_xp") || "0", 10);
    const modulesStart = parseInt(localStorage.getItem(`bq_objectives_modules_start_${weekKey}`) || "0", 10);
    const cm = localStorage.getItem("bq_completed_modules");
    const currentModules = cm ? Object.keys(JSON.parse(cm)).length : 0;
    const currentStreak = parseInt(localStorage.getItem("bq_streak") || "0", 10);
    const handsPlayed = parseInt(localStorage.getItem("bq_hands_played") || "0", 10);
    const weeklyMinigames = parseInt(localStorage.getItem("bq_weekly_minigames") || "0", 10);
    const weeklyQuizzes = parseInt(localStorage.getItem("bq_weekly_quizzes") || "0", 10);
    const dailyTotal = parseInt(localStorage.getItem("bq_daily_hand_total") || "0", 10);
    const weeklyPerfect = parseInt(localStorage.getItem("bq_weekly_perfect") || "0", 10);

    const updated = objectives.map((obj) => {
      let current = 0;
      switch (obj.id) {
        case "xp":
          current = Math.max(0, currentXp - xpStart);
          break;
        case "modules":
          current = Math.max(0, currentModules - modulesStart);
          break;
        case "streak":
          current = currentStreak;
          break;
        case "hands":
          current = handsPlayed;
          break;
        case "minigames":
          current = weeklyMinigames;
          break;
        case "quiz":
          current = weeklyQuizzes;
          break;
        case "daily":
          current = dailyTotal;
          break;
        case "perfect":
          current = weeklyPerfect;
          break;
      }
      return { ...obj, current: Math.min(current, obj.target), completed: current >= obj.target };
    });

    const allCompleted = updated.every((o) => o.completed);
    const bonusClaimed = saved ? (JSON.parse(saved) as WeeklyState).bonusClaimed : false;
    const newState = { weekKey, objectives: updated, allCompleted, bonusClaimed };

    localStorage.setItem(`bq_objectives_${weekKey}`, JSON.stringify(newState));
    setState(newState);
  }, []);

  const claimBonus = useCallback(() => {
    if (!state.allCompleted || state.bonusClaimed) return;
    const bonus = 100; // Bonus XP for completing all 3
    const prev = parseInt(localStorage.getItem("bq_xp") || "0", 10);
    localStorage.setItem("bq_xp", String(prev + bonus));

    const newState = { ...state, bonusClaimed: true };
    localStorage.setItem(`bq_objectives_${state.weekKey}`, JSON.stringify(newState));
    setState(newState);
    return bonus;
  }, [state]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Refresh every 5 seconds when tab is visible
  useEffect(() => {
    const interval = setInterval(refreshProgress, 5000);
    return () => clearInterval(interval);
  }, [refreshProgress]);

  return {
    objectives: state.objectives,
    allCompleted: state.allCompleted,
    bonusClaimed: state.bonusClaimed,
    claimBonus,
    refreshProgress,
  };
}
