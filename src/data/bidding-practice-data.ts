// Bidding Practice scenarios — 20 scenarios covering Cuori Licita topics
// Each scenario presents a hand, partner's bid, and asks the user to choose the correct response.

export type BiddingScenario = {
  id: number;
  hand: {
    spades: string;
    hearts: string;
    diamonds: string;
    clubs: string;
  };
  /** Formatted hand string for display */
  handDisplay: string;
  /** Bidding history so far (e.g. partner opened, opponents passed, etc.) */
  biddingHistory: { seat: "N" | "E" | "S" | "W"; bid: string }[];
  /** What partner bid (simplified label) */
  partnerBid: string;
  /** User's position */
  position: "N" | "S" | "E" | "W";
  vulnerability: "Nessuna" | "NS" | "EW" | "Tutti";
  correctBid: string;
  wrongBids: string[];
  explanation: string;
  /** 1 = easy, 2 = medium, 3 = hard */
  difficulty: 1 | 2 | 3;
  topic: string;
};

export const biddingScenarios: BiddingScenario[] = [
  // ===== DIFFICULTY 1 — Facile (7 scenarios) =====

  // 1. Risposta a 1NT — Texas Transfer to spades
  {
    id: 1,
    hand: { spades: "KJ875", hearts: "43", diamonds: "Q62", clubs: "K93" },
    handDisplay: "♠ KJ875  ♥ 43  ♦ Q62  ♣ K93",
    biddingHistory: [
      { seat: "N", bid: "1NT" },
      { seat: "E", bid: "Passo" },
    ],
    partnerBid: "1NT",
    position: "S",
    vulnerability: "Nessuna",
    correctBid: "2♥",
    wrongBids: ["2♠", "3NT", "Passo"],
    explanation:
      "Con 5 picche e 10 HCP, usa la Texas transfer: 2♥ chiede al compagno di dire 2♠. Poi passerai.",
    difficulty: 1,
    topic: "Texas Transfer",
  },

  // 2. Stayman dopo 1NT
  {
    id: 2,
    hand: { spades: "AQ84", hearts: "K973", diamonds: "J5", clubs: "Q62" },
    handDisplay: "♠ AQ84  ♥ K973  ♦ J5  ♣ Q62",
    biddingHistory: [
      { seat: "N", bid: "1NT" },
      { seat: "E", bid: "Passo" },
    ],
    partnerBid: "1NT",
    position: "S",
    vulnerability: "Nessuna",
    correctBid: "2♣",
    wrongBids: ["3NT", "2♠", "2♥"],
    explanation:
      "Con 4 picche e 4 cuori, usa Stayman (2♣) per cercare il fit 4-4 in un nobile. Se il compagno risponde 2♦ (nessun nobile), dici 3NT.",
    difficulty: 1,
    topic: "Stayman",
  },

  // 3. Risposta semplice a apertura 1♥
  {
    id: 3,
    hand: { spades: "KQ973", hearts: "82", diamonds: "A64", clubs: "J53" },
    handDisplay: "♠ KQ973  ♥ 82  ♦ A64  ♣ J53",
    biddingHistory: [
      { seat: "N", bid: "1♥" },
      { seat: "E", bid: "Passo" },
    ],
    partnerBid: "1♥",
    position: "S",
    vulnerability: "NS",
    correctBid: "1♠",
    wrongBids: ["2♠", "1NT", "Passo"],
    explanation:
      "Con 11 HCP e 5 picche, rispondi 1♠. Si cambia colore al livello 1 con 6+ punti e 4+ carte nel nuovo seme.",
    difficulty: 1,
    topic: "Risposte all'apertura",
  },

  // 4. Passo su 1NT con mano debole bilanciata
  {
    id: 4,
    hand: { spades: "J83", hearts: "Q52", diamonds: "9764", clubs: "K82" },
    handDisplay: "♠ J83  ♥ Q52  ♦ 9764  ♣ K82",
    biddingHistory: [
      { seat: "N", bid: "1NT" },
      { seat: "E", bid: "Passo" },
    ],
    partnerBid: "1NT",
    position: "S",
    vulnerability: "EW",
    correctBid: "Passo",
    wrongBids: ["2♣", "2NT", "2♦"],
    explanation:
      "Con solo 6 HCP e distribuzione bilanciata 3-3-4-3, passa. Non hai la forza per invitare (8-9 HCP) ne' un lungo da trasferire.",
    difficulty: 1,
    topic: "Risposte a 1NT",
  },

  // 5. Rialzo del seme del compagno
  {
    id: 5,
    hand: { spades: "Q74", hearts: "KJ82", diamonds: "953", clubs: "A64" },
    handDisplay: "♠ Q74  ♥ KJ82  ♦ 953  ♣ A64",
    biddingHistory: [
      { seat: "N", bid: "1♥" },
      { seat: "E", bid: "Passo" },
    ],
    partnerBid: "1♥",
    position: "S",
    vulnerability: "Nessuna",
    correctBid: "2♥",
    wrongBids: ["3♥", "1NT", "1♠"],
    explanation:
      "Con 10 HCP e 4 cuori di appoggio, rialza a 2♥ (6-10 punti, 3+ carte di appoggio). Il rialzo semplice mostra fit e mano non forzante.",
    difficulty: 1,
    topic: "Risposte all'apertura",
  },

  // 6. Texas Transfer to hearts
  {
    id: 6,
    hand: { spades: "53", hearts: "AQ8742", diamonds: "K84", clubs: "92" },
    handDisplay: "♠ 53  ♥ AQ8742  ♦ K84  ♣ 92",
    biddingHistory: [
      { seat: "N", bid: "1NT" },
      { seat: "E", bid: "Passo" },
    ],
    partnerBid: "1NT",
    position: "S",
    vulnerability: "Tutti",
    correctBid: "2♦",
    wrongBids: ["2♥", "3♥", "3NT"],
    explanation:
      "Con 6 cuori e 10 HCP, usa la Texas: 2♦ chiede al compagno di dire 2♥. Con 6+ carte in un nobile si usa sempre la transfer dopo 1NT.",
    difficulty: 1,
    topic: "Texas Transfer",
  },

  // 7. 3NT diretto su 1NT
  {
    id: 7,
    hand: { spades: "A84", hearts: "KQ3", diamonds: "QJ72", clubs: "K95" },
    handDisplay: "♠ A84  ♥ KQ3  ♦ QJ72  ♣ K95",
    biddingHistory: [
      { seat: "N", bid: "1NT" },
      { seat: "E", bid: "Passo" },
    ],
    partnerBid: "1NT",
    position: "S",
    vulnerability: "Nessuna",
    correctBid: "3NT",
    wrongBids: ["2NT", "2♣", "4NT"],
    explanation:
      "Con 15 HCP e distribuzione bilanciata 3-3-4-3 senza nobile quinto, vai diretto a 3NT. Punti combinati: 30-32, sufficienti per la manche.",
    difficulty: 1,
    topic: "Risposte a 1NT",
  },

  // ===== DIFFICULTY 2 — Medio (7 scenarios) =====

  // 8. Apertura debole 2♠
  {
    id: 8,
    hand: { spades: "KQJ974", hearts: "83", diamonds: "Q52", clubs: "64" },
    handDisplay: "♠ KQJ974  ♥ 83  ♦ Q52  ♣ 64",
    biddingHistory: [],
    partnerBid: "-",
    position: "S",
    vulnerability: "Nessuna",
    correctBid: "2♠",
    wrongBids: ["1♠", "Passo", "3♠"],
    explanation:
      "Con 8 HCP, 6 picche di buona qualita' (2 dei 3 onori alti) e mano non adatta per apertura a livello 1, apri con un debole a 2♠.",
    difficulty: 2,
    topic: "Aperture deboli",
  },

  // 9. 2♣ Forte convenzionale
  {
    id: 9,
    hand: { spades: "AKQJ5", hearts: "AK84", diamonds: "A3", clubs: "K7" },
    handDisplay: "♠ AKQJ5  ♥ AK84  ♦ A3  ♣ K7",
    biddingHistory: [],
    partnerBid: "-",
    position: "N",
    vulnerability: "NS",
    correctBid: "2♣",
    wrongBids: ["2♠", "1♠", "2NT"],
    explanation:
      "Con 25 HCP e mano potentissima, apri 2♣ forte convenzionale e forzante. E' l'unica apertura con 22+ HCP.",
    difficulty: 2,
    topic: "2♣ Forte",
  },

  // 10. Intervento a 1♠ sull'apertura avversaria
  {
    id: 10,
    hand: { spades: "AQJ83", hearts: "K74", diamonds: "Q93", clubs: "52" },
    handDisplay: "♠ AQJ83  ♥ K74  ♦ Q93  ♣ 52",
    biddingHistory: [
      { seat: "W", bid: "1♦" },
    ],
    partnerBid: "-",
    position: "N",
    vulnerability: "Nessuna",
    correctBid: "1♠",
    wrongBids: ["Passo", "Contro", "2♠"],
    explanation:
      "Con 12 HCP e 5 buone picche, intervieni con 1♠. L'intervento a colore richiede un buon seme di 5+ carte e 8-16 HCP circa.",
    difficulty: 2,
    topic: "Interventi",
  },

  // 11. Contro informativo (Takeout double)
  {
    id: 11,
    hand: { spades: "KQ84", hearts: "AJ73", diamonds: "5", clubs: "KQ92" },
    handDisplay: "♠ KQ84  ♥ AJ73  ♦ 5  ♣ KQ92",
    biddingHistory: [
      { seat: "W", bid: "1♦" },
    ],
    partnerBid: "-",
    position: "N",
    vulnerability: "EW",
    correctBid: "Contro",
    wrongBids: ["1♠", "2♣", "Passo"],
    explanation:
      "Con 15 HCP e appoggio in tutti e tre i semi non di apertura (4♠, 4♥, 4♣), fai Contro informativo. Chiedi al compagno di scegliere il seme.",
    difficulty: 2,
    topic: "Interventi",
  },

  // 12. Stayman dopo 2NT
  {
    id: 12,
    hand: { spades: "QJ74", hearts: "K853", diamonds: "963", clubs: "82" },
    handDisplay: "♠ QJ74  ♥ K853  ♦ 963  ♣ 82",
    biddingHistory: [
      { seat: "N", bid: "2NT" },
      { seat: "E", bid: "Passo" },
    ],
    partnerBid: "2NT",
    position: "S",
    vulnerability: "Tutti",
    correctBid: "3♣",
    wrongBids: ["Passo", "3NT", "3♠"],
    explanation:
      "Dopo 2NT (20-21 HCP), anche con solo 5 HCP cerchi la manche. Con 4-4 nei nobili, usa Stayman (3♣) per cercare il fit. I punti combinati bastano per la manche.",
    difficulty: 2,
    topic: "Stayman",
  },

  // 13. Risposta 2♦ (negativa) a 2♣ forte
  {
    id: 13,
    hand: { spades: "8743", hearts: "952", diamonds: "J84", clubs: "Q63" },
    handDisplay: "♠ 8743  ♥ 952  ♦ J84  ♣ Q63",
    biddingHistory: [
      { seat: "N", bid: "2♣" },
      { seat: "E", bid: "Passo" },
    ],
    partnerBid: "2♣",
    position: "S",
    vulnerability: "NS",
    correctBid: "2♦",
    wrongBids: ["Passo", "2NT", "2♥"],
    explanation:
      "Dopo 2♣ forte, NON puoi passare (e' forzante!). Con mano debole (0-7 HCP) rispondi 2♦ relais (negativa convenzionale). Il compagno fara' la sua seconda dichiarazione.",
    difficulty: 2,
    topic: "2♣ Forte",
  },

  // 14. Rialzo a 4♥ (barrage fit)
  {
    id: 14,
    hand: { spades: "5", hearts: "QJ874", diamonds: "K9632", clubs: "83" },
    handDisplay: "♠ 5  ♥ QJ874  ♦ K9632  ♣ 83",
    biddingHistory: [
      { seat: "N", bid: "1♥" },
      { seat: "E", bid: "Passo" },
    ],
    partnerBid: "1♥",
    position: "S",
    vulnerability: "Nessuna",
    correctBid: "4♥",
    wrongBids: ["2♥", "3♥", "Passo"],
    explanation:
      "Con 5 cuori di fit, singolo a picche, 7 HCP e distribuzione 1-5-5-2, salta diretto a 4♥ (barrage con fit). Blocchi l'intervento avversario e sfrutti la distribuzione.",
    difficulty: 2,
    topic: "Risposte all'apertura",
  },

  // ===== DIFFICULTY 3 — Difficile (6 scenarios) =====

  // 15. Cue bid dopo fit trovato
  {
    id: 15,
    hand: { spades: "AK73", hearts: "AQ84", diamonds: "5", clubs: "QJ93" },
    handDisplay: "♠ AK73  ♥ AQ84  ♦ 5  ♣ QJ93",
    biddingHistory: [
      { seat: "S", bid: "1♣" },
      { seat: "W", bid: "Passo" },
      { seat: "N", bid: "1♠" },
      { seat: "E", bid: "2♦" },
    ],
    partnerBid: "1♠",
    position: "S",
    vulnerability: "NS",
    correctBid: "3♦",
    wrongBids: ["3♠", "4♠", "Contro"],
    explanation:
      "Con 17 HCP e fit a picche (4 carte), fai una cue bid (3♦) sul seme avversario. Mostra forza e fit, invitando lo slam senza definire ancora il livello.",
    difficulty: 3,
    topic: "Cue Bid",
  },

  // 16. Splinter (salto a livello 4 in un nuovo seme)
  {
    id: 16,
    hand: { spades: "KQ84", hearts: "AJ93", diamonds: "3", clubs: "A752" },
    handDisplay: "♠ KQ84  ♥ AJ93  ♦ 3  ♣ A752",
    biddingHistory: [
      { seat: "N", bid: "1♠" },
      { seat: "E", bid: "Passo" },
    ],
    partnerBid: "1♠",
    position: "S",
    vulnerability: "Tutti",
    correctBid: "4♦",
    wrongBids: ["3♠", "4♠", "2♥"],
    explanation:
      "Con 14 HCP, 4 carte di appoggio a picche e singolo a quadri, usa lo Splinter (4♦). Mostra fit, forza da manche, e singolo nel seme nominato. Invita allo slam se il compagno non ha perdenti a quadri.",
    difficulty: 3,
    topic: "Convenzioni avanzate",
  },

  // 17. Competitiva: Rialzo competitivo dopo intervento
  {
    id: 17,
    hand: { spades: "J84", hearts: "K9732", diamonds: "A5", clubs: "842" },
    handDisplay: "♠ J84  ♥ K9732  ♦ A5  ♣ 842",
    biddingHistory: [
      { seat: "N", bid: "1♥" },
      { seat: "E", bid: "2♣" },
    ],
    partnerBid: "1♥",
    position: "S",
    vulnerability: "EW",
    correctBid: "2♥",
    wrongBids: ["3♥", "Passo", "Contro"],
    explanation:
      "Con 8 HCP e 5 cuori di appoggio, rialza a 2♥ anche dopo l'intervento. Il rialzo semplice (2♥) e' competitivo e mostra il fit, impedendo al campo avversario di giocare comodi a 2♣.",
    difficulty: 3,
    topic: "Dichiarazione competitiva",
  },

  // 18. Texas + invito slam
  {
    id: 18,
    hand: { spades: "AKJ84", hearts: "Q3", diamonds: "K72", clubs: "A95" },
    handDisplay: "♠ AKJ84  ♥ Q3  ♦ K72  ♣ A95",
    biddingHistory: [
      { seat: "N", bid: "1NT" },
      { seat: "E", bid: "Passo" },
    ],
    partnerBid: "1NT",
    position: "S",
    vulnerability: "NS",
    correctBid: "2♥",
    wrongBids: ["3♠", "4NT", "3NT"],
    explanation:
      "Con 17 HCP e 5 picche, inizia con la Texas (2♥ → 2♠), poi continuerai con 4NT (Blackwood). La Texas mette il compagno forte come dichiarante. Punti combinati: 32-34, zona slam.",
    difficulty: 3,
    topic: "Texas Transfer",
  },

  // 19. Contro punitivo dopo apertura debole
  {
    id: 19,
    hand: { spades: "A3", hearts: "KQJ84", diamonds: "AQ5", clubs: "K92" },
    handDisplay: "♠ A3  ♥ KQJ84  ♦ AQ5  ♣ K92",
    biddingHistory: [
      { seat: "W", bid: "2♠" },
    ],
    partnerBid: "-",
    position: "N",
    vulnerability: "Nessuna",
    correctBid: "Contro",
    wrongBids: ["3♥", "2NT", "Passo"],
    explanation:
      "Con 19 HCP e apertura avversaria debole 2♠, fai Contro. E' informativo (non punitivo): mostra forza e chiede al compagno di scegliere. Troppo forte per un semplice intervento a 3♥.",
    difficulty: 3,
    topic: "Dichiarazione competitiva",
  },

  // 20. Risposte dopo Stayman — compagno dice 2♥
  {
    id: 20,
    hand: { spades: "AJ73", hearts: "Q84", diamonds: "KQ5", clubs: "J92" },
    handDisplay: "♠ AJ73  ♥ Q84  ♦ KQ5  ♣ J92",
    biddingHistory: [
      { seat: "S", bid: "1NT" },
      { seat: "W", bid: "Passo" },
      { seat: "N", bid: "2♣" },
      { seat: "E", bid: "Passo" },
    ],
    partnerBid: "2♣ (Stayman)",
    position: "S",
    vulnerability: "Nessuna",
    correctBid: "2♠",
    wrongBids: ["2♥", "2♦", "2NT"],
    explanation:
      "Dopo Stayman del compagno (2♣), rispondi 2♠ mostrando le 4 picche. Con 15 HCP e 4 picche, NON dire 2♦ (che nega i nobili) ne' 2♥ (non hai 4 cuori). Mostra le picche!",
    difficulty: 3,
    topic: "Stayman",
  },
];

/** Filter scenarios by difficulty level */
export function getScenariosByDifficulty(
  difficulty: 1 | 2 | 3
): BiddingScenario[] {
  return biddingScenarios.filter((s) => s.difficulty === difficulty);
}

/** Get all unique topics */
export function getAllTopics(): string[] {
  return [...new Set(biddingScenarios.map((s) => s.topic))];
}
