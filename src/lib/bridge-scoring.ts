/**
 * BridgeLab - Bridge Scoring Engine
 * Calcola punteggi duplicate bridge, conversione IMP e verdetti di match.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SuitChar = "C" | "D" | "H" | "S" | "NT";

export interface RawScoreParams {
  level: number;        // 1-7
  suitChar: SuitChar;
  doubled: boolean;
  redoubled: boolean;
  vulnerable: boolean;
  tricksMade: number;   // prese totali effettuate (0-13)
}

export interface BoardIMPResult {
  challengerIMP: number;
  opponentIMP: number;
}

export interface MatchIMPResult {
  challengerTotal: number;
  opponentTotal: number;
  net: number;          // challengerTotal - opponentTotal
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Valore base di ogni presa per il seme dato. */
function trickValue(suitChar: SuitChar): number {
  switch (suitChar) {
    case "C":
    case "D":
      return 20;
    case "H":
    case "S":
      return 30;
    case "NT":
      return 30; // per le prese successive alla prima
  }
}

/** Calcola il punteggio delle prese dichiarate (trick score). */
function contractTrickScore(
  level: number,
  suitChar: SuitChar,
  doubled: boolean,
  redoubled: boolean,
): number {
  let score: number;

  if (suitChar === "NT") {
    // NT: 40 per la prima presa, 30 per le successive
    score = 40 + (level - 1) * 30;
  } else {
    score = level * trickValue(suitChar);
  }

  if (redoubled) return score * 4;
  if (doubled) return score * 2;
  return score;
}

// ---------------------------------------------------------------------------
// WBF IMP Table
// ---------------------------------------------------------------------------

/**
 * Limiti superiori per ogni livello IMP (indice = IMP).
 * Se la differenza assoluta supera il limite, si passa al livello successivo.
 */
const IMP_THRESHOLDS: readonly number[] = [
  10,   // 0 IMP: 0-10
  40,   // 1 IMP: 20-40
  80,   // 2 IMP: 50-80
  120,  // 3 IMP: 90-120
  160,  // 4 IMP: 130-160
  210,  // 5 IMP: 170-210
  260,  // 6 IMP: 220-260
  310,  // 7 IMP: 270-310
  360,  // 8 IMP: 320-360
  420,  // 9 IMP: 370-420
  490,  // 10 IMP: 430-490
  590,  // 11 IMP: 500-590
  740,  // 12 IMP: 600-740
  890,  // 13 IMP: 750-890
  1090, // 14 IMP: 900-1090
  1290, // 15 IMP: 1100-1290
  1490, // 16 IMP: 1300-1490
  1740, // 17 IMP: 1500-1740
  1990, // 18 IMP: 1750-1990
  2240, // 19 IMP: 2000-2240
  2490, // 20 IMP: 2250-2490
  2990, // 21 IMP: 2500-2990
  3490, // 22 IMP: 3000-3490
  3990, // 23 IMP: 3500-3990
         // 24 IMP: 4000+
] as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calcola il punteggio grezzo (raw score) di un contratto di bridge duplicate.
 *
 * Restituisce un numero positivo se il dichiarante realizza il contratto,
 * negativo se va sotto (punteggio per i difensori).
 */
export function calculateRawScore(params: RawScoreParams): number {
  const { level, suitChar, doubled, redoubled, vulnerable, tricksMade } = params;

  const tricksNeeded = level + 6;
  const overUnder = tricksMade - tricksNeeded;

  // --- Contratto non mantenuto (undertricks) ---
  if (overUnder < 0) {
    const undertricks = -overUnder;
    return -calculateUndertrickPenalty(undertricks, vulnerable, doubled, redoubled);
  }

  // --- Contratto mantenuto ---
  let score = 0;

  // 1. Trick score (prese dichiarate)
  const trickScore = contractTrickScore(level, suitChar, doubled, redoubled);
  score += trickScore;

  // 2. Overtricks
  if (overUnder > 0) {
    score += calculateOvertricks(overUnder, suitChar, vulnerable, doubled, redoubled);
  }

  // 3. Bonus per contratto (game / partial)
  if (trickScore >= 100) {
    // Game bonus
    score += vulnerable ? 500 : 300;
  } else {
    // Partial score bonus
    score += 50;
  }

  // 4. Slam bonus
  if (level === 6) {
    // Piccolo slam
    score += vulnerable ? 750 : 500;
  } else if (level === 7) {
    // Grande slam
    score += vulnerable ? 1500 : 1000;
  }

  // 5. Insult bonus (contrato/surcontrato mantenuto)
  if (redoubled) {
    score += 100;
  } else if (doubled) {
    score += 50;
  }

  return score;
}

/** Calcola la penalita per le prese sotto. */
function calculateUndertrickPenalty(
  undertricks: number,
  vulnerable: boolean,
  doubled: boolean,
  redoubled: boolean,
): number {
  if (!doubled && !redoubled) {
    // Non contrato
    return undertricks * (vulnerable ? 100 : 50);
  }

  // Contrato o surcontrato
  const multiplier = redoubled ? 2 : 1;
  let penalty = 0;

  for (let i = 1; i <= undertricks; i++) {
    if (!vulnerable) {
      // Non vulnerabile contrato: -100, -200, -200, -200, ...
      if (i === 1) {
        penalty += 100 * multiplier;
      } else {
        penalty += 200 * multiplier;
      }
    } else {
      // Vulnerabile contrato: -200, -300, -300, -300, ...
      if (i === 1) {
        penalty += 200 * multiplier;
      } else {
        penalty += 300 * multiplier;
      }
    }
  }

  return penalty;
}

