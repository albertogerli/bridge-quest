"use client";

import { useMemo } from "react";
import type { Card } from "@/lib/bridge-engine";
import { useT } from "@/contexts/traduzioni-provider";

interface HandAnalysisPanelProps {
  tricks: { cards: { player: string; card: Card }[]; winner: string }[];
  hands: { north: Card[]; east: Card[]; south: Card[]; west: Card[] };
  contract: { level: number; suit: string; declarer: string };
  currentTrick: number;
  /**
   * I posti dell'allievo. Si commentano solo le sue carte: prima erano
   * giudicate anche quelle dei robot, e il voto dell'allievo ne dipendeva.
   * Assente nelle analisi salvate prima del 26/11/2026: dichiarante e morto.
   */
  giocatori?: string[];
}

const SUIT_SYMBOLS: Record<string, string> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
};

const RANK_VALUES: Record<string, number> = {
  A: 14,
  K: 13,
  Q: 12,
  J: 11,
  "10": 10,
  "9": 9,
  "8": 8,
  "7": 7,
  "6": 6,
  "5": 5,
  "4": 4,
  "3": 3,
  "2": 2,
};

type Grade = "good" | "questionable" | "mistake";

interface PlayAnalysis {
  trickNumber: number;
  playNumber: number;
  player: string;
  card: Card;
  grade: Grade;
  commentary: string;
}

function cardValue(card: Card): number {
  return RANK_VALUES[card.rank] || 0;
}

function isHonor(card: Card): boolean {
  return ["A", "K", "Q", "J"].includes(card.rank);
}

/**
 * L'atout del contratto. I giochi salvano il seme come «spade»/«heart»…:
 * la prima versione conosceva solo «♠»/«S», trattava ogni contratto a colore
 * come Senza e non riconosceva un taglio (revisione 26/11/2026).
 */
function getTrumpSuit(contractSuit: string): string | null {
  if (contractSuit === "NT" || contractSuit === "SA") return null;
  const suitMap: Record<string, string> = {
    spade: "spade",
    heart: "heart",
    diamond: "diamond",
    club: "club",
    "♠": "spade",
    "♥": "heart",
    "♦": "diamond",
    "♣": "club",
    S: "spade",
    H: "heart",
    D: "diamond",
    C: "club",
  };
  return suitMap[contractSuit] || null;
}

