export interface GlossaryEntry {
  term: string;
  definition: string;
  emoji: string;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  presa: {
    term: "Presa",
    definition: "Un giro di 4 carte, una per giocatore. Vince chi gioca la carta più alta del seme o l'atout più alto.",
    emoji: "🃏",
  },
  atout: {
    term: "Atout",
    definition: "Il seme scelto come 'briscola' nel contratto. Una carta atout batte qualsiasi carta di un altro seme.",
    emoji: "🏆",
  },
  dichiarante: {
    term: "Dichiarante",
    definition: "Il giocatore che ha nominato per primo il seme del contratto finale. Gioca sia le proprie carte che quelle del morto.",
    emoji: "👤",
  },
  morto: {
    term: "Morto",
    definition: "Il compagno del dichiarante. Dopo l'attacco iniziale, posa le sue carte scoperte sul tavolo. Il dichiarante le gioca.",
    emoji: "🪑",
  },
  contratto: {
    term: "Contratto",
    definition: "L'impegno a fare un certo numero di prese con un dato seme come atout (o senza atout). Esempio: 4♠ = 10 prese con picche atout.",
    emoji: "📝",
  },
  senza_atout: {
    term: "Senza Atout (SA)",
    definition: "Un contratto giocato senza un seme di atout. Vince sempre la carta più alta del seme giocato.",
    emoji: "🚫",
  },
  licita: {
    term: "Licita (Dichiarazione)",
    definition: "La fase in cui i giocatori fanno offerte per determinare il contratto. Ogni offerta deve superare la precedente.",
    emoji: "🗣️",
  },
  attacco: {
    term: "Attacco",
    definition: "La prima carta giocata in una mano, dal difensore alla sinistra del dichiarante.",
    emoji: "⚔️",
  },
  difensori: {
    term: "Difensori",
    definition: "La coppia avversaria del dichiarante. Il loro obiettivo è impedire al dichiarante di fare il contratto.",
    emoji: "🛡️",
  },
  mano: {
    term: "Mano",
    definition: "Le 13 carte distribuite a ciascun giocatore, oppure l'intera partita (tutte le 13 prese).",
    emoji: "🖐️",
  },
  taglio: {
    term: "Taglio (Tagliare)",
    definition: "Giocare una carta atout quando non si ha il seme richiesto. Permette di vincere la presa con un atout.",
    emoji: "✂️",
  },
  scarto: {
    term: "Scarto",
    definition: "Giocare una carta di un seme diverso da quello richiesto quando non si hanno né quel seme né atout utili.",
    emoji: "🗑️",
  },
  impasse: {
    term: "Impasse (Finesse)",
    definition: "Tecnica per cercare di catturare una carta avversaria (spesso un Re o una Donna) giocando verso un onore.",
    emoji: "🎯",
  },
  onori: {
    term: "Onori",
    definition: "Le 5 carte più alte di ogni seme: Asso, Re, Donna, Fante, 10. Valgono punti nel conteggio.",
    emoji: "👑",
  },
  punti_onore: {
    term: "Punti Onore (HCP)",
    definition: "Sistema di valutazione: Asso=4, Re=3, Donna=2, Fante=1. Con 12-13+ punti si può aprire la licita.",
    emoji: "🔢",
  },
  apertura: {
    term: "Apertura",
    definition: "La prima dichiarazione fatta nella licita. Di solito richiede almeno 12-13 punti onore.",
    emoji: "🚀",
  },
  risposta: {
    term: "Risposta",
    definition: "La dichiarazione fatta dal compagno dell'apertore. Mostra punti e distribuzione.",
    emoji: "💬",
  },
  fit: {
    term: "Fit",
    definition: "Avere almeno 8 carte in un seme tra dichiarante e morto. Un buon fit è la base per scegliere l'atout.",
    emoji: "🤝",
  },
  slam: {
    term: "Slam",
    definition: "Contratto per fare 12 prese (piccolo slam) o tutte 13 (grande slam). Dà bonus enormi.",
    emoji: "🌟",
  },
  manche: {
    term: "Manche (Game)",
    definition: "Contratto che assegna punti sufficienti per un 'game': 3SA, 4♠, 4♥, 5♦, 5♣.",
    emoji: "🏁",
  },
  vulnerabile: {
    term: "Vulnerabile",
    definition: "Stato che raddoppia premi e penalità. Una coppia diventa vulnerabile dopo aver vinto un game in un rubber.",
    emoji: "⚠️",
  },
  distribuzione: {
    term: "Distribuzione",
    definition: "Come sono suddivise le carte tra i 4 semi nella mano di un giocatore. Es: 5-3-3-2.",
    emoji: "📊",
  },
  seme_lungo: {
    term: "Seme Lungo",
    definition: "Un seme con 5 o più carte. I semi lunghi sono fonti di prese extra se sviluppati.",
    emoji: "📏",
  },
  sviluppo: {
    term: "Sviluppo",
    definition: "Tecnica per rendere vincenti le carte basse di un seme lungo, facendo giocare agli avversari le loro carte alte.",
    emoji: "🔨",
  },
  presa_sicura: {
    term: "Presa Sicura (Vincente)",
    definition: "Una carta che vince sicuramente la presa perché è la più alta rimasta nel seme (es: Asso).",
    emoji: "✅",
  },
  presa_perdente: {
    term: "Presa Perdente",
    definition: "Una carta che probabilmente non vincerà la presa. L'obiettivo è minimizzare le perdenti.",
    emoji: "❌",
  },
  contare: {
    term: "Contare",
    definition: "Tenere traccia mentale delle carte giocate per capire cosa rimane. Abilità fondamentale.",
    emoji: "🧮",
  },
  rientro: {
    term: "Rientro (Entry)",
    definition: "Una carta che permette di passare la mano al morto o al dichiarante per giocare da quella posizione.",
    emoji: "🚪",
  },
  surtaglio: {
    term: "Surtaglio (Overruff)",
    definition: "Tagliare con un atout più alto di quello già giocato da un avversario.",
    emoji: "⬆️",
  },
  sottomano: {
    term: "Sottomano",
    definition: "Giocare intenzionalmente una carta bassa ('second hand low') per conservare gli onori.",
    emoji: "👇",
  },
  contro: {
    term: "Contro (Double)",
    definition: "Dichiarazione che raddoppia i punti del contratto avversario, sia in caso di riuscita che di caduta.",
    emoji: "✋",
  },
  caduta: {
    term: "Caduta",
    definition: "Quando il dichiarante non fa abbastanza prese per mantenere il contratto. Gli avversari segnano punti penalità.",
    emoji: "📉",
  },
};

/** Get a glossary entry by key */
export function getGlossaryEntry(key: string): GlossaryEntry | undefined {
  return GLOSSARY[key];
}

/** Get all glossary entries sorted alphabetically by term */
export function getAllTerms(): (GlossaryEntry & { key: string })[] {
  return Object.entries(GLOSSARY)
    .map(([key, entry]) => ({ key, ...entry }))
    .sort((a, b) => a.term.localeCompare(b.term, "it"));
}
