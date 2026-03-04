/**
 * FIGB Bridge LAB - Weekly Themed Challenge System
 * Rotating challenges based on ISO week number with XP multipliers and exclusive badges
 */

export interface WeeklyChallenge {
  id: number;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  xpMultiplier: number;
  badgeName: string;
  tips: string[];
}

export const WEEKLY_CHALLENGES: WeeklyChallenge[] = [
  {
    id: 0,
    name: "Settimana dell'Impasse",
    description: "Padroneggia l'arte dell'impasse: quando e come effettuare manovre di posizione vincenti",
    icon: "🎯",
    gradient: "from-blue-500 via-indigo-500 to-purple-600",
    xpMultiplier: 1.5,
    badgeName: "Maestro dell'Impasse",
    tips: [
      "Identifica le figure da catturare nelle mani avversarie",
      "Gioca verso la mano con le figure, non dalla mano con le figure",
      "Conta i punti: l'impasse ha più successo quando gli onori mancanti sono divisi"
    ]
  },
  {
    id: 1,
    name: "Settimana degli Squeeze",
    description: "Metti sotto pressione gli avversari con squeeze semplici e doppi",
    icon: "🔧",
    gradient: "from-purple-500 via-pink-500 to-rose-600",
    xpMultiplier: 1.5,
    badgeName: "Maestro dello Squeeze",
    tips: [
      "Perdi le prese che devi perdere subito per creare pressione",
      "Identifica l'avversario che controlla due colori",
      "Mantieni le comunicazioni tra le due mani fino all'ultimo"
    ]
  },
  {
    id: 2,
    name: "Settimana dei Sacrifici",
    description: "Impara quando sacrificarsi per impedire contratti avversari vantaggiosi",
    icon: "⚔️",
    gradient: "from-red-500 via-orange-500 to-amber-600",
    xpMultiplier: 1.5,
    badgeName: "Guerriero del Sacrificio",
    tips: [
      "Calcola il valore del contratto avversario vs il tuo contro",
      "Considera la vulnerabilità prima di sacrificarti",
      "Un sacrificio economico vale oro: meglio -300 che concedere manche"
    ]
  },
  {
    id: 3,
    name: "Settimana della Difesa",
    description: "Affina le tue abilità difensive: attacchi, segnali e cooperazione con il compagno",
    icon: "🛡️",
    gradient: "from-slate-500 via-gray-600 to-zinc-700",
    xpMultiplier: 1.5,
    badgeName: "Difensore Implacabile",
    tips: [
      "Scegli l'attacco giusto: preferenza, quarta migliore, o singleton?",
      "Segnala al compagno con le scartine: pari=gradimento, dispari=rifiuto",
      "Conta le prese del dichiarante per capire cosa deve fare"
    ]
  },
  {
    id: 4,
    name: "Settimana Sans Atout",
    description: "Domina il gioco a senza atout: affrancamenti, comunicazioni e tempi",
    icon: "🃏",
    gradient: "from-cyan-500 via-sky-500 to-blue-600",
    xpMultiplier: 1.5,
    badgeName: "Re del Senza Atout",
    tips: [
      "Conta le prese: quante ne hai, quante te ne servono?",
      "Affranca il colore lungo prima che gli avversari prendano il controllo",
      "Gestisci gli ingressi: non rimanere isolato nella mano sbagliata"
    ]
  },
  {
    id: 5,
    name: "Settimana delle Comunicazioni",
    description: "Mantieni le comunicazioni tra le mani: ingressi, sbloccaggi e manovre di Bath",
    icon: "🌉",
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    xpMultiplier: 1.5,
    badgeName: "Architetto dei Ponti",
    tips: [
      "Identifica dove hai bisogno di ingressi per il gioco successivo",
      "Sblocca onori alti quando necessario per creare passaggi",
      "La manovra di Bath: lascia un onore alto per mantenere il controllo"
    ]
  },
  {
    id: 6,
    name: "Settimana dei Fit Maggiori",
    description: "Eccelli nei contratti a colore maggiore: gestione atout, tagli e controllo",
    icon: "♠️",
    gradient: "from-indigo-600 via-violet-600 to-purple-700",
    xpMultiplier: 1.5,
    badgeName: "Campione dei Maggiori",
    tips: [
      "Tira atout quando hai il controllo, lascia atout fuori per tagliare",
      "Conta gli atout avversari per sapere quando hai il controllo",
      "Usa i tagli del morto per creare prese extra"
    ]
  },
  {
    id: 7,
    name: "Settimana dei Contri",
    description: "Padroneggia contri informativi, punitivi e surcontri strategici",
    icon: "⚡",
    gradient: "from-yellow-500 via-amber-500 to-orange-600",
    xpMultiplier: 1.5,
    badgeName: "Fulmine Contrante",
    tips: [
      "Il contro informativo a basso livello chiede al compagno di parlare",
      "Il contro punitivo richiede forza nel colore dichiarato dagli avversari",
      "Surcontra solo quando sei sicuro di fare il contratto"
    ]
  },
  {
    id: 8,
    name: "Settimana dello Slam",
    description: "Raggiungi e realizza contratti di slam: controllo chiavi, cue-bid e gioco preciso",
    icon: "👑",
    gradient: "from-violet-600 via-purple-600 to-fuchsia-700",
    xpMultiplier: 1.5,
    badgeName: "Sovrano dello Slam",
    tips: [
      "Usa Blackwood (4SA) per chiedere assi prima di dichiarare slam",
      "Controlla che non manchino 2 assi per il piccolo slam, 1 per il grande",
      "Al gioco, evita impasse rischiose: cerca linee di gioco sicure"
    ]
  },
  {
    id: 9,
    name: "Settimana del Gioco di Mano",
    description: "Perfeziona il ruolo del dichiarante: pianificazione, conteggio e esecuzione",
    icon: "🎭",
    gradient: "from-pink-500 via-rose-500 to-red-600",
    xpMultiplier: 1.5,
    badgeName: "Maestro Dichiarante",
    tips: [
      "Prima di giocare dal morto, fai il piano: conta prese e perde",
      "Considera tutte le linee possibili, scegli la più probabile",
      "Gioca veloce quando la linea è chiara, rifletti nelle posizioni critiche"
    ]
  },
  {
    id: 10,
    name: "Settimana della Licita Competitiva",
    description: "Naviga licitazioni competitive: interventi, surcontri, appoggi competitivi",
    icon: "🥊",
    gradient: "from-orange-600 via-red-600 to-rose-700",
    xpMultiplier: 1.5,
    badgeName: "Lottatore Competitivo",
    tips: [
      "Intervieni con 5+ carte e buoni punti, o distribuzione estrema",
      "Il surcontro dopo intervento avversario mostra 10+ punti",
      "In competizione: compra il contratto o spingi gli avversari troppo in alto"
    ]
  },
  {
    id: 11,
    name: "Settimana delle Aperture",
    description: "Perfeziona le aperture di 1 a colore, 1SA, deboli e forti",
    icon: "🚀",
    gradient: "from-sky-500 via-blue-600 to-indigo-700",
    xpMultiplier: 1.5,
    badgeName: "Pioniere delle Aperture",
    tips: [
      "Apri di 1 con 12+ punti e distribuzione 4-4-3-2 o migliore",
      "1SA richiede 15-17 punti (o 12-14 debole) e mano bilanciata",
      "Aperture deboli (2♥/♠/♦/♣) mostrano 6+ carte e 6-10 punti"
    ]
  }
];