/** Calcola il punteggio delle prese extra (overtricks). */
function calculateOvertricks(
  overtricks: number,
  suitChar: SuitChar,
  vulnerable: boolean,
  doubled: boolean,
  redoubled: boolean,
): number {
  if (redoubled) {
    return overtricks * (vulnerable ? 400 : 200);
  }
  if (doubled) {
    return overtricks * (vulnerable ? 200 : 100);
  }
  // Non contrato: valore normale della presa
  return overtricks * trickValue(suitChar);
}

/**
 * Converte una differenza di punteggio grezzo in IMP usando la tabella WBF.
 * Accetta il valore assoluto della differenza, restituisce un IMP (0-24).
 */
export function rawToIMP(diff: number): number {
  const absDiff = Math.abs(diff);

  for (let i = 0; i < IMP_THRESHOLDS.length; i++) {
    if (absDiff <= IMP_THRESHOLDS[i]) {
      return i;
    }
  }

  // Oltre 3990 = 24 IMP
  return 24;
}

/**
 * Calcola gli IMP per una singola mano (board).
 *
 * Entrambi i punteggi sono dal punto di vista del dichiarante
 * (positivo = contratto mantenuto, negativo = sotto).
 *
 * La differenza viene convertita in IMP e assegnata al vincitore.
 */
export function calculateBoardIMP(params: {
  challengerScore: number;
  opponentScore: number;
}): BoardIMPResult {
  const diff = params.challengerScore - params.opponentScore;
  const imps = rawToIMP(diff);

  if (diff > 0) {
    return { challengerIMP: imps, opponentIMP: 0 };
  } else if (diff < 0) {
    return { challengerIMP: 0, opponentIMP: imps };
  }

  return { challengerIMP: 0, opponentIMP: 0 };
}

/**
 * Calcola il risultato IMP complessivo di un match su piu mani.
 */
export function calculateMatchIMP(
  boards: Array<{ challengerScore: number; opponentScore: number }>,
): MatchIMPResult {
  let challengerTotal = 0;
  let opponentTotal = 0;

  for (const board of boards) {
    const result = calculateBoardIMP(board);
    challengerTotal += result.challengerIMP;
    opponentTotal += result.opponentIMP;
  }

  return {
    challengerTotal,
    opponentTotal,
    net: challengerTotal - opponentTotal,
  };
}

/**
 * Restituisce un verdetto in italiano basato sugli IMP netti.
 */
export function getIMPVerdict(netImps: number): string {
  if (netImps > 15) return "Vittoria netta";
  if (netImps > 0) return "Vittoria";
  if (netImps === 0) return "Pareggio";
  if (netImps < -15) return "Sconfitta netta";
  return "Sconfitta";
}

/**
 * Analizza una stringa contratto (es. "3NT", "4S", "4Sx", "4Sxx", "7NTxx")
 * e restituisce i parametri necessari per `calculateRawScore`.
 *
 * Formato: <livello><seme>[x|xx]
 *   - Livello: 1-7
 *   - Seme: C, D, H, S, NT
 *   - x = contrato, xx = surcontrato
 */
export function contractToScoreParams(
  contract: string,
  tricksMade: number,
  vulnerable: boolean,
): RawScoreParams {
  // Determina contrato/surcontrato dal suffisso
  let redoubled = false;
  let doubled = false;
  let stripped = contract.trim().toUpperCase();

  if (stripped.endsWith("XX")) {
    redoubled = true;
    stripped = stripped.slice(0, -2);
  } else if (stripped.endsWith("X")) {
    doubled = true;
    stripped = stripped.slice(0, -1);
  }

  // Primo carattere = livello
  const level = parseInt(stripped[0], 10);
  if (isNaN(level) || level < 1 || level > 7) {
    throw new Error(`Livello contratto non valido: "${contract}"`);
  }

  // Resto = seme
  const suitPart = stripped.slice(1);
  const suitMap: Record<string, SuitChar> = {
    C: "C",
    D: "D",
    H: "H",
    S: "S",
    NT: "NT",
    SA: "NT", // Senza Atout (italiano)
    // Simboli Unicode
    "\u2663": "C", // ♣
    "\u2666": "D", // ♦
    "\u2665": "H", // ♥
    "\u2660": "S", // ♠
    // Nomi italiani
    F: "C",  // Fiori
    Q: "D",  // Quadri
    // "C" gia coperto per Cuori? No, C = Club. Per Cuori si usa il simbolo.
    P: "S",  // Picche
  };

  const suitChar = suitMap[suitPart];
  if (!suitChar) {
    throw new Error(`Seme contratto non valido: "${suitPart}" in "${contract}"`);
  }

  return {
    level,
    suitChar,
    doubled,
    redoubled,
    vulnerable,
    tricksMade,
  };
}
