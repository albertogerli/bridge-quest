// Quick comprehension questions shown after theory modules
// Keyed by lessonId - each lesson has 3 quick questions
// Content sourced from FIGB official course materials

export interface ComprehensionQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // index
  explanation: string;
}

export interface LessonComprehension {
  lessonId: number;
  title: string;
  questions: ComprehensionQuestion[];
}

export const comprehensionData: LessonComprehension[] = [
  // ============================================================
  // CORSO FIORI (13 lezioni, ID 0-12)
  // ============================================================

  // --- Lezione 0: Il Bridge - Le Regole di Procedura ---
  {
    lessonId: 0,
    title: "Il Bridge: un gioco di prese",
    questions: [
      {
        question: "Quanti giocatori servono per giocare a bridge e come sono divisi?",
        options: [
          "2 giocatori, uno contro l'altro",
          "4 giocatori, 2 coppie: Nord-Sud contro Est-Ovest",
          "6 giocatori, 3 per squadra",
          "4 giocatori, ognuno per se'",
        ],
        correctAnswer: 1,
        explanation:
          "Il bridge si gioca in 4 giocatori divisi in 2 coppie: N/S contro E/O. Ogni giocatore riceve 13 carte.",
      },
      {
        question: "Qual e' la gerarchia corretta dei semi dal piu' alto al piu' basso?",
        options: [
          "Cuori > Picche > Quadri > Fiori",
          "Picche > Cuori > Fiori > Quadri",
          "Senza Atout > Picche > Cuori > Quadri > Fiori",
          "Fiori > Quadri > Cuori > Picche",
        ],
        correctAnswer: 2,
        explanation:
          "La gerarchia e': Senza Atout > Picche > Cuori > Quadri > Fiori. I semi nobili (Picche e Cuori) valgono 30 punti per presa dichiarata.",
      },
      {
        question: "Quante prese deve realizzare chi dichiara '3 Senza Atout'?",
        options: ["3 prese", "6 prese", "9 prese", "13 prese"],
        correctAnswer: 2,
        explanation:
          "Il numero dichiarato si aggiunge alle prime 6 prese (il 'libro'). Quindi 3NT = 6 + 3 = 9 prese.",
      },
    ],
  },

  // --- Lezione 1: Vincenti e Affrancabili ---
  {
    lessonId: 1,
    title: "Vincenti e affrancabili",
    questions: [
      {
        question: "Avete Picche AKQJ in una mano. Quante vincenti sono?",
        options: ["1", "2", "3", "4"],
        correctAnswer: 3,
        explanation:
          "AKQJ sono 4 carte equivalenti e tutte vincenti. Il Fante vince tanto quanto l'Asso perche' sono una sequenza completa.",
      },
      {
        question:
          "Con Fiori KQJ10 (zero vincenti immediate), quante prese potete affrancare dopo aver ceduto l'Asso?",
        options: ["0", "1", "2", "3"],
        correctAnswer: 3,
        explanation:
          "Dopo una giocata l'avversario usa l'Asso; le altre 3 carte (QJ10) si affrancano e diventano vincenti.",
      },
      {
        question:
          "Avete J103 in mano e KQ92 al morto. Il numero massimo di prese fa riferimento a:",
        options: [
          "Il numero di onori",
          "Il lato con meno carte",
          "Il numero di carte del lato lungo",
          "Il numero di Assi",
        ],
        correctAnswer: 2,
        explanation:
          "Il numero massimo di prese affrancabili ha come riferimento il numero di carte del lato lungo (4 carte = massimo 4 prese, meno quelle da cedere).",
      },
    ],
  },

  // --- Lezione 2: Il Punto di Vista dei Difensori ---
  {
    lessonId: 2,
    title: "Il punto di vista dei difensori",
    questions: [
      {
        question:
          "Da difensore a Senza Atout, quale colore scegliete per l'attacco?",
        options: [
          "Il colore con piu' onori alti",
          "Il colore piu' lungo, se pari lunghezza il piu' onorato",
          "Sempre Picche perche' e' il seme piu' alto",
          "Il colore del morto",
        ],
        correctAnswer: 1,
        explanation:
          "A SA i difensori scelgono il colore piu' lungo; se due colori di pari lunghezza, il piu' onorato.",
      },
      {
        question:
          "Il terzo di mano ha KQJ nel colore d'attacco. Quale carta gioca?",
        options: ["Il Re", "La Donna", "Il Fante", "E' indifferente"],
        correctAnswer: 2,
        explanation:
          "Quando ha carte equivalenti, il terzo di mano gioca la piu' bassa della sequenza (il contrario di chi muove per primo). Con KQJ come terzo, gioca il J.",
      },
      {
        question:
          "Con KQ1043 il difensore attacca a SA. Quale carta sceglie?",
        options: [
          "Il 3 (cartina dal basso)",
          "Il Re (testa della sequenza)",
          "La Donna",
          "Il 10",
        ],
        correctAnswer: 1,
        explanation:
          "Con una sequenza solida in testa (KQ + 10 di rinforzo), si attacca dall'alto: il Re. Nega l'Asso e promette la Donna.",
      },
    ],
  },

  // --- Lezione 3: Affrancamenti di Lunga e di Posizione ---
  {
    lessonId: 3,
    title: "Affrancamenti di lunga e di posizione",
    questions: [
      {
        question:
          "Avete AQ5 al morto e 863 in mano. Come tentate l'impasse alla Donna?",
        options: [
          "Giocate la Donna dal morto",
          "Giocate l'Asso dal morto e sperate che cada il Re",
          "Giocate piccola da Sud verso la Donna del morto",
          "Giocate piccola dal morto verso Sud",
        ],
        correctAnswer: 2,
        explanation:
          "L'impasse si realizza giocando 'verso' l'onore protetto: piccola da Sud verso la Donna al morto. Se Ovest non ha il Re, la Donna vince.",
      },
      {
        question: "Qual e' la probabilita' di successo di un'impasse semplice?",
        options: ["25%", "33%", "50%", "75%"],
        correctAnswer: 2,
        explanation:
          "Un'impasse semplice ha il 50% di probabilita': l'onore mancante puo' essere a destra o a sinistra con uguale probabilita'.",
      },
      {
        question:
          "Cosa e' un 'rientro' (o ingresso) e perche' e' fondamentale per l'affrancamento di lunga?",
        options: [
          "Una carta che permette di fare presa alla mano giusta nel momento giusto",
          "Un tipo di dichiarazione",
          "Un onore alto del morto",
          "La prima carta giocata nella presa",
        ],
        correctAnswer: 0,
        explanation:
          "Il rientro e' una carta che consente di trasferire la mano alla posizione giusta per incassare le carte affrancate. Senza rientri, le affrancabili di lunga restano inutilizzabili.",
      },
    ],
  },

  // --- Lezione 4: Piano di Gioco a Senza Atout ---
  {
    lessonId: 4,
    title: "Il piano di gioco a senz'atout",
    questions: [
      {
        question:
          "Qual e' il primo passo del piano di gioco a Senza Atout?",
        options: [
          "Fare subito l'impasse",
          "Contare le vincenti e calcolare quante prese mancano",
          "Incassare tutte le vincenti",
          "Giocare il colore piu' lungo",
        ],
        correctAnswer: 1,
        explanation:
          "Il metodo del piano di gioco: 1) Quante prese ho? 2) Quante ne devo trovare? 3) Da quale colore reperirle? Prima di muovere, contate sempre le vincenti.",
      },
      {
        question: "Cos'e' il 'colpo in bianco' (duck)?",
        options: [
          "Giocare l'Asso il prima possibile",
          "Fare un'impasse senza successo",
          "Cedere subito una presa per mantenere le comunicazioni nel colore",
          "Tagliare una vincente avversaria",
        ],
        correctAnswer: 2,
        explanation:
          "Il duck e' la cessione immediata di una presa (che sarebbe comunque ceduta dopo) allo scopo di mantenere le comunicazioni con la mano che ha il colore lungo.",
      },
      {
        question:
          "Con K2 in mano e AQJ43 al morto, come evitate il blocco nel colore?",
        options: [
          "Giocate prima l'Asso dal morto",
          "Giocate prima il Re (onore del lato corto)",
          "Giocate prima la Donna",
          "Non importa l'ordine",
        ],
        correctAnswer: 1,
        explanation:
          "Giocate per primi gli onori del lato corto per evitare il blocco. Con K2 / AQJ43, iniziate con il Re, poi cartina per le vincenti al morto.",
      },
    ],
  },

  // --- Lezione 5: Il Gioco con Atout ---
  {
    lessonId: 5,
    title: "Il gioco con l'atout",
    questions: [
      {
        question: "Cos'e' un 'fit' nel bridge?",
        options: [
          "Avere tutte le carte alte in un seme",
          "L'incontro di 8 o piu' carte in un colore tra le due mani della coppia",
          "Avere 5 carte in un seme",
          "Possedere Asso e Re nello stesso seme",
        ],
        correctAnswer: 1,
        explanation:
          "Il fit e' l'incontro di 8 o piu' carte in un colore tra giocante e morto. Con fit in un nobile (Cuori/Picche) si preferisce giocare ad atout anziche' a SA.",
      },
      {
        question:
          "Perche' nel gioco ad atout la prima operazione e' spesso 'battere le atout'?",
        options: [
          "Per fare piu' prese possibili",
          "Per impedire agli avversari di tagliare le nostre vincenti laterali",
          "Perche' e' obbligatorio per regolamento",
          "Per mostrare le proprie carte al morto",
        ],
        correctAnswer: 1,
        explanation:
          "Le vincenti nei colori laterali sono vincenti RELATIVE: il giocante le potra' incassare solo quando avra' eliminato le atout avversarie. Battere atout prima protegge le vincenti.",
      },
      {
        question:
          "Cosa si intende per 'potere di allungamento' delle atout?",
        options: [
          "Le atout diventano piu' lunghe durante il gioco",
          "Tagliando dalla mano corta si ottengono piu' prese rispetto al semplice incasso",
          "Le atout valgono piu' punti",
          "Si aggiungono carte al colore di atout",
        ],
        correctAnswer: 1,
        explanation:
          "L'allungamento: tagliando dalla mano corta si possono ottenere dal colore di atout PIU' prese che giocando normalmente. Serve quando il taglio aumenta di almeno una presa.",
      },
    ],
  },

  // --- Lezione 6: Piano di Gioco ad Atout ---
  {
    lessonId: 6,
    title: "Il piano di gioco con l'atout",
    questions: [
      {
        question:
          "Quando NON dovete battere subito le atout nel gioco a colore?",
        options: [
          "Mai: le atout vanno sempre battute subito",
          "Quando avete bisogno di fare tagli dalla parte corta",
          "Quando avete piu' di 8 atout in linea",
          "Quando il morto ha molte vincenti",
        ],
        correctAnswer: 1,
        explanation:
          "Aspettate a battere atout se avete bisogno di tagliare dalla parte corta. Altrimenti perdereste le atout necessarie per i tagli prima di realizzarli.",
      },
      {
        question:
          "Nel gioco ad atout, l'attacco da due carte: quale carta si sceglie?",
        options: [
          "Sempre la piu' bassa",
          "Sempre la piu' alta",
          "Quella con l'onore piu' alto",
          "E' indifferente",
        ],
        correctAnswer: 1,
        explanation:
          "Quando si attacca da due carte ad atout, si sceglie sempre la piu' alta. Con 74: il 7. Con 102: il 10. Con A9: l'Asso.",
      },
      {
        question:
          "Perche' ad atout non si deve MAI attaccare 'sotto Asso'?",
        options: [
          "E' vietato dal regolamento",
          "Perche' l'Asso va sempre giocato per primo",
          "Si rischia di regalare una presa al giocante",
          "Il compagno non capirebbe il segnale",
        ],
        correctAnswer: 2,
        explanation:
          "Mai attaccare sotto Asso ad atout: si rischia di regalare una presa. Ad atout, le prese si cercano da onori alti o da tagli, non da sviluppi lunghi.",
      },
    ],
  },

  // --- Lezione 7: La Dichiarazione di Apertura ---
  {
    lessonId: 7,
    title: "La valutazione della mano",
    questions: [
      {
        question: "Quanto valgono i punti onori Milton Work: A, K, Q, J?",
        options: [
          "A=5, K=4, Q=3, J=2",
          "A=4, K=3, Q=2, J=1",
          "A=3, K=2, Q=1, J=0",
          "A=10, K=5, Q=3, J=1",
        ],
        correctAnswer: 1,
        explanation:
          "Il conteggio Milton Work: Asso=4, Re=3, Donna=2, Fante=1. Totale per seme: 10 punti. Totale nel mazzo: 40 punti.",
      },
      {
        question:
          "Con due semi di 5 carte e 12 punti, quale colore aprite?",
        options: [
          "Il colore piu' basso di rango",
          "Il colore con piu' onori",
          "Il colore piu' alto di rango",
          "Sempre Fiori",
        ],
        correctAnswer: 2,
        explanation:
          "Con due semi di 5 carte si apre nel piu' alto di rango. La scelta del colore dipende dalle lunghezze, NON dalla posizione degli onori.",
      },
      {
        question:
          "Con 16 punti e distribuzione bilanciata 4-3-3-3, cosa aprite?",
        options: ["1 nel colore quarto", "1NT", "Passo", "2NT"],
        correctAnswer: 1,
        explanation:
          "Con 15-17 punti e distribuzione bilanciata (4333, 4432, 5332) si apre 1NT. Questa apertura prevale sull'apertura a colore.",
      },
    ],
  },

  // --- Lezione 8: Le Aperture di 1NT e 2NT ---
  {
    lessonId: 8,
    title: "L'apertura e la risposta",
    questions: [
      {
        question:
          "Il partner apre 1NT. Avete 10 punti senza fit in un nobile. Cosa rispondete?",
        options: [
          "Passo",
          "2NT (invitante)",
          "3NT (la manche e' certa)",
          "2 Fiori (Stayman)",
        ],
        correctAnswer: 2,
        explanation:
          "Con 10+ punti e mano senza fit nobile si risponde 3NT. La manche e' certa: 15-17 + 10 = almeno 25 punti in linea.",
      },
      {
        question:
          "Dopo 1NT - 2 Fiori (Stayman), l'apertore risponde 2 Quadri. Cosa significa?",
        options: [
          "Ha 4 carte a Quadri",
          "Non ha ne' 4 Cuori ne' 4 Picche",
          "Ha 4 Cuori e 4 Picche",
          "Ha solo 15 punti (il minimo)",
        ],
        correctAnswer: 1,
        explanation:
          "Nella Stayman: 2Q = 'non ho ne' 4 Cuori ne' 4 Picche'; 2C = 'ho 4 Cuori'; 2P = 'ho 4 Picche'; 2NT = 'ho 4C e 4P'.",
      },
      {
        question:
          "Il partner apre 1NT. Avete 5 Cuori e 3 punti. Cosa rispondete?",
        options: [
          "Passo (troppo deboli)",
          "2 Cuori (proposta di parziale, conclusiva)",
          "3 Cuori (invitante)",
          "2 Fiori (Stayman)",
        ],
        correctAnswer: 1,
        explanation:
          "Con 5+ carte in un nobile e mano debole (0-7 punti) si risponde a livello 2 nel colore. E' una proposta di parziale CONCLUSIVA: il partner deve passare.",
      },
    ],
  },

  // --- Lezione 9: Apertura di 1 a Colore - Le Risposte ---
  {
    lessonId: 9,
    title: "Aperture di 1 a colore. Le risposte",
    questions: [
      {
        question:
          "Il partner apre 1 Picche e avete 4 punti. Cosa rispondete?",
        options: ["1NT", "2 Picche", "Passo", "2 Fiori"],
        correctAnswer: 2,
        explanation:
          "Con meno di 5 punti si dice Passo. L'apertore puo' avere 12-20: con solo 4 punti la manche (24-25) non e' raggiungibile.",
      },
      {
        question:
          "Il partner apre 1 Quadri. Avete 7 punti e 4 carte di Quadri. Cosa rispondete?",
        options: [
          "1NT",
          "2 Quadri (appoggio limitativo)",
          "3 Quadri (invitante)",
          "Passo",
        ],
        correctAnswer: 1,
        explanation:
          "Appoggio a livello 2: limitativo, mostra fit (4 carte su 1Q) e 5-9 punti. Il messaggio: 'se hai una mano normale, la manche e' irraggiungibile'.",
      },
      {
        question:
          "Il partner apre 1 Cuori. Quale risposta e' FORZANTE (l'apertore non puo' passare)?",
        options: [
          "2 Cuori (appoggio)",
          "1NT (5-10 punti)",
          "1 Picche (colore nuovo a livello 1)",
          "Passo",
        ],
        correctAnswer: 2,
        explanation:
          "Un colore nuovo in risposta e' sempre FORZANTE: l'apertore non puo' passare. Promette 5+ punti e almeno 4 carte nel colore.",
      },
    ],
  },

  // --- Lezione 10: L'Apertore Descrive ---
  {
    lessonId: 10,
    title: "L'apertore descrive",
    questions: [
      {
        question:
          "L'apertore con 12-15 punti e' definito 'mano di Diritto'. Qual e' il suo Livello di Guardia con mano bilanciata?",
        options: ["1 nel suo colore", "1NT", "2NT", "2 nel suo colore"],
        correctAnswer: 1,
        explanation:
          "Con mano bilanciata di Diritto (12-15), il Livello di Guardia e' 1NT. La ridichiarazione non superera' quel livello.",
      },
      {
        question:
          "Il partner risponde 1 su 1 e l'apertore ha 18-20 punti e mano bilanciata. Come ridichiara?",
        options: [
          "1NT",
          "Passo",
          "Salto a 2NT",
          "Ripete il suo colore",
        ],
        correctAnswer: 2,
        explanation:
          "La bilanciata 18-20 si descrive con il salto a 2NT dopo risposta 1 su 1. E' troppo forte per 1NT (15-17) e troppo debole per apertura 2NT (21-23).",
      },
      {
        question:
          "Dopo una risposta '2 su 1' (es. 1P-2Q), la situazione e' forzante a manche. L'apertore cosa deve fare?",
        options: [
          "Passare se ha il minimo",
          "Descrivere la DISTRIBUZIONE senza distinguere Diritto/Rovescio",
          "Saltare subito a manche",
          "Dire 2NT per frenare",
        ],
        correctAnswer: 1,
        explanation:
          "Su risposte 2 su 1 la coppia ha almeno 24 punti: la manche e' assicurata. L'apertore descrive solo la DISTRIBUZIONE senza fare distinzioni tra Diritto e Rovescio.",
      },
    ],
  },

  // --- Lezione 11: L'Intervento ---
  {
    lessonId: 11,
    title: "L'intervento",
    questions: [
      {
        question:
          "L'avversario apre 1 Cuori. Con 14 punti e 4 Picche + tolleranza minori, cosa fate?",
        options: [
          "Passo",
          "Contro (informativo)",
          "1 Picche",
          "1NT",
        ],
        correctAnswer: 1,
        explanation:
          "Il Contro informativo su 1C garantisce 4 Picche e tolleranza per Fiori e Quadri, con 12-16 punti. E' il modo per chiedere al compagno di scegliere.",
      },
      {
        question:
          "L'intervento di 1NT dopo apertura avversaria mostra:",
        options: [
          "8-12 punti e mano lunga",
          "15-17 punti bilanciata CON fermo nel colore avversario",
          "15-17 punti bilanciata senza requisiti sul fermo",
          "21-23 punti bilanciata",
        ],
        correctAnswer: 1,
        explanation:
          "L'intervento di 1NT e' equivalente all'apertura 1NT (15-17 bilanciata) MA garantisce in piu' il fermo nel colore dell'apertore.",
      },
      {
        question:
          "L'intervento a colore a livello 1 (es. 1F-1P) richiede almeno:",
        options: [
          "5 punti e 4 carte",
          "12 punti e 4 carte",
          "8 punti e 5 carte con almeno 1 Onore",
          "10 punti e 6 carte",
        ],
        correctAnswer: 2,
        explanation:
          "L'intervento 1 su 1 richiede 8-16 punti e 5+ carte con almeno 1 Onore (A, K o Q). Se il punteggio e' minimo, dev'essere concentrato nel colore.",
      },
    ],
  },

  // --- Lezione 12: Sviluppi dopo l'Intervento Avversario ---
  {
    lessonId: 12,
    title: "Sviluppi dopo l'intervento avversario",
    questions: [
      {
        question:
          "L'avversario interviene con il Contro sull'apertura del partner. Con 11+ punti, cosa fate?",
        options: [
          "Passo",
          "Surcontro",
          "2NT",
          "Appoggio a salto",
        ],
        correctAnswer: 1,
        explanation:
          "Con 11+ punti sul Contro avversario si fa Surcontro: e' l'unica dichiarazione forte. La descrizione della mano si rimanda al giro successivo.",
      },
      {
        question:
          "Dopo un intervento avversario a colore, la risposta 1NT mostra:",
        options: [
          "5-10 punti senza nessun requisito particolare",
          "7-10 punti con il fermo nel colore avversario",
          "15-17 punti bilanciata",
          "Mano debole qualsiasi",
        ],
        correctAnswer: 1,
        explanation:
          "Con l'intervento, i Senza non sono piu' obbligati ma proposte di contratto: promettono il fermo nel colore avversario. 1NT = 7-10 punti con fermo.",
      },
      {
        question:
          "L'apertore e' passato dopo che il 4o di mano ha detto 1P su 1Q-1C. Con mano normale bilanciata, cosa fa l'apertore?",
        options: [
          "Ridice 2 Quadri per mostrare forza",
          "Contro per mostrare i suoi punti",
          "Passa (con mani normali dopo intervento del quarto, l'apertore passa)",
          "1NT per mostrare il fermo",
        ],
        correctAnswer: 2,
        explanation:
          "Con mani normali bilanciate o sbilanciate dopo intervento del 4o di mano: l'apertore Passa. Il partner avra' comunque modo di parlare grazie all'intervento avversario.",
      },
    ],
  },

  // ============================================================
  // CORSO QUADRI (12 lezioni, ID 1-12)
  // Nota: gli ID coincidono con Fiori. Queste domande saranno
  // servite quando l'architettura distinguera' i corsi.
  // ============================================================

  // --- Quadri Lez. 1: Tempi e Comunicazioni nel Gioco a Senza ---
  // ID conflicts with Fiori; these entries are for future use
  // when Quadri lesson IDs are properly namespaced

  // --- Quadri Lez. 2: Valutazioni sull'Apertura ---
  // --- Quadri Lez. 3: Contratti ad Atout - Tempo e Controllo ---
  // --- Quadri Lez. 4: Il Capitanato e la Replica dell'Apertore ---
  // --- Quadri Lez. 5: I Colori Bucati ---
  // --- Quadri Lez. 6: Le Aperture Oltre il Livello 1 ---
  // --- Quadri Lez. 7: Attacchi e Segnali di Controgioco ---
  // --- Quadri Lez. 8: L'Accostamento a Manche ---
  // --- Quadri Lez. 9: Ricevere l'Attacco ---
  // --- Quadri Lez. 10: Il Contro e la Surlicita ---
  // --- Quadri Lez. 11: Controgioco - Ragionare e Dedurre ---
  // --- Quadri Lez. 12: Interventi e Riaperture ---

  // ============================================================
  // CORSO CUORI GIOCO (10 lezioni, ID 100-109)
  // ============================================================

  // --- Lezione 100: La Prima Presa ---
  {
    lessonId: 100,
    title: "La Prima Presa",
    questions: [
      {
        question:
          "Nel gioco a colore, quale attacco e' considerato 'anormale' e sospetto?",
        options: [
          "Attacco dal colore del compagno",
          "Attacco da una sequenza (es. KQJ)",
          "Attacco sotto Asso",
          "Attacco da AK nel proprio colore",
        ],
        correctAnswer: 2,
        explanation:
          "Nessun giocatore attacca sotto Asso nei contratti a colore. Se lo fa, sospettate un motivo nascosto come la ricerca di un taglio dal compagno.",
      },
      {
        question:
          "Al morto c'e' K3 e in mano J54. L'avversario attacca con il 2 (vi mancano A e Q). Cosa giocate dal morto?",
        options: [
          "Il Re, sperando che cada l'Asso",
          "Piccola, stando bassi",
          "Il 3, perche' e' indifferente",
          "Dipende dalla dichiarazione avversaria",
        ],
        correctAnswer: 1,
        explanation:
          "State bassi! Chi attacca puo' avere la Dama ma probabilmente non l'Asso. Mettendo il Re si perde sicuramente; stando bassi il Re potrebbe vincere in seguito.",
      },
      {
        question:
          "Prima di giocare la prima carta dal morto, cosa dovete fare?",
        options: [
          "Giocare il piu' velocemente possibile",
          "Contare solo i punti del morto",
          "Fare una pausa di riflessione, dedurre dalla carta d'attacco e dalla licita",
          "Chiedere consiglio al compagno",
        ],
        correctAnswer: 2,
        explanation:
          "La pausa alla prima presa e' fondamentale. Dedurre dalla carta d'attacco, ricordare la licita, formulare ipotesi sulla distribuzione e fare il piano di gioco PRIMA di muovere.",
      },
    ],
  },

  // --- Lezione 101: Fit 5-3 e Fit 4-4 ---
  {
    lessonId: 101,
    title: "Fit 5-3 e Fit 4-4",
    questions: [
      {
        question:
          "Nel gioco ad atout, la 'Mano Base' e la 'Mano Satellite' si riferiscono a:",
        options: [
          "La mano forte e la mano debole",
          "La mano con piu' atout (Base) e l'altra (Satellite che fa i tagli)",
          "La mano del giocante e quella del morto",
          "Il seme di atout e il seme laterale",
        ],
        correctAnswer: 1,
        explanation:
          "La Mano Base e' quella con piu' atout, destinata a battere le atout avversarie. La Mano Satellite usa le sue atout per tagliare. I tagli della Satellite producono prese extra.",
      },
      {
        question: "Perche' il fit 4-4 e' considerato il piu' potente?",
        options: [
          "Perche' ha piu' punti",
          "Perche' non c'e' una mano Base a priori e si puo' tagliare da entrambe le parti",
          "Perche' garantisce 10 prese",
          "Perche' gli avversari hanno meno atout",
        ],
        correctAnswer: 1,
        explanation:
          "Il fit 4-4 e' il piu' potente perche' non avendo una mano Base predefinita, si puo' scegliere da quale parte tagliare a seconda delle esigenze, massimizzando le prese.",
      },
      {
        question:
          "Quando il piano di gioco prevede tagli al morto e lunghe laterali, cosa bisogna verificare?",
        options: [
          "Che il morto abbia molti punti",
          "Che i rientri e i collegamenti siano preservati",
          "Che le atout siano tutte in mano",
          "Che l'avversario non abbia l'Asso di atout",
        ],
        correctAnswer: 1,
        explanation:
          "Le prese del Satellite devono essere raggiungibili! Se l'unico modo per raggiungere una lunga del morto e' il colore di atout, non bisogna accorciarlo con i tagli.",
      },
    ],
  },

  // --- Lezione 102: Conto e Preferenziali ---
  {
    lessonId: 102,
    title: "Conto e Preferenziali",
    questions: [
      {
        question:
          "Nel 'conto della carta', come segnalate di avere un numero PARI di carte nel colore giocato dal compagno?",
        options: [
          "Giocate la carta piu' piccola",
          "Giocate una carta alta seguita da una bassa",
          "Giocate sempre il 2",
          "Giocate un onore",
        ],
        correctAnswer: 1,
        explanation:
          "Nel conto: con 2, 4 o 6 carte (pari) si sceglie una carta ALTA cui seguira' una piu' bassa. Con 1, 3 o 5 carte (dispari) si gioca la piu' piccola.",
      },
      {
        question:
          "Il compagno attacca e voi non siete impegnati nella presa. Come segnalate 'gradimento' nel sistema Pari-Dispari?",
        options: [
          "Carta alta = gradimento",
          "Carta bassa = gradimento",
          "Carta dispari = gradimento",
          "Carta pari = gradimento",
        ],
        correctAnswer: 2,
        explanation:
          "Nel sistema Pari-Dispari usato in Italia: carta DISPARI = gradimento (continua nel colore), carta PARI = sgradimento (cambia colore).",
      },
      {
        question:
          "Quando un difensore effettua il PRIMO scarto, cosa significa una carta DISPARI?",
        options: [
          "Non ha valori nel colore scartato",
          "Chiama: mostra valori nel colore scartato",
          "Ha un numero dispari di carte in quel colore",
          "Chiede il ritorno nel colore di attacco",
        ],
        correctAnswer: 1,
        explanation:
          "Al primo scarto: DISPARI chiama (mostra valori nel colore) e PARI rifiuta (nega valori). E' il 'primo scarto all'italiana'.",
      },
    ],
  },

  // --- Lezione 103: I Colori da Muovere in Difesa ---
  {
    lessonId: 103,
    title: "I Colori da Muovere in Difesa",
    questions: [
      {
        question:
          "In difesa, quando il giocante inizia un colore con una piccola, cosa fate in seconda posizione?",
        options: [
          "Coprite sempre con il vostro onore piu' alto",
          "Giocate piccola (seconda di mano bassa)",
          "Giocate il vostro onore medio",
          "Tagliate se possibile",
        ],
        correctAnswer: 1,
        explanation:
          "In seconda posizione: giocate piccola se l'avversario ha iniziato con una piccola. Se ha iniziato con un onore, coprite il suo onore.",
      },
      {
        question:
          "Il compagno attacca in un colore che avete. Quando dovreste giocare il vostro onore alto?",
        options: [
          "Mai, lasciate che il compagno faccia da solo",
          "Sempre, per cercare di vincere la presa",
          "Solo se l'onore e' l'Asso",
          "Quando il gradimento richiede di continuare il colore e avete carte equivalenti",
        ],
        correctAnswer: 1,
        explanation:
          "Il terzo di mano deve cercare di vincere la presa, eventualmente sacrificando i suoi onori per affrancare quelli del compagno. E' un principio fondamentale della difesa.",
      },
      {
        question:
          "Quando e' corretto dare il segnale di gradimento?",
        options: [
          "Sempre quando il compagno muove un colore",
          "Solo quando il colore e' mosso dai difensori, MAI se mosso dal Giocante",
          "Quando il Giocante attacca un colore dal morto",
          "Solo nella prima presa",
        ],
        correctAnswer: 1,
        explanation:
          "Il gradimento si da' SOLO quando un colore viene mosso dai difensori. Non si segnala MAI quando il colore e' mosso dal Giocante: in quel caso si difende normalmente.",
      },
    ],
  },

  // --- Lezione 104: I Giochi di Sicurezza ---
  {
    lessonId: 104,
    title: "I Giochi di Sicurezza",
    questions: [
      {
        question:
          "Cos'e' un 'gioco di sicurezza' nel bridge?",
        options: [
          "Giocare sempre gli Assi per primi",
          "Rinunciare a una presa potenziale per garantirsi di non perderne due",
          "Battere sempre tutte le atout prima di giocare",
          "Giocare sempre l'impasse",
        ],
        correctAnswer: 1,
        explanation:
          "Il gioco di sicurezza consiste nel rinunciare volontariamente a una presa (o alla possibilita' di farla) per proteggersi da cattive divisioni e garantire il contratto.",
      },
      {
        question:
          "Quando e' piu' importante la sicurezza rispetto alla massimizzazione delle prese?",
        options: [
          "Sempre nel gioco a Senza Atout",
          "Quando si gioca a squadre (IMP) e il contratto e' importante",
          "Solo quando si ha slam",
          "Solo quando si ha meno di 20 punti",
        ],
        correctAnswer: 1,
        explanation:
          "A squadre (IMP) il concetto di sicurezza e' fondamentale: perdere un contratto per cercare una presa in piu' e' un disastro. A coppie (Mitchell) la presa in piu' conta di piu'.",
      },
      {
        question:
          "Con AK1032 in mano e 654 al morto, quale manovra protegge da Q quarta?",
        options: [
          "Tirare Asso e Re sperando che la Donna cada",
          "Fare l'impasse giocando piccola verso il 10",
          "Giocare l'Asso, poi piccola verso il 10 (gioco di sicurezza)",
          "Giocare il 6 dal morto per il 10",
        ],
        correctAnswer: 2,
        explanation:
          "Il gioco di sicurezza: tirare l'Asso per catturare l'eventuale Q secca, poi piccola verso il 10 per gestire Q quarta dall'altro lato. Si perde al massimo 1 presa.",
      },
    ],
  },

  // --- Lezione 105: Probabilita' e Percentuali ---
  {
    lessonId: 105,
    title: "Probabilita' e Percentuali",
    questions: [
      {
        question:
          "Con 8 carte in linea in un colore, quale divisione avversaria e' la piu' probabile?",
        options: [
          "2-3 (piu' della meta' delle volte)",
          "3-2 nel 68% dei casi",
          "4-1 nel 50% dei casi",
          "2-3 nel 50% e 4-1 nel 50%",
        ],
        correctAnswer: 1,
        explanation:
          "Con 8 carte in linea, la divisione 3-2 si trova nel 68% dei casi, la 4-1 nel 28% e la 5-0 nel 4%.",
      },
      {
        question:
          "Con 7 carte in linea, qual e' la probabilita' di trovare la divisione 3-3 avversaria?",
        options: ["50%", "48%", "36%", "68%"],
        correctAnswer: 2,
        explanation:
          "Con 7 carte in linea, la 3-3 avversaria si trova solo nel 36% dei casi. La 4-2 e' molto piu' frequente (48%).",
      },
      {
        question:
          "Quando manca solo la Dama e avete 9+ carte nel colore, cosa fate?",
        options: [
          "Sempre l'impasse",
          "Battete Asso e Re (la Dama cade)",
          "Dipende dalla posizione",
          "Giocate un gioco di sicurezza",
        ],
        correctAnswer: 1,
        explanation:
          "Con 9+ carte in linea e la sola Dama mancante, la percentuale del drop (battere A e K) supera quella dell'impasse. La Dama e' piu' probabilmente secca o seconda.",
      },
    ],
  },

  // --- Lezione 106: Coprire o Non Coprire ---
  {
    lessonId: 106,
    title: "Coprire o Non Coprire",
    questions: [
      {
        question:
          "In seconda posizione, il giocante muove un onore dal morto. Quando dovete coprirlo?",
        options: [
          "Sempre, e' la regola universale",
          "Mai, si gioca sempre piccola in seconda",
          "Quando coprendo potete promuovere un onore al compagno o a voi stessi",
          "Solo se avete l'Asso",
        ],
        correctAnswer: 2,
        explanation:
          "Si copre l'onore del morto quando coprendo si puo' promuovere un onore per la propria linea. Se coprire non produce nulla (es. il morto ha una sequenza), meglio giocare piccola.",
      },
      {
        question:
          "Il morto ha QJ109. Il giocante gioca la Donna. Coprite con il Re?",
        options: [
          "Si', sempre coprire un onore",
          "No, perche' il morto ha una sequenza: coprire non promuove nulla",
          "Si', per bloccare il colore",
          "Dipende dai punti del giocante",
        ],
        correctAnswer: 1,
        explanation:
          "Non coprite! Quando il morto ha una sequenza (QJ109), coprire con il Re regala la presa senza promuovere nulla. Il giocante vincerebbe con A e le altre sarebbero comunque franche.",
      },
      {
        question:
          "La regola di seconda mano bassa ('piccola su piccola') si applica sempre?",
        options: [
          "Si', senza eccezioni",
          "No, a volte bisogna salire per impedire al giocante di fare prese con carte basse",
          "Solo nel gioco a Senza Atout",
          "Solo se si ha un onore alto",
        ],
        correctAnswer: 1,
        explanation:
          "La regola 'piccola su piccola' ha eccezioni: quando si puo' prendere la presa con certezza, o quando lasciando passare si permetterebbe al giocante una presa immeritata.",
      },
    ],
  },

  // --- Lezione 107: I Giochi di Eliminazione ---
  {
    lessonId: 107,
    title: "I Giochi di Eliminazione",
    questions: [
      {
        question:
          "Cos'e' una 'messa in mano' (endplay)?",
        options: [
          "Giocare la prima carta nella presa",
          "Mettere un avversario in presa obbligandolo a giocare a nostro vantaggio",
          "Passare la mano al morto",
          "Giocare l'ultima carta rimasta",
        ],
        correctAnswer: 1,
        explanation:
          "La messa in mano (endplay) forza un avversario a vincere la presa e poi a giocare un colore favorevole per noi: o regalandoci un rientro, o offrendo un taglio e scarto.",
      },
      {
        question:
          "Prima di effettuare una messa in mano, cosa bisogna fare?",
        options: [
          "Battere tutte le atout",
          "Eliminare i colori 'di uscita' dell'avversario",
          "Contare i punti del morto",
          "Giocare tutti gli Assi",
        ],
        correctAnswer: 1,
        explanation:
          "Prima della messa in mano bisogna 'eliminare' i colori neutri (quelli che l'avversario potrebbe rigiocare senza danno), cosi' quando sara' in presa sara' costretto a giocare nel colore favorevole a noi.",
      },
      {
        question: "Cos'e' il 'taglio e scarto'?",
        options: [
          "Tagliare un colore e scartarne un altro",
          "L'avversario in presa gioca un colore in cui noi siamo vuoti al morto e in mano, dandoci la possibilita' di tagliare da una parte e scartare una perdente dall'altra",
          "Una convenzione di licita",
          "Scartare le atout per fare tagli",
        ],
        correctAnswer: 1,
        explanation:
          "Il 'taglio e scarto' (ruff and discard) si verifica quando l'avversario e' costretto a giocare un colore in cui una mano e' vuota: si taglia da una parte e si scarta una perdente dall'altra.",
      },
    ],
  },

  // --- Lezione 108: Giocare Come Se ---
  {
    lessonId: 108,
    title: "Giocare Come Se",
    questions: [
      {
        question:
          "Cosa significa 'giocare come se' nel bridge?",
        options: [
          "Giocare facendo finta di avere piu' punti",
          "Ipotizzare una distribuzione avversaria necessaria per mantenere il contratto e giocare di conseguenza",
          "Copiare il gioco degli avversari",
          "Giocare senza guardare le carte",
        ],
        correctAnswer: 1,
        explanation:
          "Giocare 'come se' significa formulare un'ipotesi sulla distribuzione avversaria che renda il contratto possibile, e agire come se fosse certa. Se l'ipotesi alternativa porta comunque al fallimento, non c'e' nulla da perdere.",
      },
      {
        question:
          "Quando il contratto dipende da una condizione necessaria, cosa dovete fare?",
        options: [
          "Sperare nella fortuna",
          "Affrontare subito la condizione necessaria, non rimandarla",
          "Evitare il problema il piu' a lungo possibile",
          "Chiedere il Contro per guadagnare tempo",
        ],
        correctAnswer: 1,
        explanation:
          "Rimandare il problema spesso significa perdere la possibilita' di risolverlo. Se il contratto dipende da una condizione (es. un'impasse), affrontatela subito.",
      },
      {
        question:
          "Se il contratto puo' essere mantenuto solo con una specifica divisione degli onori avversari, come procedete?",
        options: [
          "Giocate la linea che funziona nel maggior numero di casi",
          "Ipotizzate la divisione favorevole e giocate di conseguenza",
          "Provate prima la linea piu' sicura e poi cambiate",
          "Non importa: il risultato e' casuale",
        ],
        correctAnswer: 1,
        explanation:
          "Se l'unica via per mantenere il contratto e' una specifica distribuzione, la assumete come vera e giocate di conseguenza. Se fosse diversa, il contratto sarebbe comunque perso.",
      },
    ],
  },

  // --- Lezione 109: Le Deduzioni del Giocante ---
  {
    lessonId: 109,
    title: "Le Deduzioni del Giocante",
    questions: [
      {
        question:
          "L'avversario ha aperto 1NT (15-17) e poi ha giocato Asso e Re di un colore. Quanti punti ha al massimo negli altri colori?",
        options: [
          "17 (non si sa nulla)",
          "Al massimo 10 (15-17 meno A+K=7)",
          "Al massimo 14",
          "Al massimo 7",
        ],
        correctAnswer: 1,
        explanation:
          "Se l'avversario ha aperto 1NT (15-17) e ha mostrato A e K in un colore (7 punti), negli altri colori avra' al massimo 10 punti. Queste deduzioni dalla licita sono fondamentali per localizzare gli onori mancanti.",
      },
      {
        question:
          "L'avversario ha passato in apertura e poi ha giocato AK di fiori. Dove cercate la Donna di un altro seme?",
        options: [
          "Indifferentemente da una parte o dall'altra",
          "Sicuramente dall'altra parte (chi ha passato con AK ha al massimo 10 punti, non abbastanza per una Donna in piu')",
          "Dalla stessa parte di chi ha AK",
          "Non si possono fare deduzioni",
        ],
        correctAnswer: 1,
        explanation:
          "Se un giocatore ha passato in apertura con AK di fiori (7 punti), non puo' avere troppo di piu'. Le Donne e i Re mancanti saranno probabilmente dall'altro lato.",
      },
      {
        question:
          "Quando la carta d'attacco e' un'onore alto (es. Re), cosa potete dedurre?",
        options: [
          "Niente di preciso",
          "L'attaccante ha una sequenza: il Re promette anche la Donna e nega l'Asso",
          "L'attaccante ha solo il Re",
          "L'attaccante sta cercando un taglio",
        ],
        correctAnswer: 1,
        explanation:
          "Un attacco di Re promette la Donna (carta immediatamente inferiore) e nega l'Asso (carta immediatamente superiore). Queste regole di attacco permettono di ricostruire la distribuzione.",
      },
    ],
  },

  // ============================================================
  // CORSO CUORI LICITA (14 lezioni, ID 200-213)
  // ============================================================

  // --- Lezione 200: La Legge delle Prese Totali ---
  {
    lessonId: 200,
    title: "La Legge delle Prese Totali",
    questions: [
      {
        question:
          "Secondo la Legge delle Prese Totali, se NS ha 9 atout e EO ha 8 atout, quante sono le Prese Totali?",
        options: ["15", "16", "17", "18"],
        correctAnswer: 2,
        explanation:
          "Prese Totali = Somma delle atout. 9 + 8 = 17 Prese Totali. Ogni coppia fara' circa tante prese quante atout possiede.",
      },
      {
        question:
          "Avete fit quarto con distribuzione 4-3-3-3 e il compagno ha aperto. Quante prese contate secondo la Legge?",
        options: [
          "8 (come se aveste fit quarto normale)",
          "7 (svalutate di una presa per la distribuzione piatta)",
          "9 (il fit quarto garantisce 9 prese)",
          "6 (le distribuzioni piatte non danno prese)",
        ],
        correctAnswer: 1,
        explanation:
          "Le distribuzioni piatte 4333 riducono la resa: svalutate di una presa. Con 8 atout in linea ma 4333, dichiarate solo 2 nel colore anziche' 3.",
      },
      {
        question:
          "Dopo 1C-1P-2C-2P, il vostro partner rialza a 3C. E' un invito a manche?",
        options: [
          "Si', sta invitando con punti buoni",
          "No, e' competitivo secondo la Legge (9 atout, 9 prese)",
          "Si', mostra 16-18 punti",
          "Dipende dalla vulnerabilita'",
        ],
        correctAnswer: 1,
        explanation:
          "3C dopo 1C-1P-2C-2P e' competitivo (9 carte, 9 prese secondo la Legge). Per invitare a manche si usano dichiarazioni convenzionali come 2NT, Contro, o un nuovo colore.",
      },
    ],
  },

  // --- Lezione 201: Valutazioni - Le Lunghe e le Corte ---
  {
    lessonId: 201,
    title: "Valutazioni: le lunghe e le corte",
    questions: [
      {
        question:
          "Il compagno ha un singolo nel vostro colore. Quale onore conserva valore?",
        options: [
          "Tutti gli onori (AKQJ)",
          "Solo l'Asso",
          "Il Re e la Donna",
          "Nessuno",
        ],
        correctAnswer: 1,
        explanation:
          "A fronte di un singolo del partner, solo l'Asso e' un onore interessante. Re, Donna e Fante davanti a un singolo sono valori potenzialmente sprecati.",
      },
      {
        question:
          "Con una settima nobile (7+ carte di Cuori o Picche), come vi comportate in dichiarazione?",
        options: [
          "Fate il Contro Sputnik per cercare il fit",
          "Dichiarate il colore direttamente: la settima DEVE essere atout",
          "Aprite a Senza Atout se avete i punti",
          "Passate se avete pochi punti",
        ],
        correctAnswer: 1,
        explanation:
          "Con monocolori di 7+ carte, il colore deve essere atout quasi sempre. Non nascondete le lunghe dietro il Contro Sputnik: dichiarate il colore.",
      },
      {
        question:
          "Il partner apre 2NT (21-23) e avete 1 punto con una settima nobile. Cosa fate?",
        options: [
          "Passo (troppo deboli)",
          "Dichiarate manche nel vostro nobile (4C o 4P)",
          "2NT + 1 non basta per la manche",
          "Dite 3 nel vostro colore come invito",
        ],
        correctAnswer: 1,
        explanation:
          "Con una settima nobile e apertura 2NT forte, dichiarate manche direttamente (4C o 4P) anche con pochissimi punti. La lunga compensa la mancanza di onori.",
      },
    ],
  },

  // --- Lezione 202: Le Texas su Apertura 1NT e 2NT ---
  {
    lessonId: 202,
    title: "Le Texas su apertura 1NT e 2NT",
    questions: [
      {
        question:
          "Dopo 1NT, la risposta 2 Quadri (Jacoby Transfer) mostra:",
        options: [
          "5+ carte di Quadri e mano debole",
          "5+ carte di Cuori (transfer: si dichiara il colore immediatamente inferiore)",
          "La Stayman avanzata",
          "Un invito a 3NT",
        ],
        correctAnswer: 1,
        explanation:
          "Jacoby Transfer: per mostrare un colore si dichiara quello immediatamente inferiore. 2Q = 5+ Cuori, 2C = 5+ Picche. L'apertore 'rispetta' il transfer.",
      },
      {
        question:
          "Dopo 1NT-2Q-2C, il rispondente dice 4NT. Cosa significa?",
        options: [
          "Blackwood, richiesta d'Assi",
          "4NT quantitativo: invito a slam (NON richiesta d'Assi)",
          "Vuole giocare 4NT",
          "Chiede il numero delle Dame",
        ],
        correctAnswer: 1,
        explanation:
          "4NT dopo transfer su 1NT e' QUANTITATIVO, cioe' un invito a slam. Non e' Blackwood! Per chiedere gli Assi si usa la Stayman e poi si cerca l'atout.",
      },
      {
        question:
          "Su 1NT, la risposta 2 Picche mostra:",
        options: [
          "5+ Picche e mano debole",
          "Almeno 6 carte di Fiori (transfer per i minori)",
          "Un invito a 3P",
          "Stayman per le Picche",
        ],
        correctAnswer: 1,
        explanation:
          "I transfer per i minori: 2P = mostra le Fiori (almeno 6 carte), 2NT = mostra le Quadri (almeno 6 carte). L'apertore rispetta il transfer o fa la 'super accettazione' con onore maggiore.",
      },
    ],
  },

  // --- Lezione 203: Sviluppi dopo le Risposte 2 su 1 ---
  {
    lessonId: 203,
    title: "Sviluppi dopo le risposte 2 su 1",
    questions: [
      {
        question:
          "Dopo 1P-2F, l'apertore ridichiara 2NT. Cosa mostra?",
        options: [
          "Bilanciata forte (18-20 punti)",
          "Bilanciata di Diritto (12-14) con fermi nei colori non detti",
          "Vuole giocare 2NT",
          "Non ha un secondo colore",
        ],
        correctAnswer: 1,
        explanation:
          "In forcing manche, 2NT dell'apertore e' l'unica replica che limita la mano: bilanciata 12-14 con attitudine a giocare a Senza. Mostra fermi nei colori non detti.",
      },
      {
        question:
          "Dopo 1C-2F, l'apertore dice un nuovo colore a livello 3 (es. 3Q). Cosa mostra?",
        options: [
          "Mano minima con le Quadri",
          "Mano buona (15+ punti) oppure distribuzione 5-5",
          "Vuole giocare a Quadri",
          "Un colore di 3 carte",
        ],
        correctAnswer: 1,
        explanation:
          "Un colore nuovo a livello 3 dell'apertore in FM mostra mano buona (15+) o distribuzione 5-5. Sfonda il livello 3, quindi certamente mano forte.",
      },
      {
        question:
          "In FM, il rispondente riporta a 2 nel seme di apertura (es. 1P-2F-2Q-2P). Questo fissa l'atout?",
        options: [
          "Si', fissa le Picche come atout definitivo",
          "No, mostra almeno tolleranza (2+ carte) e chiede ulteriore descrizione",
          "Si', e invita allo slam",
          "E' una dichiarazione conclusiva",
        ],
        correctAnswer: 1,
        explanation:
          "Il riporto a 2 nel seme di apertura mostra tolleranza (2+ carte) e chiede all'apertore di descriversi ancora. NON fissa l'atout. Il rialzo a 3, invece, fissa l'atout con velleita' di Slam.",
      },
    ],
  },

  // --- Lezione 204: Accostamento a Slam - Fissare l'Atout ---
  {
    lessonId: 204,
    title: "Accostamento a Slam: fissare l'atout",
    questions: [
      {
        question:
          "Cos'e' il 'terreno solido' nella dichiarazione verso lo Slam?",
        options: [
          "Quando si hanno 30+ punti in linea",
          "Quando le dichiarazioni iniziali hanno individuato almeno 21-22 punti in linea",
          "Quando l'atout e' concordato",
          "Quando si hanno tutti gli Assi",
        ],
        correctAnswer: 1,
        explanation:
          "Il terreno e' solido quando le dichiarazioni hanno mostrato almeno 21-22 punti combinati. Su terreno solido, fissare l'atout appena sotto manche e' FORZANTE (obiettivo Slam).",
      },
      {
        question:
          "Dopo 1C-1P-2C-3C, il 3C e' forzante o passabile?",
        options: [
          "Forzante (terreno solido, obiettivo Slam)",
          "Passabile (terreno non solido, invitante)",
          "Dipende dai punti dell'apertore",
          "E' sempre conclusivo",
        ],
        correctAnswer: 1,
        explanation:
          "Dopo 1C-1P-2C non c'e' certezza di 21+ punti in linea. Il terreno non e' solido, quindi 3C e' passabile (invitante, non forzante).",
      },
      {
        question:
          "Come si distingue un fissaggio forzante (slam) da uno invitante?",
        options: [
          "Dal livello di dichiarazione",
          "Se il terreno e' solido (21+ in linea) e' forzante; se non solido e' invitante",
          "E' sempre forzante sotto manche",
          "Dipende dal numero di Assi",
        ],
        correctAnswer: 1,
        explanation:
          "Le due domande chiave: A) Il compagno potrebbe accontentarsi del contratto? B) Aveva strade piu' forti? Se terreno solido = forzante (Slam). Se non solido = invitante (passabile).",
      },
    ],
  },

  // --- Lezione 205: Accostamento a Slam - Le Cue Bid ---
  {
    lessonId: 205,
    title: "Accostamento a Slam: le Cue Bid",
    questions: [
      {
        question:
          "Cos'e' una Cue Bid nel contesto dell'accostamento a Slam?",
        options: [
          "La dichiarazione del colore avversario",
          "Una dichiarazione illogica che mostra un CONTROLLO (Asso, vuoto, Re, singolo) in un colore laterale",
          "La richiesta d'Assi (Blackwood)",
          "L'appoggio a salto nel colore del compagno",
        ],
        correctAnswer: 1,
        explanation:
          "Le Cue Bid per lo Slam sono dichiarazioni che mostrano un controllo (1o giro: Asso/vuoto; 2o giro: Re/singolo) in un colore laterale, dopo che l'obiettivo e' lo Slam.",
      },
      {
        question:
          "Quale delle 4 regole delle Cue Bid dice 'Cue Bid saltata = non c'e''?",
        options: [
          "La prima regola",
          "La seconda regola",
          "La terza regola: se un giocatore salta una Cue e il compagno prosegue, il compagno PROMETTE il controllo saltato",
          "La quarta regola",
        ],
        correctAnswer: 2,
        explanation:
          "Regola 3: Cue Bid saltata = non c'e'. Se un giocatore salta una Cue e il compagno prosegue le Cue Bid, il compagno promette di avere il controllo nel colore saltato.",
      },
      {
        question:
          "Sotto il livello di manche, le Cue Bid sono obbligatorie o facoltative?",
        options: [
          "Facoltative: con mano minima si puo' rifiutare",
          "OBBLIGATORIE: non si nega la Cue Bid con la scusa 'mano minima'",
          "Dipende dal numero di punti",
          "Solo il Capitano puo' fare Cue Bid",
        ],
        correctAnswer: 1,
        explanation:
          "Sotto il livello di manche, le Cue Bid sono OBBLIGATORIE. Non si nega una Cue Bid con la scusa della 'mano minima'. La ridefinizione della forza avviene dopo, al Livello di Guardia.",
      },
    ],
  },

  // --- Lezione 206: Le Sottoaperture ---
  {
    lessonId: 206,
    title: "Le Sottoaperture",
    questions: [
      {
        question:
          "Le sottoaperture 2C e 2P mostrano:",
        options: [
          "21+ punti e mano forte",
          "6 carte e 6-10 punti",
          "5 carte e 12-14 punti",
          "7+ carte di barrage",
        ],
        correctAnswer: 1,
        explanation:
          "Le sottoaperture 2C e 2P mostrano 6 carte e punteggio 6-10. Sono aperture interdittive: il Rispondente sara' il Capitano.",
      },
      {
        question:
          "Dopo la sottoapertura 2P del partner, rispondete 2NT. Quale convenzione state usando?",
        options: [
          "Stayman",
          "Transfer",
          "Ogust (interrogativa: chiede qualita' del colore e del punteggio)",
          "Blackwood",
        ],
        correctAnswer: 2,
        explanation:
          "2NT dopo sottoapertura e' la convenzione Ogust: chiede al compagno la qualita' del colore e del punteggio. Risposte: 3F=min+brutto, 3Q=min+bello, 3C=max+brutto, 3P=max+bello, 3NT=AKQxxx.",
      },
      {
        question:
          "Nella convenzione Ogust, 3 Picche in risposta significa:",
        options: [
          "Punteggio minimo e colore brutto",
          "Punteggio minimo e colore bello",
          "Punteggio massimo e colore brutto",
          "Punteggio massimo e colore bello",
        ],
        correctAnswer: 3,
        explanation:
          "Nella Ogust: 3F=min+brutto, 3Q=min+bello, 3C=max+brutto, 3P=max+bello, 3NT=AKQxxx. Bello = 2 onori maggiori (AK, AQ, KQ) o A/K con J10.",
      },
    ],
  },

  // --- Lezione 207: L'Apertura di 2F Forte Indeterminata ---
  {
    lessonId: 207,
    title: "L'apertura di 2 Fiori forte indeterminata",
    questions: [
      {
        question:
          "L'apertura di 2 Fiori e':",
        options: [
          "Un barrage a Fiori",
          "L'unica apertura forte del sistema, senza limite superiore di punti",
          "15-17 punti bilanciata",
          "Una sottoapertura con 6 carte di Fiori",
        ],
        correctAnswer: 1,
        explanation:
          "2F e' l'unica apertura forte del sistema. Non ha limite superiore. Il Capitanato spetta all'Apertore. La risposta convenzionale d'attesa e' 2Q.",
      },
      {
        question:
          "Per rispondere 2C o 2P sull'apertura 2F, servono TUTTI questi 3 requisiti:",
        options: [
          "5+ carte, almeno un onore, almeno 5 punti",
          "4+ carte e 8+ punti",
          "6+ carte e qualsiasi punteggio",
          "Solo 4 carte in un nobile",
        ],
        correctAnswer: 0,
        explanation:
          "Per dire 2C o 2P su 2F servono TUTTI E 3: almeno 5 carte + almeno un onore + forza di manche (5+ punti). Se manca anche uno solo dei 3 requisiti, si dice 2Q.",
      },
      {
        question:
          "Dopo 2F-2Q-2C, la situazione e' forzante manche?",
        options: [
          "Si', sempre dopo 2F",
          "No, e' forzante solo fino al ritorno a 3C (3 nel colore)",
          "Si', ma solo con 8+ punti",
          "No, si puo' passare subito",
        ],
        correctAnswer: 1,
        explanation:
          "Dopo 2F-2Q-2C o 2P, la situazione NON e' FM: e' forzante solo fino al ritorno nel colore (3C o 3P). FM si raggiunge solo se l'apertore mostra bilanciata (2NT) o minore.",
      },
    ],
  },

  // --- Lezione 208: Competitivo, Costruttivo, Interdittivo ---
  {
    lessonId: 208,
    title: "Competitivo, costruttivo, interdittivo",
    questions: [
      {
        question:
          "Una dichiarazione COMPETITIVA e' caratterizzata da:",
        options: [
          "Un salto nel colore di atout",
          "L'appoggio o rialzo senza salto, senza ambizioni di manche",
          "L'uso del Contro o della Surlicita",
          "Un cambio di colore forzante",
        ],
        correctAnswer: 1,
        explanation:
          "Le dichiarazioni competitive: carte senza ambizioni di manche, effettuate in appoggio/rialzo NON a salto. Corrispondono sempre a colori che si intende giocare.",
      },
      {
        question:
          "Una dichiarazione INTERDITTIVA e' SEMPRE caratterizzata da:",
        options: [
          "Un appoggio al minimo livello",
          "Un annuncio a SALTO",
          "L'uso del Contro",
          "Una dichiarazione convenzionale",
        ],
        correctAnswer: 1,
        explanation:
          "Le dichiarazioni interdittive sono SEMPRE caratterizzate da un annuncio a SALTO (barrage). Chi le fa demanda al compagno tutte le successive decisioni e deve farle al massimo livello alla prima occasione.",
      },
      {
        question:
          "Dopo 1C-P-2C-P-3C dall'apertore. Il 3C e':",
        options: [
          "Un invito a manche",
          "Interdittivo: mostra lunghezza extra e previene la riapertura avversaria",
          "Costruttivo: cerca lo Slam",
          "Un errore dichiarativo",
        ],
        correctAnswer: 1,
        explanation:
          "3C non e' un invito! E' interdittivo, mostra lunghezza extra nel colore (Legge delle Prese Totali) e cerca di impedire la riapertura avversaria.",
      },
    ],
  },

  // --- Lezione 209: Mani di Fit nel Nobile - Standard ---
  {
    lessonId: 209,
    title: "Mani di fit nel nobile: standard",
    questions: [
      {
        question:
          "L'appoggio a 3 nel nobile (es. 1P-3P) dopo apertura del partner mostra:",
        options: [
          "Invito a manche con 10-11 punti",
          "Barrage: fit QUARTO, 0-7 punti, distribuzione sbilanciata",
          "Fit terzo e 12+ punti",
          "Manche conclusiva",
        ],
        correctAnswer: 1,
        explanation:
          "Nel sistema standard avanzato, 3 nel nobile e' BARRAGE: fit quarto, 0-7 punti e distribuzione sbilanciata (non invito!). Racconta l'esatta lunghezza del fit.",
      },
      {
        question:
          "Cosa mostra 2NT Truscott in risposta a 1P del partner?",
        options: [
          "Mano bilanciata invitante a 3NT",
          "Fit nel nobile (terzo o quarto), invito a manche (10 belli - 12 brutti)",
          "15-17 punti bilanciata",
          "Transfer per un minore",
        ],
        correctAnswer: 1,
        explanation:
          "2NT Truscott: fit nel nobile, terzo o quarto, invito a manche (10 belli - 12 brutti). NON richiede fermi nei colori ne' mano bilanciata.",
      },
      {
        question:
          "La risposta 1NT su 1 nobile del partner (nel sistema avanzato) e':",
        options: [
          "Sempre 5-10 punti, nega il fit",
          "Semiforzante: 5-11 punti, puo' nascondere fit nel nobile",
          "15-17 punti bilanciata",
          "Forzante a manche",
        ],
        correctAnswer: 1,
        explanation:
          "1NT semiforzante si allarga a 5-11 punti. Puo' nascondere fit nel nobile di apertura. L'apertore su 1NT non dice mai Passo (tranne 5332 di 11).",
      },
    ],
  },

  // --- Lezione 210: Mani di Fit nel Nobile - Bergen ---
  {
    lessonId: 210,
    title: "Mani di fit nel nobile: Bergen",
    questions: [
      {
        question:
          "Nel sistema Bergen, la risposta 3 Fiori su apertura 1 nobile mostra:",
        options: [
          "Fiori lunghe e mano debole",
          "Fit QUARTO nel nobile con 7-9 punti",
          "Fit QUARTO nel nobile con 10-11 punti",
          "Invito a Slam",
        ],
        correctAnswer: 1,
        explanation:
          "Bergen: 1 nobile - 3F = fit QUARTO con 7-9 punti. 1 nobile - 3Q = fit QUARTO con 10-11 punti. L'apertore riporta a 3 in atout se minimo.",
      },
      {
        question:
          "Nel Bergen, 2NT Truscott mostra:",
        options: [
          "Invito naturale a 3NT",
          "Tutte le mani di 12+ punti con fit quarto o piu'",
          "8-9 punti bilanciata",
          "Fit terzo debole",
        ],
        correctAnswer: 1,
        explanation:
          "Nel Bergen, 2NT Truscott e' illimitato (12+ punti) con fit quarto o piu'. L'apertore risponde: colore nuovo = singolo/vuoto; 3 in atout = mano interessante; 4 in atout = peggiore.",
      },
      {
        question:
          "Il Surcontro dopo il Contro avversario sull'apertura 1 nobile del partner mostra:",
        options: [
          "Fit nel nobile di apertura",
          "11+ punti, tendenzialmente ESCLUDE il fit",
          "Mano debole che vuole giocare",
          "Barrage nel nobile",
        ],
        correctAnswer: 1,
        explanation:
          "Nel sistema Bergen, il Surcontro su Contro avversario mostra 11+ punti e tendenzialmente ESCLUDE il fit. Per il fit si usano gli appoggi diretti o 2NT Truscott.",
      },
    ],
  },

  // --- Lezione 211: Mani di Fit nel Nobile - Appoggi Costruttivi ---
  {
    lessonId: 211,
    title: "Mani di fit nel nobile: appoggi costruttivi",
    questions: [
      {
        question:
          "Nel sistema con NT forzante, l'appoggio a 2 nel nobile mostra:",
        options: [
          "5-9 punti con fit terzo",
          "8-10 punti, COSTRUTTIVO, normalmente fit terzo",
          "0-7 punti barrage",
          "12+ punti con fit",
        ],
        correctAnswer: 1,
        explanation:
          "Nel sistema NT forzante, l'appoggio a 2 e' COSTRUTTIVO: 8-10 punti, normalmente fit terzo. Le mani piu' deboli con fit passano da 1NT forzante e poi riportano a 2.",
      },
      {
        question:
          "Dopo intervento avversario, 2NT Truscott diventa:",
        options: [
          "Invitante come senza intervento",
          "ILLIMITATA (11+), con fit quarto o piu'",
          "Naturale, proposta di giocare a Senza",
          "Non piu' utilizzabile",
        ],
        correctAnswer: 1,
        explanation:
          "Dopo intervento a colore, 2NT Truscott diventa illimitata (11+) con almeno fit quarto. La surlicita invece mostra fit TERZO illimitato (11+).",
      },
      {
        question:
          "Con fit quinto nel nobile del partner e 2NT Truscott accettato, cosa fate?",
        options: [
          "Passate a 3 nel nobile",
          "Rialzate comunque a manche (10 carte = 10 prese)",
          "Dite 3NT per giocare a Senza",
          "Fate la Stayman",
        ],
        correctAnswer: 1,
        explanation:
          "Con fit quinto: usate 2NT e poi rialzate a manche comunque (10 carte in linea = 10 prese secondo la Legge delle Prese Totali).",
      },
    ],
  },

  // --- Lezione 212: Interventi Speciali e Difese ---
  {
    lessonId: 212,
    title: "Interventi speciali e difese",
    questions: [
      {
        question:
          "L'intervento 2NT dopo apertura avversaria di 1C o 1P mostra:",
        options: [
          "Bilanciata forte (15-17 punti)",
          "Bicolore minore almeno 5-5 con buoni colori (Michael's/Ghestem)",
          "Invito naturale a 3NT",
          "Due maggiori 5-5",
        ],
        correctAnswer: 1,
        explanation:
          "Dopo 1C o 1P avversario, 2NT mostra bicolore minore almeno 5-5 con buoni colori. NON una bilanciata forte (per quella si usa Contro poi rimozione).",
      },
      {
        question:
          "L'intervento convenzionale 2F (Landy) su apertura avversaria di 1NT mostra:",
        options: [
          "6+ carte di Fiori",
          "Almeno 5/4 nelle nobili (Cuori + Picche) con 9/10+ punti",
          "Bicolore minore",
          "Bilanciata di 12-14 punti",
        ],
        correctAnswer: 1,
        explanation:
          "Landy: 2F su 1NT avversario mostra almeno 5/4 nelle nobili con 9/10+ punti. Il compagno sceglie il maggiore preferito (2Q chiede il nobile piu' lungo).",
      },
      {
        question:
          "Sulla difesa contro la 2Q Multicolor avversaria, il Contro immediato mostra:",
        options: [
          "Mano generica forte",
          "Le Picche (passo poi contra = Picche)",
          "Le Cuori: informativo con 12+ punti e Cuori",
          "Bicolore minore",
        ],
        correctAnswer: 2,
        explanation:
          "Sulla 2Q Multicolor: Contro immediato = cuori (12+ punti). Per le picche: Passo seguito da Contro. Il principio: ci si comporta come se l'avversario avesse sottoaperto a 2P.",
      },
    ],
  },

  // --- Lezione 213: Casi Particolari dopo le Risposte 1 su 1 ---
  {
    lessonId: 213,
    title: "Casi particolari dopo le risposte 1 su 1",
    questions: [
      {
        question:
          "L'apertore con 5332 e 17-18 punti, dopo risposta 1 su 1, ridichiara:",
        options: [
          "1NT (12-14)",
          "2NT (Rever a Senza: 17-18 con 5332)",
          "3NT (19-20)",
          "Ripete il suo colore",
        ],
        correctAnswer: 1,
        explanation:
          "Il Rever a Senza: 2NT dopo 1 maggiore - 1x mostra 5332 di 17-18. Conseguenza: chi apre 1NT con nobile quinto ha il punteggio minimo (15-16).",
      },
      {
        question:
          "L'avversario interviene (effetto sponda) e l'apertore appoggia direttamente a 2 nel nobile di risposta. Questo mostra:",
        options: [
          "Mano minima qualsiasi",
          "Fit quarto con mano normale",
          "Mano forte di 16+ punti",
          "Passo forzato dal regolamento",
        ],
        correctAnswer: 1,
        explanation:
          "L'appoggio immediato dopo intervento = fit quarto. L'apertore non e' obbligato a parlare (effetto sponda), quindi ogni dichiarazione e' 'speciale'. L'appoggio a 2 = fit quarto, mano normale.",
      },
      {
        question:
          "Dopo 1Q-P-1C-1P, l'apertore passa. Il rispondente con 8+ punti usa il Contro. Cosa chiede?",
        options: [
          "Di punire 1P",
          "All'apertore di descriversi (Contro competitivo del rispondente)",
          "Di giocare a SA",
          "Di cambiare colore",
        ],
        correctAnswer: 1,
        explanation:
          "Dopo che l'apertore e' passato sull'intervento del 4o di mano, il Contro del rispondente (7/8+ punti) chiede all'apertore di descriversi: non e' punitivo, e' competitivo.",
      },
    ],
  },
];