function analyzePlay(
  play: { player: string; card: Card },
  trickCards: { player: string; card: Card }[],
  playIndex: number,
  trumpSuit: string | null,
  declarer: string,
  trickNumber: number,
  /** Le carte che il giocatore aveva in mano prima di giocare questa. */
  inMano: Card[]
): PlayAnalysis {
  const { player, card } = play;
  const leadSuit = trickCards[0].card.suit;
  const stessoSeme = inMano.filter((c) => c.suit === leadSuit);

  // Una sola carta nel seme: non c'era niente da scegliere.
  if (playIndex > 0 && stessoSeme.length === 1) {
    return {
      trickNumber,
      playNumber: playIndex,
      player,
      card,
      grade: "good",
      commentary: `Carta obbligata: l'unica a ${SUIT_SYMBOLS[leadSuit]}`,
    };
  }
  // Senza carte nel seme: un taglio o uno scarto, non «alta» o «bassa».
  if (playIndex > 0 && stessoSeme.length === 0) {
    const taglio = trumpSuit !== null && card.suit === trumpSuit;
    return {
      trickNumber,
      playNumber: playIndex,
      player,
      card,
      grade: "good",
      commentary: taglio
        ? `Taglio con ${card.rank}${SUIT_SYMBOLS[card.suit]}`
        : `Scarto ${card.rank}${SUIT_SYMBOLS[card.suit]}: niente ${SUIT_SYMBOLS[leadSuit]} in mano`,
    };
  }
  const isLeader = playIndex === 0;
  const isSecondHand = playIndex === 1;
  const isThirdHand = playIndex === 2;
  const isFourthHand = playIndex === 3;

  let grade: Grade = "good";
  let commentary = "";

  // Opening lead analysis (trick 1, first card)
  if (trickNumber === 0 && isLeader) {
    if (hasSequence(card, inMano)) {
      grade = "good";
      commentary = `Ottima uscita dalla sequenza con ${card.rank}${SUIT_SYMBOLS[card.suit]}`;
    } else if (isHonor(card) && card.rank !== "A") {
      grade = "questionable";
      commentary = `Uscita rischiosa da onore. Forse meglio da un seme più sicuro`;
    } else {
      grade = "good";
      commentary = `Uscita standard dal ${SUIT_SYMBOLS[card.suit]}`;
    }
    return { trickNumber, playNumber: playIndex, player, card, grade, commentary };
  }

  // Second hand analysis
  if (isSecondHand) {
    const leaderCard = trickCards[0].card;
    const playedLow = cardValue(card) <= 9;

    if (isHonor(leaderCard) && isHonor(card) && card.suit === leaderCard.suit && cardValue(card) > cardValue(leaderCard)) {
      grade = "good";
      commentary = `Giusto coprire l'onore con l'onore`;
    } else if (isHonor(leaderCard) && !isHonor(card)) {
      grade = "good";
      commentary = `Bene giocare basso in seconda posizione`;
    } else if (playedLow) {
      grade = "good";
      commentary = `Corretto: secondo di mano gioca basso`;
    } else {
      grade = "questionable";
      commentary = `In seconda posizione meglio giocare basso`;
    }
    return { trickNumber, playNumber: playIndex, player, card, grade, commentary };
  }

  // Third hand analysis
  if (isThirdHand) {
    // Chi attacca è sempre il compagno del terzo di mano: conta chi sta
    // vincendo la presa dopo il secondo, non chi l'ha aperta.
    const partnerLeading = getCurrentWinner(trickCards.slice(0, 2), trumpSuit) === getPartner(player);
    const highestPlayed = Math.max(
      ...trickCards.slice(0, 2).filter((p) => p.card.suit === leadSuit).map((p) => cardValue(p.card))
    );

    if (partnerLeading && cardValue(card) <= 9) {
      grade = "good";
      commentary = `Bene giocare basso quando il compagno è già in presa`;
    } else if (!partnerLeading && isHonor(card) && cardValue(card) > highestPlayed) {
      grade = "good";
      commentary = `Ottimo: terzo di mano gioca alto per cercare di prendere`;
    } else if (!partnerLeading && cardValue(card) > highestPlayed) {
      grade = "good";
      commentary = `Giusto superare con il ${card.rank}${SUIT_SYMBOLS[card.suit]}`;
    } else if (!partnerLeading && cardValue(card) < highestPlayed) {
      grade = "questionable";
      commentary = `Forse potevi giocare una carta più alta?`;
    } else {
      grade = "good";
      commentary = `Giocata ragionevole in terza posizione`;
    }
    return { trickNumber, playNumber: playIndex, player, card, grade, commentary };
  }

  // Fourth hand analysis
  if (isFourthHand) {
    const currentWinner = getCurrentWinner(trickCards.slice(0, 3), trumpSuit);
    const partnerWinning = currentWinner === getPartner(player);

    if (partnerWinning && cardValue(card) <= 9) {
      grade = "good";
      commentary = `Corretto scartare basso con il compagno in presa`;
    } else if (!partnerWinning && canWin(card, trickCards.slice(0, 3), trumpSuit)) {
      grade = "good";
      commentary = `Bene prendere la presa in quarta posizione`;
    } else if (!partnerWinning && !canWin(card, trickCards.slice(0, 3), trumpSuit)) {
      grade = "good";
      commentary = `Non puoi prendere, giocata obbligata`;
    } else {
      grade = "good";
      commentary = `Giocata corretta`;
    }
    return { trickNumber, playNumber: playIndex, player, card, grade, commentary };
  }

  // Default
  return {
    trickNumber,
    playNumber: playIndex,
    player,
    card,
    grade: "good",
    commentary: "Giocata standard",
  };
}

/**
 * Attacco da sequenza: l'onore attaccato con la carta subito sotto nello
 * stesso seme (K da K-Q, Q da Q-J, J da J-10). Prima bastava un onore
 * qualunque: il K da K-7-3 era «ottima uscita dalla sequenza».
 */