/**
 * Get the current weekly challenge based on ISO week number
 */
export function getCurrentWeeklyChallenge(): WeeklyChallenge {
  const now = Date.now();
  const weeksSinceEpoch = Math.floor(now / (7 * 24 * 3600 * 1000));
  const challengeIndex = weeksSinceEpoch % WEEKLY_CHALLENGES.length;
  return WEEKLY_CHALLENGES[challengeIndex];
}

/**
 * Get time remaining until the next Monday 00:00 (week reset)
 */
export function getTimeRemainingInWeek(): { days: number; hours: number; minutes: number } {
  const now = new Date();

  // Calculate next Monday at 00:00
  const nextMonday = new Date(now);
  const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek); // If Sunday, 1 day; else calculate

  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);

  const msRemaining = nextMonday.getTime() - now.getTime();

  const days = Math.floor(msRemaining / (24 * 3600 * 1000));
  const hours = Math.floor((msRemaining % (24 * 3600 * 1000)) / (3600 * 1000));
  const minutes = Math.floor((msRemaining % (3600 * 1000)) / (60 * 1000));

  return { days, hours, minutes };
}

export interface WeeklyChallengeProgress {
  weekId: number;
  played: number;
  xpEarned: number;
  completedHands: Array<{
    handId: string;
    score: number;
    xpGained: number;
    completedAt: string;
  }>;
}

