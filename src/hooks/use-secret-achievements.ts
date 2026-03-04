"use client";

import { useEffect, useState } from "react";

export interface SecretAchievement {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const SECRET_ACHIEVEMENTS: SecretAchievement[] = [
  {
    id: "nottambulo",
    name: "Nottambulo",
    icon: "🦉",
    description: "Hai giocato dopo mezzanotte",
  },
  {
    id: "schiacciasassi",
    name: "Schiacciasassi",
    icon: "🔥",
    description: "5 vittorie consecutive",
  },
  {
    id: "primo-sangue",
    name: "Primo Sangue",
    icon: "⚔️",
    description: "Hai vinto la tua prima mano",
  },
  {
    id: "speedster",
    name: "Speedster",
    icon: "⚡",
    description: "Completa una mano in meno di 30 secondi",
  },
  {
    id: "maratoneta",
    name: "Maratoneta",
    icon: "🏃",
    description: "10 mani giocate in una sessione",
  },
  {
    id: "tuttofare",
    name: "Tuttofare",
    icon: "🌍",
    description: "Completa almeno 1 lezione in tutti e 4 i corsi",
  },
  {
    id: "stakanovista",
    name: "Stakanovista",
    icon: "📅",
    description: "Raggiungi una striscia di 30 giorni",
  },
  {
    id: "re-delle-fiches",
    name: "Re delle Fiches",
    icon: "🪙",
    description: "Accumula 500+ fiches",
  },
  {
    id: "collezionista",
    name: "Collezionista",
    icon: "🛍️",
    description: "Acquista 3+ oggetti dal negozio",
  },
  {
    id: "campione-segreto",
    name: "Campione Segreto",
    icon: "👑",
    description: "Ottieni tutti gli altri 9 achievement segreti",
  },
];

export function useSecretAchievements() {
  const [earnedSecretAchievements, setEarnedSecretAchievements] = useState<
    string[]
  >([]);
  const [newAchievements, setNewAchievements] = useState<SecretAchievement[]>(
    []
  );

  useEffect(() => {
    // Load earned achievements from localStorage
    const stored = localStorage.getItem("bq_secret_achievements");
    const earned = stored ? JSON.parse(stored) : [];
    setEarnedSecretAchievements(earned);

    // Check for new achievements on mount
    const newlyUnlocked = checkAchievements(earned);
    if (newlyUnlocked.length > 0) {
      setNewAchievements(newlyUnlocked);
    }
  }, []);

  const checkAchievements = (
    currentEarned: string[] = earnedSecretAchievements
  ): SecretAchievement[] => {
    const newlyUnlocked: SecretAchievement[] = [];

    // Nottambulo - Play after midnight
    if (!currentEarned.includes("nottambulo")) {
      const hour = new Date().getHours();
      if (hour >= 0 && hour < 5) {
        newlyUnlocked.push(
          SECRET_ACHIEVEMENTS.find((a) => a.id === "nottambulo")!
        );
      }
    }

    // Schiacciasassi - 5 consecutive wins
    if (!currentEarned.includes("schiacciasassi")) {
      const consecutiveWins = parseInt(
        localStorage.getItem("bq_consecutive_wins") || "0"
      );
      if (consecutiveWins >= 5) {
        newlyUnlocked.push(
          SECRET_ACHIEVEMENTS.find((a) => a.id === "schiacciasassi")!
        );
      }
    }

    // Primo Sangue - Win first hand
    if (!currentEarned.includes("primo-sangue")) {
      const handsWon = parseInt(localStorage.getItem("bq_hands_won") || "0");
      if (handsWon >= 1) {
        newlyUnlocked.push(
          SECRET_ACHIEVEMENTS.find((a) => a.id === "primo-sangue")!
        );
      }
    }

    // Speedster - Complete hand in under 30 seconds
    if (!currentEarned.includes("speedster")) {
      const fastestHand = parseInt(
        localStorage.getItem("bq_fastest_hand") || "999999"
      );
      if (fastestHand < 30000) {
        newlyUnlocked.push(
          SECRET_ACHIEVEMENTS.find((a) => a.id === "speedster")!
        );
      }
    }

    // Maratoneta - 10 hands in one session
    if (!currentEarned.includes("maratoneta")) {
      const sessionHands = parseInt(
        localStorage.getItem("bq_session_hands") || "0"
      );
      if (sessionHands >= 10) {
        newlyUnlocked.push(
          SECRET_ACHIEVEMENTS.find((a) => a.id === "maratoneta")!
        );
      }
    }

    // Tuttofare - Complete at least 1 lesson in each of 4 courses
    if (!currentEarned.includes("tuttofare")) {
      const completedLessons = JSON.parse(
        localStorage.getItem("bq_completed_lessons") || "[]"
      );
      const hasFiori = completedLessons.some(
        (id: number) => id >= 0 && id <= 12
      );
      const hasQuadri = completedLessons.some(
        (id: number) => id >= 1 && id <= 12
      );
      const hasCuoriGioco = completedLessons.some(
        (id: number) => id >= 100 && id <= 109
      );
      const hasCuoriLicita = completedLessons.some(
        (id: number) => id >= 200 && id <= 213
      );

      if (hasFiori && hasQuadri && hasCuoriGioco && hasCuoriLicita) {
        newlyUnlocked.push(
          SECRET_ACHIEVEMENTS.find((a) => a.id === "tuttofare")!
        );
      }
    }

    // Stakanovista - 30-day streak
    if (!currentEarned.includes("stakanovista")) {
      const streak = parseInt(localStorage.getItem("bq_streak") || "0");
      if (streak >= 30) {
        newlyUnlocked.push(
          SECRET_ACHIEVEMENTS.find((a) => a.id === "stakanovista")!
        );
      }
    }

    // Re delle Fiches - 500+ fiches
    if (!currentEarned.includes("re-delle-fiches")) {
      const xp = parseInt(localStorage.getItem("bq_xp") || "0");
      const fiches = Math.floor(xp / 10);
      if (fiches >= 500) {
        newlyUnlocked.push(
          SECRET_ACHIEVEMENTS.find((a) => a.id === "re-delle-fiches")!
        );
      }
    }

    // Collezionista - Buy 3+ items from shop
    if (!currentEarned.includes("collezionista")) {
      const shopOwned = JSON.parse(
        localStorage.getItem("bq_shop_owned") || "[]"
      );
      if (shopOwned.length >= 3) {
        newlyUnlocked.push(
          SECRET_ACHIEVEMENTS.find((a) => a.id === "collezionista")!
        );
      }
    }

    // Campione Segreto - Earn all other 9 achievements
    if (!currentEarned.includes("campione-segreto")) {
      const otherAchievements = SECRET_ACHIEVEMENTS.filter(
        (a) => a.id !== "campione-segreto"
      ).map((a) => a.id);
      const hasAllOthers = otherAchievements.every((id) =>
        currentEarned.includes(id)
      );

      if (hasAllOthers) {
        newlyUnlocked.push(
          SECRET_ACHIEVEMENTS.find((a) => a.id === "campione-segreto")!
        );
      }
    }

    // Save newly unlocked achievements
    if (newlyUnlocked.length > 0) {
      const updatedEarned = [
        ...currentEarned,
        ...newlyUnlocked.map((a) => a.id),
      ];
      localStorage.setItem(
        "bq_secret_achievements",
        JSON.stringify(updatedEarned)
      );
      setEarnedSecretAchievements(updatedEarned);
    }

    return newlyUnlocked;
  };

  const earnedSecretAchievementObjects = SECRET_ACHIEVEMENTS.filter((a) =>
    earnedSecretAchievements.includes(a.id)
  );

  return {
    checkAchievements: () => checkAchievements(),
    earnedSecretAchievements: earnedSecretAchievementObjects,
    earnedSecretAchievementIds: earnedSecretAchievements,
    totalSecretAchievements: SECRET_ACHIEVEMENTS.length,
    newAchievements,
    clearNewAchievements: () => setNewAchievements([]),
  };
}
