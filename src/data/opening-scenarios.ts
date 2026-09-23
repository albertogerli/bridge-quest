export type HandScenario = {
  hand: string; // Formatted: "♠ AK32 ♥ Q87 ♦ KJ5 ♣ 943"
  hcp: number;
  distribution: string; // e.g. "4-3-3-3"
  correctBid: string;
  explanation: string;
  options: string[];
};

// Opening scenarios: FIGB Corso Fiori 2022, fifth-card majors and fourth-card diamonds.
// HCP: A=4, K=3, Q=2, J=1. Every hand verified for 13 cards and correct HCP total.
export const openingScenarios: HandScenario[] = [
  // === PASS (4 scenarios, 8-11 HCP) ===
  {
    hand: "♠ Q93  ♥ K72  ♦ J84  ♣ A653",
    hcp: 10, distribution: "3-3-3-4",
    correctBid: "Passo", explanation: "10 HCP: sotto il minimo di 12 per aprire",
    options: ["Passo", "1♣", "1NT", "1♦"],
  },
  {
    hand: "♠ J842  ♥ Q73  ♦ K95  ♣ A84",
    hcp: 10, distribution: "4-3-3-3",
    correctBid: "Passo", explanation: "10 HCP: troppo debole per aprire, servono almeno 12",
    options: ["Passo", "1♠", "1♦", "1♣"],
  },
  {
    hand: "♠ K63  ♥ Q984  ♦ J72  ♣ A53",
    hcp: 10, distribution: "3-4-3-3",
    correctBid: "Passo", explanation: "10 HCP: non si apre con meno di 12 punti onori",
    options: ["1♥", "Passo", "1♣", "1NT"],
  },
  {
    hand: "♠ A72  ♥ QJ3  ♦ K984  ♣ J105",
    hcp: 11, distribution: "3-3-4-3",
    correctBid: "Passo", explanation: "11 HCP: ancora sotto il minimo di 12 per aprire",
    options: ["Passo", "1♦", "1♣", "1NT"],
  },
  // === 1NT (4 scenarios, 15-17 HCP balanced) ===
  {
    hand: "♠ KJ5  ♥ AQ83  ♦ K72  ♣ Q94",
    hcp: 15, distribution: "3-4-3-3",
    correctBid: "1NT", explanation: "15 HCP, bilanciata 3-4-3-3: apri 1NT (15-17)",
    options: ["1♥", "1NT", "1♦", "Passo"],
  },
  {
    hand: "♠ AJ62  ♥ KQ3  ♦ A84  ♣ Q75",
    hcp: 16, distribution: "4-3-3-3",
    correctBid: "1NT", explanation: "16 HCP, bilanciata 4-3-3-3: apri 1NT. La quarta di picche non conta, 1NT ha la precedenza!",
    options: ["1♠", "1NT", "1♣", "1♦"],
  },
  {
    hand: "♠ A94  ♥ KJ85  ♦ AQ3  ♣ J72",
    hcp: 15, distribution: "3-4-3-3",
    correctBid: "1NT", explanation: "15 HCP, bilanciata: con 15-17 e distribuzione bilanciata si apre sempre 1NT",
    options: ["1♥", "1NT", "1♦", "1♣"],
  },
  {
    hand: "♠ KQ84  ♥ A73  ♦ KJ5  ♣ Q92",
    hcp: 15, distribution: "4-3-3-3",
    correctBid: "1NT", explanation: "15 HCP, bilanciata 4-3-3-3: 1NT prevale sull'apertura a colore",
    options: ["1♠", "1NT", "1♣", "Passo"],
  },
  // === 1♠ (3 scenarios, 12-21 HCP, 5+ spades) ===
  {
    hand: "♠ AK832  ♥ Q74  ♦ K95  ♣ J3",
    hcp: 13, distribution: "5-3-3-2",
    correctBid: "1♠", explanation: "13 HCP, 5 picche: apri 1♠ nel seme più lungo",
    options: ["Passo", "1♠", "1NT", "1♣"],
  },
  {
    hand: "♠ AQJ74  ♥ K5  ♦ Q83  ♣ 962",
    hcp: 12, distribution: "5-2-3-3",
    correctBid: "1♠", explanation: "12 HCP, 5 picche: si apre nel seme più lungo, 1♠",
    options: ["1♠", "Passo", "1♦", "1NT"],
  },
  {
    hand: "♠ KQ9742  ♥ A5  ♦ AJ3  ♣ 84",
    hcp: 14, distribution: "6-2-3-2",
    correctBid: "1♠", explanation: "14 HCP, 6 picche: apri 1♠. Con 6 carte non bilanciata, niente 1NT",
    options: ["1♠", "2♠", "1NT", "Passo"],
  },
  // === Major opening or short clubs with neither five-card major ===
  {
    hand: "♠ 84  ♥ AKJ63  ♦ Q72  ♣ K95",
    hcp: 13, distribution: "2-5-3-3",
    correctBid: "1♥", explanation: "13 HCP, 5 cuori: apri 1♥ nel seme più lungo",
    options: ["1♥", "1NT", "Passo", "1♣"],
  },
  {
    hand: "♠ KJ84  ♥ AQ73  ♦ K92  ♣ 65",
    hcp: 13, distribution: "4-4-3-2",
    correctBid: "1♣", explanation: "13 punti, 4-4 nei nobili e tre quadri: nessun maggiore quinto. Nel Fiori 2022 si apre 1♣ anche con due carte.",
    options: ["1♠", "1♥", "1♦", "1♣"],
  },
  {
    hand: "♠ 5  ♥ AQJ84  ♦ K73  ♣ AQ92",
    hcp: 16, distribution: "1-5-3-4",
    correctBid: "1♥", explanation: "16 HCP, 5 cuori: sbilanciata, si apre nel seme più lungo 1♥",
    options: ["1♥", "1♣", "1NT", "2♥"],
  },
  // === 1♦ (3 scenarios) ===
  {
    hand: "♠ K84  ♥ A53  ♦ KJ952  ♣ Q7",
    hcp: 13, distribution: "3-3-5-2",
    correctBid: "1♦", explanation: "13 HCP, 5 quadri: apri nel seme più lungo, 1♦",
    options: ["1♦", "1♣", "1NT", "Passo"],
  },
  {
    hand: "♠ AQ73  ♥ K84  ♦ QJ95  ♣ 62",
    hcp: 12, distribution: "4-3-4-2",
    correctBid: "1♦", explanation: "12 HCP, 4♠ e 4♦: con due quarti si apre nel più basso di rango, 1♦",
    options: ["1♠", "1♦", "1♣", "Passo"],
  },
  {
    hand: "♠ K83  ♥ Q5  ♦ AKJ74  ♣ 962",
    hcp: 13, distribution: "3-2-5-3",
    correctBid: "1♦", explanation: "13 HCP, 5 quadri: si apre nel seme più lungo",
    options: ["1♦", "1♣", "Passo", "1NT"],
  },
  // === 1♣ (3 scenarios) ===
  {
    hand: "♠ QJ5  ♥ K84  ♦ A73  ♣ KJ62",
    hcp: 14, distribution: "3-3-3-4",
    correctBid: "1♣", explanation: "14 HCP, bilanciata 3-3-3-4: non 15-17 per 1NT, apri nel seme più lungo 1♣",
    options: ["1♣", "1NT", "1♦", "Passo"],
  },
  {
    hand: "♠ K42  ♥ Q73  ♦ A85  ♣ KJ94",
    hcp: 13, distribution: "3-3-3-4",
    correctBid: "1♣", explanation: "13 HCP, bilanciata 3-3-3-4: con 12-14 bilanciata apri nel più lungo, 1♣",
    options: ["1♣", "1♦", "1NT", "Passo"],
  },
  {
    hand: "♠ K53  ♥ A84  ♦ Q62  ♣ AJ73",
    hcp: 14, distribution: "3-3-3-4",
    correctBid: "1♣", explanation: "14 punti, bilanciata 3-3-3-4: quattro fiori e solo tre quadri, apri 1♣.",
    options: ["1♣", "1♦", "1NT", "1♥"],
  },
  // === 2NT (FIGB Fiori 2022: 21-23 HCP balanced) ===
  {
    hand: "♠ AKQ5  ♥ A3  ♦ AJ84  ♣ K72",
    hcp: 21, distribution: "4-2-4-3",
    correctBid: "2NT", explanation: "21 HCP, bilanciata: apri 2NT (21-23, Fiori 2022)",
    options: ["1♠", "2NT", "1NT", "2♣"],
  },
  {
    hand: "♠ AJ3  ♥ KQ84  ♦ AK5  ♣ KJ7",
    hcp: 21, distribution: "3-4-3-3",
    correctBid: "2NT", explanation: "21 HCP, bilanciata 3-4-3-3: apri 2NT (21-23, Fiori 2022)",
    options: ["1♥", "2NT", "2♣", "1NT"],
  },
  // === 2♣ (FIGB Fiori 2022: 24+ HCP balanced) ===
  {
    hand: "♠ AKJ5  ♥ AKQ3  ♦ AK2  ♣ 84",
    hcp: 24, distribution: "4-4-3-2",
    correctBid: "2♣", explanation: "24 HCP, bilanciata: apri 2♣ (Fiori 2022), poi descrivi i Senza",
    options: ["2♣", "2NT", "1♠", "1♥"],
  },
  {
    hand: "♠ AK3  ♥ AQJ84  ♦ AK7  ♣ A5",
    hcp: 25, distribution: "3-5-3-2",
    correctBid: "2♣", explanation: "25 HCP, bilanciata: apri 2♣ (Fiori 2022), poi descrivi i Senza",
    options: ["2♣", "2NT", "1♥", "2♥"],
  },
];