/**
 * Get weekly challenge progress from localStorage
 */
export function getWeeklyChallengeProgress(): {
  played: number;
  target: number;
  completed: boolean;
  xpEarned: number;
  completedHands: WeeklyChallengeProgress['completedHands'];
} {
  const TARGET = 5;
  const currentChallenge = getCurrentWeeklyChallenge();

  if (typeof window === "undefined") {
    return { played: 0, target: TARGET, completed: false, xpEarned: 0, completedHands: [] };
  }

  try {
    const stored = localStorage.getItem("bq_weekly_challenge_progress");
    if (!stored) {
      return { played: 0, target: TARGET, completed: false, xpEarned: 0, completedHands: [] };
    }

    const progress: WeeklyChallengeProgress = JSON.parse(stored);

    // Reset if it's a different week
    if (progress.weekId !== currentChallenge.id) {
      localStorage.removeItem("bq_weekly_challenge_progress");
      return { played: 0, target: TARGET, completed: false, xpEarned: 0, completedHands: [] };
    }

    return {
      played: progress.played || 0,
      target: TARGET,
      completed: progress.played >= TARGET,
      xpEarned: progress.xpEarned || 0,
      completedHands: progress.completedHands || []
    };
  } catch (e) {
    console.error("Error reading weekly challenge progress:", e);
    return { played: 0, target: TARGET, completed: false, xpEarned: 0, completedHands: [] };
  }
}

/**
 * Update weekly challenge progress after completing a hand
 */
export function updateWeeklyChallengeProgress(handId: string, score: number, baseXp: number): void {
  if (typeof window === "undefined") return;

  const currentChallenge = getCurrentWeeklyChallenge();
  const current = getWeeklyChallengeProgress();

  // Check if already completed this week (max 5)
  if (current.played >= 5) return;

  // Calculate XP with multiplier
  const xpGained = Math.round(baseXp * currentChallenge.xpMultiplier);

  const updatedProgress: WeeklyChallengeProgress = {
    weekId: currentChallenge.id,
    played: current.played + 1,
    xpEarned: current.xpEarned + xpGained,
    completedHands: [
      ...current.completedHands,
      {
        handId,
        score,
        xpGained,
        completedAt: new Date().toISOString()
      }
    ]
  };

  localStorage.setItem("bq_weekly_challenge_progress", JSON.stringify(updatedProgress));

  // If completed all 5, unlock badge
  if (updatedProgress.played >= 5) {
    unlockWeeklyBadge(currentChallenge.id, currentChallenge.badgeName);
  }
}

/**
 * Unlock weekly badge
 */
function unlockWeeklyBadge(weekId: number, badgeName: string): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem("bq_weekly_badges");
    const badges = stored ? JSON.parse(stored) : [];

    // Check if already unlocked
    if (badges.some((b: any) => b.weekId === weekId)) return;

    badges.push({
      weekId,
      badgeName,
      unlockedAt: new Date().toISOString()
    });

    localStorage.setItem("bq_weekly_badges", JSON.stringify(badges));
  } catch (e) {
    console.error("Error unlocking weekly badge:", e);
  }
}

/**
 * Get all unlocked weekly badges
 */
export function getUnlockedWeeklyBadges(): Array<{ weekId: number; badgeName: string; unlockedAt: string }> {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem("bq_weekly_badges");
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Error reading weekly badges:", e);
    return [];
  }
}

/**
 * Check if current week's badge is unlocked
 */
export function isCurrentWeekBadgeUnlocked(): boolean {
  const currentChallenge = getCurrentWeeklyChallenge();
  const badges = getUnlockedWeeklyBadges();
  return badges.some(b => b.weekId === currentChallenge.id);
}
