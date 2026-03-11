export interface GlossaryQuiz {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface GlossaryEntry {
  term: string;
  definition: string;
  emoji: string;
  category: "base" | "licita" | "gioco" | "difesa" | "punteggio";
  example?: string;
  cards?: string;
  relatedTerms?: string[];
  quiz: GlossaryQuiz;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  // ── BASE ──────────────────────────────────────────────
  presa: {
    term: "Presa",
    definition:
      "Un giro di 4 carte, una per giocatore. Vince chi gioca la carta più alta del seme o l'atout più alto.",
    emoji: "🃏",
    category: "base",
    example:
      "Ovest gioca ♠5, Nord ♠9, Est ♠Q, Sud ♠A. Sud vince la presa con l'Asso.",
    cards: "♠A ♠Q ♠9 ♠5",
    relatedTerms: ["atout", "taglio", "presa_sicura"],
    quiz: {
      question: "Cosa determina chi vince una presa?",
      options: [
        "Chi gioca per primo",
        "Chi gioca la carta più alta del seme (o atout più alto)",
        "Chi ha più carte dello stesso seme",
        "Chi ha più punti onore in mano",
      ],
      correctAnswer: 1,
      explanation:
        "Vince la presa chi gioca la carta più alta del seme d'attacco. Se qualcuno taglia con un atout, vince l'atout più alto.",
    },
  },
  atout: {
    term: "Atout",
    definition:
      "Il seme scelto come 'briscola' nel contratto. Una carta atout batte qualsiasi carta di un altro seme.",
    emoji: "🏆",
    category: "base",
    example:
      "Se il contratto è 4♠, picche è atout. Un ♠2 batte un ♥A se giocato come taglio.",
    relatedTerms: ["taglio", "senza_atout", "contratto"],
    quiz: {
      question: "Se il contratto è 4♥, quale carta vince tra ♥3 e ♠A?",
      options: [
        "♠A perché l'Asso è la carta più alta",
        "♥3 se giocato come taglio (cuori è atout)",
        "Dipende da chi gioca per primo",
        "Nessuna delle due",
      ],
      correctAnswer: 1,
      explanation:
        "Con cuori atout, un qualsiasi cuori giocato come taglio batte qualsiasi carta di un altro seme, anche un Asso.",
    },
  },
  dichiarante: {
    term: "Dichiarante",
    definition:
      "Il giocatore che ha nominato per primo il seme del contratto finale. Gioca sia le proprie carte che quelle del morto.",
    emoji: "👤",
    category: "base",
    example:
      "Se Sud apre 1♥ e il contratto finale è 4♥, Sud è il dichiarante perché ha nominato cuori per primo.",
    relatedTerms: ["morto", "difensori", "contratto"],
    quiz: {
      question: "Chi è il dichiarante?",
      options: [
        "Chi fa l'ultima dichiarazione nella licita",
        "Chi ha più punti nella coppia",
        "Chi ha nominato per primo il seme del contratto finale",
        "Chi siede a Nord",
      ],
      correctAnswer: 2,
      explanation:
        "Il dichiarante è chi nella coppia vincente ha nominato per primo il seme (o SA) del contratto finale.",
    },
  },
  morto: {
    term: "Morto",
    definition:
      "Il compagno del dichiarante. Dopo l'attacco iniziale, posa le sue carte scoperte sul tavolo. Il dichiarante le gioca.",
    emoji: "🪑",
    category: "base",
    example:
      "Dopo l'attacco di Ovest, il morto (Nord) espone le sue 13 carte e Sud le gioca insieme alle proprie.",
    relatedTerms: ["dichiarante", "attacco", "rientro"],
    quiz: {
      question: "Quando il morto espone le carte?",
      options: [
        "Subito dopo la licita",
        "Dopo che il difensore alla sinistra del dichiarante ha giocato la prima carta",
        "Prima della licita",
        "Quando il dichiarante lo decide",
      ],
      correctAnswer: 1,
      explanation:
        "Il morto espone le carte dopo l'attacco iniziale, cioè dopo che il difensore alla sinistra del dichiarante gioca la prima carta.",
    },
  },
  contratto: {
    term: "Contratto",
    definition:
      "L'impegno a fare un certo numero di prese con un dato seme come atout (o senza atout). Esempio: 4♠ = 10 prese con picche atout.",
    emoji: "📝",
    category: "base",
    example:
      "Il contratto 3SA significa fare 9 prese (6 base + 3) senza atout. 4♥ significa fare 10 prese con cuori atout.",
    relatedTerms: ["licita", "manche", "slam", "caduta"],
    quiz: {
      question: "Se il contratto è 3♠, quante prese deve fare il dichiarante?",
      options: ["3 prese", "6 prese", "9 prese", "13 prese"],
      correctAnswer: 2,
      explanation:
        "Il numero del contratto si aggiunge a 6 (il 'libro'). Quindi 3♠ = 6+3 = 9 prese da fare con picche come atout.",
    },
  },
  mano: {
    term: "Mano",
    definition:
      "Le 13 carte distribuite a ciascun giocatore, oppure l'intera partita (tutte le 13 prese).",
    emoji: "🖐️",
    category: "base",
    example:
      "Ogni giocatore riceve una mano di 13 carte. 'Giocare una mano' significa giocare tutte le 13 prese.",
    cards: "♠KJ73 ♥AQ5 ♦K84 ♣Q92",
    relatedTerms: ["distribuzione", "presa"],
    quiz: {
      question: "Quante carte ha ogni giocatore in una mano di bridge?",
      options: ["10 carte", "12 carte", "13 carte", "Dipende dal contratto"],
      correctAnswer: 2,
      explanation:
        "Il mazzo da 52 carte è diviso equamente tra 4 giocatori: 52 ÷ 4 = 13 carte ciascuno.",
    },
  },

  // ── LICITA ────────────────────────────────────────────
  licita: {
    term: "Licita (Dichiarazione)",
    definition:
      "La fase in cui i giocatori fanno offerte per determinare il contratto. Ogni offerta deve superare la precedente.",
    emoji: "🗣️",
    category: "licita",
    example:
      "Sud apre 1♥, Ovest passa, Nord risponde 2♥, tutti passano. Il contratto è 2♥.",
    relatedTerms: ["apertura", "risposta", "contratto", "contro"],
    quiz: {
      question: "Nella licita, cosa succede se tutti e 4 i giocatori passano?",
      options: [
        "Si gioca senza atout",
        "La mano è annullata e si ridistribuisce",
        "Il mazziere sceglie il contratto",
        "Si gioca a 1♣",
      ],
      correctAnswer: 1,
      explanation:
        "Se tutti e 4 passano alla prima opportunità, la mano non si gioca e le carte vengono ridistribuite.",
    },
  },
  apertura: {
    term: "Apertura",
    definition:
      "La prima dichiarazione fatta nella licita. Di solito richiede almeno 12-13 punti onore.",
    emoji: "🚀",
    category: "licita",
    example:
      "Con ♠AK854 ♥Q3 ♦KJ7 ♣95 (13 punti, 5 picche) si apre 1♠.",
    cards: "♠AK854 ♥Q3 ♦KJ7 ♣95",
    relatedTerms: ["punti_onore", "risposta", "licita"],
    quiz: {
      question: "Di quanti punti onore hai generalmente bisogno per aprire?",
      options: ["8-10 punti", "10-11 punti", "12-13 punti", "15+ punti"],
      correctAnswer: 2,
      explanation:
        "Per aprire la licita servono di solito 12-13+ punti onore (HCP). Con meno si passa.",
    },
  },
  risposta: {
    term: "Risposta",
    definition:
      "La dichiarazione fatta dal compagno dell'apertore. Mostra punti e distribuzione.",
    emoji: "💬",
    category: "licita",
    example:
      "Il compagno apre 1♥. Con ♠J4 ♥K873 ♦A95 ♣7643 (8 punti, 4 cuori) rispondi 2♥ mostrando il fit.",
    cards: "♠J4 ♥K873 ♦A95 ♣7643",
    relatedTerms: ["apertura", "fit", "licita"],
    quiz: {
      question: "Cosa comunica la risposta del compagno dell'apertore?",
      options: [
        "Solo quanti punti ha",
        "Solo la distribuzione dei semi",
        "Punti e distribuzione (e se c'è fit)",
        "Il contratto finale",
      ],
      correctAnswer: 2,
      explanation:
        "La risposta indica sia la forza della mano (punti) sia la distribuzione, aiutando a trovare il contratto giusto.",
    },
  },
  fit: {
    term: "Fit",
    definition:
      "Avere almeno 8 carte in un seme tra dichiarante e morto. Un buon fit è la base per scegliere l'atout.",
    emoji: "🤝",
    category: "licita",
    example:
      "Se hai 5♠ e il compagno ne ha 3♠, avete 8 picche insieme: c'è il fit! Picche sarà l'atout ideale.",
    relatedTerms: ["atout", "distribuzione", "seme_lungo"],
    quiz: {
      question: "Quante carte servono in un seme tra i due compagni per avere un 'fit'?",
      options: [
        "Almeno 6",
        "Almeno 7",
        "Almeno 8",
        "Almeno 10",
      ],
      correctAnswer: 2,
      explanation:
        "Il fit richiede almeno 8 carte in un seme tra dichiarante e morto. Con 8+ carte, quel seme è un ottimo atout.",
    },
  },
  senza_atout: {
    term: "Senza Atout (SA)",
    definition:
      "Un contratto giocato senza un seme di atout. Vince sempre la carta più alta del seme giocato.",
    emoji: "🚫",
    category: "licita",
    example:
      "Con una mano bilanciata 4-3-3-3 e 15 punti, si apre spesso 1SA. Nessun seme è atout.",
    cards: "♠AJ5 ♥KQ8 ♦Q973 ♣KJ4",
    relatedTerms: ["atout", "contratto", "manche"],
    quiz: {
      question: "In un contratto Senza Atout, cosa succede se non hai carte del seme giocato?",
      options: [
        "Puoi tagliare con un altro seme",
        "Devi scartare (e non puoi vincere quella presa)",
        "Puoi scegliere di non giocare",
        "Prendi automaticamente la presa",
      ],
      correctAnswer: 1,
      explanation:
        "Senza atout non esiste il taglio. Se non hai carte del seme, devi scartare una carta di un altro seme e non puoi vincere.",
    },
  },
  contro: {
    term: "Contro (Double)",
    definition:
      "Dichiarazione che raddoppia i punti del contratto avversario, sia in caso di riuscita che di caduta.",
    emoji: "✋",
    category: "licita",
    example:
      "Gli avversari dichiarano 4♠. Pensi che cadranno: dici 'Contro!'. Se cadono, le penalità sono raddoppiate.",
    relatedTerms: ["caduta", "licita", "vulnerabile"],
    quiz: {
      question: "Cosa succede quando contri un contratto avversario?",
      options: [
        "Il contratto viene annullato",
        "I punti (premi o penalità) vengono raddoppiati",
        "Si ridistribuiscono le carte",
        "L'avversario deve cambiare seme",
      ],
      correctAnswer: 1,
      explanation:
        "Il Contro raddoppia i punti: se il contratto riesce, gli avversari guadagnano di più; se cade, le penalità sono maggiori.",
    },
  },

  // ── GIOCO ─────────────────────────────────────────────
  attacco: {
    term: "Attacco",
    definition:
      "La prima carta giocata in una mano, dal difensore alla sinistra del dichiarante.",
    emoji: "⚔️",
    category: "gioco",
    example:
      "Il contratto è 4♠ di Sud. Ovest (alla sinistra di Sud) fa l'attacco iniziale giocando per primo.",
    relatedTerms: ["difensori", "morto", "dichiarante"],
    quiz: {
      question: "Chi fa l'attacco iniziale?",
      options: [
        "Il dichiarante",
        "Il morto",
        "Il difensore alla sinistra del dichiarante",
        "Il difensore alla destra del dichiarante",
      ],
      correctAnswer: 2,
      explanation:
        "L'attacco iniziale spetta sempre al difensore alla sinistra del dichiarante.",
    },
  },
  taglio: {
    term: "Taglio (Tagliare)",
    definition:
      "Giocare una carta atout quando non si ha il seme richiesto. Permette di vincere la presa con un atout.",
    emoji: "✂️",
    category: "gioco",
    example:
      "Viene giocato ♦A ma tu non hai quadri. Con cuori atout, giochi ♥4 e tagli: vinci la presa!",
    relatedTerms: ["atout", "surtaglio", "scarto"],
    quiz: {
      question: "Quando puoi 'tagliare'?",
      options: [
        "Sempre, quando vuoi",
        "Quando non hai carte del seme giocato e hai atout",
        "Solo quando hai un Asso atout",
        "Solo nella prima presa",
      ],
      correctAnswer: 1,
      explanation:
        "Puoi tagliare solo quando non hai carte del seme richiesto. In quel caso puoi giocare un atout per vincere la presa.",
    },
  },
  scarto: {
    term: "Scarto",
    definition:
      "Giocare una carta di un seme diverso da quello richiesto quando non si hanno né quel seme né atout utili.",
    emoji: "🗑️",
    category: "gioco",
    example:
      "Viene giocato ♠K ma non hai picche. Senza atout (o non conviene tagliare), scarti un ♣3 inutile.",
    relatedTerms: ["taglio", "presa_perdente"],
    quiz: {
      question: "Qual è la differenza tra taglio e scarto?",
      options: [
        "Non c'è differenza",
        "Taglio usa un atout, scarto usa una carta di un altro seme non-atout",
        "Scarto si fa solo a SA",
        "Taglio si fa solo nella prima presa",
      ],
      correctAnswer: 1,
      explanation:
        "Il taglio usa un atout per vincere la presa. Lo scarto è giocare una carta di un seme diverso (non atout) rinunciando alla presa.",
    },
  },
  impasse: {
    term: "Impasse (Finesse)",
    definition:
      "Tecnica per cercare di catturare una carta avversaria (spesso un Re o una Donna) giocando verso un onore.",
    emoji: "🎯",
    category: "gioco",
    example:
      "Hai ♠AQ al morto. Giochi verso la Donna sperando che il Re sia a sinistra. Se sì, la Q vince!",
    cards: "♠AQ",
    relatedTerms: ["onori", "presa_sicura", "rientro"],
    quiz: {
      question: "Qual è lo scopo di un'impasse?",
      options: [
        "Eliminare tutti gli atout avversari",
        "Cercare di catturare un onore avversario giocando verso una carta strategica",
        "Fare sempre 13 prese",
        "Contare le carte rimaste",
      ],
      correctAnswer: 1,
      explanation:
        "L'impasse mira a catturare un onore avversario (es. il Re) giocando verso un onore (es. AQ) sperando nella posizione favorevole.",
    },
  },
  sviluppo: {
    term: "Sviluppo",
    definition:
      "Tecnica per rendere vincenti le carte basse di un seme lungo, facendo giocare agli avversari le loro carte alte.",
    emoji: "🔨",
    category: "gioco",
    example:
      "Hai ♠AK7654. Giochi ♠A e ♠K (cadono gli onori avversari), poi i ♠654 diventano vincenti.",
    cards: "♠AK7654",
    relatedTerms: ["seme_lungo", "rientro", "presa_sicura"],
    quiz: {
      question: "Cosa significa 'sviluppare' un seme?",
      options: [
        "Distribuire le carte equamente",
        "Far cadere le carte alte avversarie per rendere vincenti le carte basse",
        "Giocare sempre il seme più lungo",
        "Cambiare il seme atout durante il gioco",
      ],
      correctAnswer: 1,
      explanation:
        "Sviluppare un seme significa giocare le carte alte per far cadere quelle avversarie, rendendo vincenti le piccole rimanenti.",
    },
  },
  rientro: {
    term: "Rientro (Entry)",
    definition:
      "Una carta che permette di passare la mano al morto o al dichiarante per giocare da quella posizione.",
    emoji: "🚪",
    category: "gioco",
    example:
      "Hai sviluppato ♦ lunghe al morto ma devi arrivarci: l'♥A al morto è il tuo rientro.",
    relatedTerms: ["morto", "sviluppo", "dichiarante"],
    quiz: {
      question: "Perché i rientri sono importanti?",
      options: [
        "Per confondere gli avversari",
        "Per poter giocare le carte vincenti dalla mano giusta (morto o dichiarante)",
        "Per fare punti extra",
        "Per cambiare il contratto",
      ],
      correctAnswer: 1,
      explanation:
        "I rientri servono per trasferire il gioco alla mano dove si hanno prese vincenti da incassare.",
    },
  },
  surtaglio: {
    term: "Surtaglio (Overruff)",
    definition:
      "Tagliare con un atout più alto di quello già giocato da un avversario.",
    emoji: "⬆️",
    category: "gioco",
    example:
      "Sud taglia con ♥5, ma Ovest ha ♥Q e surtaglia: Ovest vince la presa con l'atout più alto.",
    relatedTerms: ["taglio", "atout"],
    quiz: {
      question: "Cos'è un surtaglio?",
      options: [
        "Tagliare per la seconda volta nella stessa presa",
        "Tagliare con un atout più alto rispetto a chi ha già tagliato",
        "Giocare due atout contemporaneamente",
        "Rinunciare a tagliare",
      ],
      correctAnswer: 1,
      explanation:
        "Il surtaglio (overruff) è giocare un atout più alto di quello già giocato come taglio da un altro giocatore.",
    },
  },
  sottomano: {
    term: "Sottomano",
    definition:
      "Giocare intenzionalmente una carta bassa ('second hand low') per conservare gli onori.",
    emoji: "👇",
    category: "gioco",
    example:
      "L'avversario gioca ♦3 e tu hai ♦KJ7. Giochi ♦7 (basso) conservando il Re per catturare qualcosa di meglio.",
    cards: "♦KJ7",
    relatedTerms: ["onori", "difensori"],
    quiz: {
      question: "Perché si gioca 'sottomano' (carta bassa in seconda posizione)?",
      options: [
        "Per far vincere il compagno",
        "Per conservare gli onori per un uso migliore",
        "Perché è obbligatorio",
        "Per contare le carte",
      ],
      correctAnswer: 1,
      explanation:
        "Giocare basso in seconda posizione conserva gli onori per catturare carte più importanti in seguito.",
    },
  },
  contare: {
    term: "Contare",
    definition:
      "Tenere traccia mentale delle carte giocate per capire cosa rimane. Abilità fondamentale nel bridge.",
    emoji: "🧮",
    category: "gioco",
    example:
      "Dopo 3 giri di picche, sono uscite 10 picche. Restano 3 picche in giro: sai esattamente quante ne ha ciascun avversario.",
    relatedTerms: ["distribuzione", "presa"],
    quiz: {
      question: "Cosa si conta nel bridge?",
      options: [
        "Solo i propri punti",
        "Le carte giocate in ogni seme per sapere quante ne restano",
        "Solo le prese fatte",
        "Solo le carte del morto",
      ],
      correctAnswer: 1,
      explanation:
        "Contare le carte giocate in ogni seme permette di sapere la distribuzione residua e prendere decisioni migliori.",
    },
  },

  // ── DIFESA ────────────────────────────────────────────
  difensori: {
    term: "Difensori",
    definition:
      "La coppia avversaria del dichiarante. Il loro obiettivo è impedire al dichiarante di fare il contratto.",
    emoji: "🛡️",
    category: "difesa",
    example:
      "Se Sud dichiara 4♠, Ovest ed Est sono i difensori. Devono fare almeno 4 prese per far cadere il contratto.",
    relatedTerms: ["dichiarante", "attacco", "caduta"],
    quiz: {
      question: "Quante prese devono fare i difensori per far cadere un contratto di 4♠?",
      options: ["3 prese", "4 prese", "5 prese", "Dipende dalla vulnerabilità"],
      correctAnswer: 1,
      explanation:
        "4♠ = 10 prese necessarie. I difensori devono fare 14-10 = 4 prese per far cadere il contratto.",
    },
  },
  segnale: {
    term: "Segnale",
    definition:
      "Il modo in cui i difensori comunicano tra loro attraverso la scelta delle carte giocate (alto = incoraggiante, basso = scoraggiante).",
    emoji: "📡",
    category: "difesa",
    example:
      "Il compagno attacca ♥A. Tu giochi ♥9 (alto) per dire 'continua cuori, ho qualcosa!'. Se giochi ♥2, dici 'cambia seme'.",
    relatedTerms: ["difensori", "attacco"],
    quiz: {
      question: "Cosa indica giocare una carta alta come difensore?",
      options: [
        "Che vuoi cambiare seme",
        "Che vuoi che il compagno continui quel seme (segnale incoraggiante)",
        "Che non hai più carte di quel seme",
        "Che vuoi che il compagno passi la mano",
      ],
      correctAnswer: 1,
      explanation:
        "Un segnale alto (es. 9, 8) è incoraggiante: dice al compagno di continuare quel seme. Basso (2, 3) è scoraggiante.",
    },
  },
  terza_alta: {
    term: "Terza Alta",
    definition:
      "Regola difensiva: in terza posizione, gioca la carta più alta per cercare di vincere la presa.",
    emoji: "3️⃣",
    category: "difesa",
    example:
      "Il compagno attacca ♦4, il morto gioca ♦6. Tu in terza posizione giochi ♦K (il più alto) per vincere.",
    cards: "♦K93",
    relatedTerms: ["difensori", "sottomano"],
    quiz: {
      question: "Cosa dice la regola 'terza alta'?",
      options: [
        "In terza posizione, gioca la carta più bassa",
        "In terza posizione, gioca la carta più alta disponibile",
        "Gioca il terzo atout che hai",
        "Fai sempre tre prese di fila",
      ],
      correctAnswer: 1,
      explanation:
        "In terza posizione (dopo compagno e morto), si gioca alto per cercare di vincere la presa o forzare un onore avversario.",
    },
  },

  // ── PUNTEGGIO ─────────────────────────────────────────
  onori: {
    term: "Onori",
    definition:
      "Le 5 carte più alte di ogni seme: Asso, Re, Donna, Fante, 10. Valgono punti nel conteggio.",
    emoji: "👑",
    category: "punteggio",
    example: "In ♠AKQJ10, tutte e 5 sono onori. Gli onori danno forza alla mano.",
    cards: "♠AKQJ10",
    relatedTerms: ["punti_onore", "presa_sicura"],
    quiz: {
      question: "Quali carte sono considerate 'onori'?",
      options: [
        "Solo Asso e Re",
        "Asso, Re e Donna",
        "Asso, Re, Donna, Fante e 10",
        "Tutte le figure",
      ],
      correctAnswer: 2,
      explanation:
        "I 5 onori sono: Asso (A), Re (K), Donna (Q), Fante (J) e 10. Sono le carte che valgono punti onore.",
    },
  },
  punti_onore: {
    term: "Punti Onore (HCP)",
    definition:
      "Sistema di valutazione: Asso=4, Re=3, Donna=2, Fante=1. Con 12-13+ punti si può aprire la licita.",
    emoji: "🔢",
    category: "punteggio",
    example:
      "♠AK ♥QJ ♦A ♣KQJ = A(4)+K(3)+Q(2)+J(1)+A(4)+K(3)+Q(2)+J(1) = 20 punti.",
    cards: "♠AK ♥QJ ♦A ♣KQJ",
    relatedTerms: ["onori", "apertura"],
    quiz: {
      question: "Quanti punti vale un Re nel sistema HCP?",
      options: ["1 punto", "2 punti", "3 punti", "4 punti"],
      correctAnswer: 2,
      explanation: "Nel sistema HCP: Asso=4, Re=3, Donna=2, Fante=1. Il 10 non vale punti onore.",
    },
  },
  distribuzione: {
    term: "Distribuzione",
    definition:
      "Come sono suddivise le carte tra i 4 semi nella mano di un giocatore. Es: 5-3-3-2.",
    emoji: "📊",
    category: "punteggio",
    example:
      "Una mano con 5♠ 3♥ 3♦ 2♣ ha distribuzione 5-3-3-2. Una mano 4-3-3-3 è molto bilanciata.",
    cards: "♠AK854 ♥Q73 ♦K95 ♣84",
    relatedTerms: ["seme_lungo", "fit"],
    quiz: {
      question: "Una mano con 5♠ 4♥ 3♦ 1♣ ha quale distribuzione?",
      options: ["4-3-3-3", "5-3-3-2", "5-4-3-1", "6-4-2-1"],
      correctAnswer: 2,
      explanation:
        "La distribuzione si indica in ordine decrescente: 5-4-3-1. Indica quante carte ha ogni seme.",
    },
  },
  seme_lungo: {
    term: "Seme Lungo",
    definition:
      "Un seme con 5 o più carte. I semi lunghi sono fonti di prese extra se sviluppati.",
    emoji: "📏",
    category: "punteggio",
    example:
      "Con ♠AK8754 (6 carte!), dopo aver fatto cadere le picche avversarie, le piccole diventano vincenti.",
    cards: "♠AK8754",
    relatedTerms: ["sviluppo", "distribuzione", "fit"],
    quiz: {
      question: "Da quante carte un seme si definisce 'lungo'?",
      options: ["3+ carte", "4+ carte", "5+ carte", "6+ carte"],
      correctAnswer: 2,
      explanation:
        "Un seme lungo ha 5 o più carte. È una fonte preziosa di prese extra, specialmente se sviluppato.",
    },
  },
  presa_sicura: {
    term: "Presa Sicura (Vincente)",
    definition:
      "Una carta che vince sicuramente la presa perché è la più alta rimasta nel seme (es: Asso).",
    emoji: "✅",
    category: "punteggio",
    example:
      "♠A è sempre una presa sicura perché nessuna carta batte l'Asso. Dopo che l'Asso è uscito, ♠K diventa sicuro.",
    relatedTerms: ["presa_perdente", "onori"],
    quiz: {
      question: "Cosa rende una carta una 'presa sicura'?",
      options: [
        "Essere un atout",
        "Essere la carta più alta rimasta nel seme",
        "Essere giocata per prima",
        "Avere il seme più lungo",
      ],
      correctAnswer: 1,
      explanation:
        "Una presa sicura (o vincente) è una carta che vincerà perché è la più alta rimasta nel suo seme.",
    },
  },
  presa_perdente: {
    term: "Presa Perdente",
    definition:
      "Una carta che probabilmente non vincerà la presa. L'obiettivo è minimizzare le perdenti.",
    emoji: "❌",
    category: "punteggio",
    example:
      "Con ♠Q74 senza altri onori alti, la Donna rischia di perdere contro l'Asso e il Re avversari.",
    cards: "♠Q74",
    relatedTerms: ["presa_sicura", "impasse", "taglio"],
    quiz: {
      question: "Come si può eliminare una presa perdente?",
      options: [
        "Non si può mai eliminare",
        "Con un'impasse, tagliandola o scartandola su una vincente",
        "Solo rilanciando nella licita",
        "Chiedendo al compagno",
      ],
      correctAnswer: 1,
      explanation:
        "Le perdenti si eliminano con tecniche come l'impasse, il taglio (ruff) al morto, o lo scarto su carte vincenti.",
    },
  },
  vulnerabile: {
    term: "Vulnerabile",
    definition:
      "Stato che raddoppia premi e penalità. Una coppia diventa vulnerabile dopo aver vinto un game in un rubber.",
    emoji: "⚠️",
    category: "punteggio",
    example:
      "Se sei vulnerabile e cadi, paghi penalità doppie (100 per ogni presa sotto, invece di 50).",
    relatedTerms: ["caduta", "manche", "contro"],
    quiz: {
      question: "Cosa cambia quando una coppia è vulnerabile?",
      options: [
        "Non può fare contratti di slam",
        "I premi e le penalità sono maggiori",
        "Deve sempre aprire la licita",
        "Non può contrare",
      ],
      correctAnswer: 1,
      explanation:
        "La vulnerabilità aumenta sia i premi per contratti riusciti sia le penalità per cadute.",
    },
  },
  manche: {
    term: "Manche (Game)",
    definition:
      "Contratto che assegna punti sufficienti per un 'game': 3SA, 4♠, 4♥, 5♦, 5♣.",
    emoji: "🏁",
    category: "punteggio",
    example:
      "4♠ è un contratto di manche: se lo fai, guadagni un bonus importante (300 o 500 punti).",
    relatedTerms: ["slam", "contratto", "vulnerabile"],
    quiz: {
      question: "Quale di questi NON è un contratto di manche?",
      options: ["3SA", "4♥", "2♠", "5♣"],
      correctAnswer: 2,
      explanation:
        "2♠ è un contratto parziale, non di manche. I contratti di manche sono: 3SA, 4♠, 4♥, 5♦, 5♣.",
    },
  },
  slam: {
    term: "Slam",
    definition:
      "Contratto per fare 12 prese (piccolo slam) o tutte 13 (grande slam). Dà bonus enormi.",
    emoji: "🌟",
    category: "punteggio",
    example:
      "6♠ = piccolo slam (12 prese). 7♠ = grande slam (tutte 13 prese). Bonus: 500-1500 punti!",
    relatedTerms: ["manche", "contratto"],
    quiz: {
      question: "Quante prese servono per un piccolo slam?",
      options: ["10 prese", "11 prese", "12 prese", "13 prese"],
      correctAnswer: 2,
      explanation:
        "Il piccolo slam richiede 12 prese (contratto a livello 6). Il grande slam richiede tutte 13 (livello 7).",
    },
  },
  caduta: {
    term: "Caduta",
    definition:
      "Quando il dichiarante non fa abbastanza prese per mantenere il contratto. Gli avversari segnano punti penalità.",
    emoji: "📉",
    category: "punteggio",
    example:
      "Il contratto è 4♠ (10 prese necessarie). Il dichiarante fa solo 8 prese: cade di 2 e paga penalità.",
    relatedTerms: ["contratto", "difensori", "vulnerabile"],
    quiz: {
      question: "Se il contratto è 3SA e il dichiarante fa 7 prese, di quante è la caduta?",
      options: ["1", "2", "3", "6"],
      correctAnswer: 1,
      explanation:
        "3SA = 9 prese necessarie. Con 7 prese fatte, la caduta è di 9-7 = 2.",
    },
  },

  // ── NUOVI TERMINI ─────────────────────────────────────
  libro: {
    term: "Libro",
    definition:
      "Le prime 6 prese che il dichiarante deve fare prima di contare quelle del contratto. Sono 'gratis'.",
    emoji: "📖",
    category: "base",
    example:
      "Un contratto di 3♠ significa 6 (libro) + 3 = 9 prese. Il libro è la base di partenza.",
    relatedTerms: ["contratto", "presa"],
    quiz: {
      question: "Quante prese compongono il 'libro'?",
      options: ["4 prese", "5 prese", "6 prese", "7 prese"],
      correctAnswer: 2,
      explanation:
        "Il libro è composto da 6 prese. Il numero del contratto si aggiunge al libro: 1♠ = 6+1 = 7 prese.",
    },
  },
  mazziere: {
    term: "Mazziere",
    definition:
      "Il giocatore che distribuisce le carte e che parla per primo nella licita.",
    emoji: "🎴",
    category: "base",
    example:
      "Il mazziere distribuisce 13 carte a ciascuno e apre la licita. La mazzata ruota in senso orario.",
    relatedTerms: ["licita", "mano"],
    quiz: {
      question: "Qual è il privilegio del mazziere?",
      options: [
        "Sceglie il seme atout",
        "Distribuisce le carte e parla per primo nella licita",
        "Gioca sempre per primo",
        "Può guardare le carte del morto",
      ],
      correctAnswer: 1,
      explanation:
        "Il mazziere distribuisce le carte e ha il diritto/dovere di parlare per primo nella licita.",
    },
  },
  bilanciata: {
    term: "Mano Bilanciata",
    definition:
      "Una mano senza singoli o vuoti, con distribuzione 4-3-3-3, 4-4-3-2 o 5-3-3-2.",
    emoji: "⚖️",
    category: "licita",
    example:
      "♠AJ5 ♥KQ83 ♦Q97 ♣KJ4 è bilanciata (4-3-3-3). Ideale per giocare a Senza Atout.",
    cards: "♠AJ5 ♥KQ83 ♦Q97 ♣KJ4",
    relatedTerms: ["senza_atout", "distribuzione", "apertura"],
    quiz: {
      question: "Quale distribuzione NON è bilanciata?",
      options: ["4-3-3-3", "4-4-3-2", "5-3-3-2", "6-3-2-2"],
      correctAnswer: 3,
      explanation:
        "6-3-2-2 non è bilanciata: il doppietto (2 carte) la rende sbilanciata. Le bilanciate sono 4-3-3-3, 4-4-3-2, 5-3-3-2.",
    },
  },
  forzante: {
    term: "Forzante",
    definition:
      "Una dichiarazione che obbliga il compagno a parlare ancora (non può passare). Serve per esplorare il contratto migliore.",
    emoji: "🔒",
    category: "licita",
    example:
      "Dopo 1♥ dal compagno, rispondere 1♠ è forzante: l'apertore deve dichiarare ancora.",
    relatedTerms: ["licita", "risposta", "apertura"],
    quiz: {
      question: "Cosa significa che una dichiarazione è 'forzante'?",
      options: [
        "Il compagno deve raddoppiare",
        "Il compagno non può passare e deve fare un'altra dichiarazione",
        "Gli avversari devono passare",
        "Si deve giocare quel contratto",
      ],
      correctAnswer: 1,
      explanation:
        "Una dichiarazione forzante obbliga il compagno a continuare la licita: non può passare.",
    },
  },
  ruff: {
    term: "Ruff (Taglio al Morto)",
    definition:
      "Far tagliare una carta dal morto usando i suoi atout. Tecnica fondamentale per creare prese extra.",
    emoji: "🔄",
    category: "gioco",
    example:
      "Hai ♦72 in mano e il morto è vuoto di quadri ma ha ♠84. Giochi ♦7, il morto taglia con ♠4: presa extra!",
    relatedTerms: ["taglio", "morto", "atout"],
    quiz: {
      question: "Perché il taglio al morto è vantaggioso?",
      options: [
        "Perché fa perdere carte agli avversari",
        "Perché crea prese extra senza indebolire gli atout in mano",
        "Perché è obbligatorio",
        "Perché annulla la vulnerabilità",
      ],
      correctAnswer: 1,
      explanation:
        "Tagliare al morto con i suoi atout 'corti' crea prese extra senza sacrificare gli atout del dichiarante.",
    },
  },
  eliminazione: {
    term: "Eliminazione ed Endplay",
    definition:
      "Tecnica avanzata: si eliminano i semi di uscita di un avversario per costringerlo a giocare a tuo vantaggio.",
    emoji: "🎪",
    category: "gioco",
    example:
      "Elimini picche e quadri, poi dai la mano all'avversario che deve giocare cuori (verso il tuo AQ) o concedere ruff e scarto.",
    relatedTerms: ["impasse", "rientro", "scarto"],
    quiz: {
      question: "Qual è il principio dell'endplay?",
      options: [
        "Giocare velocemente per finire la mano",
        "Forzare l'avversario a giocare una carta che ti avvantaggia",
        "Fare sempre la prima presa",
        "Contare i punti a fine mano",
      ],
      correctAnswer: 1,
      explanation:
        "L'endplay forza un avversario in una posizione dove qualsiasi carta giochi ti darà un vantaggio.",
    },
  },
  squeeze: {
    term: "Squeeze",
    definition:
      "Tecnica avanzata che costringe un avversario a scartare una carta preziosa perché ha troppi semi da guardiare.",
    emoji: "🗜️",
    category: "gioco",
    example:
      "L'avversario guarda sia ♠ che ♥. Giocando le tue vincenti in ♦, prima o poi deve abbandonare uno dei due semi.",
    relatedTerms: ["eliminazione", "contare", "sviluppo"],
    quiz: {
      question: "Cosa rende possibile uno squeeze?",
      options: [
        "Avere tutti e 4 gli Assi",
        "Un avversario che deve proteggere più semi di quante carte può tenere",
        "Giocare a Senza Atout",
        "Avere più di 20 punti",
      ],
      correctAnswer: 1,
      explanation:
        "Lo squeeze funziona quando un avversario non riesce a proteggere tutti i semi che deve guardiare.",
    },
  },
  parziale: {
    term: "Parziale (Part-score)",
    definition:
      "Un contratto sotto il livello di manche (es. 2♠, 1SA). Dà meno punti ma è più facile da realizzare.",
    emoji: "📝",
    category: "punteggio",
    example:
      "Con solo 20 punti in coppia, ci si ferma a 2♥ (parziale) invece di forzare 4♥ (manche).",
    relatedTerms: ["manche", "contratto"],
    quiz: {
      question: "Quale di questi è un contratto parziale?",
      options: ["3SA", "4♥", "2♠", "6♦"],
      correctAnswer: 2,
      explanation:
        "2♠ è un parziale (sotto il livello di manche). I contratti di manche sono 3SA, 4♠, 4♥, 5♦, 5♣.",
    },
  },
  punti_distribuzione: {
    term: "Punti Distribuzione",
    definition:
      "Punti extra dati dalla distribuzione della mano: vuoto=3, singolo=2, doppietto=1.",
    emoji: "📐",
    category: "punteggio",
    example:
      "Con ♠AK854 ♥3 ♦KJ75 ♣95: 12 punti onore + 2 per il singolo ♥3 = 14 punti totali.",
    cards: "♠AK854 ♥3 ♦KJ75 ♣95",
    relatedTerms: ["punti_onore", "distribuzione"],
    quiz: {
      question: "Quanti punti distribuzione vale un singolo (1 sola carta in un seme)?",
      options: ["0 punti", "1 punto", "2 punti", "3 punti"],
      correctAnswer: 2,
      explanation:
        "Punti distribuzione: vuoto (0 carte) = 3, singolo (1 carta) = 2, doppietto (2 carte) = 1.",
    },
  },
  regola_venti: {
    term: "Regola del 20",
    definition:
      "Per aprire con mani senza 12 HCP: somma HCP + carte nei 2 semi più lunghi. Se ≥ 20, puoi aprire.",
    emoji: "2️⃣0️⃣",
    category: "licita",
    example:
      "Con 10 HCP e 5♠+5♦: 10+5+5 = 20 → puoi aprire! Con 10 HCP e 4♠+4♦: 10+4+4 = 18 → passa.",
    cards: "♠KQ854 ♥3 ♦AJ975 ♣84",
    relatedTerms: ["apertura", "punti_onore", "seme_lungo"],
    quiz: {
      question: "In cosa consiste la Regola del 20?",
      options: [
        "Aprire solo con 20+ punti",
        "Sommare HCP + lunghezza dei 2 semi più lunghi: se ≥ 20, si apre",
        "Fare sempre 20 prese",
        "Avere almeno 20 carte alte",
      ],
      correctAnswer: 1,
      explanation:
        "La Regola del 20: HCP + carte nei 2 semi più lunghi ≥ 20 → si può aprire anche con meno di 12 HCP.",
    },
  },
  cue_bid: {
    term: "Cue Bid (Controllo)",
    definition:
      "Dichiarazione di un seme dove si ha l'Asso o il vuoto, usata per esplorare slam senza superare il livello di manche.",
    emoji: "🎯",
    category: "licita",
    example:
      "Dopo aver trovato fit in ♠, dire 4♦ mostra l'Asso o il vuoto a quadri, esplorando il piccolo slam.",
    relatedTerms: ["slam", "fit", "licita"],
    quiz: {
      question: "A cosa serve un cue bid?",
      options: [
        "A confondere gli avversari",
        "A mostrare un controllo (Asso o vuoto) in vista di un possibile slam",
        "A cambiare il seme atout",
        "A chiudere la licita",
      ],
      correctAnswer: 1,
      explanation:
        "Il cue bid mostra un controllo (Asso, Re, singolo o vuoto) per esplorare la possibilità di giocare uno slam.",
    },
  },
  stayman: {
    term: "Stayman",
    definition:
      "Convenzione: dopo 1SA del compagno, rispondere 2♣ chiede se ha un seme maggiore quarto (4♠ o 4♥).",
    emoji: "🔍",
    category: "licita",
    example:
      "Il compagno apre 1SA. Hai 4♠ e 11 punti. Dici 2♣ (Stayman). Lui risponde 2♠ se ha 4 picche.",
    relatedTerms: ["senza_atout", "fit", "risposta"],
    quiz: {
      question: "Dopo 1SA, cosa chiede la risposta 2♣ (Stayman)?",
      options: [
        "Se il compagno ha fiori lunghe",
        "Se il compagno ha un seme maggiore quarto (4♠ o 4♥)",
        "Quanti punti ha il compagno",
        "Se il compagno vuole giocare a SA",
      ],
      correctAnswer: 1,
      explanation:
        "La Stayman (2♣ dopo 1SA) chiede: 'Hai 4 carte in un seme maggiore?' per cercare un fit 4-4 in ♠ o ♥.",
    },
  },
  transfer: {
    term: "Transfer (Jacoby)",
    definition:
      "Convenzione: dopo 1SA, 2♦ = trasferimento a cuori, 2♥ = trasferimento a picche. L'apertore nomina il seme del rispondente.",
    emoji: "↗️",
    category: "licita",
    example:
      "Il compagno apre 1SA. Hai 5♥. Dici 2♦ (transfer). Lui dice 2♥ e tu sei il dichiarante.",
    relatedTerms: ["senza_atout", "seme_lungo", "fit"],
    quiz: {
      question: "Nella Jacoby Transfer dopo 1SA, cosa significa dire 2♦?",
      options: [
        "Che hai quadri lunghe",
        "Che chiedi al compagno di dire 2♥ (hai cuori lunghe)",
        "Che vuoi giocare a quadri",
        "Che passi",
      ],
      correctAnswer: 1,
      explanation:
        "2♦ è un transfer a cuori: dice al compagno di 1SA 'ho cuori lunghe, di' 2♥ così sei tu il morto'.",
    },
  },
  ducking: {
    term: "Ducking (Lasciar Passare)",
    definition:
      "Perdere intenzionalmente una presa per mantenere comunicazioni o tagliare le comunicazioni avversarie.",
    emoji: "🦆",
    category: "gioco",
    example:
      "A SA, hai ♦AK8754 al morto con un solo rientro. Lasci passare la prima ♦ per poi incassare le rimanenti.",
    cards: "♦AK8754",
    relatedTerms: ["sviluppo", "rientro", "senza_atout"],
    quiz: {
      question: "Perché si fa ducking (si perde una presa intenzionalmente)?",
      options: [
        "Per fare un regalo agli avversari",
        "Per mantenere i rientri e sviluppare un seme lungo",
        "Perché è obbligatorio",
        "Per cambiare l'atout",
      ],
      correctAnswer: 1,
      explanation:
        "Il ducking mantiene i rientri verso la mano con il seme lungo, permettendo poi di incassare tutte le carte sviluppate.",
    },
  },
  hold_up: {
    term: "Hold-up",
    definition:
      "A Senza Atout, non prendere subito con l'Asso per tagliare le comunicazioni dei difensori nel seme d'attacco.",
    emoji: "🛑",
    category: "gioco",
    example:
      "Difendono attaccando ♠. Hai ♠A73. Non prendi subito: lasci passare 1-2 giri per esaurire le picche di un difensore.",
    cards: "♠A73",
    relatedTerms: ["senza_atout", "difensori", "ducking"],
    quiz: {
      question: "Qual è lo scopo dell'hold-up a SA?",
      options: [
        "Far credere di non avere l'Asso",
        "Esaurire il seme d'attacco in un difensore per tagliare le comunicazioni",
        "Contare quante carte hanno gli avversari",
        "Permettere al morto di tagliare",
      ],
      correctAnswer: 1,
      explanation:
        "L'hold-up a SA serve a esaurire il seme d'attacco in un difensore, così quando riprende la mano non può continuare quel seme.",
    },
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

/** Get glossary entries filtered by category */
export function getTermsByCategory(
  category: GlossaryEntry["category"]
): (GlossaryEntry & { key: string })[] {
  return getAllTerms().filter((t) => t.category === category);
}

/** Get total count */
export function getGlossaryCount(): number {
  return Object.keys(GLOSSARY).length;
}