function hasSequence(card: Card, inMano: Card[]): boolean {
  if (!isHonor(card)) return false;
  const sotto = cardValue(card) - 1;
  return inMano.some((c) => c.suit === card.suit && cardValue(c) === sotto);
}

function getPartner(position: string): string {
  const partners: Record<string, string> = {
    north: "south",
    south: "north",
    east: "west",
    west: "east",
  };
  return partners[position] || position;
}

function getCurrentWinner(
  plays: { player: string; card: Card }[],
  trumpSuit: string | null
): string {
  if (plays.length === 0) return "";
  const leadSuit = plays[0].card.suit;
  let winner = plays[0];

  for (let i = 1; i < plays.length; i++) {
    const play = plays[i];
    const winnerIsTrump = trumpSuit && winner.card.suit === trumpSuit;
    const playIsTrump = trumpSuit && play.card.suit === trumpSuit;

    if (playIsTrump && !winnerIsTrump) {
      winner = play;
    } else if (playIsTrump && winnerIsTrump) {
      if (cardValue(play.card) > cardValue(winner.card)) winner = play;
    } else if (!playIsTrump && !winnerIsTrump) {
      if (play.card.suit === leadSuit && winner.card.suit === leadSuit) {
        if (cardValue(play.card) > cardValue(winner.card)) winner = play;
      } else if (play.card.suit === leadSuit) {
        winner = play;
      }
    }
  }

  return winner.player;
}

function canWin(
  card: Card,
  priorPlays: { player: string; card: Card }[],
  trumpSuit: string | null
): boolean {
  const currentWinner = getCurrentWinner(priorPlays, trumpSuit);
  const currentWinningCard = priorPlays.find((p) => p.player === currentWinner)!.card;
  const leadSuit = priorPlays[0].card.suit;

  const cardIsTrump = trumpSuit && card.suit === trumpSuit;
  const winnerIsTrump = trumpSuit && currentWinningCard.suit === trumpSuit;

  if (cardIsTrump && !winnerIsTrump) return true;
  if (cardIsTrump && winnerIsTrump) return cardValue(card) > cardValue(currentWinningCard);
  if (card.suit === leadSuit && currentWinningCard.suit === leadSuit) {
    return cardValue(card) > cardValue(currentWinningCard);
  }
  return false;
}

