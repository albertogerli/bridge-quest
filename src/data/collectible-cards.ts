export interface CollectibleCard {
  id: string;
  name: string;
  description: string;
  category: "tecnica" | "convenzione" | "strategia" | "storia" | "mossa";
  rarity: "comune" | "rara" | "epica" | "leggendaria";
  emoji: string;
  unlockCondition: string; // Human-readable
  checkUnlock: (stats: PlayerStats) => boolean;
  gradient: string; // Tailwind gradient
}

export interface PlayerStats {
  xp: number;
  streak: number;
  handsPlayed: number;
  completedModules: number;
  badges: string[];
  quizLampoBest: number;
  memoryBest: number;
  dailyHandsTotal: number;
}

export const collectibleCards: CollectibleCard[] = [
  // === COMUNI (easy to unlock) ===
  {
    id: "prima-mano",
    name: "Prima Mano",
    description: "Il primo passo nel mondo del bridge. Ogni maestro e' stato un principiante.",
    category: "storia",
    rarity: "comune",
    emoji: "🃏",
    unlockCondition: "Gioca la tua prima mano",
    checkUnlock: (s) => s.handsPlayed >= 1,
    gradient: "from-gray-100 to-gray-200",
  },
  {
    id: "conta-punti",
    name: "Conta Punti",
    description: "A=4, K=3, Q=2, J=1. Il sistema di Milton Work, usato dal 1915.",
    category: "tecnica",
    rarity: "comune",
    emoji: "🔢",
    unlockCondition: "Completa 3 moduli",
    checkUnlock: (s) => s.completedModules >= 3,
    gradient: "from-blue-100 to-blue-200",
  },
  {
    id: "apertura",
    name: "L'Apertura",
    description: "12+ punti? Apri la dichiarazione. Il viaggio inizia qui.",
    category: "tecnica",
    rarity: "comune",
    emoji: "🚪",
    unlockCondition: "Completa 5 moduli",
    checkUnlock: (s) => s.completedModules >= 5,
    gradient: "from-emerald-100 to-emerald-200",
  },
  {
    id: "passo",
    name: "Il Passo",
    description: "Sapere quando passare e' importante quanto sapere quando dichiarare.",
    category: "strategia",
    rarity: "comune",
    emoji: "✋",
    unlockCondition: "Gioca 5 mani",
    checkUnlock: (s) => s.handsPlayed >= 5,
    gradient: "from-amber-100 to-amber-200",
  },
  {
    id: "primo-fit",
    name: "Primo Fit",
    description: "8 carte in un colore: il fit magico. La base della dichiarazione.",
    category: "tecnica",
    rarity: "comune",
    emoji: "🤝",
    unlockCondition: "Guadagna 100 XP",
    checkUnlock: (s) => s.xp >= 100,
    gradient: "from-teal-100 to-teal-200",
  },
  {
    id: "studente",
    name: "Studente Modello",
    description: "La costanza batte il talento. Gioca ogni giorno!",
    category: "storia",
    rarity: "comune",
    emoji: "📖",
    unlockCondition: "Serie di 3 giorni",
    checkUnlock: (s) => s.streak >= 3,
    gradient: "from-indigo-100 to-indigo-200",
  },
  // === RARE ===
  {
    id: "impasse",
    name: "L'Impasse",
    description: "La mossa piu' elegante del bridge: il tentativo di cattura dell'onore avversario.",
    category: "mossa",
    rarity: "rara",
    emoji: "🎯",
    unlockCondition: "Completa 15 moduli",
    checkUnlock: (s) => s.completedModules >= 15,
    gradient: "from-violet-200 to-purple-300",
  },
  {
    id: "sans-atout",
    name: "Senza Atout",
    description: "3NT: il contratto piu' giocato al mondo. Eleganza pura.",
    category: "tecnica",
    rarity: "rara",
    emoji: "🎩",
    unlockCondition: "Gioca 15 mani",
    checkUnlock: (s) => s.handsPlayed >= 15,
    gradient: "from-slate-200 to-slate-300",
  },
  {
    id: "stayman",
    name: "Stayman",
    description: "La convenzione di Sam Stayman (1945): 2♣ su 1NT per trovare il fit 4-4 a maggiore.",
    category: "convenzione",
    rarity: "rara",
    emoji: "🔍",
    unlockCondition: "Completa 20 moduli",
    checkUnlock: (s) => s.completedModules >= 20,
    gradient: "from-cyan-200 to-cyan-300",
  },
  {
    id: "transfer",
    name: "Transfer",
    description: "Le transfer di Jacoby: liciti da 2♦/2♥ su 1NT per trasferire la dichiarazione.",
    category: "convenzione",
    rarity: "rara",
    emoji: "↔️",
    unlockCondition: "Guadagna 500 XP",
    checkUnlock: (s) => s.xp >= 500,
    gradient: "from-sky-200 to-sky-300",
  },
  {
    id: "taglio",
    name: "Il Taglio",
    description: "Tagliare con l'atout quando sei corto: la potenza della distribuzione.",
    category: "mossa",
    rarity: "rara",
    emoji: "✂️",
    unlockCondition: "Gioca 25 mani",
    checkUnlock: (s) => s.handsPlayed >= 25,
    gradient: "from-rose-200 to-rose-300",
  },
  {
    id: "quiz-master",
    name: "Quiz Master",
    description: "La velocita' di pensiero e' fondamentale al tavolo da bridge.",
    category: "storia",
    rarity: "rara",
    emoji: "⚡",
    unlockCondition: "500+ punti nel Quiz Lampo",
    checkUnlock: (s) => s.quizLampoBest >= 500,
    gradient: "from-yellow-200 to-yellow-300",
  },
  {
    id: "piano-di-gioco",
    name: "Piano di Gioco",
    description: "Prima di giocare la prima carta, CONTA: prese sicure, prese da sviluppare, pericoli.",
    category: "strategia",
    rarity: "rara",
    emoji: "🗺️",
    unlockCondition: "Serie di 7 giorni",
    checkUnlock: (s) => s.streak >= 7,
    gradient: "from-lime-200 to-lime-300",
  },
  // === EPICHE ===
  {
    id: "squeeze",
    name: "Lo Squeeze",
    description: "Mettere un avversario nell'impossibilita' di scartare: l'arte suprema del bridge.",
    category: "mossa",
    rarity: "epica",
    emoji: "🔧",
    unlockCondition: "Completa 30 moduli",
    checkUnlock: (s) => s.completedModules >= 30,
    gradient: "from-purple-300 to-fuchsia-400",
  },
  {
    id: "blackwood",
    name: "Blackwood 4NT",
    description: "Easley Blackwood, 1933: 4NT per chiedere gli Assi. La via verso lo Slam.",
    category: "convenzione",
    rarity: "epica",
    emoji: "🏰",
    unlockCondition: "Guadagna 1000 XP",
    checkUnlock: (s) => s.xp >= 1000,
    gradient: "from-amber-300 to-orange-400",
  },
  {
    id: "endplay",
    name: "L'Endplay",
    description: "Forzare l'avversario a giocare per te: l'eliminazione e il gioco in mano.",
    category: "mossa",
    rarity: "epica",
    emoji: "🪤",
    unlockCondition: "Gioca 50 mani",
    checkUnlock: (s) => s.handsPlayed >= 50,
    gradient: "from-red-300 to-rose-400",
  },
  {
    id: "memoria",
    name: "Memoria di Ferro",
    description: "Ricordare ogni carta giocata: il segreto dei campioni.",
    category: "strategia",
    rarity: "epica",
    emoji: "🧠",
    unlockCondition: "Memory Bridge sotto 30 secondi",
    checkUnlock: (s) => s.memoryBest > 0 && s.memoryBest <= 30,
    gradient: "from-indigo-300 to-blue-400",
  },
  {
    id: "mano-quotidiana",
    name: "Giocatore Assiduo",
    description: "La pratica quotidiana e' il segreto di ogni campione.",
    category: "storia",
    rarity: "epica",
    emoji: "📅",
    unlockCondition: "Gioca 10 mani del giorno",
    checkUnlock: (s) => s.dailyHandsTotal >= 10,
    gradient: "from-emerald-300 to-teal-400",
  },
  // === LEGGENDARIE ===
  {
    id: "grande-slam",
    name: "Grande Slam",
    description: "7NT: tutte e 13 le prese. Il contratto impossibile... quasi.",
    category: "tecnica",
    rarity: "leggendaria",
    emoji: "👑",
    unlockCondition: "Completa 40 moduli",
    checkUnlock: (s) => s.completedModules >= 40,
    gradient: "from-yellow-400 to-amber-500",
  },
  {
    id: "blue-team",
    name: "Blue Team",
    description: "La squadra italiana che domino' il bridge mondiale: 16 titoli mondiali (1957-1975).",
    category: "storia",
    rarity: "leggendaria",
    emoji: "🇮🇹",
    unlockCondition: "Guadagna 2000 XP",
    checkUnlock: (s) => s.xp >= 2000,
    gradient: "from-blue-400 to-indigo-500",
  },
  {
    id: "maestro",
    name: "Il Maestro",
    description: "Non si smette mai di imparare. Il bridge e' un viaggio senza fine.",
    category: "storia",
    rarity: "leggendaria",
    emoji: "🎓",
    unlockCondition: "Serie di 30 giorni",
    checkUnlock: (s) => s.streak >= 30,
    gradient: "from-emerald-400 to-emerald-600",
  },
  {
    id: "vienna-coup",
    name: "Colpo di Vienna",
    description: "Incassare un onore per creare la posizione di squeeze: genio tattico.",
    category: "mossa",
    rarity: "leggendaria",
    emoji: "💎",
    unlockCondition: "Completa tutti i corsi",
    checkUnlock: (s) => s.completedModules >= 49,
    gradient: "from-fuchsia-400 to-pink-500",
  },
];

export const RARITY_CONFIG = {
  comune: { label: "Comune", color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-300" },
  rara: { label: "Rara", color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-300" },
  epica: { label: "Epica", color: "text-purple-600", bg: "bg-purple-100", border: "border-purple-300" },
  leggendaria: { label: "Leggendaria", color: "text-amber-600", bg: "bg-amber-100", border: "border-amber-400" },
};

export const CATEGORY_CONFIG = {
  tecnica: { label: "Tecnica", emoji: "🔧" },
  convenzione: { label: "Convenzione", emoji: "📜" },
  strategia: { label: "Strategia", emoji: "🧭" },
  storia: { label: "Storia", emoji: "📖" },
  mossa: { label: "Mossa", emoji: "♟️" },
};
