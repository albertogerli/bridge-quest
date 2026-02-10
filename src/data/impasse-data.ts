export interface ImpasseScenario {
  id: number;
  yourHand: string; // e.g. "♠AQ32" (the relevant suit)
  dummy: string; // e.g. "♠K854" (dummy's relevant suit)
  totalCards: number; // combined cards in suit (your + dummy)
  missingHonor: string; // e.g. "♠K" or "♠Q" - what you're missing
  missingCards: number; // how many cards opponents have in suit
  correctAnswer: "impasse" | "drop";
  probability: number; // % chance the correct play works
  explanation: string; // Italian explanation
  difficulty: "facile" | "medio" | "difficile";
}

export const impasseScenarios: ImpasseScenario[] = [
  // ============================================================
  // FACILE (10 scenari) - "8 ever, 9 never" classici
  // Regola aurea FIGB: con 8 carte e Q mancante → impasse;
  //                     con 9 carte e Q mancante → drop.
  //                     K mancante → impasse (sempre, con AQ).
  // ============================================================
  {
    id: 1,
    yourHand: "♠AQ74",
    dummy: "♠8653",
    totalCards: 8,
    missingHonor: "♠K",
    missingCards: 5,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "Con 8 carte e il Re mancante, l'impasse al 50% batte nettamente il drop (~33%). Gioca piccola dal morto verso la Donna: se Ovest ha il Re, la Donna vince.",
    difficulty: "facile",
  },
  {
    id: 2,
    yourHand: "♥AK762",
    dummy: "♥J854",
    totalCards: 9,
    missingHonor: "♥Q",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 52,
    explanation:
      "Regola dei 9: con 9 carte e la Donna mancante, batti Asso e Re (drop al 52%). La Q cade perche' con 4 carte fuori la divisione 2-2 e' al 40%, e la Q singola aggiunge un ulteriore 10%.",
    difficulty: "facile",
  },
  {
    id: 3,
    yourHand: "♦AQ63",
    dummy: "♦9742",
    totalCards: 8,
    missingHonor: "♦K",
    missingCards: 5,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "Re mancante con 8 carte: impasse classica al 50%. Il drop richiederebbe il Re singolo (~13%), molto meno favorevole. Gioca piccola verso la AQ.",
    difficulty: "facile",
  },
  {
    id: 4,
    yourHand: "♣AK8653",
    dummy: "♣J974",
    totalCards: 10,
    missingHonor: "♣Q",
    missingCards: 3,
    correctAnswer: "drop",
    probability: 78,
    explanation:
      "Con 10 carte e la Donna tra sole 3 avversarie, il drop e' schiacciante (78%). La Q e' singola o seconda nella grande maggioranza dei casi. Batti Asso e Re senza pensarci.",
    difficulty: "facile",
  },
  {
    id: 5,
    yourHand: "♠AQ8",
    dummy: "♠7643",
    totalCards: 7,
    missingHonor: "♠K",
    missingCards: 6,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "Con solo 7 carte il Re e' disperso tra 6 carte avversarie: il Re singolo e' rarissimo (~3%). L'impasse al 50% e' l'unica manovra ragionevole.",
    difficulty: "facile",
  },
  {
    id: 6,
    yourHand: "♥AK9543",
    dummy: "♥J876",
    totalCards: 10,
    missingHonor: "♥Q",
    missingCards: 3,
    correctAnswer: "drop",
    probability: 78,
    explanation:
      "10 carte, Donna mancante tra sole 3: gioca Asso e Re dal lato lungo. La Q cade quasi certamente. Non rischiare un'impasse inutile.",
    difficulty: "facile",
  },
  {
    id: 7,
    yourHand: "♦AQJ5",
    dummy: "♦8742",
    totalCards: 8,
    missingHonor: "♦K",
    missingCards: 5,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "AQJ contro il Re: impasse con gradino d'ingresso. Gioca piccola dal morto, inserisci il Fante. Se perde, la volta dopo gioca ancora piccola per la Donna. Con 8 carte il drop (33%) e' molto peggio.",
    difficulty: "facile",
  },
  {
    id: 8,
    yourHand: "♣AK742",
    dummy: "♣Q863",
    totalCards: 9,
    missingHonor: "♣J",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 58,
    explanation:
      "Con AKQ distribuiti e 9 carte, il Fante mancante cade facilmente giocando dall'alto. Il drop del J con 4 carte fuori e' molto probabile (~58%) perche' il J e' un onore basso.",
    difficulty: "facile",
  },
  {
    id: 9,
    yourHand: "♠AQ53",
    dummy: "♠10864",
    totalCards: 8,
    missingHonor: "♠K",
    missingCards: 5,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "8 carte, Re mancante tra 5 avversarie: impasse al 50% contro drop al 33%. Gioca dal morto piccola verso la Donna. Il 10 nel morto puo' aiutare come carta intermedia.",
    difficulty: "facile",
  },
  {
    id: 10,
    yourHand: "♥AK86532",
    dummy: "♥J74",
    totalCards: 10,
    missingHonor: "♥Q",
    missingCards: 3,
    correctAnswer: "drop",
    probability: 78,
    explanation:
      "Con 10 carte la Q e' tra sole 3 avversarie. Il drop (78%) e' nettamente superiore. Batti A e K: la Donna cade nella stragrande maggioranza dei casi.",
    difficulty: "facile",
  },

  // ============================================================
  // MEDIO (12 scenari) - Variazioni con diversi onori, casi limite
  // Regola FIGB: la "regola dei 9" (8 ever / 9 never) vale solo
  // per la Donna. Con il Re mancante e AQ, l'impasse e' sempre
  // corretta indipendentemente dal numero di carte.
  // ============================================================
  {
    id: 11,
    yourHand: "♠AK853",
    dummy: "♠J742",
    totalCards: 9,
    missingHonor: "♠Q",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 52,
    explanation:
      "9 carte, Donna mancante: la regola dei 9 dice 'non fare la finesse'. Il drop (52%) supera di poco l'impasse. Batti A e K sperando nella Q seconda o singola.",
    difficulty: "medio",
  },
  {
    id: 12,
    yourHand: "♦AQ852",
    dummy: "♦J743",
    totalCards: 9,
    missingHonor: "♦K",
    missingCards: 4,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "Attenzione: la regola dei 9 vale SOLO per la Donna! Con il Re mancante e AQ in mano, l'impasse (50%) resta corretta anche con 9 carte, perche' non puoi 'droppare' il Re giocando dall'alto senza l'AK.",
    difficulty: "medio",
  },
  {
    id: 13,
    yourHand: "♣AK64",
    dummy: "♣J852",
    totalCards: 8,
    missingHonor: "♣Q",
    missingCards: 5,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "8 carte con la Donna mancante: 'con 8, fai sempre l'impasse'. Gioca piccola dal morto verso il J, oppure piccola verso la mano con AK. L'impasse al 50% batte il drop (~33%).",
    difficulty: "medio",
  },
  {
    id: 14,
    yourHand: "♥AQ752",
    dummy: "♥8643",
    totalCards: 9,
    missingHonor: "♥K",
    missingCards: 4,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "Re mancante con 9 carte: NON applicare la regola dei 9! Quella regola e' solo per la Donna. Con AQ devi giocare verso la Donna, cioe' fare l'impasse. Non puoi 'droppare' il Re senza avere AK.",
    difficulty: "medio",
  },
  {
    id: 15,
    yourHand: "♠AK9742",
    dummy: "♠853",
    totalCards: 9,
    missingHonor: "♠Q",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 52,
    explanation:
      "9 carte totali, Donna mancante: 'con 9, non finessare'. Il drop al 52% e' leggermente favorito. Batti A e K: la Q ha buone probabilita' di cadere.",
    difficulty: "medio",
  },
  {
    id: 16,
    yourHand: "♦AQ7",
    dummy: "♦10843",
    totalCards: 7,
    missingHonor: "♦K",
    missingCards: 6,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "Solo 7 carte con il Re disperso tra 6 avversarie: il Re singolo davanti alla Q sarebbe un miracolo (~3%). L'impasse al 50% e' l'unica scelta sensata.",
    difficulty: "medio",
  },
  {
    id: 17,
    yourHand: "♣AK1084",
    dummy: "♣J753",
    totalCards: 9,
    missingHonor: "♣Q",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 52,
    explanation:
      "Nonostante il 10, con 9 carte e la Q mancante il drop resta favorito (52%). Il 10 aiuterebbe solo con l'impasse ma la matematica dice drop. Regola dei 9.",
    difficulty: "medio",
  },
  {
    id: 18,
    yourHand: "♥AQ10",
    dummy: "♥8654",
    totalCards: 7,
    missingHonor: "♥K",
    missingCards: 6,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "7 carte, Re mancante tra 6: l'impasse al 50% e' obbligatoria. Il 10 fornisce un comodo gradino d'ingresso: gioca piccola, inserisci il 10, poi riprova con la Q.",
    difficulty: "medio",
  },
  {
    id: 19,
    yourHand: "♠AKJ43",
    dummy: "♠8652",
    totalCards: 9,
    missingHonor: "♠Q",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 52,
    explanation:
      "Il Fante ti protegge, ma con 9 carte e la Donna fuori, il drop (52%) resta la manovra corretta. Colpo di sonda: batti l'Asso, poi il Re. Se la Q non cade, il J e' ancora utilizzabile.",
    difficulty: "medio",
  },
  {
    id: 20,
    yourHand: "♦AQ9854",
    dummy: "♦J73",
    totalCards: 9,
    missingHonor: "♦K",
    missingCards: 4,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "Re mancante con 9 carte e AQ in mano: l'impasse e' obbligatoria. Non puoi 'droppare' il Re senza avere AK. Gioca dal morto piccola verso la Donna.",
    difficulty: "medio",
  },
  {
    id: 21,
    yourHand: "♣AK95",
    dummy: "♣Q873",
    totalCards: 8,
    missingHonor: "♣J",
    missingCards: 5,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "Con AKQ distribuiti e 8 carte, il Fante tra 5 avversarie rende l'impasse (50%) migliore del drop (~33%). Il 9 e' il gradino: gioca piccola verso la Q, poi piccola verso il 9.",
    difficulty: "medio",
  },
  {
    id: 22,
    yourHand: "♥AK6543",
    dummy: "♥Q87",
    totalCards: 9,
    missingHonor: "♥J",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 58,
    explanation:
      "Con AKQ distribuiti e 9 carte, il Fante e' un onore minore: battendo dall'alto cade nel 58% dei casi. Il drop e' nettamente favorito, non serve impasse per il J.",
    difficulty: "medio",
  },

  // ============================================================
  // DIFFICILE (10 scenari) - Scelta ristretta, onori multipli
  // mancanti, casi dove la distribuzione inganna
  // ============================================================
  {
    id: 23,
    yourHand: "♠AKJ10",
    dummy: "♠8765",
    totalCards: 8,
    missingHonor: "♠Q",
    missingCards: 5,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "AKJ10 contro la Q: con 8 carte l'impasse (50%) batte il drop (33%). Il J-10 ti danno il gradino per ripetere la manovra: batti l'A (colpo di sonda), poi piccola inserendo il J o il 10.",
    difficulty: "difficile",
  },
  {
    id: 24,
    yourHand: "♥AQ10932",
    dummy: "♥854",
    totalCards: 9,
    missingHonor: "♥K",
    missingCards: 4,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "Trappola: 9 carte ma il Re e' l'onore mancante, non la Donna! La regola dei 9 NON si applica. Con AQ devi fare l'impasse. Il 10 aiuta se il K e' terzo a Ovest.",
    difficulty: "difficile",
  },
  {
    id: 25,
    yourHand: "♦AQ5",
    dummy: "♦J1098",
    totalCards: 7,
    missingHonor: "♦K",
    missingCards: 6,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "7 carte, K fuori tra 6: il drop e' praticamente impossibile (K singolo ~3%). La sequenza J-10-9 nel morto ti permette un'impasse ripetuta: gioca il J, se il K non copre inserisci, poi il 10, ecc. In due tentativi ~75%.",
    difficulty: "difficile",
  },
  {
    id: 26,
    yourHand: "♣AK10943",
    dummy: "♣J85",
    totalCards: 9,
    missingHonor: "♣Q",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 52,
    explanation:
      "La 'scelta ristretta' (restricted choice): se al primo giro di A un avversario gioca piccola, il drop resta 52%. Non farti tentare dal 10: con 9 carte e Q mancante vale la regola dei 9.",
    difficulty: "difficile",
  },
  {
    id: 27,
    yourHand: "♠AQ987",
    dummy: "♠10654",
    totalCards: 9,
    missingHonor: "♠K",
    missingCards: 4,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "9 carte ma e' il Re che manca, non la Donna! Non confondere con la regola dei 9. Con AQ in mano devi giocare verso la Donna (impasse). Il 10 del morto e' un'utile carta intermedia se il K e' terzo.",
    difficulty: "difficile",
  },
  {
    id: 28,
    yourHand: "♥AK97654",
    dummy: "♥J3",
    totalCards: 9,
    missingHonor: "♥Q",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 52,
    explanation:
      "Anche con distribuzione asimmetrica 7-2, contano le carte totali: 9 carte, Q mancante = drop al 52%. Il J-3 non offre gradini per l'impasse. Batti A e K.",
    difficulty: "difficile",
  },
  {
    id: 29,
    yourHand: "♦AKJ1054",
    dummy: "♦987",
    totalCards: 9,
    missingHonor: "♦Q",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 52,
    explanation:
      "Il J e il 10 ti tentano per l'impasse, ma con 9 carte e la Q fuori la matematica dice drop (52%). Colpo di sonda: batti l'A (se Q secca cade), poi K. Se non cade, il J salva una presa.",
    difficulty: "difficile",
  },
  {
    id: 30,
    yourHand: "♣AQ6",
    dummy: "♣J10987",
    totalCards: 8,
    missingHonor: "♣K",
    missingCards: 5,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "K mancante con 8 carte: l'impasse (50%) batte il drop (33%). La lunga sequenza J-10-9-8-7 nel morto permette impasse ripetute: gioca il J, se Ovest non copre lascia correre. Ripeti con il 10. In due tentativi arrivi al ~75%.",
    difficulty: "difficile",
  },
  {
    id: 31,
    yourHand: "♠AK108",
    dummy: "♠Q965",
    totalCards: 8,
    missingHonor: "♠J",
    missingCards: 5,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "Con AKQ distribuiti e 8 carte, il Fante tra 5 avversarie rende l'impasse (50%) migliore del drop (33%). Batti l'A (colpo di sonda), poi gioca piccola verso il 10: se Est ha il J, il 10 vince.",
    difficulty: "difficile",
  },
  {
    id: 32,
    yourHand: "♥AK10976",
    dummy: "♥J54",
    totalCards: 9,
    missingHonor: "♥Q",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 52,
    explanation:
      "9 carte nel colore: applica la regola dei 9. Il 10-9 sono irrilevanti per la decisione impasse/drop. Batti Asso e Re: la Q cade al 52%. Se non cade, il 10 salva comunque la situazione.",
    difficulty: "difficile",
  },
];