export function HandAnalysisPanel({
  tricks,
  hands,
  contract,
  currentTrick,
  giocatori,
}: HandAnalysisPanelProps) {
  const t = useT();
  const trumpSuit = getTrumpSuit(contract.suit);
  const declarer = contract.declarer;
  const mieiPosti = useMemo(
    () => giocatori ?? [declarer, getPartner(declarer)],
    [giocatori, declarer]
  );
  const difende = !mieiPosti.includes(declarer);

  const analyses = useMemo(() => {
    const results: PlayAnalysis[] = [];
    // Le mani di partenza: quelle salvate, più le carte già giocate se il
    // gioco le ha salvate a fine mano (vuote).
    const giocate = tricks.flatMap((tr) => tr.cards);
    const inMano: Record<string, Card[]> = {};
    for (const pos of ["north", "east", "south", "west"] as const) {
      const salvate = hands[pos] ?? [];
      const mancanti = giocate
        .filter((p) => p.player === pos)
        .map((p) => p.card)
        .filter((c) => !salvate.some((x) => x.suit === c.suit && x.rank === c.rank));
      inMano[pos] = [...salvate, ...mancanti];
    }
    tricks.forEach((trick, trickIdx) => {
      trick.cards.forEach((play, playIdx) => {
        const mano = inMano[play.player] ?? [];
        if (mieiPosti.includes(play.player)) {
          results.push(
            analyzePlay(play, trick.cards, playIdx, trumpSuit, declarer, trickIdx, mano)
          );
        }
        inMano[play.player] = mano.filter(
          (c) => !(c.suit === play.card.suit && c.rank === play.card.rank)
        );
      });
    });
    return results;
  }, [tricks, hands, trumpSuit, declarer, mieiPosti]);

  const overallGrade = useMemo(() => {
    if (analyses.length === 0) return "N/A";
    const goodCount = analyses.filter((a) => a.grade === "good").length;
    const percentage = (goodCount / analyses.length) * 100;

    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  }, [analyses]);

  const keyTakeaways = useMemo(() => {
    const takeaways: string[] = [];
    const mistakes = analyses.filter((a) => a.grade === "mistake");
    const questionable = analyses.filter((a) => a.grade === "questionable");

    if (mistakes.length > 0) {
      takeaways.push(`Hai commesso ${mistakes.length} errore/i da rivedere`);
    }
    if (questionable.length > 0) {
      takeaways.push(`${questionable.length} giocata/e da migliorare`);
    }
    if (mistakes.length === 0 && questionable.length === 0) {
      takeaways.push("Ottima performance, nessun errore rilevato!");
    }

    // Add strategic insight
    const declarerTricks = tricks.filter((t) => t.winner === declarer || t.winner === getPartner(declarer)).length;
    const tricksNeeded = contract.level + 6;
    // In difesa il successo è il contrario: far cadere il contratto.
    if (difende) {
      if (declarerTricks < tricksNeeded) {
        takeaways.push(`Contratto battuto di ${tricksNeeded - declarerTricks}`);
      } else {
        takeaways.push(
          `Il dichiarante ha mantenuto: serviva ${declarerTricks - tricksNeeded + 1 === 1 ? "una presa" : `${declarerTricks - tricksNeeded + 1} prese`} in più alla difesa`
        );
      }
    } else if (declarerTricks >= tricksNeeded) {
      takeaways.push("Contratto mantenuto con successo");
    } else {
      takeaways.push(`Servivano ${tricksNeeded - declarerTricks} prese in più`);
    }

    return takeaways;
  }, [analyses, tricks, contract, declarer, difende]);

  const gradeIcon = (grade: Grade) => {
    switch (grade) {
      case "good":
        return "✅";
      case "questionable":
        return "⚠️";
      case "mistake":
        return "❌";
    }
  };

  const gradeColor = (grade: Grade) => {
    switch (grade) {
      case "good":
        return "text-green-600 dark:text-green-400";
      case "questionable":
        return "text-amber-600 dark:text-amber-400";
      case "mistake":
        return "text-red-600 dark:text-red-400";
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-card rounded-2xl overflow-hidden">
      {/* Header with overall grade */}
      <div className="bg-primary text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{t("Analisi AI")}</h2>
            <p className="text-sm text-blue-100">
              {contract.level}
              {contract.suit} - {analyses.length} giocate analizzate
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
            <div className="text-3xl font-bold">{overallGrade}</div>
            <div className="text-xs text-blue-100">{t("Voto")}</div>
          </div>
        </div>
      </div>

      {/* Key takeaways */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900 p-4">
        <h3 className="text-sm font-semibold text-foreground/80 mb-2">{t("Punti chiave")}</h3>
        <ul className="space-y-1">
          {keyTakeaways.map((takeaway, idx) => (
            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>{takeaway}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Scrollable analysis list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <div className="p-4 space-y-3">
          {analyses.map((analysis, idx) => {
            const isCurrentTrickPlay =
              analysis.trickNumber === currentTrick ||
              (analysis.trickNumber === currentTrick - 1 && currentTrick > 0);
            return (
              <div
                key={idx}
                className={`card-clean p-3 transition-all ${
                  isCurrentTrickPlay
                    ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">
                    {gradeIcon(analysis.grade)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        Presa {analysis.trickNumber + 1}.{analysis.playNumber + 1}
                      </span>
                      <span className="text-xs font-semibold text-foreground/80 uppercase">
                        {analysis.player}
                      </span>
                      <span className="text-sm font-bold">
                        {analysis.card.rank}
                        {SUIT_SYMBOLS[analysis.card.suit]}
                      </span>
                    </div>
                    <p className={`text-sm ${gradeColor(analysis.grade)}`}>
                      {analysis.commentary}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats summary */}
      <div className="bg-muted/50 border-t border-border p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {analyses.filter((a) => a.grade === "good").length}
            </div>
            <div className="text-xs text-muted-foreground">{t("Ottime")}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {analyses.filter((a) => a.grade === "questionable").length}
            </div>
            <div className="text-xs text-muted-foreground">{t("Da migliorare")}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {analyses.filter((a) => a.grade === "mistake").length}
            </div>
            <div className="text-xs text-muted-foreground">{t("Errori")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
