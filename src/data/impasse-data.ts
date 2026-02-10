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
  // FACILE (10 scenari) - Casi chiari, regole base
  // ============================================================
  {
    id: 1,
    yourHand: "♠AQ32",
    dummy: "♠7654",
    totalCards: 8,
    missingHonor: "♠K",
    missingCards: 5,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "Con 8 carte nel colore e il Re mancante, l'impasse (50%) batte il drop (~33%). Gioca piccola verso la Donna.",
    difficulty: "facile",
  },
  {
    id: 2,
    yourHand: "♥AK432",
    dummy: "♥J876",
    totalCards: 9,
    missingHonor: "♥Q",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 52,
    explanation:
      "Con 9 carte e la Donna mancante, gioca per il drop (52%). Batti Asso e Re: la Donna cade spesso in terza.",
    difficulty: "facile",
  },
  {
    id: 3,
    yourHand: "♦AQ74",
    dummy: "♦8653",
    totalCards: 8,
    missingHonor: "♦K",
    missingCards: 5,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "Re mancante con 8 carte: impasse classica al 50%. Il drop con 5 carte mancanti e' solo ~33%.",
    difficulty: "facile",
  },
  {
    id: 4,
    yourHand: "♣AK7532",
    dummy: "♣J864",
    totalCards: 10,
    missingHonor: "♣Q",
    missingCards: 3,
    correctAnswer: "drop",
    probability: 78,
    explanation:
      "Con 10 carte e solo 3 mancanti, la Donna cade quasi sempre sotto Asso-Re. Drop netto (78%).",
    difficulty: "facile",
  },
  {
    id: 5,
    yourHand: "♠AQ9",
    dummy: "♠8754",
    totalCards: 7,
    missingHonor: "♠K",
    missingCards: 6,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "Con solo 7 carte, il Re puo' essere ovunque nelle 6 mancanti. L'impasse (50%) e' molto meglio del drop (~16%).",
    difficulty: "facile",
  },
  {
    id: 6,
    yourHand: "♥AK8743",
    dummy: "♥J652",
    totalCards: 10,
    missingHonor: "♥Q",
    missingCards: 3,
    correctAnswer: "drop",
    probability: 78,
    explanation:
      "10 carte, Donna mancante con solo 3 avversarie: gioca Asso-Re, la Donna cade quasi certamente.",
    difficulty: "facile",
  },
  {
    id: 7,
    yourHand: "♦AQJ4",
    dummy: "♦8653",
    totalCards: 8,
    missingHonor: "♦K",
    missingCards: 5,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "Doppia impasse possibile: AQJ contro il Re. Con 8 carte l'impasse e' corretta al 50%.",
    difficulty: "facile",
  },
  {
    id: 8,
    yourHand: "♣AK9876",
    dummy: "♣5432",
    totalCards: 10,
    missingHonor: "♣Q",
    missingCards: 3,
    correctAnswer: "drop",
    probability: 78,
    explanation:
      "Solo 3 carte mancanti inclusa la Donna: il drop e' schiacciante. Gioca dall'alto!",
    difficulty: "facile",
  },
  {
    id: 9,
    yourHand: "♠AQ65",
    dummy: "♠9743",
    totalCards: 8,
    missingHonor: "♠K",
    missingCards: 5,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "8 carte, Re mancante: la regola e' chiara. Impasse al 50% batte sempre il drop (~33%) con 5 carte fuori.",
    difficulty: "facile",
  },
  {
    id: 10,
    yourHand: "♥AK65432",
    dummy: "♥J87",
    totalCards: 10,
    missingHonor: "♥Q",
    missingCards: 3,
    correctAnswer: "drop",
    probability: 78,
    explanation:
      "Con 10 carte e la Donna mancante tra sole 3, non serve la finesse. Asso e Re la fanno cadere.",
    difficulty: "facile",
  },

  // ============================================================
  // MEDIO (10 scenari) - Decisioni piu' vicine, bisogna contare
  // ============================================================
  {
    id: 11,
    yourHand: "♠AK852",
    dummy: "♠J743",
    totalCards: 9,
    missingHonor: "♠Q",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 52,
    explanation:
      "9 carte, Donna mancante tra 4: il drop (52%) supera di poco l'impasse (48%). La regola dei 9: 'con 9, non fare la finesse'.",
    difficulty: "medio",
  },
  {
    id: 12,
    yourHand: "♦AQ853",
    dummy: "♦J742",
    totalCards: 9,
    missingHonor: "♦K",
    missingCards: 4,
    correctAnswer: "impasse",
    probability: 56,
    explanation:
      "Attenzione: la regola dei 9 vale solo per la Donna! Con il Re mancante e 9 carte, l'impasse resta migliore (56%).",
    difficulty: "medio",
  },
  {
    id: 13,
    yourHand: "♣AK63",
    dummy: "♣J852",
    totalCards: 8,
    missingHonor: "♣Q",
    missingCards: 5,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "8 carte con la Donna mancante e 5 fuori: l'impasse (50%) batte il drop (~33%). Con 8, fai la finesse.",
    difficulty: "medio",
  },
  {
    id: 14,
    yourHand: "♥AQ743",
    dummy: "♥8652",
    totalCards: 9,
    missingHonor: "♥K",
    missingCards: 4,
    correctAnswer: "impasse",
    probability: 56,
    explanation:
      "Re mancante con 9 carte: l'impasse (56%) batte il drop (48%). La 'regola dei 9' non si applica al Re!",
    difficulty: "medio",
  },
  {
    id: 15,
    yourHand: "♠AK9743",
    dummy: "♠852",
    totalCards: 9,
    missingHonor: "♠Q",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 52,
    explanation:
      "9 carte totali, Donna mancante: 'con 9, non fare l'impasse'. Il drop al 52% e' leggermente favorito.",
    difficulty: "medio",
  },
  {
    id: 16,
    yourHand: "♦AQ6",
    dummy: "♦10843",
    totalCards: 7,
    missingHonor: "♦K",
    missingCards: 6,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "Solo 7 carte con il Re fuori tra 6: il drop richiederebbe Re singolo (~3%). L'impasse al 50% e' ovvia.",
    difficulty: "medio",
  },
  {
    id: 17,
    yourHand: "♣AK10842",
    dummy: "♣J73",
    totalCards: 9,
    missingHonor: "♣Q",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 52,
    explanation:
      "Nonostante il 10, con 9 carte e la Q mancante il drop resta favorito al 52%. Il 10 aiuterebbe solo se fai impasse.",
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
      "7 carte, Re mancante: impasse al 50%. Con 6 carte fuori il Re singolo e' rarissimo. Il 10 fornisce anche un rientro.",
    difficulty: "medio",
  },
  {
    id: 19,
    yourHand: "♠AK854",
    dummy: "♠Q73",
    totalCards: 8,
    missingHonor: "♠J",
    missingCards: 5,
    correctAnswer: "drop",
    probability: 68,
    explanation:
      "Con AKQ e 8 carte, il Fante mancante cade spesso giocando dall'alto. Il J non merita un'impasse con 5 fuori (drop ~68%).",
    difficulty: "medio",
  },
  {
    id: 20,
    yourHand: "♦AKJ94",
    dummy: "♦8532",
    totalCards: 9,
    missingHonor: "♦Q",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 52,
    explanation:
      "Il Fante ti copre, ma con 9 carte e la Donna fuori, il drop al 52% resta la manovra corretta. 'Con 9, non finessare'.",
    difficulty: "medio",
  },

  // ============================================================
  // DIFFICILE (12 scenari) - Casi limite, scelta ristretta, posti vacanti
  // ============================================================
  {
    id: 21,
    yourHand: "♠AK10943",
    dummy: "♠J85",
    totalCards: 9,
    missingHonor: "♠Q",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 52,
    explanation:
      "La 'scelta ristretta' (restricted choice) con Q-x e singola: se un avversario gioca piccola, il drop resta 52%. Non farti tentare dal 10.",
    difficulty: "difficile",
  },
  {
    id: 22,
    yourHand: "♥AQ10932",
    dummy: "♥854",
    totalCards: 9,
    missingHonor: "♥K",
    missingCards: 4,
    correctAnswer: "impasse",
    probability: 56,
    explanation:
      "Re mancante con 9 carte: l'impasse resta corretta (56%). La 'regola dei 9' vale SOLO per la Donna, non per il Re!",
    difficulty: "difficile",
  },
  {
    id: 23,
    yourHand: "♦AKJ10",
    dummy: "♦8765",
    totalCards: 8,
    missingHonor: "♦Q",
    missingCards: 5,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "AKJ10 contro la Q mancante: con 8 carte l'impasse al 50% batte il drop. Il J-10 ti da' doppia sicurezza nella manovra.",
    difficulty: "difficile",
  },
  {
    id: 24,
    yourHand: "♣AQ9876",
    dummy: "♣543",
    totalCards: 9,
    missingHonor: "♣K",
    missingCards: 4,
    correctAnswer: "impasse",
    probability: 56,
    explanation:
      "Re mancante, 9 carte, 4 fuori: impasse al 56%. Non confondere con la regola dei 9 che si applica solo alla Donna!",
    difficulty: "difficile",
  },
  {
    id: 25,
    yourHand: "♠AK8765",
    dummy: "♠J432",
    totalCards: 10,
    missingHonor: "♠Q",
    missingCards: 3,
    correctAnswer: "drop",
    probability: 78,
    explanation:
      "10 carte, Q tra sole 3: il drop (78%) e' schiacciante. Solo Q-x-x la salva. Nessun motivo per l'impasse.",
    difficulty: "difficile",
  },
  {
    id: 26,
    yourHand: "♥AQ4",
    dummy: "♥J1098",
    totalCards: 7,
    missingHonor: "♥K",
    missingCards: 6,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "7 carte con K fuori tra 6: l'impasse e' l'unica chance ragionevole. Il J-10-9 ti da' la sequenza per ripetere la manovra.",
    difficulty: "difficile",
  },
  {
    id: 27,
    yourHand: "♦AK10865",
    dummy: "♦J92",
    totalCards: 9,
    missingHonor: "♦Q",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 52,
    explanation:
      "Principio della scelta ristretta: se Ovest gioca piccola al secondo giro, la Q era piu' probabilmente nell'altra mano. Drop 52%.",
    difficulty: "difficile",
  },
  {
    id: 28,
    yourHand: "♣AQ5",
    dummy: "♣J1076",
    totalCards: 7,
    missingHonor: "♣K",
    missingCards: 6,
    correctAnswer: "impasse",
    probability: 50,
    explanation:
      "K mancante con sole 7 carte: il drop e' irrisorio (~6% per K singolo). L'impasse ripetuta con il J-10 da' ~75% in due tentativi.",
    difficulty: "difficile",
  },
  {
    id: 29,
    yourHand: "♠AK97654",
    dummy: "♠J3",
    totalCards: 9,
    missingHonor: "♠Q",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 52,
    explanation:
      "Anche con distribuzione 7-2, contano le carte totali: 9 carte, Q mancante = drop al 52%. Il J-3 da' poco per l'impasse.",
    difficulty: "difficile",
  },
  {
    id: 30,
    yourHand: "♥AK109876",
    dummy: "♥J5",
    totalCards: 9,
    missingHonor: "♥Q",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 52,
    explanation:
      "9 carte nel colore: applica la regola dei 9. Il 10-9-8 sono irrilevanti per la decisione. Asso e Re, la Q cade al 52%.",
    difficulty: "difficile",
  },
  {
    id: 31,
    yourHand: "♦AQ987",
    dummy: "♦10654",
    totalCards: 9,
    missingHonor: "♦K",
    missingCards: 4,
    correctAnswer: "impasse",
    probability: 56,
    explanation:
      "Trappola classica: 9 carte ma e' il RE che manca, non la Donna. L'impasse (56%) e' corretta. Mai confondere K con Q!",
    difficulty: "difficile",
  },
  {
    id: 32,
    yourHand: "♣AKJ105",
    dummy: "♣9876",
    totalCards: 9,
    missingHonor: "♣Q",
    missingCards: 4,
    correctAnswer: "drop",
    probability: 52,
    explanation:
      "Il J e il 10 ti tentano per l'impasse, ma con 9 carte e la Q fuori, la matematica dice drop al 52%. Resisti alla tentazione!",
    difficulty: "difficile",
  },
];
